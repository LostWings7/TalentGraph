"""Career Roadmap Orchestration Service.

Bridges deterministic skill gap analysis with Gemini 3.7 Flash roadmap reasoning.
"""
from typing import Dict, Any
from apps.employees.models import Employee
from apps.roles.models import Role
from apps.mobility.gap_service import analyze_skill_gaps_for_role
from apps.ai.career_service import generate_career_roadmap

def build_employee_career_roadmap(employee: Employee, target_role: Role) -> Dict[str, Any]:
    """Generate a validated multi-stage career progression roadmap."""
    # 1. Analyze skill gaps first
    gap_analysis = analyze_skill_gaps_for_role(employee, target_role)
    
    # 2. Generate roadmap structure
    roadmap_schema = generate_career_roadmap(
        employee=employee,
        target_role=target_role,
        skill_gaps=gap_analysis['skill_gaps']
    )

    return {
        'employee_id': employee.id,
        'employee_name': employee.name,
        'current_role': employee.current_role,
        'target_role_id': target_role.id,
        'target_role_title': target_role.title,
        'target_role_department': target_role.department,
        'match_score': gap_analysis['overall_match_score'],
        'readiness_percentage': gap_analysis['readiness_percentage'],
        'critical_gap_count': gap_analysis['critical_gap_count'],
        'estimated_total_months': roadmap_schema.estimated_total_months,
        'readiness_assessment': roadmap_schema.readiness_assessment,
        'stages': [stage.model_dump() for stage in roadmap_schema.stages],
    }
