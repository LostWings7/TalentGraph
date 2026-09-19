from django.db import models
from apps.core.models import Enterprise
from apps.skills.models import Skill

class Role(models.Model):
    DEPARTMENT_CHOICES = [
        ('Engineering', 'Engineering'),
        ('AI Research', 'AI Research & Platform'),
        ('Data Platform', 'Data Platform & Analytics'),
        ('Cloud Architecture', 'Cloud & Infrastructure'),
        ('Product', 'Product & Design'),
        ('Security', 'Information Security'),
        ('Healthcare Analytics', 'Healthcare Analytics'),
        ('Financial Technology', 'Financial Technology'),
    ]

    DEMAND_CHOICES = [
        ('Critical', 'Critical Growth Need'),
        ('High', 'High Demand'),
        ('Moderate', 'Moderate Demand'),
    ]

    enterprise = models.ForeignKey(Enterprise, null=True, blank=True, on_delete=models.CASCADE, related_name='roles')
    title = models.CharField(max_length=150)
    department = models.CharField(max_length=60, choices=DEPARTMENT_CHOICES, default='Engineering', db_index=True)
    description = models.TextField()
    responsibilities = models.TextField(help_text='Detailed key responsibilities and expectations')
    required_experience_years = models.FloatField(default=3.0)
    future_demand_level = models.CharField(max_length=20, choices=DEMAND_CHOICES, default='High', db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    embedding = models.JSONField(blank=True, null=True, help_text='Cached embedding vector for semantic matching')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']
        unique_together = ('enterprise', 'title')
        indexes = [
            models.Index(fields=['enterprise', 'is_active']),
            models.Index(fields=['department', 'future_demand_level']),
        ]

    def __str__(self):
        if self.enterprise:
            return f"{self.title} ({self.department} - {self.enterprise.name})"
        return f"{self.title} ({self.department})"

class RoleSkill(models.Model):
    IMPORTANCE_CHOICES = [
        ('Essential', 'Essential (Core Requirement)'),
        ('Preferred', 'Preferred (High Value)'),
        ('Nice-to-have', 'Nice-to-have (Bonus)'),
    ]

    PROFICIENCY_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
        ('Expert', 'Expert'),
    ]

    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name='role_requirements')
    importance = models.CharField(max_length=20, choices=IMPORTANCE_CHOICES, default='Essential', db_index=True)
    minimum_proficiency = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES, default='Intermediate')
    is_required = models.BooleanField(default=True, db_index=True, help_text='Whether this skill is strictly mandatory for the role')

    class Meta:
        unique_together = ('role', 'skill')
        ordering = ['-is_required', 'skill__name']
        indexes = [
            models.Index(fields=['role', 'is_required']),
            models.Index(fields=['skill', 'importance']),
        ]

    def __str__(self):
        return f"{self.role.title} -> {self.skill.name} ({self.importance})"
