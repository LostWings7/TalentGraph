from django.db import models
from apps.employees.models import Employee
from apps.roles.models import Role

class Feedback(models.Model):
    RECOMMENDATION_TYPE_CHOICES = [
        ('RoleMatch', 'Role Recommendation Match'),
        ('Learning', 'Learning Resource Recommendation'),
        ('Roadmap', 'Career Development Roadmap'),
        ('SkillInference', 'AI-Discovered Skill'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='feedbacks')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks')
    recommendation_type = models.CharField(max_length=30, choices=RECOMMENDATION_TYPE_CHOICES, default='RoleMatch')
    accepted = models.BooleanField(default=True, help_text='True for accepted/liked, False for rejected/disliked')
    reason = models.TextField(blank=True, default='', help_text='Employee feedback rationale or context')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        status = "Accepted" if self.accepted else "Rejected"
        return f"{self.employee.name} - {self.recommendation_type} ({status})"
