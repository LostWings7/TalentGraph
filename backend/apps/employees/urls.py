from django.urls import path
from apps.employees.views import (
    EmployeeListView,
    EmployeeDetailView,
    employee_skills_list_create,
    employee_career_goal
)

urlpatterns = [
    path('', EmployeeListView.as_view(), name='employee-list'),
    path('<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('<int:employee_id>/skills/', employee_skills_list_create, name='employee-skills'),
    path('<int:employee_id>/career-goal/', employee_career_goal, name='employee-career-goal'),
]
