from django.test import TestCase
from apps.employees.models import Employee
from apps.roles.models import Role
from apps.mobility.matching_service import rank_roles_for_employee

class RecommendationRankingTestCase(TestCase):
    def test_ranking_sort_order(self):
        emp = Employee.objects.create(
            name="Ranking Candidate",
            email="rank@talentgraph.internal",
            department="Engineering",
            current_role="Senior Software Engineer",
            years_experience=6.0
        )
        Role.objects.create(
            title="Senior Backend Engineer",
            department="Engineering",
            description="High scale backend",
            responsibilities="APIs",
            required_experience_years=5.0
        )
        Role.objects.create(
            title="Junior Graphic Designer",
            department="Product",
            description="Graphics and visual assets",
            responsibilities="Figma designs",
            required_experience_years=1.0
        )

        ranked = rank_roles_for_employee(emp, top_n=10)
        self.assertGreaterEqual(len(ranked), 2)
        
        # Verify descending order of overall_score
        scores = [r['overall_score'] for r in ranked]
        self.assertEqual(scores, sorted(scores, reverse=True))
