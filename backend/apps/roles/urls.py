from django.urls import path
from apps.roles.views import (
    RoleListView,
    RoleDetailView,
    role_departments
)

urlpatterns = [
    path('', RoleListView.as_view(), name='role-list'),
    path('departments/', role_departments, name='role-departments'),
    path('<int:pk>/', RoleDetailView.as_view(), name='role-detail'),
]
