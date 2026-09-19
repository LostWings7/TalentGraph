from django.db import models
from apps.employees.models import Employee
from apps.roles.models import Role

class RoleMatch(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='role_matches')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='matched_candidates')
    overall_score = models.FloatField(default=0.0, db_index=True)
    semantic_score = models.FloatField(default=0.0)
    skill_score = models.FloatField(default=0.0)
    experience_score = models.FloatField(default=0.0)
    project_score = models.FloatField(default=0.0)
    matched_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)
    partially_matched_skills = models.JSONField(default=list)
    explanation = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('employee', 'role')
        ordering = ['-overall_score']

    def __str__(self):
        return f"{self.employee.name} -> {self.role.title} ({int(self.overall_score * 100)}%)"
