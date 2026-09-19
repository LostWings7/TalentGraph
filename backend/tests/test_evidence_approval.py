"""
Tests for Approval Service & Continuous Talent Feedback Loop.
Verifies project contribution submission, evidence verification, HR approval,
skill confidence boost, and audit logging.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.core.models import Enterprise, UserProfile, ApprovalRequest, AuditLog
from apps.employees.models import Employee, EmployeeSkill
from apps.skills.models import Skill
from apps.projects.models import Project, ProjectContribution


class EvidenceApprovalTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.enterprise = Enterprise.objects.create(
            name='Vertex AI Corp',
            slug='vertex-ai',
            industry='Artificial Intelligence'
        )

        # HR Admin
        self.hr_user = User.objects.create_user(
            username='hr@vertex.demo',
            email='hr@vertex.demo',
            password='Password123!'
        )
        self.hr_profile = UserProfile.objects.create(
            user=self.hr_user,
            enterprise=self.enterprise,
            role='hr_admin'
        )
        self.hr_token = Token.objects.create(user=self.hr_user)

        # Employee
        self.emp = Employee.objects.create(
            name='Maya Lin',
            email='maya@vertex.demo',
            department='AI Research',
            current_role='Principal ML Engineer',
            enterprise=self.enterprise
        )
        self.emp_user = User.objects.create_user(
            username='maya@vertex.demo',
            email='maya@vertex.demo',
            password='Password123!'
        )
        self.emp_profile = UserProfile.objects.create(
            user=self.emp_user,
            enterprise=self.enterprise,
            employee=self.emp,
            role='employee'
        )
        self.emp_token = Token.objects.create(user=self.emp_user)

        self.skill = Skill.objects.create(name='PyTorch Distributed', category='Machine Learning')
        self.emp_skill = EmployeeSkill.objects.create(
            employee=self.emp,
            skill=self.skill,
            proficiency='Advanced',
            confidence=0.70,
            verification_status='self_reported'
        )
        self.project = Project.objects.create(
            name='Multi-Modal LLM Fine-Tuning',
            description='Scalable distributed training pipeline',
            enterprise=self.enterprise,
            status='Active'
        )

    def test_employee_can_submit_evidence_approval_request(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.emp_token.key}')
        payload = {
            'request_type': 'evidence_verification',
            'title': 'PyTorch Distributed Cluster Benchmark Evidence',
            'description': 'Deployed 64-GPU distributed training pipeline achieving 98% linear scaling efficiency.',
            'payload': {
                'skill_id': self.skill.id,
                'skill_name': self.skill.name,
                'project_id': self.project.id
            }
        }
        response = self.client.post('/api/approvals/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        req_id = response.json()['id']

        req = ApprovalRequest.objects.get(id=req_id)
        self.assertEqual(req.status, 'pending')
        self.assertEqual(req.requester, self.emp_user)

    def test_hr_approval_boosts_skill_confidence_and_verifies(self):
        # Create pending approval
        req = ApprovalRequest.objects.create(
            enterprise=self.enterprise,
            requester=self.emp_user,
            request_type='evidence_verification',
            title='PyTorch Distributed Benchmark Verification',
            description='Validated model training on distributed GPUs',
            payload={'skill_id': self.skill.id}
        )

        initial_conf = self.emp_skill.confidence

        # HR approves
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.hr_token.key}')
        response = self.client.post(
            f'/api/approvals/{req.id}/resolve/',
            {'status': 'approved', 'reviewer_notes': 'Verified by Tech Lead and HR.'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        # Refresh
        self.emp_skill.refresh_from_db()
        req.refresh_from_db()

        self.assertEqual(req.status, 'approved')
        self.assertEqual(self.emp_skill.verification_status, 'hr_verified')
        self.assertGreater(self.emp_skill.confidence, initial_conf)

        # Check Audit Log was generated
        audit_exists = AuditLog.objects.filter(
            enterprise=self.enterprise,
            action='APPROVAL_APPROVED',
            target_id=str(req.id)
        ).exists()
        self.assertTrue(audit_exists)

    def test_hr_rejection_leaves_skill_unverified(self):
        req = ApprovalRequest.objects.create(
            enterprise=self.enterprise,
            requester=self.emp_user,
            request_type='evidence_verification',
            title='Unverified Claim',
            description='Incomplete benchmark',
            payload={'skill_id': self.skill.id}
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.hr_token.key}')
        response = self.client.post(
            f'/api/approvals/{req.id}/resolve/',
            {'status': 'rejected', 'reviewer_notes': 'Insufficient metrics.'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        req.refresh_from_db()
        self.assertEqual(req.status, 'rejected')
        self.emp_skill.refresh_from_db()
        self.assertEqual(self.emp_skill.verification_status, 'self_reported')

