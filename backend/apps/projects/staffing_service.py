"""AI Project Staffing Engine & Team Optimizer for TalentGraph AI.

Provides deterministic multi-factor candidate scoring, team composition optimization,
and grounded Gemini 3.7 Flash explainability.
Strictly tenant-scoped to the authenticated Enterprise.
"""
import logging
from typing import Dict, Any, List, Optional
from django.utils import timezone
from django.db.models import Q
from apps.employees.models import Employee, EmployeeSkill
from apps.projects.models import Project, ProjectContribution, StaffingRequest, StaffingRecommendation
from apps.skills.models import Skill
from apps.core.models import Enterprise
from apps.core.normalization import normalize_skill_name
from apps.core.math_utils import get_proficiency_weight, calculate_experience_score
from apps.ai.gemini_client import generate_structured_gemini_response
from apps.ai.schemas import StaffingExplanationSchema

from apps.core.constants import (
    STAFFING_WEIGHTS,
    EVIDENCE_WEIGHTS,
    FRESHNESS_CONFIG,
    PROFICIENCY_LEVEL_WEIGHTS
)

logger = logging.getLogger(__name__)

# Default weights for project staffing (aliased to centralized constants)
DEFAULT_STAFFING_WEIGHTS = STAFFING_WEIGHTS


