"""
Tests for AI Project Staffing Engine and Team Builder Optimizer.
Verifies multi-factor scoring formula, candidate ranking, availability weighting,
greedy team selection, and explainability fallback.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.core.models import Enterprise, UserProfile
from apps.employees.models import Employee, EmployeeSkill
from apps.skills.models import Skill
from apps.projects.models import Project, StaffingRequest
from apps.projects.staffing_service import StaffingEngine


class StaffingEngineTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.enterprise = Enterprise.objects.create(
            name='Nexus Labs',
            slug='nexus-labs',
            industry='Cloud Computing'
        )

        # HR Admin
        self.hr_user = User.objects.create_user(
            username='hr@nexus.demo',
            email='hr@nexus.demo',
            password='Password123!'
        )
        self.hr_profile = UserProfile.objects.create(
            user=self.hr_user,
            enterprise=self.enterprise,
            role='hr_admin'
        )
        self.hr_token = Token.objects.create(user=self.hr_user)

        # Skills
        self.k8s_skill = Skill.objects.create(name='Kubernetes Orchestration', category='Cloud')
        self.go_skill = Skill.objects.create(name='Go Microservices', category='Backend')

        # Employee 1: Highly skilled, high availability
        self.emp1 = Employee.objects.create(
            name='Dave DevOps',
            email='dave@nexus.demo',
            department='Engineering',
            current_role='Principal Cloud Architect',
            years_experience=8,
            enterprise=self.enterprise,
            availability_pct=0.8,
            current_allocation_pct=0.2
        )
        EmployeeSkill.objects.create(
            employee=self.emp1,
            skill=self.k8s_skill,
            proficiency='Expert',
            confidence=0.95,
            verification_status='hr_verified'
        )
        EmployeeSkill.objects.create(
            employee=self.emp1,
            skill=self.go_skill,
            proficiency='Advanced',
            confidence=0.90,
            verification_status='hr_verified'
        )

        # Employee 2: Medium skilled, busy (low availability)
        self.emp2 = Employee.objects.create(
            name='Junior John',
            email='john@nexus.demo',
            department='Engineering',
            current_role='Junior Cloud Engineer',
            years_experience=2,
            enterprise=self.enterprise,
            availability_pct=0.1,
            current_allocation_pct=0.9
        )
        EmployeeSkill.objects.create(
            employee=self.emp2,
            skill=self.k8s_skill,
            proficiency='Intermediate',
            confidence=0.50
        )

        # Project & Staffing Request
        self.project = Project.objects.create(
            name='Global Multi-Region Kubernetes Mesh',
            description='Deploy enterprise service mesh across 5 cloud regions',
            enterprise=self.enterprise,
            status='Active'
        )
        self.staffing_req = StaffingRequest.objects.create(
            enterprise=self.enterprise,
            project=self.project,
            project_title='Global Multi-Region Kubernetes Mesh',
            department='Engineering',
            requested_by=self.hr_user,
            team_size=1,
            required_skills=[
                {'name': 'Kubernetes Orchestration', 'min_proficiency': 'Advanced', 'importance': 'Required'},
                {'name': 'Go Microservices', 'min_proficiency': 'Intermediate', 'importance': 'Preferred'}
            ],
            minimum_experience=5.0
        )

    def test_staffing_candidate_ranking_and_scores(self):
        engine = StaffingEngine(self.enterprise)
        candidates = engine.score_candidates_for_request(self.staffing_req)

        self.assertGreater(len(candidates), 0)
        top_candidate = candidates[0]

        # Top candidate should be Dave DevOps
        self.assertEqual(top_candidate['employee_id'], self.emp1.id)
        self.assertGreater(top_candidate['overall_score'], 0.70)
        self.assertIn('skill_score', top_candidate)
        self.assertIn('availability_score', top_candidate)
        self.assertIsNotNone(top_candidate['explanation'])

    def test_staffing_api_endpoint(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.hr_token.key}')
        response = self.client.post(f'/api/projects/staffing/{self.staffing_req.id}/analyze/', {}, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('results', data)
        self.assertGreaterEqual(len(data['results']), 1)
        self.assertEqual(data['results'][0]['employee_name'], 'Dave DevOps')


    def test_team_builder_greedy_selection(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.hr_token.key}')
        payload = {
            'team_size': 1
        }
        response = self.client.post(f'/api/projects/staffing/{self.staffing_req.id}/team-builder/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('selected_members', data)
        self.assertEqual(len(data['selected_members']), 1)
        self.assertEqual(data['selected_members'][0]['employee_id'], self.emp1.id)

