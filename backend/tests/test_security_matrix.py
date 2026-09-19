"""Comprehensive Security Test Matrix for TalentGraph AI.

Verifies and proves the 9 critical security boundaries:
1. Unauthenticated users cannot access protected APIs (401).
2. Employee cannot access HR-only endpoints (403).
3. Employee cannot access another employee's private profile (403).
4. Employee cannot modify another employee's data or skills (403).
5. Employee cannot access confidential HR/project information (403).
6. Enterprise A cannot access Enterprise B employees (isolated / 403).
7. Enterprise A cannot access Enterprise B roles or projects (isolated).
8. Confidential project AI boundary is enforced server-side.
9. Tenant boundaries are strictly preserved across mutations and queries.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.core.models import Enterprise, UserProfile, ApprovalRequest
from apps.employees.models import Employee, EmployeeSkill
from apps.roles.models import Role
from apps.projects.models import Project, ProjectContribution
from apps.skills.models import Skill
from apps.ai.profile_builder import build_employee_text_context

class SecurityMatrixTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Enterprise A (NovaTech)
        self.ent_a = Enterprise.objects.create(name='NovaTech Corp', slug='novatech-corp')
        
        # Enterprise A - HR Admin
        self.hr_a = User.objects.create_user(username='hr@novatech.demo', email='hr@novatech.demo', password='password123', is_staff=True)
        self.hr_a_profile = UserProfile.objects.create(user=self.hr_a, enterprise=self.ent_a, role='hr_admin')
        self.hr_a_token = Token.objects.create(user=self.hr_a)

        # Enterprise A - Employee 1 (Alice)
        self.emp_a1 = Employee.objects.create(name='Alice Nova', email='alice@novatech.demo', department='Engineering', enterprise=self.ent_a)
        self.user_a1 = User.objects.create_user(username='alice@novatech.demo', email='alice@novatech.demo', password='password123')
        self.profile_a1 = UserProfile.objects.create(user=self.user_a1, enterprise=self.ent_a, role='employee', employee=self.emp_a1)
        self.token_a1 = Token.objects.create(user=self.user_a1)

        # Enterprise A - Employee 2 (Bob)
        self.emp_a2 = Employee.objects.create(name='Bob Nova', email='bob@novatech.demo', department='Product', enterprise=self.ent_a)
        self.user_a2 = User.objects.create_user(username='bob@novatech.demo', email='bob@novatech.demo', password='password123')
        self.profile_a2 = UserProfile.objects.create(user=self.user_a2, enterprise=self.ent_a, role='employee', employee=self.emp_a2)
        self.token_a2 = Token.objects.create(user=self.user_a2)

        # Enterprise B (Apex Dynamics)
        self.ent_b = Enterprise.objects.create(name='Apex Dynamics', slug='apex-dynamics')
        
        # Enterprise B - HR Admin
        self.hr_b = User.objects.create_user(username='hr@apex.demo', email='hr@apex.demo', password='password123', is_staff=True)
        self.hr_b_profile = UserProfile.objects.create(user=self.hr_b, enterprise=self.ent_b, role='hr_admin')
        self.hr_b_token = Token.objects.create(user=self.hr_b)

        # Enterprise B - Employee (Charlie)
        self.emp_b = Employee.objects.create(name='Charlie Apex', email='charlie@apex.demo', department='AI Research', enterprise=self.ent_b)
        self.user_b = User.objects.create_user(username='charlie@apex.demo', email='charlie@apex.demo', password='password123')
        self.profile_b = UserProfile.objects.create(user=self.user_b, enterprise=self.ent_b, role='employee', employee=self.emp_b)
        self.token_b = Token.objects.create(user=self.user_b)

        # Skills & Projects
        self.skill = Skill.objects.create(name='Cloud Architecture', category='Cloud & DevOps')
        
        # Confidential Project in Enterprise A
        self.confidential_proj = Project.objects.create(
            enterprise=self.ent_a,
            name='Project BlackManta Proprietary',
            description='Highly secret stealth product development with proprietary trade secrets.',
            technologies='Rust, Zero-Knowledge Proofs',
            outcomes='Proprietary secret benchmark',
            sensitivity_level='HR_ONLY',
            ai_processing_mode='NO_EXTERNAL_AI'
        )

        # Public Project in Enterprise A
        self.public_proj = Project.objects.create(
            enterprise=self.ent_a,
            name='Customer Portal V2',
            description='Public facing developer platform.',
            technologies='React, Node.js',
            sensitivity_level='ENTERPRISE_PUBLIC',
            ai_processing_mode='AI_ALLOWED'
        )

    # 1. Unauthenticated users cannot access protected APIs
    def test_01_unauthenticated_denied(self):
        self.client.credentials()  # No token
        res = self.client.get(f'/api/employees/{self.emp_a1.id}/')
        self.assertIn(res.status_code, [401, 403])
        
        res2 = self.client.get('/api/analytics/dashboard/')
        self.assertIn(res2.status_code, [401, 403])

    # 2. Employee cannot access HR-only endpoints
    def test_02_employee_cannot_access_hr_endpoints(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a1.key}')
        res_analytics = self.client.get('/api/analytics/dashboard/')
        self.assertEqual(res_analytics.status_code, 403)
        
        res_audit = self.client.get('/api/audit/')
        self.assertEqual(res_audit.status_code, 403)

        res_profile_update = self.client.put('/api/enterprises/profile/', {'name': 'Hacked Enterprise'})
        self.assertEqual(res_profile_update.status_code, 403)

        res_resolve = self.client.post('/api/approvals/999/resolve/', {'status': 'approved'})
        self.assertEqual(res_resolve.status_code, 403)

    # 3. Employee cannot access another employee's private profile
    def test_03_employee_cannot_access_other_employee_private_profile(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a1.key}')
        res = self.client.get(f'/api/employees/{self.emp_a2.id}/')
        self.assertEqual(res.status_code, 403)

    # 4. Employee cannot modify another employee's data or skills
    def test_04_employee_cannot_modify_other_employee_data(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a1.key}')
        res = self.client.post(f'/api/employees/{self.emp_a2.id}/skills/', {
            'skill_name': 'Cloud Architecture',
            'proficiency': 'Expert'
        })
        self.assertEqual(res.status_code, 403)

    # 5. Employee cannot access confidential HR-only project without permission
    def test_05_employee_cannot_access_confidential_project(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a1.key}')
        res = self.client.get(f'/api/projects/{self.confidential_proj.id}/')
        self.assertEqual(res.status_code, 403)

    # 6. Enterprise A cannot access Enterprise B employees
    def test_06_enterprise_a_cannot_access_enterprise_b_employees(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.hr_a_token.key}')
        res = self.client.get(f'/api/employees/{self.emp_b.id}/')
        self.assertIn(res.status_code, [403, 404])

        # Listing employees only returns Enterprise A employees
        res_list = self.client.get('/api/employees/')
        self.assertEqual(res_list.status_code, 200)
        list_json = res_list.json()
        items = list_json if isinstance(list_json, list) else list_json.get('results', [])
        returned_ids = [e['id'] for e in items]
        self.assertNotIn(self.emp_b.id, returned_ids)

    # 7. Enterprise A cannot access Enterprise B roles or projects
    def test_07_enterprise_a_cannot_access_enterprise_b_roles_or_projects(self):
        role_b = Role.objects.create(
            enterprise=self.ent_b,
            title='Apex Lead AI Scientist',
            department='AI Research',
            description='Proprietary Apex Role'
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.hr_a_token.key}')
        res = self.client.get(f'/api/roles/{role_b.id}/')
        self.assertIn(res.status_code, [403, 404])

    # 8. Confidential project AI boundary is enforced server-side
    def test_08_confidential_project_ai_boundary(self):
        ProjectContribution.objects.create(
            employee=self.emp_a1,
            project=self.confidential_proj,
            role_in_project='Lead Cryptographer',
            contribution_summary='Invented proprietary zero-knowledge compression algorithm.',
            technologies_demonstrated='Rust, ZK-Snarks'
        )
        text_context = build_employee_text_context(self.emp_a1)
        # Verify proprietary content is NOT leaked
        self.assertNotIn('Project BlackManta Proprietary', text_context)
        self.assertNotIn('proprietary zero-knowledge compression', text_context)
        self.assertIn('[Confidential Internal Initiative - Redacted under Enterprise Security Policy]', text_context)

    # 9. Tenant boundaries are strictly preserved across mutations and queries
    def test_09_tenant_boundaries_preserved_in_mutations(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a1.key}')
        # Attempt to simulate What-If on employee from another enterprise
        role_a = Role.objects.create(enterprise=self.ent_a, title='Cloud Architect', department='Engineering')
        res = self.client.post(f'/api/mobility/what-if/{self.emp_b.id}/{role_a.id}/', {
            'acquired_skills': ['Cloud Architecture']
        })
        self.assertEqual(res.status_code, 403)
