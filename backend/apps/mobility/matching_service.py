"""Unified Hybrid Matching Engine for TalentGraph AI.

Provides cohesive bidirectional talent matching across:
  - Employee -> Role (Career Progression & Readiness)
  - Employee -> Project (Project Discovery & Contribution)
  - Role -> Employees (Succession Bench & Talent Search)
  - Project -> Employees (AI Project Staffing & Squad Builder)
  - What-If Capability Simulation (Mathematical Uplift Modeling)

All scoring logic is inspectable, centralized, and uses shared normalization,
evidence weighting, freshness curves, and semantic similarity.
"""
from typing import Dict, Any, List, Optional, Sequence
from django.db.models import Q
from apps.employees.models import Employee, EmployeeSkill
from apps.roles.models import Role, RoleSkill
from apps.projects.models import Project, ProjectContribution
from apps.mobility.models import RoleMatch
from apps.core.constants import (
    MATCHING_WEIGHTS,
    STAFFING_WEIGHTS,
    EVIDENCE_WEIGHTS,
    FRESHNESS_CONFIG,
    PROFICIENCY_LEVEL_WEIGHTS
)
from apps.ai.embeddings import get_text_embedding, compute_semantic_similarity
from apps.ai.profile_builder import build_employee_text_context, build_role_text_context
from apps.core.normalization import normalize_skill_name
from apps.core.math_utils import (
    calculate_experience_score,
    get_proficiency_weight,
    calculate_weighted_hybrid_score,
    calculate_freshness_score
)

