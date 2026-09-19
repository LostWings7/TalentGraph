import logging
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from apps.employees.models import Employee, EmployeeSkill, CareerGoal
from apps.employees.serializers import (
    EmployeeSerializer,
    EmployeeDetailSerializer,
    EmployeeSkillSerializer,
    CareerGoalSerializer
)
from apps.skills.models import Skill
from apps.core.models import Enterprise, ApprovalRequest
from apps.core.normalization import normalize_skill_name
from apps.core.permissions import CanAccessEmployeeObject, IsHRAdmin
from apps.core.audit import log_audit_event
from apps.core.approval_service import ApprovalService

logger = logging.getLogger(__name__)

class EmployeeListView(generics.ListAPIView):
    serializer_class = EmployeeSerializer

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None) if user and user.is_authenticated else None
        enterprise = profile.enterprise if profile else Enterprise.objects.first()

        qs = Employee.objects.all()
        if enterprise:
            qs = qs.filter(enterprise=enterprise)

        dept = self.request.query_params.get('department')
        if dept:
            qs = qs.filter(department=dept)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(current_role__icontains=search))

        # Filter by min availability
        min_avail = self.request.query_params.get('min_availability')
        if min_avail:
            try:
                avail_val = float(min_avail) / 100.0 if float(min_avail) > 1.0 else float(min_avail)
                qs = qs.filter(availability_pct__gte=avail_val)
            except ValueError:
                pass

        # Filter by required skill
        skill_param = self.request.query_params.get('skill')
        if skill_param:
            qs = qs.filter(skills__skill__name__icontains=skill_param).distinct()

        return qs

class EmployeeDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = EmployeeDetailSerializer
    permission_classes = [IsAuthenticated, CanAccessEmployeeObject]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None) if user and user.is_authenticated else None
        if profile and profile.enterprise:
            return Employee.objects.filter(enterprise=profile.enterprise)
        return Employee.objects.all()

    def perform_update(self, serializer):
        emp = serializer.save()
        profile = getattr(self.request.user, 'profile', None)
        enterprise = profile.enterprise if profile else emp.enterprise
        log_audit_event(
            enterprise=enterprise,
            actor=self.request.user if self.request.user.is_authenticated else None,
            action='EMPLOYEE_PROFILE_UPDATED',
            target_model='Employee',
            target_id=str(emp.id),
            details={'name': emp.name, 'current_role': emp.current_role}
        )

@api_view(['GET', 'POST'])
def employee_skills_list_create(request, employee_id):
    employee = get_object_or_404(Employee, id=employee_id)

    # Permission check
    if request.user and request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
        if profile and profile.enterprise_id != employee.enterprise_id:
            return Response({'error': 'Unauthorized enterprise access.'}, status=status.HTTP_403_FORBIDDEN)
        if profile and profile.is_employee and profile.employee_id != employee.id:
            return Response({'error': 'Cannot modify skills of other employees.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        skills = employee.skills.select_related('skill', 'verified_by').all()
        serializer = EmployeeSkillSerializer(skills, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        skill_name = request.data.get('skill_name')
        if not skill_name:
            return Response({'error': 'skill_name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        canonical_name = normalize_skill_name(skill_name)
        category = request.data.get('category', 'Backend')
        
        # Skill lookup in enterprise or global
        skill_obj = Skill.objects.filter(
            Q(enterprise=employee.enterprise) | Q(enterprise__isnull=True),
            name=canonical_name
        ).first()

        if not skill_obj:
            skill_obj = Skill.objects.create(
                enterprise=employee.enterprise,
                name=canonical_name,
                category=category,
                description=f'{canonical_name} skill'
            )

        is_hr = bool(request.user and request.user.is_authenticated and getattr(request.user, 'profile', None) and request.user.profile.is_hr)
        v_status = 'hr_verified' if is_hr else request.data.get('verification_status', 'self_reported')

        emp_skill, created = EmployeeSkill.objects.update_or_create(
            employee=employee,
            skill=skill_obj,
            defaults={
                'proficiency': request.data.get('proficiency', 'Intermediate'),
                'confidence': float(request.data.get('confidence', 0.9 if is_hr else 0.80)),
                'source': request.data.get('source', 'explicit'),
                'evidence': request.data.get('evidence', 'Added by employee'),
                'verification_status': v_status,
                'verified_by': request.user if is_hr else None,
                'verified_at': timezone.now() if is_hr else None,
                'last_demonstrated_date': timezone.now().date()
            }
        )

        # If employee added self-reported skill, optionally notify HR via ApprovalRequest
        if not is_hr and request.user and request.user.is_authenticated:
            ApprovalService.create_request(
                enterprise=employee.enterprise,
                requester=request.user,
                request_type='evidence_verification',
                title=f"{employee.name} added skill: {skill_obj.name} ({emp_skill.proficiency})",
                description=emp_skill.evidence,
                payload={'employee_id': employee.id, 'skill_id': skill_obj.id, 'skill_name': skill_obj.name}
            )

        serializer = EmployeeSkillSerializer(emp_skill)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

@api_view(['GET', 'POST', 'PUT'])
def employee_career_goal(request, employee_id):
    employee = get_object_or_404(Employee, id=employee_id)

    # Permission check
    if request.user and request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
        if profile and profile.enterprise_id != employee.enterprise_id:
            return Response({'error': 'Unauthorized enterprise access.'}, status=status.HTTP_403_FORBIDDEN)
        if profile and profile.is_employee and profile.employee_id != employee.id:
            return Response({'error': 'Cannot modify career goal of other employees.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        try:
            goal = employee.career_goal
            serializer = CareerGoalSerializer(goal)
            return Response(serializer.data)
        except CareerGoal.DoesNotExist:
            return Response({'target_role_title': '', 'notes': '', 'target_role_id': None})
    else:
        target_role_title = request.data.get('target_role_title', '')
        target_role_id = request.data.get('target_role_id')
        notes = request.data.get('notes', '')

        goal, _ = CareerGoal.objects.update_or_create(
            employee=employee,
            defaults={
                'target_role_title': target_role_title,
                'target_role_id': target_role_id,
                'notes': notes
            }
        )

        if employee.enterprise:
            log_audit_event(
                enterprise=employee.enterprise,
                actor=request.user if request.user.is_authenticated else None,
                action='CAREER_GOAL_UPDATED',
                target_model='CareerGoal',
                target_id=str(goal.id),
                details={'employee': employee.name, 'target_role': target_role_title}
            )

        serializer = CareerGoalSerializer(goal)
        return Response(serializer.data)
