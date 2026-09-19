from django.urls import path
from apps.projects.views import (
    ProjectListView,
    ProjectDetailView,
    EmployeeContributionsListView,
    project_contributors_view,
    staffing_requests_list_create,
    staffing_analyze_view,
    staffing_team_builder_view,
    staffing_assign_candidate_view,
    project_assign_contributor_view
)

urlpatterns = [
    path('', ProjectListView.as_view(), name='project-list-create'),
    path('<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('<int:project_id>/contributors/', project_contributors_view, name='project-contributors'),
    path('employee/<int:employee_id>/', EmployeeContributionsListView.as_view(), name='employee-contributions'),
    
    # Direct contributor assignment
    path('<int:project_id>/assign/<int:employee_id>/', project_assign_contributor_view, name='project-assign-contributor'),
    
    # Staffing routes
    path('staffing/', staffing_requests_list_create, name='staffing-requests'),
    path('staffing/<int:request_id>/analyze/', staffing_analyze_view, name='staffing-analyze'),
    path('staffing/<int:request_id>/team-builder/', staffing_team_builder_view, name='staffing-team-builder'),
    path('staffing/<int:request_id>/assign/<int:employee_id>/', staffing_assign_candidate_view, name='staffing-assign'),
]
