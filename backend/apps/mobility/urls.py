from django.urls import path
from apps.mobility.views import (
    employee_role_matches,
    role_match_detail,
    employee_skill_gap_analysis,
    employee_career_roadmap,
    what_if_simulation_view
)

urlpatterns = [
    path('matches/<int:employee_id>/', employee_role_matches, name='employee-role-matches'),
    path('match/<int:employee_id>/<int:role_id>/', role_match_detail, name='role-match-detail'),
    path('skill-gap/<int:employee_id>/<int:role_id>/', employee_skill_gap_analysis, name='skill-gap-analysis'),
    path('roadmap/<int:employee_id>/<int:role_id>/', employee_career_roadmap, name='career-roadmap'),
    path('what-if/<int:employee_id>/<int:role_id>/', what_if_simulation_view, name='what-if-simulation'),
]
