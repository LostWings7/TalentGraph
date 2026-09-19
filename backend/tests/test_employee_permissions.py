"""
Tests for employee permissions and self-service boundaries.
Verifies an employee can only access their own profile/evidence/roadmaps
and cannot access HR-only analytics or modify unauthorized assets.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.core.models import Enterprise, UserProfile
from apps.employees.models import Employee, EmployeeSkill
from apps.skills.models import Skill


class EmployeePermissionsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.enterprise = Enterprise.objects.create(
            name='Acme Global',
            slug='acme-global',
            industry='Technology'
        )

        # HR Admin
        self.hr_user = User.objects.create_user(
            username='hr@acme.demo',
            email='hr@acme.demo',
            password='Password123!'
        )
        self.hr_profile = UserProfile.objects.create(
            user=self.hr_user,
            enterprise=self.enterprise,
            role='hr_admin'
        )
        self.hr_token = Token.objects.create(user=self.hr_user)

        # Employee 1 (Alice)
        self.emp1 = Employee.objects.create(
            name='Alice Wonderland',
            email='alice@acme.demo',
            department='Engineering',
            current_role='Software Engineer',
            enterprise=self.enterprise
        )
        self.user1 = User.objects.create_user(
            username='alice@acme.demo',
            email='alice@acme.demo',
            password='Password123!'
        )
        self.profile1 = UserProfile.objects.create(
            user=self.user1,
            enterprise=self.enterprise,
            employee=self.emp1,
            role='employee'
        )
        self.token1 = Token.objects.create(user=self.user1)

        # Employee 2 (Bob)
        self.emp2 = Employee.objects.create(
            name='Bob Builder',
            email='bob@acme.demo',
            department='Product',
            current_role='Product Manager',
            enterprise=self.enterprise
        )
        self.user2 = User.objects.create_user(
            username='bob@acme.demo',
            email='bob@acme.demo',
            password='Password123!'
        )
        self.profile2 = UserProfile.objects.create(
            user=self.user2,
            enterprise=self.enterprise,
            employee=self.emp2,
            role='employee'
        )
        self.token2 = Token.objects.create(user=self.user2)

        # Skill
        self.skill = Skill.objects.create(name='Python Architecture', category='Backend')
        self.emp_skill1 = EmployeeSkill.objects.create(
            employee=self.emp1,
            skill=self.skill,
            proficiency='Advanced',
            confidence=0.85
        )

    def test_employee_can_access_own_profile(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')
        response = self.client.get(f'/api/employees/{self.emp1.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['name'], 'Alice Wonderland')

    def test_employee_cannot_access_other_employee_detail(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')
        response = self.client.get(f'/api/employees/{self.emp2.id}/')
        self.assertEqual(response.status_code, 403)

    def test_employee_cannot_access_hr_workforce_intelligence(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')
        response = self.client.get('/api/analytics/dashboard/')
        self.assertEqual(response.status_code, 403)

    def test_employee_cannot_access_audit_logs(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')
        response = self.client.get('/api/audit/')
        self.assertEqual(response.status_code, 403)

    def test_hr_can_access_all_employee_profiles(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.hr_token.key}')
        response1 = self.client.get(f'/api/employees/{self.emp1.id}/')
        response2 = self.client.get(f'/api/employees/{self.emp2.id}/')
        self.assertEqual(response1.status_code, 200)
        self.assertEqual(response2.status_code, 200)
