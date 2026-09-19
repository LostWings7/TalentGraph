"""Profile Builder & Context Assembler for TalentGraph AI.

Assembles comprehensive, structured textual contexts from database records
to feed into AI generation, embedding models, and deterministic engines.
"""
from typing import Dict, Any
from apps.employees.models import Employee
from apps.roles.models import Role

def build_employee_text_context(employee: Employee) -> str:
    """Build a comprehensive textual representation of an employee for AI or embedding."""
    lines = [
        f"Employee Name: {employee.name}",
        f"Current Role: {employee.current_role}",
        f"Department: {employee.department}",
        f"Years of Experience: {employee.years_experience}",
        f"Education: {employee.education}",
        f"Certifications: {employee.certifications}",
        f"Professional Bio: {employee.bio}",
        f"Career Interests: {employee.interests}",
        "",
        "Current Recorded Skills & Proficiencies:"
    ]

    for es in employee.skills.select_related('skill').all():
        evidence_note = f" (Evidence: {es.evidence})" if es.evidence else ""
        lines.append(f"- {es.skill.name} [{es.skill.category}]: {es.proficiency} (Source: {es.source}, Confidence: {es.confidence:.2f}){evidence_note}")

    lines.append("")
    lines.append("Project History & Technical Contributions:")
    for contrib in employee.contributions.select_related('project').all():
        proj = contrib.project
        mode = getattr(proj, 'ai_processing_mode', 'AI_ALLOWED')

        if mode == 'NO_EXTERNAL_AI':
            # Confidential project — strictly redact all internal content
            techs = contrib.technologies_demonstrated or 'Internal Technologies'
            lines.append(f"- Project: [Confidential Internal Initiative - Redacted under Enterprise Security Policy]")
            lines.append(f"  Technical Domain Practiced: {techs}")
            lines.append(f"  Role: {contrib.role_in_project}")
            lines.append(f"  Contribution Context: Technical implementation verified by Enterprise HR/Lead (Details Confidential).")
        elif mode == 'AI_SAFE_SUMMARY':
            # Sanitized summary only — omit proprietary objectives and granular metrics
            lines.append(f"- Project: {proj.name} (Sanitized Enterprise Summary)")
            lines.append(f"  Technologies: {proj.technologies}")
            lines.append(f"  Role: {contrib.role_in_project}")
            lines.append(f"  Contribution: {contrib.contribution_summary[:200]}")
        else:
            # AI_ALLOWED — full context permitted
            lines.append(f"- Project: {proj.name} (Duration: {proj.duration_months} mo)")
            lines.append(f"  Technologies: {proj.technologies}")
            lines.append(f"  Role in Project: {contrib.role_in_project}")
            lines.append(f"  Contribution: {contrib.contribution_summary}")
            lines.append(f"  Outcomes/Evidence: {proj.outcomes}")

    lines.append("")
    lines.append("Learning & Development Activity:")
    for l in employee.learnings.select_related('resource').all():
        lines.append(f"- Course: {l.resource.title} ({l.resource.provider}) - Status: {l.status} (Outcome: {l.outcome or 'N/A'})")

    return "\n".join(lines)

def build_role_text_context(role: Role) -> str:
    """Build a comprehensive textual representation of a role for AI or embedding."""
    lines = [
        f"Role Title: {role.title}",
        f"Department: {role.department}",
        f"Required Experience: {role.required_experience_years} years",
        f"Future Demand Level: {role.future_demand_level}",
        f"Role Description: {role.description}",
        f"Key Responsibilities: {role.responsibilities}",
        "",
        "Required & Preferred Skills:"
    ]

    for rs in role.role_skills.select_related('skill').all():
        req_flag = "MANDATORY" if rs.is_required else "OPTIONAL"
        lines.append(f"- {rs.skill.name} [{rs.skill.category}]: Minimum {rs.minimum_proficiency}, Importance: {rs.importance} ({req_flag})")

    return "\n".join(lines)
