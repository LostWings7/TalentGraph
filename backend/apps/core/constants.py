"""Centralized Constants and Algorithmic Parameters for TalentGraph AI.

This module houses all system-wide scoring weights, decay half-lives,
evidence hierarchies, proficiency curves, and AI configurations.
All business rules and scoring mathematics are inspectable, centralized,
and free of undocumented magic numbers.
"""
from typing import Dict, Any

# =====================================================================
# 1. HYBRID ROLE MATCHING WEIGHTS (Total = 1.00)
# =====================================================================
# Formula:
#   Score = (0.30 * S_semantic) + (0.35 * S_skill) + (0.20 * S_experience) + (0.15 * S_project)
MATCHING_WEIGHTS: Dict[str, float] = {
    "semantic": 0.30,       # 30% - Contextual embedding similarity (cosine distance of profile vs role text)
    "skill": 0.35,          # 35% - Explicit & inferred hard skill alignment against mandatory/preferred criteria
    "experience": 0.20,     # 20% - Seniority & experience curve alignment (years vs required minimum)
    "project": 0.15,        # 15% - Real delivered impact, project contributions, and domain history
}

# =====================================================================
# 2. AI PROJECT STAFFING ENGINE WEIGHTS (Total = 1.00)
# =====================================================================
# Formula:
#   StaffingScore = 0.30*S_match + 0.20*E_exp + 0.20*P_proj + 0.10*V_evid + 0.10*F_fresh + 0.10*A_avail
STAFFING_WEIGHTS: Dict[str, float] = {
    "skill_match": 0.30,        # 30% - Candidate skill coverage against project technical requisitions
    "experience": 0.20,         # 20% - Track record seniority curve
    "project_relevance": 0.20,  # 20% - Direct past delivery in relevant technical domains
    "evidence": 0.10,           # 10% - Traceability & verification strength of candidate skills
    "freshness": 0.10,          # 10% - Recency of active skill practice (half-life decay adjusted)
    "availability": 0.10,       # 10% - Unallocated workload capacity for immediate staffing
}

# =====================================================================
# 3. EVIDENCE HIERARCHY & TRACEABILITY WEIGHTS (0.0 to 1.0)
# =====================================================================
# Reflects epistemological certainty of talent capability:
EVIDENCE_WEIGHTS: Dict[str, float] = {
    "hr_verified": 1.00,        # Formally verified by Enterprise HR / Tech Lead through approval workflow
    "certified": 0.95,          # Validated via recognized industry certification or credential
    "demonstrated": 0.85,       # Evidenced through shipped project deliverables & contribution logs
    "inferred": 0.70,           # Deduced via Gemini 3.7 Flash semantic skill extraction from artifacts
    "self_reported": 0.55,      # Claimed by employee during profile setup without artifact verification
    "declared": 0.50,           # Baseline self-declared career interest or foundational capability
}

# =====================================================================
# 4. SKILL FRESHNESS & TEMPORAL DECAY MODEL
# =====================================================================
# Exponential half-life decay formula:
#   Freshness(t) = max(decay_floor, exp(-ln(2) * months_since_demonstrated / half_life_months))
#   If actively demonstrated within full_confidence_months, multiplier = active_recency_multiplier
FRESHNESS_CONFIG: Dict[str, Any] = {
    "half_life_months": 18.0,               # 18 months half-life for fast-evolving technology skills
    "full_confidence_months": 6.0,          # Full 100% confidence within first 6 months of active practice
    "active_recency_multiplier": 1.10,      # 10% bonus for active usage in ongoing projects
    "decay_floor": 0.40,                    # Minimum floor — foundational capabilities do not fully evaporate
}

# =====================================================================
# 5. PROFICIENCY LEVEL WEIGHTS & THRESHOLDS
# =====================================================================
PROFICIENCY_LEVEL_WEIGHTS: Dict[str, float] = {
    "beginner": 0.40,
    "intermediate": 0.70,
    "advanced": 0.90,
    "expert": 1.00,
}

# Map numeric weights back to canonical labels
PROFICIENCY_WEIGHT_TO_LABEL: Dict[float, str] = {
    0.40: "Beginner",
    0.70: "Intermediate",
    0.90: "Advanced",
    1.00: "Expert",
}

# =====================================================================
# 6. AI MODEL CONFIGURATION & TIMEOUT PARAMETERS
# =====================================================================
AI_SETTINGS: Dict[str, Any] = {
    "primary_model": "gemini-3.7-flash",
    "embedding_model": "gemini-embedding-001",
    "fallback_enabled": True,
    "timeout_seconds": 15,
    "max_output_tokens": 4096,
    "default_temperature": 0.2,
    "vector_dimension": 256,                 # Fallback deterministic hashing dimension
}
