from django.urls import path
from apps.personas import views

urlpatterns = [
    path('demos/', views.list_demo_personas_view, name='personas-demos-list'),
    path('demos/<str:demo_id>/files/', views.get_demo_persona_files_view, name='personas-demo-files'),
    path('parse-files/', views.parse_files_view, name='personas-parse-files'),
    path('analyze/', views.analyze_persona_view, name='personas-analyze'),
    path('create/', views.create_persona_view, name='personas-create'),
    path('stats/', views.get_personas_stats_view, name='personas-stats'),
    path('<int:pk>/', views.delete_persona_view, name='personas-delete'),
]
