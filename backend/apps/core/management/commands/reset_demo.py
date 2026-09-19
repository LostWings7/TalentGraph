"""Management Command: reset_demo

Deterministically restores the TalentGraph AI database to the clean, certified demo state.
Scoped strictly for Hackathon, Staging, and Evaluation environments.
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
from django.contrib.auth.models import User
from apps.core.models import Enterprise, UserProfile, ApprovalRequest, AuditLog
from apps.employees.models import Employee, EmployeeSkill, CareerGoal
from apps.roles.models import Role, RoleSkill
from apps.projects.models import Project, ProjectContribution, StaffingRequest, StaffingRecommendation
from apps.skills.models import Skill
from apps.learning.models import LearningResource, EmployeeLearning
from apps.mobility.models import RoleMatch

class Command(BaseCommand):
    help = 'Safely resets database and re-seeds deterministic TalentGraph AI demo data.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force demo reset without interactive confirmation prompt.',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("=" * 60))
        self.stdout.write(self.style.WARNING("  TALENTGRAPH AI — DETERMINISTIC DEMO RESTORATION"))
        self.stdout.write(self.style.WARNING("=" * 60))

        if not options.get('force'):
            self.stdout.write(
                "This will reset all employees, roles, projects, approvals, and matches "
                "to the canonical NovaTech Solutions seed dataset."
            )

        with transaction.atomic():
            self.stdout.write("1. Purging existing transactional data and caches...")
            RoleMatch.objects.all().delete()
            StaffingRecommendation.objects.all().delete()
            StaffingRequest.objects.all().delete()
            ApprovalRequest.objects.all().delete()
            AuditLog.objects.all().delete()
            ProjectContribution.objects.all().delete()
            EmployeeLearning.objects.all().delete()
            EmployeeSkill.objects.all().delete()
            CareerGoal.objects.all().delete()
            RoleSkill.objects.all().delete()
            LearningResource.objects.all().delete()
            Project.objects.all().delete()
            Role.objects.all().delete()
            Skill.objects.all().delete()
            Employee.objects.all().delete()
            UserProfile.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

            self.stdout.write("2. Executing seed_data engine...")
            call_command('seed_data')

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  DEMO RESTORATION COMPLETE!"))
        self.stdout.write(self.style.SUCCESS("  Enterprise: NovaTech Solutions (ID: 1, novatech-solutions)"))
        self.stdout.write(self.style.SUCCESS("  HR Admin:   hr@novatech.demo / password123"))
        self.stdout.write(self.style.SUCCESS("  Employees:  maya@novatech.demo, alex@novatech.demo, etc. / password123"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
