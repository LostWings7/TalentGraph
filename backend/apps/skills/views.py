from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from apps.skills.models import Skill
from apps.skills.serializers import SkillSerializer
from apps.core.models import Enterprise
from apps.core.normalization import normalize_skill_name

class SkillListView(generics.ListCreateAPIView):
    serializer_class = SkillSerializer

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None) if user and user.is_authenticated else None
        enterprise = profile.enterprise if profile else Enterprise.objects.first()

        qs = Skill.objects.all()
        if enterprise:
            qs = qs.filter(Q(enterprise=enterprise) | Q(enterprise__isnull=True))

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'profile', None) if self.request.user and self.request.user.is_authenticated else None
        enterprise = profile.enterprise if profile else None
        serializer.save(enterprise=enterprise)

class SkillDetailView(generics.RetrieveAPIView):
    serializer_class = SkillSerializer

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None) if user and user.is_authenticated else None
        enterprise = profile.enterprise if profile else Enterprise.objects.first()
        if enterprise:
            return Skill.objects.filter(Q(enterprise=enterprise) | Q(enterprise__isnull=True))
        return Skill.objects.all()

@api_view(['GET'])
def skill_categories(request):
    categories = [
        {'id': c[0], 'name': c[1]}
        for c in Skill.CATEGORY_CHOICES
    ]
    return Response(categories)
