from django.test import TestCase
from apps.employees.models import Employee
from apps.roles.models import Role
from apps.ai.fallback import (
    generate_fallback_skill_profile,
    generate_fallback_role_explanation,
    generate_fallback_career_roadmap,
    generate_fallback_assistant_response,
    generate_fallback_hr_insights
)
from apps.ai.schemas import (
    SkillProfileSchema,
    RoleExplanationSchema,
    CareerRoadmapSchema,
    CareerAssistantResponseSchema,
    HRWorkforceInsightsSchema
)

class AIFallbackTestCase(TestCase):
    def setUp(self):
        self.employee = Employee.objects.create(
            name="Fallback Candidate",
            email="fallback@talentgraph.internal",
            department="AI Research",
            current_role="Machine Learning Engineer",
            years_experience=4.0
        )
        self.role = Role.objects.create(
            title="Lead AI Scientist",
            department="AI Research",
            description="Leading AI initiatives",
            responsibilities="Lead research",
            required_experience_years=6.0
        )

    def test_fallback_skill_profile_schema_compliance(self):
        profile = generate_fallback_skill_profile(self.employee)
        self.assertIsInstance(profile, SkillProfileSchema)
        self.assertEqual(profile.employee_name, self.employee.name)
        self.assertTrue(len(profile.strengths) > 0)
        # Verify evidence is present for inferred skills
        for inf in profile.inferred_skills:
            self.assertTrue(len(inf.evidence) > 0)

    def test_fallback_role_explanation_schema_compliance(self):
        match_data = {
            'overall_score': 0.88,
            'matched_skills': [{'name': 'Python'}, {'name': 'PyTorch'}],
            'missing_skills': [{'name': 'MLOps'}]
        }
        explanation = generate_fallback_role_explanation(self.employee, self.role, match_data)
        self.assertIsInstance(explanation, RoleExplanationSchema)
        self.assertIn("88%", explanation.overall_fit_summary)
        self.assertTrue(len(explanation.key_strengths) > 0)
        self.assertTrue(len(explanation.recommended_actions) > 0)

    def test_fallback_career_roadmap_schema_compliance(self):
        gaps = [{'skill_name': 'MLOps', 'status': 'Missing', 'priority': 'Critical'}]
        roadmap = generate_fallback_career_roadmap(self.employee, self.role, gaps)
        self.assertIsInstance(roadmap, CareerRoadmapSchema)
        self.assertEqual(len(roadmap.stages), 3)
        self.assertGreater(roadmap.estimated_total_months, 0)

    def test_fallback_assistant_response_schema_compliance(self):
        resp = generate_fallback_assistant_response(
            self.employee,
            "How do I reach Lead AI Scientist?",
            {'target_role_title': 'Lead AI Scientist'}
        )
        self.assertIsInstance(resp, CareerAssistantResponseSchema)
        self.assertTrue(len(resp.answer) > 0)
        self.assertTrue(len(resp.grounded_facts_used) > 0)
        self.assertTrue(len(resp.suggested_prompts) > 0)

    def test_fallback_hr_insights_schema_compliance(self):
        insights = generate_fallback_hr_insights({'total_employees': 30, 'total_skills': 40})
        self.assertIsInstance(insights, HRWorkforceInsightsSchema)
        self.assertTrue(len(insights.executive_summary) > 0)
        self.assertTrue(len(insights.emerging_risk_areas) > 0)
