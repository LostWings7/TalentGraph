from django.test import TestCase
from apps.core.math_utils import calculate_weighted_hybrid_score
from apps.employees.models import Employee
from apps.roles.models import Role
from apps.mobility.matching_service import calculate_role_match, rank_roles_for_employee

class WeightedRoleRankingTestCase(TestCase):
    def test_weighted_hybrid_formula(self):
        # Weights: 0.30 semantic, 0.35 skill, 0.20 experience, 0.15 project
        score = calculate_weighted_hybrid_score(
            semantic_score=1.0,
            skill_score=1.0,
            experience_score=1.0,
            project_score=1.0
        )
        self.assertEqual(score, 1.0)

        partial_score = calculate_weighted_hybrid_score(
            semantic_score=0.80,   # 0.24
            skill_score=0.90,      # 0.315
            experience_score=0.70,  # 0.14
            project_score=0.60     # 0.09
        )
        self.assertAlmostEqual(partial_score, 0.785, places=3)

    def test_role_match_calculation(self):
        emp = Employee.objects.first()
        role = Role.objects.first()
        if emp and role:
            match = calculate_role_match(emp, role)
            self.assertIn('overall_score', match)
            self.assertIn('semantic_score', match)
            self.assertIn('skill_score', match)
            self.assertIn('experience_score', match)
            self.assertIn('project_score', match)
            self.assertGreaterEqual(match['overall_score'], 0.0)
            self.assertLessEqual(match['overall_score'], 1.0)
