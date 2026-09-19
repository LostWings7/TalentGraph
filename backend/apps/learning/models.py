from django.db import models
from apps.core.models import Enterprise
from apps.skills.models import Skill
from apps.employees.models import Employee

class LearningResource(models.Model):
    DIFFICULTY_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
    ]

    PROVIDER_CHOICES = [
        ('Internal Academy', 'TalentGraph Internal Academy'),
        ('Coursera', 'Coursera Enterprise'),
        ('AWS Skill Builder', 'AWS Skill Builder'),
        ('Google Cloud Skills', 'Google Cloud Skills Boost'),
        ('O\'Reilly', 'O\'Reilly Media'),
        ('DeepLearning.AI', 'DeepLearning.AI'),
        ('Linux Foundation', 'Linux Foundation'),
    ]

    enterprise = models.ForeignKey(Enterprise, null=True, blank=True, on_delete=models.CASCADE, related_name='learning_resources', help_text='Null for global learning catalog, set for enterprise-specific courses')
    title = models.CharField(max_length=200)
    provider = models.CharField(max_length=100, choices=PROVIDER_CHOICES, default='Internal Academy')
    description = models.TextField()
    skills_covered = models.ManyToManyField(Skill, related_name='learning_resources')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='Intermediate')
    duration_hours = models.IntegerField(default=10)
    certification_name = models.CharField(max_length=200, blank=True, default='')
    url = models.URLField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        if self.enterprise:
            return f"{self.title} ({self.provider} - {self.enterprise.name})"
        return f"{self.title} ({self.provider})"

class EmployeeLearning(models.Model):
    STATUS_CHOICES = [
        ('Not Started', 'Not Started'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='learnings')
    resource = models.ForeignKey(LearningResource, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='In Progress')
    completion_date = models.DateField(null=True, blank=True)
    outcome = models.TextField(blank=True, default='', help_text='Assessment score or capstone project evidence')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('employee', 'resource')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.name} - {self.resource.title} ({self.status})"
