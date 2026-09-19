from django.urls import path
from apps.skills.views import SkillListView, SkillDetailView, skill_categories

urlpatterns = [
    path('', SkillListView.as_view(), name='skill-list'),
    path('categories/', skill_categories, name='skill-categories'),
    path('<int:pk>/', SkillDetailView.as_view(), name='skill-detail'),
]
