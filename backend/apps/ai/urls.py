from django.urls import path
from apps.ai.views import (
    profile_employee_ai_view,
    career_assistant_chat_view,
    hr_assistant_chat_view,
    ai_status_view
)

urlpatterns = [
    path('profile/<int:employee_id>/', profile_employee_ai_view, name='ai-skill-profile'),
    path('assistant/chat/', career_assistant_chat_view, name='ai-assistant-chat'),
    path('assistant/hr/', hr_assistant_chat_view, name='ai-assistant-hr'),
    path('status/', ai_status_view, name='ai-status'),
]