class StaffingEngine:
    def __init__(self, enterprise: Optional[Enterprise] = None):
        self.enterprise = enterprise

    def score_candidates_for_request(self, staffing_request: StaffingRequest, limit: int = 20) -> List[Dict[str, Any]]:
        enterprise = self.enterprise or staffing_request.enterprise
        candidates = self.rank_candidates_for_enterprise(
            enterprise=enterprise,
            required_skills=staffing_request.required_skills,
            minimum_experience=staffing_request.minimum_experience,
            project_description=staffing_request.description,
            weights=staffing_request.weights_config or None,
            limit=limit
        )
        ai_mode = staffing_request.project.ai_processing_mode if staffing_request.project else 'AI_ALLOWED'
        for cand in candidates:
            cand['explanation'] = self.generate_candidate_explanation(
                candidate_score=cand,
                project_title=staffing_request.project_title,
                project_description=staffing_request.description,
                ai_processing_mode=ai_mode
            )
        return candidates

    @staticmethod
    def score_candidate_for_request(
        employee: Employee,
        required_skills: List[Dict[str, Any]],
        minimum_experience: float,
        project_description: str = '',
        weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Calculates deterministic multi-factor fit score for an employee."""
        w = weights or DEFAULT_STAFFING_WEIGHTS
        
        # 1. Skill Match Score (0.0 to 1.0)
        emp_skills_map = {
            normalize_skill_name(es.skill.name): es
            for es in employee.skills.select_related('skill').all()
        }

        matched_skills = []
        missing_skills = []
        total_req_weight = 0.0
        accum_skill_score = 0.0
        verified_count = 0

        for req in required_skills:
            req_name = req.get('name', '')
            norm_name = normalize_skill_name(req_name)
            min_prof = req.get('min_proficiency', 'Intermediate')
            importance = req.get('importance', 'Essential')
            
            imp_mult = 1.5 if importance == 'Essential' else (1.2 if importance == 'Preferred' else 0.8)
            total_req_weight += imp_mult
            req_weight = get_proficiency_weight(min_prof)

            if norm_name in emp_skills_map:
                es = emp_skills_map[norm_name]
                cand_weight = get_proficiency_weight(es.proficiency)
                conf = max(0.5, min(1.0, es.confidence))
                
                if es.verification_status == 'hr_verified':
                    verified_count += 1

                if cand_weight >= req_weight:
                    accum_skill_score += imp_mult * 1.0 * conf
                else:
                    accum_skill_score += imp_mult * (cand_weight / max(0.01, req_weight)) * conf

                matched_skills.append({
                    'name': es.skill.name,
                    'candidate_proficiency': es.proficiency,
                    'required_proficiency': min_prof,
                    'confidence': es.confidence,
                    'verification_status': es.verification_status,
                    'evidence': es.evidence,
                    'source': es.source
                })
            else:
                missing_skills.append({
                    'name': req_name,
                    'required_proficiency': min_prof,
                    'importance': importance
                })

        skill_score = (accum_skill_score / max(0.01, total_req_weight)) if total_req_weight > 0 else 0.85
        skill_score = max(0.0, min(1.0, skill_score))

        # 2. Experience Score (0.0 to 1.0)
        experience_score = calculate_experience_score(employee.years_experience, minimum_experience)

        # 3. Project Relevance Score (0.0 to 1.0)
        contributions = employee.contributions.select_related('project').all()
        project_count = contributions.count()
        if project_count == 0:
            project_score = 0.35
        else:
            rel_matches = 0
            desc_lower = project_description.lower()
            for c in contributions:
                for tech in c.project.get_tech_list():
                    if tech.lower() in desc_lower or any(tech.lower() in r.get('name', '').lower() for r in required_skills):
                        rel_matches += 1
            project_score = min(1.0, 0.45 + (rel_matches * 0.15))

        # 4. Evidence Strength Score (0.0 to 1.0)
        # Based on proportion of verified skills and average confidence
        all_emp_skills = list(employee.skills.all())
        if all_emp_skills:
            avg_conf = sum(s.confidence for s in all_emp_skills) / len(all_emp_skills)
            verified_ratio = sum(1 for s in all_emp_skills if s.verification_status == 'hr_verified') / len(all_emp_skills)
            evidence_score = round(0.5 * avg_conf + 0.5 * verified_ratio, 4)
        else:
            evidence_score = 0.40

        # 5. Skill Freshness Score (0.0 to 1.0)
        # In a real system, calculated from last demonstrated date. Defaulting to 0.85-0.95 for active contributors
        freshness_score = 0.90 if project_count > 0 else 0.70

        # 6. Availability Score (0.0 to 1.0)
        availability_score = max(0.0, min(1.0, employee.availability_pct))

        # Overall Weighted Score
        overall_score = (
            w.get('skill_match', 0.30) * skill_score +
            w.get('experience', 0.20) * experience_score +
            w.get('project_relevance', 0.20) * project_score +
            w.get('evidence_strength', 0.10) * evidence_score +
            w.get('skill_freshness', 0.10) * freshness_score +
            w.get('availability', 0.10) * availability_score
        )
        overall_score = round(max(0.0, min(1.0, overall_score)), 4)

        return {
            'employee_id': employee.id,
            'employee_name': employee.name,
            'current_role': employee.current_role,
            'department': employee.department,
            'years_experience': employee.years_experience,
            'availability_pct': int(employee.availability_pct * 100),
            'overall_score': overall_score,
            'skill_score': round(skill_score, 4),
            'experience_score': round(experience_score, 4),
            'project_score': round(project_score, 4),
            'evidence_score': round(evidence_score, 4),
            'freshness_score': round(freshness_score, 4),
            'availability_score': round(availability_score, 4),
            'matched_skills': matched_skills,
            'missing_skills': missing_skills,
            'verified_evidence_count': verified_count,
            'project_count': project_count,
            'weights': w
        }

    @staticmethod
    def rank_candidates_for_enterprise(
        enterprise: Enterprise,
        required_skills: List[Dict[str, Any]],
        minimum_experience: float = 2.0,
        project_description: str = '',
        weights: Optional[Dict[str, float]] = None,
        limit: int = 15
    ) -> List[Dict[str, Any]]:
        """Strictly tenant-scoped candidate ranking for project staffing."""
        # Query only employees belonging to this enterprise
        employees = Employee.objects.filter(enterprise=enterprise).prefetch_related(
            'skills__skill', 'contributions__project'
        )

        candidates = []
        for emp in employees:
            score_data = StaffingEngine.score_candidate_for_request(
                employee=emp,
                required_skills=required_skills,
                minimum_experience=minimum_experience,
                project_description=project_description,
                weights=weights
            )
            candidates.append(score_data)

        # Sort descending by overall_score
        candidates.sort(key=lambda x: (x['overall_score'], x['availability_pct']), reverse=True)

        # Assign ranks
        for i, c in enumerate(candidates, 1):
            c['rank'] = i

        return candidates[:limit]

    @staticmethod
    def build_optimal_team(
        enterprise: Enterprise,
        required_skills: List[Dict[str, Any]],
        team_size: int = 5,
        minimum_experience: float = 2.0,
        project_description: str = ''
    ) -> Dict[str, Any]:
        """
        Greedy/weighted team optimizer:
        Selects a complementary squad that maximizes skill coverage, evidence depth,
        and respects employee availability without excessive duplication.
        """
        all_candidates = StaffingEngine.rank_candidates_for_enterprise(
            enterprise=enterprise,
            required_skills=required_skills,
            minimum_experience=minimum_experience,
            project_description=project_description,
            limit=30
        )

        # Filter out completely unavailable employees if possible
        available_pool = [c for c in all_candidates if c['availability_pct'] > 0]
        if len(available_pool) < team_size:
            available_pool = all_candidates

        selected_team = []
        covered_skills = set()
        req_skill_names = [r.get('name', '') for r in required_skills]

        # Greedy selection: pick candidate that provides highest marginal new skill coverage + overall score
        remaining_pool = list(available_pool)

        while len(selected_team) < team_size and remaining_pool:
            best_candidate = None
            best_marginal_score = -1.0

            for cand in remaining_pool:
                cand_skills = {s['name'] for s in cand['matched_skills']}
                new_skills_covered = len(cand_skills.intersection(req_skill_names) - covered_skills)
                marginal_score = cand['overall_score'] + (new_skills_covered * 0.25)
                
                if marginal_score > best_marginal_score:
                    best_marginal_score = marginal_score
                    best_candidate = cand

            if best_candidate:
                selected_team.append(best_candidate)
                for s in best_candidate['matched_skills']:
                    covered_skills.add(s['name'])
                remaining_pool.remove(best_candidate)
            else:
                break

        # Compute skill coverage breakdown
        coverage_breakdown = []
        for req_name in req_skill_names:
            providers = [
                m['employee_name'] for m in selected_team
                if any(ms['name'] == req_name for ms in m['matched_skills'])
            ]
            coverage_breakdown.append({
                'skill_name': req_name,
                'coverage_count': len(providers),
                'providers': providers,
                'is_covered': len(providers) > 0,
                'status': 'Strong' if len(providers) >= 2 else ('Covered' if len(providers) == 1 else 'Shortage')
            })

        avg_team_fit = sum(m['overall_score'] for m in selected_team) / max(1, len(selected_team))
        avg_availability = sum(m['availability_pct'] for m in selected_team) / max(1, len(selected_team))

        return {
            'team_size': len(selected_team),
            'target_team_size': team_size,
            'selected_members': selected_team,
            'coverage_breakdown': coverage_breakdown,
            'average_team_fit_pct': int(avg_team_fit * 100),
            'average_availability_pct': int(avg_availability),
            'uncovered_skills': [c['skill_name'] for c in coverage_breakdown if not c['is_covered']],
        }

    @staticmethod
    def generate_candidate_explanation(
        candidate_score: Dict[str, Any],
        project_title: str,
        project_description: str = '',
        ai_processing_mode: str = 'AI_ALLOWED'
    ) -> str:
        """
        Generates grounded 'Why This Person?' explanation using Gemini 3.7 Flash
        or deterministic fallback when offline or when project is confidential.
        """
        # Deterministic fallback text
        matched_str = ", ".join([f"{s['name']} ({s['candidate_proficiency']})" for s in candidate_score['matched_skills'][:4]])
        missing_str = ", ".join([s['name'] for s in candidate_score['missing_skills']]) or "None"
        verified_cnt = candidate_score['verified_evidence_count']
        avail = candidate_score['availability_pct']

        fallback_explanation = (
            f"{candidate_score['employee_name']} is a strong candidate with a {int(candidate_score['overall_score'] * 100)}% fit "
            f"for '{project_title}'. Key strengths include {matched_str or 'strong technical foundation'}. "
            f"Has {verified_cnt} HR-verified skill demonstration(s) with {avail}% capacity available. "
            f"{f'Missing skills to support: {missing_str}.' if missing_str != 'None' else 'All primary skill requirements are satisfied.'}"
        )

        if ai_processing_mode == 'NO_EXTERNAL_AI':
            return fallback_explanation

        # Try Gemini 3.7 Flash explanation with structured context
        prompt = (
            f"Project: {project_title}\n"
            f"Candidate: {candidate_score['employee_name']} ({candidate_score['current_role']}, {candidate_score['years_experience']} yrs exp)\n"
            f"Overall Fit Score: {int(candidate_score['overall_score'] * 100)}%\n"
            f"Availability: {candidate_score['availability_pct']}%\n"
            f"Matched Skills: {matched_str}\n"
            f"Missing Skills: {missing_str}\n"
            f"Verified Demonstrations: {verified_cnt}\n\n"
            f"Provide a concise, professional 2-sentence explanation of why this employee is recommended for the staffing assignment."
        )

        try:
            from apps.ai.gemini_client import generate_gemini_text
            res = generate_gemini_text(prompt)
            if res and len(res.strip()) > 20:
                return res.strip()
        except Exception as e:
            logger.info(f"Using deterministic staffing explanation: {e}")

        return fallback_explanation
