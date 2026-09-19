from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from apps.learning.models import LearningResource, EmployeeLearning
from apps.employees.models import Employee
from apps.learning.serializers import LearningResourceSerializer, EmployeeLearningSerializer
from apps.core.models import Enterprise
from apps.skills.models import Skill
from apps.core.audit import log_audit_event

class LearningResourceListView(generics.ListCreateAPIView):
    serializer_class = LearningResourceSerializer

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None) if user and user.is_authenticated else None
        enterprise = profile.enterprise if profile else Enterprise.objects.first()

        qs = LearningResource.objects.all()
        if enterprise:
            qs = qs.filter(Q(enterprise=enterprise) | Q(enterprise__isnull=True))

        provider = self.request.query_params.get('provider')
        if provider:
            qs = qs.filter(provider=provider)
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        return qs

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'profile', None) if self.request.user and self.request.user.is_authenticated else None
        enterprise = profile.enterprise if profile else None
        resource = serializer.save(enterprise=enterprise)

        skills_covered = self.request.data.get('skills_covered', [])
        for sid in skills_covered:
            skill_obj = Skill.objects.filter(id=sid).first()
            if skill_obj:
                resource.skills_covered.add(skill_obj)

        if enterprise:
            log_audit_event(
                enterprise=enterprise,
                actor=self.request.user if self.request.user.is_authenticated else None,
                action='COURSE_CREATED',
                target_model='LearningResource',
                target_id=str(resource.id),
                details={'title': resource.title, 'provider': resource.provider}
            )

class LearningResourceDetailView(generics.RetrieveAPIView):
    serializer_class = LearningResourceSerializer

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None) if user and user.is_authenticated else None
        enterprise = profile.enterprise if profile else Enterprise.objects.first()
        if enterprise:
            return LearningResource.objects.filter(Q(enterprise=enterprise) | Q(enterprise__isnull=True))
        return LearningResource.objects.all()

@api_view(['GET', 'POST'])
def employee_learnings_list_create(request, employee_id):
    employee = get_object_or_404(Employee, id=employee_id)

    # Permission check
    if request.user and request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
        if profile and profile.enterprise_id != employee.enterprise_id:
            return Response({'error': 'Unauthorized enterprise access.'}, status=status.HTTP_403_FORBIDDEN)
        if profile and profile.is_employee and profile.employee_id != employee.id:
            return Response({'error': 'Cannot access learning records of other employees.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        enrollments = employee.learnings.select_related('resource').all()
        serializer = EmployeeLearningSerializer(enrollments, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        resource_id = request.data.get('resource_id')
        resource = get_object_or_404(LearningResource, id=resource_id)
        status_val = request.data.get('status', 'In Progress')
        outcome = request.data.get('outcome', '')

        enrollment, created = EmployeeLearning.objects.update_or_create(
            employee=employee,
            resource=resource,
            defaults={
                'status': status_val,
                'outcome': outcome,
                'completion_date': timezone.now().date() if status_val == 'Completed' else None
            }
        )
        serializer = EmployeeLearningSerializer(enrollment)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
