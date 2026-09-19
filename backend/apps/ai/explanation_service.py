"""Explainable Role Recommendation Service.

Generates transparent, evidence-grounded rationales for internal mobility matches
using Gemini 3.7 Flash with deterministic fallback.
"""
import logging
from typing import Dict, Any
from apps.employees.models import Employee
from apps.roles.models import Role
from apps.ai.gemini_client import generate_structured_gemini_response
from apps.ai.schemas import RoleExplanationSchema
from apps.ai.prompts import EXPLANATION_SYSTEM_INSTRUCTION
from apps.ai.profile_builder import build_employee_text_context, build_role_text_context
from apps.ai.fallback import generate_fallback_role_explanation

logger = logging.getLogger(__name__)

def generate_role_match_explanation(
    employee: Employee,
    role: Role,
    match_data: Dict[str, Any]
) -> RoleExplanationSchema:
    """Generate an explainable AI justification for a role match."""
    emp_context = build_employee_text_context(employee)
    role_context = build_role_text_context(role)

    prompt = (
        f"Generate a transparent, evidence-backed fit explanation for recommending this role to the employee.\n\n"
        f"--- CANDIDATE PROFILE ---\n{emp_context}\n\n"
        f"--- TARGET ROLE REQUIREMENTS ---\n{role_context}\n\n"
        f"--- CALCULATED MATCH SCORES ---\n"
        f"Overall Score: {int(match_data.get('overall_score', 0.8) * 100)}%\n"
        f"Semantic Profile Fit: {int(match_data.get('semantic_score', 0.8) * 100)}%\n"
        f"Skill Alignment: {int(match_data.get('skill_score', 0.8) * 100)}%\n"
        f"Experience Alignment: {int(match_data.get('experience_score', 0.8) * 100)}%\n"
        f"Project Relevance: {int(match_data.get('project_score', 0.8) * 100)}%\n"
        f"Matched Skills: {match_data.get('matched_skills', [])}\n"
        f"Missing Skills: {match_data.get('missing_skills', [])}\n"
    )

    result = generate_structured_gemini_response(
        prompt=prompt,
        response_schema=RoleExplanationSchema,
        system_instruction=EXPLANATION_SYSTEM_INSTRUCTION,
        temperature=0.2
    )

    if result is None:
        logger.info(f"Gemini API unavailable. Using deterministic fallback explanation for {employee.name} -> {role.title}.")
        result = generate_fallback_role_explanation(employee, role, match_data)

    return result
