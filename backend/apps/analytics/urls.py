from django.urls import path
from apps.analytics.views import hr_intelligence_dashboard

urlpatterns = [
    path('dashboard/', hr_intelligence_dashboard, name='hr-intelligence-dashboard'),
]
