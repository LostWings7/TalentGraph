from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.conf import settings
from apps.employees.models import Employee
from apps.roles.models import Role
from apps.core.models import Enterprise
from apps.ai.skill_inference import profile_employee_skills
from apps.ai.assistant_service import chat_career_assistant, chat_hr_assistant
from apps.ai.model_config import GEMINI_MODEL, GEMINI_EMBEDDING_MODEL, AI_ENABLED, AI_FALLBACK_ENABLED

@api_view(['POST'])
def profile_employee_ai_view(request, employee_id):
    """Trigger AI Skill Profiling using Gemini 3.7 Flash with evidence validation and fallback."""
    employee = get_object_or_404(Employee, id=employee_id)
    persist = request.data.get('persist', True)
    
    profile_result = profile_employee_skills(employee, persist_discovered=persist)
    data = profile_result.model_dump() if hasattr(profile_result, 'model_dump') else profile_result
    return Response(data)

@api_view(['POST'])
def career_assistant_chat_view(request):
    """Grounded AI Career Assistant endpoint for employees."""
    employee_id = request.data.get('employee_id')
    query = request.data.get('query')
    if not employee_id or not query:
        return Response({'error': 'employee_id and query are required'}, status=status.HTTP_400_BAD_REQUEST)

    employee = get_object_or_404(Employee, id=employee_id)
    target_role_id = request.data.get('target_role_id')
    target_role = Role.objects.filter(id=target_role_id).first() if target_role_id else None
    history = request.data.get('conversation_history') or request.data.get('history') or []

    chat_response = chat_career_assistant(
        employee=employee,
        query=query,
        target_role=target_role,
        conversation_history=history
    )

    data = chat_response.model_dump() if hasattr(chat_response, 'model_dump') else chat_response
    if isinstance(data, dict):
        answer_text = data.get('answer') or data.get('reply') or data.get('message') or data.get('response') or ''
        facts = data.get('grounded_facts_used') or data.get('facts_used') or []
        next_steps = data.get('suggested_next_steps') or data.get('suggested_actions') or []
        prompts = data.get('suggested_prompts') or []
        
        data['answer'] = answer_text
        data['reply'] = answer_text
        data['response'] = answer_text
        data['message'] = answer_text
        data['grounded_facts_used'] = facts
        data['facts_used'] = facts
        data['suggested_next_steps'] = next_steps
        data['suggested_actions'] = next_steps
        data['suggested_prompts'] = prompts
        data['ai_model'] = GEMINI_MODEL
        data['is_live_ai'] = True

    return Response(data)

@api_view(['POST'])
def hr_assistant_chat_view(request):
    """Grounded HR Workforce Intelligence Assistant endpoint."""
    query = request.data.get('query')
    if not query:
        return Response({'error': 'query is required'}, status=status.HTTP_400_BAD_REQUEST)

    profile = getattr(request.user, 'profile', None) if request.user and request.user.is_authenticated else None
    enterprise = profile.enterprise if profile else Enterprise.objects.first()
    history = request.data.get('conversation_history') or request.data.get('history') or []

    res = chat_hr_assistant(enterprise=enterprise, query=query, conversation_history=history)
    return Response(res)

@api_view(['GET'])
def ai_status_view(request):
    """Returns AI model configuration, active provider, and fallback readiness."""
    has_key = bool(getattr(settings, 'GEMINI_API_KEY', ''))
    return Response({
        'gemini_model': GEMINI_MODEL,
        'embedding_model': GEMINI_EMBEDDING_MODEL,
        'ai_enabled': AI_ENABLED,
        'ai_fallback_enabled': AI_FALLBACK_ENABLED,
        'has_api_key': has_key,
        'mode': 'Live Gemini 3.7 Flash' if has_key and AI_ENABLED else 'Deterministic High-Fidelity Fallback Engine',
    })
