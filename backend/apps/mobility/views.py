from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from apps.employees.models import Employee
from apps.roles.models import Role
from apps.mobility.models import RoleMatch
from apps.mobility.matching_service import calculate_role_match, rank_roles_for_employee
from apps.mobility.gap_service import analyze_skill_gaps_for_role
from apps.mobility.roadmap_service import build_employee_career_roadmap
from apps.ai.explanation_service import generate_role_match_explanation

def _check_employee_access(request, employee):
    if request.user and request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
        if profile and profile.enterprise_id != employee.enterprise_id:
            return Response({'error': 'Unauthorized enterprise access.'}, status=status.HTTP_403_FORBIDDEN)
        if profile and profile.is_employee and profile.employee_id != employee.id:
            return Response({'error': 'Cannot access other employee data.'}, status=status.HTTP_403_FORBIDDEN)
    return None

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_role_matches(request, employee_id):
    """Returns top ranked role recommendations for an employee using the hybrid engine."""
    employee = get_object_or_404(Employee, id=employee_id)
    
    auth_err = _check_employee_access(request, employee)
    if auth_err: return auth_err

    top_n = int(request.query_params.get('limit', 15))
    force_refresh = request.query_params.get('refresh', 'false').lower() == 'true'
    
    ranked = rank_roles_for_employee(employee, top_n=top_n)
    return Response({
        'employee_id': employee.id,
        'employee_name': employee.name,
        'current_role': employee.current_role,
        'department': employee.department,
        'matches_count': len(ranked),
        'results': ranked
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def role_match_detail(request, employee_id, role_id):
    """Returns detailed 4-component match breakdown + AI explainability explanation."""
    employee = get_object_or_404(Employee, id=employee_id)
    
    auth_err = _check_employee_access(request, employee)
    if auth_err: return auth_err

    role = get_object_or_404(Role, id=role_id)
    force_refresh = request.query_params.get('refresh', 'false').lower() == 'true'

    match_data = calculate_role_match(employee, role, force_refresh=force_refresh)
    
    # Generate transparent AI explanation using Gemini 3.7 Flash or fallback
    explanation_result = generate_role_match_explanation(employee, role, match_data)
    match_data['explanation_details'] = (
        explanation_result.model_dump() if hasattr(explanation_result, 'model_dump') else explanation_result
    )

    # Save summary explanation text to RoleMatch model
    if hasattr(explanation_result, 'overall_fit_summary'):
        RoleMatch.objects.filter(employee=employee, role=role).update(
            explanation=explanation_result.overall_fit_summary
        )

    return Response(match_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_skill_gap_analysis(request, employee_id, role_id):
    """Returns skill gap decomposition (Matched, Partial, Missing) and mapped learning pathways."""
    employee = get_object_or_404(Employee, id=employee_id)
    
    auth_err = _check_employee_access(request, employee)
    if auth_err: return auth_err

    role = get_object_or_404(Role, id=role_id)
    gap_data = analyze_skill_gaps_for_role(employee, role)
    return Response(gap_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_career_roadmap(request, employee_id, role_id):
    """Returns multi-stage career development roadmap from current role to target role."""
    employee = get_object_or_404(Employee, id=employee_id)
    
    auth_err = _check_employee_access(request, employee)
    if auth_err: return auth_err

    role = get_object_or_404(Role, id=role_id)
    roadmap_data = build_employee_career_roadmap(employee, role)
    return Response(roadmap_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def what_if_simulation_view(request, employee_id, role_id):
    """Simulates capability acquisition and computes real mathematical readiness score delta."""
    employee = get_object_or_404(Employee, id=employee_id)
    role = get_object_or_404(Role, id=role_id)

    # Permission check for multi-tenancy & self-service
    if request.user and request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
        if profile and profile.enterprise_id != employee.enterprise_id:
            return Response({'error': 'Unauthorized enterprise access.'}, status=status.HTTP_403_FORBIDDEN)
        if profile and profile.is_employee and profile.employee_id != employee.id:
            return Response({'error': 'Cannot simulate What-If for other employees.'}, status=status.HTTP_403_FORBIDDEN)

    acquired_skills = request.data.get('acquired_skills', [])
    if isinstance(acquired_skills, str):
        acquired_skills = [s.strip() for s in acquired_skills.split(',') if s.strip()]

    from apps.mobility.matching_service import simulate_what_if_readiness
    sim_data = simulate_what_if_readiness(employee, role, acquired_skills=acquired_skills)
    return Response(sim_data)

