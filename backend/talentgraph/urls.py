from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings

@api_view(['GET'])
def health_check(request):
    return Response({
        'status': 'healthy',
        'service': 'TalentGraph AI API',
        'version': '1.0.0',
        'ai_model': settings.GEMINI_MODEL,
        'ai_enabled': settings.AI_ENABLED,
        'ai_fallback_enabled': settings.AI_FALLBACK_ENABLED,
        'has_api_key': bool(settings.GEMINI_API_KEY)
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/', include('apps.core.urls')),
    path('api/employees/', include('apps.employees.urls')),
    path('api/skills/', include('apps.skills.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/roles/', include('apps.roles.urls')),
    path('api/learning/', include('apps.learning.urls')),
    path('api/mobility/', include('apps.mobility.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/feedback/', include('apps.feedback.urls')),
    path('api/ai/', include('apps.ai.urls')),
    path('api/personas/', include('apps.personas.urls')),
]
