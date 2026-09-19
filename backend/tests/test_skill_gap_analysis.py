from django.test import TestCase
from apps.skills.models import Skill
from apps.roles.models import Role, RoleSkill
from apps.employees.models import Employee, EmployeeSkill
from apps.mobility.gap_service import analyze_skill_gaps_for_role

class SkillGapAnalysisTestCase(TestCase):
    def setUp(self):
        self.skill_python = Skill.objects.create(name="Python", category="Backend")
        self.skill_pytorch = Skill.objects.create(name="PyTorch", category="AI/ML")
        self.skill_k8s = Skill.objects.create(name="Kubernetes", category="Cloud & DevOps")

        self.role = Role.objects.create(
            title="Senior ML Engineer",
            department="AI Research",
            description="ML engineering role",
            responsibilities="Train and deploy models",
            required_experience_years=4.0
        )

        RoleSkill.objects.create(
            role=self.role,
            skill=self.skill_python,
            importance="Essential",
            minimum_proficiency="Advanced",
            is_required=True
        )
        RoleSkill.objects.create(
            role=self.role,
            skill=self.skill_pytorch,
            importance="Essential",
            minimum_proficiency="Intermediate",
            is_required=True
        )
        RoleSkill.objects.create(
            role=self.role,
            skill=self.skill_k8s,
            importance="Preferred",
            minimum_proficiency="Beginner",
            is_required=False
        )

        self.employee = Employee.objects.create(
            name="Test Engineer",
            email="test@talentgraph.internal",
            department="Engineering",
            current_role="Software Engineer",
            years_experience=3.5
        )

        # Employee has Python (Expert) -> Matched
        EmployeeSkill.objects.create(
            employee=self.employee,
            skill=self.skill_python,
            proficiency="Expert",
            confidence=0.95
        )
        # Employee has PyTorch (Beginner, but role wants Intermediate) -> Partial Gap
        EmployeeSkill.objects.create(
            employee=self.employee,
            skill=self.skill_pytorch,
            proficiency="Beginner",
            confidence=0.80
        )
        # Employee does NOT have Kubernetes -> Missing Gap

    def test_skill_gap_classification(self):
        gap_data = analyze_skill_gaps_for_role(self.employee, self.role)
        
        self.assertEqual(len(gap_data['matched_skills']), 1)
        self.assertEqual(gap_data['matched_skills'][0]['skill_name'], "Python")

        self.assertEqual(len(gap_data['skill_gaps']), 2)
        
        # Check PyTorch is classified as Partial with Critical priority (since Essential + is_required)
        pytorch_gap = next(g for g in gap_data['skill_gaps'] if g['skill_name'] == "PyTorch")
        self.assertEqual(pytorch_gap['status'], 'Partial')
        self.assertEqual(pytorch_gap['priority'], 'Critical')

        # Check Kubernetes is classified as Missing with Medium priority (since Preferred)
        k8s_gap = next(g for g in gap_data['skill_gaps'] if g['skill_name'] == "Kubernetes")
        self.assertEqual(k8s_gap['status'], 'Missing')
        self.assertEqual(k8s_gap['priority'], 'Medium')
