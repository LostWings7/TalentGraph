from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from apps.roles.models import Role, RoleSkill
from apps.roles.serializers import RoleSerializer, RoleDetailSerializer
from apps.core.models import Enterprise
from apps.skills.models import Skill
from apps.core.normalization import normalize_skill_name
from apps.core.audit import log_audit_event
from apps.ai.embeddings import get_text_embedding
from apps.ai.profile_builder import build_role_text_context

class RoleListView(generics.ListCreateAPIView):
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None) if user and user.is_authenticated else None
        enterprise = profile.enterprise if profile else Enterprise.objects.first()

        qs = Role.objects.filter(is_active=True)
        if enterprise:
            qs = qs.filter(Q(enterprise=enterprise) | Q(enterprise__isnull=True))

        dept = self.request.query_params.get('department')
        if dept:
            qs = qs.filter(department=dept)
        demand = self.request.query_params.get('demand')
        if demand:
            qs = qs.filter(future_demand_level=demand)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        return qs

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        enterprise = profile.enterprise if profile else Enterprise.objects.first()
        role = serializer.save(enterprise=enterprise)

        # Generate and save role embedding
        try:
            role_text = build_role_text_context(role)
            role.embedding = get_text_embedding(role_text)
            role.save(update_fields=['embedding'])
        except Exception:
            pass

        # Handle required skills if passed in request
        skills_data = self.request.data.get('skills', [])
        for s in skills_data:
            sname = s.get('name') or s.get('skill_name')
            if sname:
                canon = normalize_skill_name(sname)
                skill_obj, _ = Skill.objects.get_or_create(
                    name=canon,
                    defaults={'category': s.get('category', 'Backend'), 'enterprise': enterprise}
                )
                RoleSkill.objects.create(
                    role=role,
                    skill=skill_obj,
                    importance=s.get('importance', 'Essential'),
                    minimum_proficiency=s.get('minimum_proficiency', 'Intermediate'),
                    is_required=s.get('is_required', True)
                )

        log_audit_event(
            enterprise=enterprise,
            actor=self.request.user,
            action='ROLE_CREATED',
            target_model='Role',
            target_id=str(role.id),
            details={'title': role.title, 'department': role.department}
        )

class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RoleDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None) if user and user.is_authenticated else None
        enterprise = profile.enterprise if profile else Enterprise.objects.first()
        if enterprise:
            return Role.objects.filter(Q(enterprise=enterprise) | Q(enterprise__isnull=True))
        return Role.objects.all()

@api_view(['GET'])
def role_departments(request):
    depts = [
        {'id': d[0], 'name': d[1]}
        for d in Role.DEPARTMENT_CHOICES
    ]
    return Response(depts)
