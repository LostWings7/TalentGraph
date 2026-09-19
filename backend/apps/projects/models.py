from django.db import models
from django.contrib.auth.models import User
from apps.core.models import Enterprise
from apps.employees.models import Employee
from apps.skills.models import Skill

class Project(models.Model):
    STATUS_CHOICES = [
        ('Proposed', 'Proposed'),
        ('Staffing', 'Staffing'),
        ('Active', 'Active'),
        ('Completed', 'Completed'),
        ('Archived', 'Archived'),
    ]

    SENSITIVITY_CHOICES = [
        ('HR_ONLY', 'HR Only (Confidential / Sensitive)'),
        ('HR_CONTRIBUTORS', 'HR + Assigned Contributors'),
        ('ENTERPRISE_PUBLIC', 'Enterprise Public'),
    ]

    AI_PROCESSING_CHOICES = [
        ('AI_ALLOWED', 'AI Allowed (Full Context)'),
        ('AI_SAFE_SUMMARY', 'AI-Safe Summary Only (Redacted)'),
        ('NO_EXTERNAL_AI', 'No External AI Processing'),
    ]

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

    enterprise = models.ForeignKey(Enterprise, null=True, blank=True, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=200)
    objective = models.TextField(blank=True, default='', help_text='Strategic business objective or goal of the project')
    description = models.TextField()
    department = models.CharField(max_length=60, choices=DEPARTMENT_CHOICES, default='Engineering', db_index=True)
    technologies = models.TextField(help_text='Comma-separated list of technologies, frameworks, and tools used')
    required_skills = models.TextField(blank=True, default='', help_text='Comma-separated or list of required skills')
    outcomes = models.TextField(blank=True, default='', help_text='Measurable impact, metrics, or project deliverables')
    duration_months = models.IntegerField(default=6)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Active', db_index=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    sensitivity_level = models.CharField(max_length=30, choices=SENSITIVITY_CHOICES, default='ENTERPRISE_PUBLIC', db_index=True)
    ai_processing_mode = models.CharField(max_length=30, choices=AI_PROCESSING_CHOICES, default='AI_ALLOWED')
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('enterprise', 'name')
        indexes = [
            models.Index(fields=['enterprise', 'status']),
            models.Index(fields=['enterprise', 'sensitivity_level']),
        ]

    def __str__(self):
        if self.enterprise:
            return f"{self.name} ({self.enterprise.name})"
        return self.name

    def get_tech_list(self):
        """Return technologies as a list of strings."""
        if not self.technologies:
            return []
        return [t.strip() for t in self.technologies.split(',') if t.strip()]

    def get_required_skills_list(self):
        """Return required skills as a clean list of strings."""
        if not self.required_skills:
            return self.get_tech_list()
        return [s.strip() for s in self.required_skills.split(',') if s.strip()]

class ProjectContribution(models.Model):
    VERIFICATION_CHOICES = [
        ('pending', 'Pending HR Review'),
        ('approved', 'Approved / HR-Verified'),
        ('rejected', 'Rejected'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='contributions')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='contributors')
    role_in_project = models.CharField(max_length=150, default='Core Contributor')
    contribution_summary = models.TextField()
    evidence = models.TextField(blank=True, default='', help_text='Concrete artifact/impact evidence for skill inference')
    allocation_pct = models.FloatField(default=0.5, help_text='Time commitment percentage on this project')
    technologies_demonstrated = models.TextField(blank=True, default='')
    verification_status = models.CharField(max_length=30, choices=VERIFICATION_CHOICES, default='approved', db_index=True)
    submitted_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='submitted_contributions')
    verified_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='verified_contributions')
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('employee', 'project')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'verification_status']),
            models.Index(fields=['project', 'verification_status']),
        ]

    def __str__(self):
        return f"{self.employee.name} in {self.project.name} ({self.role_in_project})"

class StaffingRequest(models.Model):
    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('Staffed', 'Staffed'),
        ('Cancelled', 'Cancelled'),
    ]

    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, related_name='staffing_requests')
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.SET_NULL, related_name='staffing_requests')
    project_title = models.CharField(max_length=200)
    department = models.CharField(max_length=60, default='Engineering', db_index=True)
    requested_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='requested_staffing')
    team_size = models.IntegerField(default=5)
    required_skills = models.JSONField(default=list, help_text='List of skill requirements with proficiency & importance')
    minimum_experience = models.FloatField(default=2.0)
    duration_months = models.IntegerField(default=3)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Open', db_index=True)
    weights_config = models.JSONField(default=dict, blank=True, help_text='Custom weights configuration for staffing ranking')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['enterprise', 'status']),
        ]

    def __str__(self):
        return f"Staffing: {self.project_title} ({self.status}) - {self.enterprise.name}"

class StaffingRecommendation(models.Model):
    STATUS_CHOICES = [
        ('Recommended', 'Recommended'),
        ('Assigned', 'Assigned'),
        ('Declined', 'Declined'),
        ('Deferred', 'Deferred'),
    ]

    staffing_request = models.ForeignKey(StaffingRequest, on_delete=models.CASCADE, related_name='recommendations')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='staffing_recommendations')
    overall_score = models.FloatField(default=0.0, db_index=True)
    skill_score = models.FloatField(default=0.0)
    experience_score = models.FloatField(default=0.0)
    project_score = models.FloatField(default=0.0)
    evidence_score = models.FloatField(default=0.0)
    freshness_score = models.FloatField(default=0.0)
    availability_score = models.FloatField(default=0.0)
    matched_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)
    explanation = models.TextField(blank=True, default='')
    rank = models.IntegerField(default=1, db_index=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Recommended', db_index=True)
    feedback_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['rank', '-overall_score']
        unique_together = ('staffing_request', 'employee')
        indexes = [
            models.Index(fields=['staffing_request', 'rank']),
            models.Index(fields=['staffing_request', 'status']),
        ]

    def __str__(self):
        return f"#{self.rank} {self.employee.name} for {self.staffing_request.project_title} ({int(self.overall_score * 100)}%)"
