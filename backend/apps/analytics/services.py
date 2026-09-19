"""HR Workforce Skill Intelligence & Analytics Service.

Calculates enterprise skill heatmaps, talent bench depth, emerging skill gaps,
verified capability supply, and generates executive workforce insights.
Strictly tenant-scoped.
"""
from typing import Dict, Any, List, Optional
from django.db.models import Count, Avg, Q
from apps.employees.models import Employee, EmployeeSkill
from apps.skills.models import Skill
from apps.roles.models import Role, RoleSkill
from apps.projects.models import Project, ProjectContribution
from apps.learning.models import LearningResource, EmployeeLearning
from apps.core.models import Enterprise
from apps.mobility.models import RoleMatch
from apps.mobility.matching_service import calculate_role_match
from apps.core.normalization import normalize_skill_name
from apps.core.math_utils import calculate_experience_score
from apps.ai.gemini_client import generate_structured_gemini_response
from apps.ai.schemas import HRWorkforceInsightsSchema
from apps.ai.prompts import HR_INSIGHTS_SYSTEM_INSTRUCTION
from apps.ai.fallback import generate_fallback_hr_insights

def get_workforce_intelligence_dashboard(enterprise: Optional[Enterprise] = None) -> Dict[str, Any]:
    """Compile comprehensive executive workforce talent intelligence metrics for enterprise."""
    emp_qs = Employee.objects.all()
    role_qs = Role.objects.filter(is_active=True)
    proj_qs = Project.objects.all()
    learning_qs = EmployeeLearning.objects.all()
    skill_qs = Skill.objects.all()

    if enterprise:
        emp_qs = emp_qs.filter(enterprise=enterprise)
        role_qs = role_qs.filter(Q(enterprise=enterprise) | Q(enterprise__isnull=True))
        proj_qs = proj_qs.filter(enterprise=enterprise)
        learning_qs = learning_qs.filter(employee__enterprise=enterprise)
        skill_qs = skill_qs.filter(Q(enterprise=enterprise) | Q(enterprise__isnull=True))

    total_employees = emp_qs.count()
    total_skills = skill_qs.count()
    total_roles = role_qs.count()
    total_projects = proj_qs.count()
    active_projects = proj_qs.filter(status='Active').count()
    total_learnings = learning_qs.count()
    completed_learnings = learning_qs.filter(status='Completed').count()

    # 1. Skill Distribution by Category
    category_counts = skill_qs.values('category').annotate(count=Count('id')).order_by('-count')
    category_distribution = {item['category']: item['count'] for item in category_counts}

    # 2. Most In-Demand Skills vs Organization Coverage & Verified Talent
    demand_by_skill = RoleSkill.objects.filter(role__in=role_qs).values('skill__name', 'skill__category').annotate(
        role_demand_count=Count('role', distinct=True)
    ).order_by('-role_demand_count')[:12]

    emerging_skill_gaps = []
    capability_risks = []

    for item in demand_by_skill:
        skill_name = item['skill__name']
        emp_skills = EmployeeSkill.objects.filter(employee__in=emp_qs, skill__name=skill_name)
        emp_count = emp_skills.count()
        verified_count = emp_skills.filter(verification_status='hr_verified').count()
        role_demand = item['role_demand_count']
        
        scarcity_ratio = round(role_demand / max(1, emp_count), 2)
        risk_level = 'Critical' if scarcity_ratio > 1.5 or (role_demand >= 3 and verified_count < 2) else ('High' if scarcity_ratio > 0.8 else 'Moderate')

        gap_info = {
            'skill_name': skill_name,
            'category': item['skill__category'],
            'open_role_demand': role_demand,
            'proficient_employees_count': emp_count,
            'verified_employees_count': verified_count,
            'scarcity_ratio': scarcity_ratio,
            'risk_level': risk_level,
        }
        emerging_skill_gaps.append(gap_info)

        if risk_level in ['Critical', 'High']:
            capability_risks.append({
                'skill_name': skill_name,
                'category': item['skill__category'],
                'demand_count': role_demand,
                'verified_count': verified_count,
                'risk_level': risk_level,
                'recommendation': f"Prioritize internal workshops or hiring for {skill_name}."
            })

    emerging_skill_gaps.sort(key=lambda x: x['scarcity_ratio'], reverse=True)

    # 3. Internal Talent Availability & Near-Ready Succession Bench (High-performance prefetch)
    top_roles = list(role_qs[:8])
    employees = list(emp_qs)
    
    # Pre-fetch existing cached RoleMatches
    existing_matches = {
        (rm.role_id, rm.employee_id): rm.overall_score
        for rm in RoleMatch.objects.filter(role__in=top_roles, employee__in=employees)
    }
    
    # Pre-fetch employee skills map for fast in-memory fallback
    emp_skills_map = {}
    for es in EmployeeSkill.objects.filter(employee__in=employees).select_related('skill'):
        emp_skills_map.setdefault(es.employee_id, {})[normalize_skill_name(es.skill.name)] = es

    role_skills_map = {}
    for rs in RoleSkill.objects.filter(role__in=top_roles).select_related('skill'):
        role_skills_map.setdefault(rs.role_id, []).append(rs)

    role_bench_readiness = []

    for role in top_roles:
        ready_now = []
        near_ready = []
        upskill_needed = []
        r_skills = role_skills_map.get(role.id, [])

        for emp in employees:
            score = existing_matches.get((role.id, emp.id))
            if score is None:
                e_skills = emp_skills_map.get(emp.id, {})
                if r_skills:
                    matched_wt = sum(1.0 for rs in r_skills if normalize_skill_name(rs.skill.name) in e_skills)
                    skill_alignment = matched_wt / len(r_skills)
                else:
                    skill_alignment = 0.8
                exp_score = calculate_experience_score(emp.years_experience, role.required_experience_years)
                score = round((skill_alignment * 0.6) + (exp_score * 0.4), 2)

            cand_info = {
                'employee_id': emp.id,
                'employee_name': emp.name,
                'current_role': emp.current_role,
                'department': emp.department,
                'match_score': score,
                'experience_years': emp.years_experience,
                'availability_pct': int(emp.availability_pct * 100)
            }
            if score >= 0.85:
                ready_now.append(cand_info)
            elif score >= 0.70:
                near_ready.append(cand_info)
            elif score >= 0.50:
                upskill_needed.append(cand_info)
        
        ready_now.sort(key=lambda x: x['match_score'], reverse=True)
        near_ready.sort(key=lambda x: x['match_score'], reverse=True)
        
        role_bench_readiness.append({
            'role_id': role.id,
            'role_title': role.title,
            'department': role.department,
            'future_demand_level': role.future_demand_level,
            'ready_now_count': len(ready_now),
            'near_ready_count': len(near_ready),
            'upskill_count': len(upskill_needed),
            'bench_depth_count': len(ready_now) + len(near_ready),
            'top_candidates': (ready_now + near_ready)[:3],
        })

    # 4. Talent Availability Stats
    available_100 = emp_qs.filter(availability_pct__gte=0.9).count()
    available_part = emp_qs.filter(availability_pct__gt=0.0, availability_pct__lt=0.9).count()
    unavailable = emp_qs.filter(availability_pct=0.0).count()

    availability_stats = {
        'fully_available_count': available_100,
        'partially_available_count': available_part,
        'allocated_count': unavailable,
        'overall_capacity_pct': int((sum(e.availability_pct for e in emp_qs) / max(1, total_employees)) * 100)
    }

    # 5. Learning & Development Demand
    learning_stats = {
        'total_enrollments': total_learnings,
        'completed_count': completed_learnings,
        'completion_rate_pct': int((completed_learnings / max(1, total_learnings)) * 100),
        'top_providers': list(
            LearningResource.objects.values('provider').annotate(count=Count('id')).order_by('-count')[:4]
        )
    }

    # 6. Strategic AI Insights using Gemini 3.7 Flash or fallback
    org_summary_stats = {
        'enterprise_name': enterprise.name if enterprise else 'Enterprise',
        'total_employees': total_employees,
        'total_skills': total_skills,
        'total_roles': total_roles,
        'active_projects': active_projects,
        'critical_gap_count': len(capability_risks),
        'top_scarcities': [g['skill_name'] for g in emerging_skill_gaps[:3]]
    }

    ai_insights = None
    try:
        prompt = (
            f"--- WORKFORCE TALENT METRICS ({org_summary_stats['enterprise_name']}) ---\n"
            f"Employees: {total_employees}\n"
            f"Active Projects: {active_projects}\n"
            f"Critical Capability Gaps: {len(capability_risks)} ({', '.join(org_summary_stats['top_scarcities'])})\n"
            f"Talent Capacity: {availability_stats['overall_capacity_pct']}%\n"
            f"Generate high-level workforce intelligence insights with executive summary and actionable recommendations."
        )
        ai_insights = generate_structured_gemini_response(
            prompt=prompt,
            response_schema=HRWorkforceInsightsSchema,
            system_instruction=HR_INSIGHTS_SYSTEM_INSTRUCTION,
            temperature=0.2
        )
    except Exception:
        pass

    if ai_insights is None:
        ai_insights = generate_fallback_hr_insights(org_summary_stats)

    return {
        'enterprise_name': enterprise.name if enterprise else 'Enterprise',
        'organization_stats': {
            'total_employees': total_employees,
            'total_skills': total_skills,
            'total_roles': total_roles,
            'total_projects': total_projects,
            'active_projects': active_projects,
        },
        'category_distribution': category_distribution,
        'emerging_skill_gaps': emerging_skill_gaps,
        'capability_risks': capability_risks,
        'role_bench_readiness': role_bench_readiness,
        'availability_stats': availability_stats,
        'learning_stats': learning_stats,
        'ai_insights': ai_insights.model_dump() if hasattr(ai_insights, 'model_dump') else ai_insights,
    }
