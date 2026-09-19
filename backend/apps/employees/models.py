from django.db import models
from django.contrib.auth.models import User
from apps.core.models import Enterprise
from apps.skills.models import Skill

class Employee(models.Model):
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

    AVAILABILITY_CHOICES = [
        (1.0, '100% Available'),
        (0.75, '75% Available'),
        (0.50, '50% Available'),
        (0.25, '25% Available'),
        (0.0, 'Unavailable / Fully Allocated'),
    ]

    enterprise = models.ForeignKey(Enterprise, null=True, blank=True, on_delete=models.CASCADE, related_name='employees')
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=60, choices=DEPARTMENT_CHOICES, default='Engineering')
    current_role = models.CharField(max_length=150)
    years_experience = models.FloatField(default=1.0)
    education = models.CharField(max_length=255, blank=True, default='')
    certifications = models.TextField(blank=True, default='', help_text='Comma-separated or newline list of certifications')
    bio = models.TextField(blank=True, default='')
    interests = models.TextField(blank=True, default='', help_text='Areas of career curiosity or aspirational interests')
    avatar_url = models.URLField(blank=True, default='')
    availability_pct = models.FloatField(default=1.0, help_text='Current capacity available for project staffing (0.0 to 1.0)')
    current_allocation_pct = models.FloatField(default=0.0, help_text='Allocated capacity across active projects')
    embedding = models.JSONField(blank=True, null=True, help_text='Cached embedding vector')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['enterprise', 'department']),
            models.Index(fields=['enterprise', 'availability_pct']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.current_role})"

    @property
    def is_available(self):
        return self.availability_pct > 0.0

class EmployeeSkill(models.Model):
    PROFICIENCY_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
        ('Expert', 'Expert'),
    ]

    SOURCE_CHOICES = [
        ('explicit', 'Explicit (Self-Reported / Verified)'),
        ('project_inferred', 'Project-Inferred'),
        ('learning', 'Learning & Certification'),
        ('ai_discovered', 'AI-Discovered (Hidden/Transferable)'),
    ]

    VERIFICATION_CHOICES = [
        ('self_reported', 'Self-Reported'),
        ('hr_verified', 'HR Verified'),
        ('ai_inferred', 'AI Inferred'),
        ('system_generated', 'System Generated'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name='employee_proficiencies')
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES, default='Intermediate', db_index=True)
    confidence = models.FloatField(default=0.85, db_index=True, help_text='Confidence score between 0.0 and 1.0')
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES, default='explicit')
    evidence = models.TextField(blank=True, default='', help_text='Mandatory grounding context for inferred/discovered skills')
    verification_status = models.CharField(max_length=30, choices=VERIFICATION_CHOICES, default='hr_verified', db_index=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='verified_employee_skills')
    last_demonstrated_date = models.DateField(null=True, blank=True, help_text='Date when skill was most recently practiced')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('employee', 'skill')
        ordering = ['-confidence', 'skill__name']
        indexes = [
            models.Index(fields=['employee', 'verification_status']),
            models.Index(fields=['skill', 'confidence']),
        ]

    def __str__(self):
        return f"{self.employee.name} - {self.skill.name} ({self.proficiency}, {self.verification_status})"

class CareerGoal(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='career_goal')
    target_role_title = models.CharField(max_length=150)
    target_role_id = models.IntegerField(null=True, blank=True, help_text='Optional FK reference to Role id')
    notes = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.name} -> {self.target_role_title}"
