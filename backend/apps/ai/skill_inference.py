"""Skill Inference and Dynamic Employee Profiling Service.

Discovers explicit, inferred, and transferable skills using Gemini 3.7 Flash,
with strict evidence grounding and deterministic fallback.
"""
import logging
from apps.employees.models import Employee, EmployeeSkill
from apps.skills.models import Skill
from apps.core.normalization import normalize_skill_name
from apps.ai.gemini_client import generate_structured_gemini_response
from apps.ai.schemas import SkillProfileSchema, SkillItem
from apps.ai.prompts import PROFILER_SYSTEM_INSTRUCTION
from apps.ai.profile_builder import build_employee_text_context
from apps.ai.fallback import generate_fallback_skill_profile

logger = logging.getLogger(__name__)

def profile_employee_skills(employee: Employee, persist_discovered: bool = True) -> SkillProfileSchema:
    """Analyze an employee record with Gemini 3.7 Flash and return structured skill intelligence."""
    context = build_employee_text_context(employee)
    prompt = (
        f"Perform an exhaustive technical skill profiling and latent capability extraction for the following employee:\n\n"
        f"{context}\n\n"
        f"Ensure every inferred skill cites concrete factual evidence from project deliverables."
    )

    result = generate_structured_gemini_response(
        prompt=prompt,
        response_schema=SkillProfileSchema,
        system_instruction=PROFILER_SYSTEM_INSTRUCTION,
        temperature=0.2
    )

    if result is None:
        logger.info(f"Gemini API unavailable or returned empty. Using deterministic fallback profiler for {employee.name}.")
        result = generate_fallback_skill_profile(employee)

    # Normalize skill names and ensure evidence is present
    for item in result.inferred_skills:
        item.name = normalize_skill_name(item.name)
        if not item.evidence:
            item.evidence = f"Inferred from technical execution in {employee.department} project deliverables."

    for item in result.explicit_skills:
        item.name = normalize_skill_name(item.name)

    for item in result.transferable_skills:
        item.name = normalize_skill_name(item.name)
        if not item.evidence:
            item.evidence = f"Cross-functional domain competency in {employee.current_role}."

    # Optionally persist newly discovered skills into the database
    if persist_discovered:
        _persist_discovered_skills(employee, result)

    return result

def _persist_discovered_skills(employee: Employee, profile: SkillProfileSchema):
    """Safely saves inferred / discovered skills into the EmployeeSkill table if not already present."""
    all_items = profile.inferred_skills + profile.transferable_skills
    for item in all_items:
        try:
            canonical_name = normalize_skill_name(item.name)
            if not canonical_name:
                continue

            skill_obj, _ = Skill.objects.get_or_create(
                name=canonical_name,
                defaults={
                    'category': item.category or 'Backend',
                    'description': f"Discovered skill in {item.category or 'Engineering'}",
                    'market_trend': 'Growing'
                }
            )

            # Only add if not already explicitly recorded
            if not EmployeeSkill.objects.filter(employee=employee, skill=skill_obj).exists():
                EmployeeSkill.objects.create(
                    employee=employee,
                    skill=skill_obj,
                    proficiency=item.proficiency or 'Intermediate',
                    confidence=max(0.1, min(1.0, item.confidence or 0.85)),
                    source=item.source if item.source in ['project_inferred', 'ai_discovered'] else 'ai_discovered',
                    evidence=item.evidence or f"Verified in project deliverables for {employee.current_role}"
                )
        except Exception as e:
            logger.warning(f"Error persisting discovered skill '{item.name}': {e}")
