"""Career Roadmap and Progression Service.

Generates multi-stage career development pathways using Gemini 3.7 Flash
with deterministic fallback.
"""
import logging
from typing import List, Dict, Any
from apps.employees.models import Employee
from apps.roles.models import Role
from apps.ai.gemini_client import generate_structured_gemini_response
from apps.ai.schemas import CareerRoadmapSchema
from apps.ai.prompts import ROADMAP_SYSTEM_INSTRUCTION
from apps.ai.profile_builder import build_employee_text_context, build_role_text_context
from apps.ai.fallback import generate_fallback_career_roadmap

logger = logging.getLogger(__name__)

def generate_career_roadmap(
    employee: Employee,
    target_role: Role,
    skill_gaps: List[Dict[str, Any]]
) -> CareerRoadmapSchema:
    """Generate a multi-stage career development roadmap for moving into the target role."""
    emp_context = build_employee_text_context(employee)
    role_context = build_role_text_context(target_role)

    gap_summary = "\n".join([
        f"- {g.get('skill_name')}: Status={g.get('status')}, Priority={g.get('priority')}"
        for g in skill_gaps
    ])

    prompt = (
        f"Design a realistic, high-impact multi-stage career development roadmap to guide the employee into the target role.\n\n"
        f"--- CURRENT EMPLOYEE PROFILE ---\n{emp_context}\n\n"
        f"--- TARGET ROLE REQUIREMENTS ---\n{role_context}\n\n"
        f"--- IDENTIFIED SKILL GAPS ---\n{gap_summary}\n\n"
        f"Structure a 3-stage progression outlining concrete milestones, focus competencies, internal projects, and learning pathways."
    )

    result = generate_structured_gemini_response(
        prompt=prompt,
        response_schema=CareerRoadmapSchema,
        system_instruction=ROADMAP_SYSTEM_INSTRUCTION,
        temperature=0.3
    )

    if result is None:
        logger.info(f"Gemini API unavailable. Using fallback roadmap for {employee.name} -> {target_role.title}.")
        result = generate_fallback_career_roadmap(employee, target_role, skill_gaps)

    return result
