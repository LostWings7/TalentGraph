"""Skill Gap Analysis and Learning Recommendation Engine.

Identifies explicit and latent skill gaps against target roles, prioritizes gaps
into Critical / High / Medium / Low, and maps each gap to data-driven learning pathways.
"""
from typing import Dict, Any, List
from apps.employees.models import Employee, EmployeeSkill
from apps.roles.models import Role, RoleSkill
from apps.learning.models import LearningResource, EmployeeLearning
from apps.mobility.matching_service import calculate_role_match
from apps.core.normalization import normalize_skill_name

def analyze_skill_gaps_for_role(employee: Employee, role: Role) -> Dict[str, Any]:
    """Perform a comprehensive skill-gap decomposition and map gaps to learning resources."""
    match_data = calculate_role_match(employee, role)
    
    role_skills = role.role_skills.select_related('skill').all()
    emp_skills_map = {
        normalize_skill_name(es.skill.name): es
        for es in employee.skills.select_related('skill').all()
    }

    gaps = []
    matched = []

    for rs in role_skills:
        canonical_name = normalize_skill_name(rs.skill.name)
        
        # Determine gap priority
        if rs.is_required and rs.importance == 'Essential':
            priority = 'Critical'
        elif rs.is_required or rs.importance == 'Essential':
            priority = 'High'
        elif rs.importance == 'Preferred':
            priority = 'Medium'
        else:
            priority = 'Low'

        if canonical_name in emp_skills_map:
            es = emp_skills_map[canonical_name]
            from apps.core.math_utils import get_proficiency_weight
            cand_weight = get_proficiency_weight(es.proficiency)
            req_weight = get_proficiency_weight(rs.minimum_proficiency)

            if cand_weight >= req_weight:
                matched.append({
                    'skill_id': rs.skill.id,
                    'skill_name': rs.skill.name,
                    'category': rs.skill.category,
                    'status': 'Matched',
                    'priority': 'Fulfilled',
                    'candidate_proficiency': es.proficiency,
                    'required_proficiency': rs.minimum_proficiency,
                    'evidence': es.evidence or f"Verified in {employee.current_role}",
                    'source': es.source,
                    'confidence': es.confidence,
                })
            else:
                # Partial Gap
                partial_courses = _find_learning_resources_for_skill(rs.skill, rs.minimum_proficiency)
                gaps.append({
                    'skill_id': rs.skill.id,
                    'skill_name': rs.skill.name,
                    'category': rs.skill.category,
                    'status': 'Partial',
                    'priority': priority,
                    'candidate_proficiency': es.proficiency,
                    'required_proficiency': rs.minimum_proficiency,
                    'gap_description': f"Current proficiency ({es.proficiency}) is below role expectation ({rs.minimum_proficiency}).",
                    'evidence': es.evidence,
                    'confidence': es.confidence,
                    'recommended_resources': partial_courses,
                })
        else:
            # Full Missing Gap
            missing_courses = _find_learning_resources_for_skill(rs.skill, rs.minimum_proficiency)
            gaps.append({
                'skill_id': rs.skill.id,
                'skill_name': rs.skill.name,
                'category': rs.skill.category,
                'status': 'Missing',
                'priority': priority,
                'candidate_proficiency': 'None',
                'required_proficiency': rs.minimum_proficiency,
                'gap_description': f"Skill not currently recorded or demonstrated. Required at {rs.minimum_proficiency} level.",
                'evidence': 'No verified project contribution or certification record found.',
                'confidence': 0.0,
                'recommended_resources': missing_courses,
            })

    # Sort gaps: Critical -> High -> Medium -> Low
    priority_order = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}
    gaps.sort(key=lambda g: priority_order.get(g['priority'], 4))

    # Overall Gap Statistics
    total_requirements = len(role_skills)
    matched_count = len(matched)
    gap_count = len(gaps)
    critical_gap_count = sum(1 for g in gaps if g['priority'] == 'Critical')
    readiness_percentage = int((matched_count / max(1, total_requirements)) * 100)

    return {
        'employee_id': employee.id,
        'employee_name': employee.name,
        'current_role': employee.current_role,
        'role_id': role.id,
        'role_title': role.title,
        'department': role.department,
        'overall_match_score': match_data['overall_score'],
        'readiness_percentage': readiness_percentage,
        'total_requirements': total_requirements,
        'matched_count': matched_count,
        'gap_count': gap_count,
        'critical_gap_count': critical_gap_count,
        'matched_skills': matched,
        'skill_gaps': gaps,
    }

def _find_learning_resources_for_skill(skill, target_proficiency: str) -> List[Dict[str, Any]]:
    """Query data-driven learning resources linked directly or by category to the skill."""
    # Direct match via many-to-many
    direct_resources = skill.learning_resources.all()
    
    if not direct_resources.exists():
        # Fallback to resources in the same category or title keyword
        direct_resources = LearningResource.objects.filter(
            description__icontains=skill.name
        )[:3]

    if not direct_resources.exists():
        # General resources
        direct_resources = LearningResource.objects.all()[:2]

    results = []
    for res in direct_resources[:3]:
        results.append({
            'id': res.id,
            'title': res.title,
            'provider': res.provider,
            'difficulty': res.difficulty,
            'duration_hours': res.duration_hours,
            'certification_name': res.certification_name,
            'url': res.url,
            'description': res.description,
        })
    return results
