"""
Tests for multi-tenant enterprise data isolation.
Verifies Enterprise A can never see or modify Enterprise B's data.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.core.models import Enterprise, UserProfile
from apps.employees.models import Employee, EmployeeSkill
from apps.skills.models import Skill
from apps.roles.models import Role
from apps.projects.models import Project, StaffingRequest
from apps.learning.models import LearningResource


class EnterpriseIsolationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Enterprise A (Alpha Corp)
        self.ent_a = Enterprise.objects.create(
            name='Alpha Corp',
            slug='alpha-corp',
            industry='FinTech',
            departments=['Risk', 'Core Platform']
        )
        self.hr_user_a = User.objects.create_user(
            username='hr@alpha.demo',
            email='hr@alpha.demo',
            password='Password123!'
        )
        self.hr_profile_a = UserProfile.objects.create(
            user=self.hr_user_a,
            enterprise=self.ent_a,
            role='hr_admin'
        )
        self.token_a = Token.objects.create(user=self.hr_user_a)

        self.emp_a = Employee.objects.create(
            name='Alice Alpha',
            email='alice@alpha.demo',
            department='Engineering',
            current_role='Platform Engineer',
            enterprise=self.ent_a
        )
        self.project_a = Project.objects.create(
            name='Alpha Core Migration',
            description='Alpha proprietary migration',
            enterprise=self.ent_a,
            status='Active',
            sensitivity_level='HR_CONTRIBUTORS'
        )
        self.role_a = Role.objects.create(
            title='Alpha Lead Architect',
            department='Engineering',
            enterprise=self.ent_a
        )
        self.course_a = LearningResource.objects.create(
            title='Alpha Security Training',
            provider='TalentGraph Internal Academy',
            enterprise=self.ent_a
        )

        # Enterprise B (Beta Corp)
        self.ent_b = Enterprise.objects.create(
            name='Beta Corp',
            slug='beta-corp',
            industry='Healthcare',
            departments=['AI Research']
        )
        self.hr_user_b = User.objects.create_user(
            username='hr@beta.demo',
            email='hr@beta.demo',
            password='Password123!'
        )
        self.hr_profile_b = UserProfile.objects.create(
            user=self.hr_user_b,
            enterprise=self.ent_b,
            role='hr_admin'
        )
        self.token_b = Token.objects.create(user=self.hr_user_b)

        self.emp_b = Employee.objects.create(
            name='Bob Beta',
            email='bob@beta.demo',
            department='AI Research',
            current_role='ML Engineer',
            enterprise=self.ent_b
        )
        self.project_b = Project.objects.create(
            name='Beta Clinical Diagnostics',
            description='Beta confidential diagnostics engine',
            enterprise=self.ent_b,
            status='Active',
            sensitivity_level='HR_ONLY'
        )
        self.role_b = Role.objects.create(
            title='Beta Clinical ML Specialist',
            department='AI Research',
            enterprise=self.ent_b
        )
        self.course_b = LearningResource.objects.create(
            title='HIPAA Compliance Mastery',
            provider='TalentGraph Internal Academy',
            enterprise=self.ent_b
        )

    def test_hr_a_cannot_see_enterprise_b_employees(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')
        response = self.client.get('/api/employees/')
        self.assertEqual(response.status_code, 200)
        emp_ids = [e['id'] for e in response.json()]
        self.assertIn(self.emp_a.id, emp_ids)
        self.assertNotIn(self.emp_b.id, emp_ids)

    def test_hr_a_cannot_access_enterprise_b_employee_detail(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')
        response = self.client.get(f'/api/employees/{self.emp_b.id}/')
        self.assertEqual(response.status_code, 404)

    def test_hr_a_cannot_see_enterprise_b_projects(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, 200)
        proj_ids = [p['id'] for p in response.json()]
        self.assertIn(self.project_a.id, proj_ids)
        self.assertNotIn(self.project_b.id, proj_ids)

    def test_hr_a_cannot_see_enterprise_b_roles(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')
        response = self.client.get('/api/roles/')
        self.assertEqual(response.status_code, 200)
        role_ids = [r['id'] for r in response.json()]
        self.assertIn(self.role_a.id, role_ids)
        self.assertNotIn(self.role_b.id, role_ids)

    def test_hr_a_cannot_see_enterprise_b_courses(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')
        response = self.client.get('/api/learning/')
        self.assertEqual(response.status_code, 200)
        course_ids = [c['id'] for c in response.json()]
        self.assertIn(self.course_a.id, course_ids)
        self.assertNotIn(self.course_b.id, course_ids)

    def test_hr_a_cannot_view_enterprise_b_capability_map(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')
        response = self.client.get('/api/enterprises/capability-map/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['enterprise_name'], 'Alpha Corp')
        self.assertIn('Risk', data['departments'])


