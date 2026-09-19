from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from apps.core.models import Enterprise, UserProfile
from apps.employees.models import Employee

class AuthenticationTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.enterprise = Enterprise.objects.create(
            name="Alpha Corp",
            slug="alpha-corp"
        )
        self.hr_user = User.objects.create_user(
            username="hr_alpha",
            email="hr@alpha.demo",
            password="SecurePassword123!",
            is_staff=True
        )
        self.hr_profile = UserProfile.objects.create(
            user=self.hr_user,
            enterprise=self.enterprise,
            role="hr_admin",
            is_temporary_password=False
        )

        self.employee = Employee.objects.create(
            enterprise=self.enterprise,
            name="John Doe",
            email="john@alpha.demo",
            department="Engineering",
            current_role="Software Engineer"
        )
        self.emp_user = User.objects.create_user(
            username="john",
            email="john@alpha.demo",
            password="TempPassword123!"
        )
        self.emp_profile = UserProfile.objects.create(
            user=self.emp_user,
            enterprise=self.enterprise,
            role="employee",
            employee=self.employee,
            is_temporary_password=True
        )

    def test_hr_login_success(self):
        response = self.client.post(
            '/api/auth/login/',
            {'email': 'hr@alpha.demo', 'password': 'SecurePassword123!'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('token', data)
        self.assertIn('user', data)
        self.assertIn('enterprise', data)
        self.assertEqual(data['user']['role'], 'hr_admin')
        self.assertEqual(data['enterprise']['name'], 'Alpha Corp')

    def test_employee_login_success(self):
        response = self.client.post(
            '/api/auth/login/',
            {'email': 'john@alpha.demo', 'password': 'TempPassword123!'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'employee')
        self.assertTrue(data['user']['is_temporary_password'])
        self.assertEqual(data['user']['employee_id'], self.employee.id)

    def test_invalid_login(self):
        response = self.client.post(
            '/api/auth/login/',
            {'email': 'hr@alpha.demo', 'password': 'WrongPassword'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)

    def test_employee_password_change(self):
        token, _ = Token.objects.get_or_create(user=self.emp_user)
        response = self.client.post(
            '/api/auth/change-password/',
            {'old_password': 'TempPassword123!', 'new_password': 'NewSecurePass999!'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}'
        )
        self.assertEqual(response.status_code, 200)
        self.emp_profile.refresh_from_db()
        self.emp_user.refresh_from_db()
        self.assertFalse(self.emp_profile.is_temporary_password)
        self.assertTrue(self.emp_user.check_password('NewSecurePass999!'))

    def test_enterprise_onboarding_setup(self):
        payload = {
            'company_name': 'Beta Tech Inc',
            'admin_email': 'admin@beta.demo',
            'admin_password': 'AdminPassword123!',
            'admin_name': 'Beta Admin',
            'industry': 'Healthcare Technology',
            'departments': ['Clinical Data', 'Engineering']
        }
        response = self.client.post(
            '/api/auth/enterprise-setup/',
            payload,
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['enterprise']['name'], 'Beta Tech Inc')
        self.assertEqual(data['user']['role'], 'hr_admin')
