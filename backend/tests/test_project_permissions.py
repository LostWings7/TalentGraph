"""
Tests for Project Sensitivity, RBAC, Masking, and AI Safety Modes.
Verifies HR_ONLY vs HR_CONTRIBUTORS vs ENTERPRISE_PUBLIC projects,
contributor access, description masking, and AI processing modes.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.core.models import Enterprise, UserProfile
from apps.employees.models import Employee
from apps.projects.models import Project, ProjectContribution


class ProjectPermissionsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.enterprise = Enterprise.objects.create(
            name='CyberDyne Systems',
            slug='cyberdyne',
            industry='Autonomous AI'
        )

        # HR Admin
        self.hr_user = User.objects.create_user(
            username='hr@cyberdyne.demo',
            email='hr@cyberdyne.demo',
            password='Password123!'
        )
        self.hr_profile = UserProfile.objects.create(
            user=self.hr_user,
            enterprise=self.enterprise,
            role='hr_admin'
        )
        self.hr_token = Token.objects.create(user=self.hr_user)

        # Employee 1 (Contributor to Confidential Project)
        self.emp1 = Employee.objects.create(
            name='Sarah Connor',
            email='sarah@cyberdyne.demo',
            department='Engineering',
            current_role='Security Engineer',
            enterprise=self.enterprise
        )
        self.user1 = User.objects.create_user(
            username='sarah@cyberdyne.demo',
            email='sarah@cyberdyne.demo',
            password='Password123!'
        )
        self.profile1 = UserProfile.objects.create(
            user=self.user1,
            enterprise=self.enterprise,
            employee=self.emp1,
            role='employee'
        )
        self.token1 = Token.objects.create(user=self.user1)

        # Employee 2 (Non-contributor)
        self.emp2 = Employee.objects.create(
            name='John Connor',
            email='john@cyberdyne.demo',
            department='Engineering',
            current_role='Tactical Analyst',
            enterprise=self.enterprise
        )
        self.user2 = User.objects.create_user(
            username='john@cyberdyne.demo',
            email='john@cyberdyne.demo',
            password='Password123!'
        )
        self.profile2 = UserProfile.objects.create(
            user=self.user2,
            enterprise=self.enterprise,
            employee=self.emp2,
            role='employee'
        )
        self.token2 = Token.objects.create(user=self.user2)

        # Public Project
        self.public_proj = Project.objects.create(
            name='Enterprise Portal Redesign',
            description='Standard internal portal update for all employees',
            enterprise=self.enterprise,
            status='Active',
            sensitivity_level='ENTERPRISE_PUBLIC',
            ai_processing_mode='AI_ALLOWED'
        )

        # Confidential Project (HR_ONLY sensitivity)
        self.secret_proj = Project.objects.create(
            name='Project Skynet Core Engine',
            description='Proprietary defense autonomous decision network architecture',
            enterprise=self.enterprise,
            status='Active',
            sensitivity_level='HR_ONLY',
            ai_processing_mode='NO_EXTERNAL_AI'
        )

        # Contributor-restricted Project (HR_CONTRIBUTORS sensitivity)
        self.team_proj = Project.objects.create(
            name='Quantum Cryptography Prototype',
            description='Restricted quantum cipher testing platform',
            enterprise=self.enterprise,
            status='Active',
            sensitivity_level='HR_CONTRIBUTORS',
            ai_processing_mode='AI_SAFE_SUMMARY'
        )
        ProjectContribution.objects.create(
            project=self.team_proj,
            employee=self.emp1,
            role_in_project='Lead Cryptographer',
            contribution_summary='Developed post-quantum cipher primitives.',
            verification_status='approved'
        )

    def test_hr_can_view_all_projects_with_full_details(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.hr_token.key}')
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        titles = [p['name'] for p in data]
        self.assertIn('Project Skynet Core Engine', titles)
        self.assertIn('Quantum Cryptography Prototype', titles)
        self.assertIn('Enterprise Portal Redesign', titles)

        # Check description is not masked for HR
        secret_p = next(p for p in data if p['name'] == 'Project Skynet Core Engine')
        self.assertEqual(secret_p['description'], 'Proprietary defense autonomous decision network architecture')

    def test_contributor_can_view_assigned_restricted_project(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        titles = [p['name'] for p in data]
        self.assertIn('Quantum Cryptography Prototype', titles)
        self.assertIn('Enterprise Portal Redesign', titles)

        team_p = next(p for p in data if p['name'] == 'Quantum Cryptography Prototype')
        self.assertEqual(team_p['description'], 'Restricted quantum cipher testing platform')

    def test_non_contributor_employee_sees_masked_secret_project(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token2.key}')
        response = self.client.get(f'/api/projects/{self.secret_proj.id}/')
        # Direct access to HR_ONLY by non-contributor employee is forbidden
        self.assertEqual(response.status_code, 403)

    def test_assigning_contributor_grants_access(self):
        # HR assigns emp2 to Quantum Cryptography Prototype
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.hr_token.key}')
        assign_res = self.client.post(
            f'/api/projects/{self.team_proj.id}/assign/{self.emp2.id}/',
            {'role_in_project': 'Security Auditor'},
            content_type='application/json'
        )
        self.assertEqual(assign_res.status_code, 200)
        self.assertTrue(assign_res.json()['success'])

        # Now emp2 can access Quantum Cryptography Prototype
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token2.key}')
        response = self.client.get(f'/api/projects/{self.team_proj.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['name'], 'Quantum Cryptography Prototype')
