from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify

class Enterprise(models.Model):
    name = models.CharField(max_length=150, unique=True)
    legal_name = models.CharField(max_length=200, blank=True, default='')
    slug = models.SlugField(max_length=100, unique=True)
    industry = models.CharField(max_length=100, default='Technology & Software')
    description = models.TextField(blank=True, default='')
    mission = models.TextField(blank=True, default='')
    size = models.CharField(max_length=50, default='1,000 - 5,000 employees')
    departments = models.JSONField(default=list, help_text='List of organization departments')
    locations = models.JSONField(default=list, help_text='Enterprise office and remote locations')
    work_modes = models.JSONField(default=list, help_text='Supported work modes: Remote, Hybrid, On-site')
    website = models.URLField(blank=True, default='')
    logo_url = models.URLField(blank=True, default='')
    settings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('hr_admin', 'HR / Enterprise Administrator'),
        ('employee', 'Employee'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, related_name='members')
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='employee')
    employee = models.OneToOneField('employees.Employee', null=True, blank=True, on_delete=models.SET_NULL, related_name='account')
    is_temporary_password = models.BooleanField(default=False)
    title = models.CharField(max_length=150, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['user__username']

    def __str__(self):
        return f"{self.user.username} ({self.role}) - {self.enterprise.name}"

    @property
    def is_hr(self):
        return self.role == 'hr_admin'

    @property
    def is_employee(self):
        return self.role == 'employee'

class ApprovalRequest(models.Model):
    TYPE_CHOICES = [
        ('project_contribution', 'Project Contribution'),
        ('evidence_verification', 'Skill Evidence Verification'),
        ('skill_correction', 'Skill Profile Correction'),
        ('course_completion', 'Course Completion Claim'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, related_name='approvals')
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requested_approvals')
    reviewer = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_approvals')
    request_type = models.CharField(max_length=40, choices=TYPE_CHOICES, default='project_contribution', db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    payload = models.JSONField(default=dict, blank=True)
    reviewer_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['enterprise', 'status']),
            models.Index(fields=['enterprise', 'request_type']),
        ]

    def __str__(self):
        return f"{self.title} ({self.status}) - {self.enterprise.name}"

class AuditLog(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, related_name='audit_logs')
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='audit_actions')
    actor_name = models.CharField(max_length=150, blank=True, default='')
    action = models.CharField(max_length=100, db_index=True)
    target_model = models.CharField(max_length=100, blank=True, default='', db_index=True)
    target_id = models.CharField(max_length=100, blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['enterprise', 'action']),
            models.Index(fields=['enterprise', 'timestamp']),
        ]

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.actor_name}: {self.action} ({self.enterprise.name})"
