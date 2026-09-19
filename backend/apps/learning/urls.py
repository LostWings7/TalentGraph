from django.urls import path
from apps.learning.views import (
    LearningResourceListView,
    LearningResourceDetailView,
    employee_learnings_list_create
)

urlpatterns = [
    path('', LearningResourceListView.as_view(), name='learning-list'),
    path('<int:pk>/', LearningResourceDetailView.as_view(), name='learning-detail'),
    path('employee/<int:employee_id>/', employee_learnings_list_create, name='employee-learnings'),
]
