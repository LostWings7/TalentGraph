"""Mathematical and Statistical Utilities for TalentGraph Matching Engine.

Deterministic implementations of vector cosine similarity, experience alignment curves,
proficiency weightings, and score normalizations.
"""
import math
from typing import List, Sequence

def cosine_similarity(vec_a: Sequence[float], vec_b: Sequence[float]) -> float:
    """Calculate cosine similarity between two floating-point vectors.
    
    Returns a float between 0.0 and 1.0 (clamped).
    """
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    
    similarity = dot_product / (norm_a * norm_b)
    # Clamp to [0.0, 1.0] range
    return max(0.0, min(1.0, float(similarity)))

def calculate_experience_score(candidate_years: float, required_years: float) -> float:
    """Calculate an experience alignment score based on years of experience.
    
    - If candidate meets or exceeds required years: 0.90 to 1.0 (with slight bonus for mastery)
    - If candidate is within 1-2 years: 0.70 to 0.85
    - If candidate is within 3+ years: smooth logarithmic/sigmoid decay
    """
    if required_years <= 0:
        return 1.0
        
    diff = float(candidate_years) - float(required_years)
    
    if diff >= 0:
        # Perfect match or exceeds requirement: 0.90 to 1.0
        # Capped to avoid penalizing or over-inflating for very senior candidates
        bonus = min(0.10, diff * 0.02)
        return min(1.0, 0.90 + bonus)
    else:
        # Candidate has less experience than required:
        # delta is negative
        # When diff is -1 (e.g. 4 yrs vs 5 req), score ~ 0.80
        # When diff is -2, score ~ 0.65
        # When diff is -3, score ~ 0.50
        # When diff is -5+, score decays towards 0.20
        ratio = max(0.0, candidate_years / required_years)
        score = 0.30 + 0.60 * (ratio ** 1.2)
        return max(0.10, min(0.88, score))

from apps.core.constants import (
    PROFICIENCY_LEVEL_WEIGHTS,
    MATCHING_WEIGHTS,
    FRESHNESS_CONFIG,
    EVIDENCE_WEIGHTS
)

def get_proficiency_weight(level: str) -> float:
    """Return numeric weight (0.0 - 1.0) for a proficiency string."""
    if not level:
        return 0.50
    return PROFICIENCY_LEVEL_WEIGHTS.get(level.strip().lower(), 0.50)

def calculate_freshness_score(
    months_since_demonstrated: float,
    is_active_in_project: bool = False,
    config: dict = None
) -> float:
    """Calculate exponential decay freshness multiplier based on temporal recency.
    
    Formula:
      If t <= full_confidence_months: 1.0 (with active multiplier if current project)
      Else: max(decay_floor, exp(-ln(2) * (t - full_conf) / half_life))
    """
    cfg = config or FRESHNESS_CONFIG
    half_life = cfg.get("half_life_months", 18.0)
    full_conf = cfg.get("full_confidence_months", 6.0)
    decay_floor = cfg.get("decay_floor", 0.40)
    active_mult = cfg.get("active_recency_multiplier", 1.10)

    if months_since_demonstrated <= full_conf:
        base_score = 1.0
    else:
        elapsed = months_since_demonstrated - full_conf
        decay_constant = math.log(2) / half_life
        base_score = math.exp(-decay_constant * elapsed)

    if is_active_in_project:
        base_score = min(1.0, base_score * active_mult)

    return round(max(decay_floor, min(1.0, base_score)), 4)

def calculate_weighted_hybrid_score(
    semantic_score: float,
    skill_score: float,
    experience_score: float,
    project_score: float,
    weights: dict = None
) -> float:
    """Calculate the overall hybrid match score using centralized weights:
    - Semantic Similarity: 30%
    - Skill Alignment: 35%
    - Experience Alignment: 20%
    - Project Relevance: 15%
    """
    w = weights or MATCHING_WEIGHTS
    
    overall = (
        float(semantic_score) * w['semantic'] +
        float(skill_score) * w['skill'] +
        float(experience_score) * w['experience'] +
        float(project_score) * w['project']
    )
    return round(max(0.0, min(1.0, overall)), 4)