class UnifiedMatchingEngine:
    """Centralized, deterministic talent matching engine connecting people to opportunities."""

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or MATCHING_WEIGHTS

    def match_employee_to_role(
        self,
        employee: Employee,
        role: Role,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """Calculate comprehensive 4-factor hybrid match between an employee and a role."""
        if not force_refresh:
            cached_match = RoleMatch.objects.filter(employee=employee, role=role).first()
            if cached_match:
                return {
                    'id': cached_match.id,
                    'employee_id': employee.id,
                    'employee_name': employee.name,
                    'role_id': role.id,
                    'role_title': role.title,
                    'department': role.department,
                    'future_demand_level': role.future_demand_level,
                    'overall_score': cached_match.overall_score,
                    'semantic_score': cached_match.semantic_score,
                    'skill_score': cached_match.skill_score,
                    'experience_score': cached_match.experience_score,
                    'project_score': cached_match.project_score,
                    'matched_skills': cached_match.matched_skills,
                    'missing_skills': cached_match.missing_skills,
                    'partially_matched_skills': cached_match.partially_matched_skills,
                    'explanation': cached_match.explanation,
                    'weights': self.weights,
                }

        # 1. Semantic Similarity Score (30%)
        semantic_score = self._compute_semantic_score(employee, role)

        # 2. Skill Alignment Score (35%)
        skill_score, matched_skills, partially_matched_skills, missing_skills = self._compute_skill_alignment(employee, role)

        # 3. Experience Alignment Score (20%)
        experience_score = calculate_experience_score(employee.years_experience, role.required_experience_years)

        # 4. Project Relevance Score (15%)
        project_score = self._compute_project_relevance(employee, role)

        # Calculate Overall Weighted Hybrid Score
        overall_score = calculate_weighted_hybrid_score(
            semantic_score=semantic_score,
            skill_score=skill_score,
            experience_score=experience_score,
            project_score=project_score,
            weights=self.weights
        )

        # Update or create cached RoleMatch
        match_obj, _ = RoleMatch.objects.update_or_create(
            employee=employee,
            role=role,
            defaults={
                'overall_score': overall_score,
                'semantic_score': round(semantic_score, 4),
                'skill_score': round(skill_score, 4),
                'experience_score': round(experience_score, 4),
                'project_score': round(project_score, 4),
                'matched_skills': matched_skills,
                'missing_skills': missing_skills,
                'partially_matched_skills': partially_matched_skills,
            }
        )

        return {
            'id': match_obj.id,
            'employee_id': employee.id,
            'employee_name': employee.name,
            'role_id': role.id,
            'role_title': role.title,
            'department': role.department,
            'future_demand_level': role.future_demand_level,
            'overall_score': overall_score,
            'semantic_score': round(semantic_score, 4),
            'skill_score': round(skill_score, 4),
            'experience_score': round(experience_score, 4),
            'project_score': round(project_score, 4),
            'matched_skills': matched_skills,
            'missing_skills': missing_skills,
            'partially_matched_skills': partially_matched_skills,
            'explanation': match_obj.explanation,
            'weights': self.weights,
        }

    def match_employee_to_project(
        self,
        employee: Employee,
        project: Project
    ) -> Dict[str, Any]:
        """Match an employee to a project requisition using shared technical taxonomy."""
        emp_skills = {
            normalize_skill_name(es.skill.name): es
            for es in employee.skills.select_related('skill').all()
        }
        
        req_skills = project.get_required_skills_list()
        matched = []
        missing = []
        accum_score = 0.0

        for r_name in req_skills:
            canon = normalize_skill_name(r_name)
            if canon in emp_skills:
                es = emp_skills[canon]
                matched.append({
                    'name': es.skill.name,
                    'proficiency': es.proficiency,
                    'confidence': es.confidence,
                    'verification_status': es.verification_status
                })
                accum_score += es.confidence * get_proficiency_weight(es.proficiency)
            else:
                missing.append({'name': r_name})

        coverage = (accum_score / max(1, len(req_skills))) if req_skills else 0.8
        exp_score = calculate_experience_score(employee.years_experience, 2.0)
        overall = round(0.50 * coverage + 0.30 * exp_score + 0.20 * employee.availability_pct, 4)

        return {
            'employee_id': employee.id,
            'employee_name': employee.name,
            'project_id': project.id,
            'project_name': project.name,
            'overall_score': overall,
            'skill_coverage': round(coverage, 4),
            'experience_score': round(exp_score, 4),
            'availability_pct': int(employee.availability_pct * 100),
            'matched_skills': matched,
            'missing_skills': missing,
        }

    def match_role_to_employees(
        self,
        role: Role,
        employees: Optional[Sequence[Employee]] = None
    ) -> List[Dict[str, Any]]:
        """Bidirectional: Rank all employees in enterprise for a specific role."""
        if employees is None:
            qs = Employee.objects.all()
            if role.enterprise:
                qs = qs.filter(enterprise=role.enterprise)
            employees = list(qs.prefetch_related('skills__skill', 'contributions__project'))

        results = [self.match_employee_to_role(emp, role) for emp in employees]
        results.sort(key=lambda x: x['overall_score'], reverse=True)
        return results

    def match_project_to_employees(
        self,
        project: Project,
        employees: Optional[Sequence[Employee]] = None
    ) -> List[Dict[str, Any]]:
        """Bidirectional: Rank candidates for a project requisition."""
        if employees is None:
            qs = Employee.objects.all()
            if project.enterprise:
                qs = qs.filter(enterprise=project.enterprise)
            employees = list(qs.prefetch_related('skills__skill', 'contributions__project'))

        results = [self.match_employee_to_project(emp, project) for emp in employees]
        results.sort(key=lambda x: x['overall_score'], reverse=True)
        return results

    def simulate_what_if(
        self,
        employee: Employee,
        role: Role,
        acquired_skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Simulate capability acquisition and calculate mathematical readiness delta.
        
        Evaluates projected skill score increase, closure of critical gaps,
        and updated overall readiness score.
        """
        acquired_normalized = {normalize_skill_name(s) for s in (acquired_skills or [])}
        
        # 1. Base current match
        base_match = self.match_employee_to_role(employee, role)
        
        # 2. Simulated skill alignment calculation
        role_skills = role.role_skills.select_related('skill').all()
        emp_skills_map = {
            normalize_skill_name(es.skill.name): es
            for es in employee.skills.select_related('skill').all()
        }

        sim_matched = []
        sim_missing = []
        total_weight = 0.0
        accum_score = 0.0

        for rs in role_skills:
            skill_name = normalize_skill_name(rs.skill.name)
            imp_mult = 1.5 if rs.importance == 'Essential' else (1.2 if rs.importance == 'Preferred' else 0.8)
            if rs.is_required:
                imp_mult *= 1.3
            total_weight += imp_mult
            req_weight = get_proficiency_weight(rs.minimum_proficiency)

            if skill_name in emp_skills_map:
                # Existing skill
                es = emp_skills_map[skill_name]
                cand_weight = get_proficiency_weight(es.proficiency)
                conf = max(0.5, min(1.0, es.confidence))
                ratio = min(1.0, cand_weight / max(0.01, req_weight))
                accum_score += imp_mult * ratio * conf
                sim_matched.append({'name': rs.skill.name, 'status': 'already_possessed'})
            elif skill_name in acquired_normalized:
                # Newly simulated skill (assumed proficient & fresh)
                sim_weight = req_weight # Meets required proficiency
                sim_conf = 0.90         # High simulated confidence
                accum_score += imp_mult * 1.0 * sim_conf
                sim_matched.append({'name': rs.skill.name, 'status': 'simulated_acquired'})
            else:
                sim_missing.append({'name': rs.skill.name, 'importance': rs.importance})

        sim_skill_score = (accum_score / max(0.001, total_weight))
        sim_skill_score = max(0.0, min(1.0, sim_skill_score))

        # 3. Simulated overall score
        sim_overall = calculate_weighted_hybrid_score(
            semantic_score=base_match['semantic_score'],
            skill_score=sim_skill_score,
            experience_score=base_match['experience_score'],
            project_score=base_match['project_score'],
            weights=self.weights
        )

        delta = round(sim_overall - base_match['overall_score'], 4)
        delta_pct = round(delta * 100, 1)

        return {
            'employee_id': employee.id,
            'employee_name': employee.name,
            'role_id': role.id,
            'role_title': role.title,
            'current_overall_score': base_match['overall_score'],
            'simulated_overall_score': sim_overall,
            'readiness_delta': delta,
            'readiness_delta_pct': delta_pct,
            'current_skill_score': base_match['skill_score'],
            'simulated_skill_score': round(sim_skill_score, 4),
            'acquired_skills_count': len(acquired_normalized),
            'closed_gaps': [s for s in sim_matched if s['status'] == 'simulated_acquired'],
            'remaining_missing_skills': sim_missing,
            'weights': self.weights,
        }

    def _compute_semantic_score(self, employee: Employee, role: Role) -> float:
        """Compute cosine similarity between cached employee and role embedding vectors."""
        emp_vec = employee.embedding
        if not emp_vec:
            emp_text = build_employee_text_context(employee)
            emp_vec = get_text_embedding(emp_text)
            employee.embedding = emp_vec
            employee.save(update_fields=['embedding'])

        role_vec = role.embedding
        if not role_vec:
            role_text = build_role_text_context(role)
            role_vec = get_text_embedding(role_text)
            role.embedding = role_vec
            role.save(update_fields=['embedding'])

        return compute_semantic_similarity(emp_vec, role_vec)

    def _compute_skill_alignment(self, employee: Employee, role: Role):
        """Calculates skill alignment score and decomposes into matched, partial, missing."""
        role_skills = role.role_skills.select_related('skill').all()
        if not role_skills.exists():
            return 0.85, [], [], []

        emp_skills_map = {
            normalize_skill_name(es.skill.name): es
            for es in employee.skills.select_related('skill').all()
        }

        matched_skills = []
        partially_matched_skills = []
        missing_skills = []
        total_weight = 0.0
        accumulated_score = 0.0

        for rs in role_skills:
            skill_name = normalize_skill_name(rs.skill.name)
            importance_mult = 1.5 if rs.importance == 'Essential' else (1.2 if rs.importance == 'Preferred' else 0.8)
            if rs.is_required:
                importance_mult *= 1.3

            total_weight += importance_mult
            req_weight = get_proficiency_weight(rs.minimum_proficiency)

            if skill_name in emp_skills_map:
                es = emp_skills_map[skill_name]
                cand_weight = get_proficiency_weight(es.proficiency)
                confidence_factor = max(0.5, min(1.0, es.confidence))

                if cand_weight >= req_weight:
                    score_contrib = importance_mult * 1.0 * confidence_factor
                    accumulated_score += score_contrib
                    matched_skills.append({
                        'id': rs.skill.id,
                        'name': rs.skill.name,
                        'category': rs.skill.category,
                        'candidate_proficiency': es.proficiency,
                        'required_proficiency': rs.minimum_proficiency,
                        'importance': rs.importance,
                        'is_required': rs.is_required,
                        'confidence': es.confidence,
                        'evidence': es.evidence,
                        'source': es.source,
                    })
                else:
                    ratio = cand_weight / max(0.01, req_weight)
                    score_contrib = importance_mult * ratio * confidence_factor
                    accumulated_score += score_contrib
                    partially_matched_skills.append({
                        'id': rs.skill.id,
                        'name': rs.skill.name,
                        'category': rs.skill.category,
                        'candidate_proficiency': es.proficiency,
                        'required_proficiency': rs.minimum_proficiency,
                        'importance': rs.importance,
                        'is_required': rs.is_required,
                        'confidence': es.confidence,
                        'evidence': es.evidence,
                        'source': es.source,
                    })
            else:
                missing_skills.append({
                    'id': rs.skill.id,
                    'name': rs.skill.name,
                    'category': rs.skill.category,
                    'candidate_proficiency': 'None',
                    'required_proficiency': rs.minimum_proficiency,
                    'importance': rs.importance,
                    'is_required': rs.is_required,
                    'confidence': 0.0,
                    'evidence': '',
                    'source': 'unacquired',
                })

        skill_score = accumulated_score / max(0.001, total_weight)
        return max(0.0, min(1.0, skill_score)), matched_skills, partially_matched_skills, missing_skills

    def _compute_project_relevance(self, employee: Employee, role: Role) -> float:
        """Calculates project relevance score by measuring tech & deliverable alignment."""
        contributions = employee.contributions.select_related('project').all()
        if not contributions.exists():
            return 0.35

        role_text = (role.description + " " + role.responsibilities).lower()
        role_skill_names = [rs.skill.name.lower() for rs in role.role_skills.select_related('skill').all()]

        matched_elements = 0
        total_elements = max(1, len(role_skill_names) + 3)

        for contrib in contributions:
            for tech in contrib.project.get_tech_list():
                if tech.lower() in role_text or any(tech.lower() in rsn for rsn in role_skill_names):
                    matched_elements += 1

            outcomes = contrib.project.outcomes.lower()
            if "scale" in outcomes or "production" in outcomes or "lead" in outcomes or "architecture" in outcomes:
                matched_elements += 0.5

        ratio = matched_elements / total_elements
        return max(0.20, min(1.0, 0.40 + ratio * 0.60))

# =====================================================================
# Standalone Module Functions (Backward Compatible & Clean APIs)
# =====================================================================

_engine = UnifiedMatchingEngine()

def calculate_role_match(employee: Employee, role: Role, force_refresh: bool = False) -> Dict[str, Any]:
    return _engine.match_employee_to_role(employee, role, force_refresh=force_refresh)

def calculate_project_match(employee: Employee, project: Project) -> Dict[str, Any]:
    return _engine.match_employee_to_project(employee, project)

def rank_roles_for_employee(employee: Employee, top_n: int = 15) -> List[Dict[str, Any]]:
    qs = Role.objects.filter(is_active=True)
    if employee.enterprise:
        qs = qs.filter(Q(enterprise=employee.enterprise) | Q(enterprise__isnull=True))
    all_roles = qs.prefetch_related('role_skills__skill').all()
    results = [_engine.match_employee_to_role(employee, r) for r in all_roles]
    results.sort(key=lambda x: x['overall_score'], reverse=True)
    return results[:top_n]

def rank_candidates_for_role(role: Role, top_n: int = 15) -> List[Dict[str, Any]]:
    return _engine.match_role_to_employees(role)[:top_n]

def simulate_what_if_readiness(employee: Employee, role: Role, acquired_skills: Optional[List[str]] = None) -> Dict[str, Any]:
    return _engine.simulate_what_if(employee, role, acquired_skills=acquired_skills)
