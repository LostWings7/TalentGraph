"""Pydantic schemas for structured Gemini output validation."""
from typing import List, Optional
from pydantic import BaseModel, Field

# ---------------------------------------------------------
# Skill Profiling Schemas
# ---------------------------------------------------------
class SkillItem(BaseModel):
    name: str = Field(description="Canonical or clean name of the skill")
    category: str = Field(default="Backend", description="Category: AI/ML, Backend, Frontend, Data Engineering, Cloud & DevOps, Security, Leadership & Product")
    proficiency: str = Field(default="Intermediate", description="Beginner, Intermediate, Advanced, Expert")
    confidence: float = Field(default=0.85, ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    source: str = Field(default="explicit", description="explicit, project_inferred, learning, or ai_discovered")
    evidence: str = Field(description="Grounding context: specific project outcome, bio claim, or course completion")

class SkillProfileSchema(BaseModel):
    employee_name: str = Field(description="Name of the employee analyzed")
    overall_summary: str = Field(description="Executive summary of technical and functional capabilities")
    explicit_skills: List[SkillItem] = Field(default_factory=list, description="Directly claimed or certified skills")
    inferred_skills: List[SkillItem] = Field(default_factory=list, description="Skills inferred from project contributions with mandatory evidence")
    transferable_skills: List[SkillItem] = Field(default_factory=list, description="Cross-functional, domain or architectural transferable skills")
    strengths: List[str] = Field(default_factory=list, description="Key distinct competitive advantages")
    growth_areas: List[str] = Field(default_factory=list, description="Identified technical development opportunities")

# ---------------------------------------------------------
# Explainable Role Match Schemas
# ---------------------------------------------------------
class RoleExplanationSchema(BaseModel):
    role_title: str = Field(description="Title of target role")
    employee_name: str = Field(description="Name of the evaluated employee")
    overall_fit_summary: str = Field(description="Grounded explanation of why this role was recommended or matched")
    key_strengths: List[str] = Field(default_factory=list, description="Specific skills and project deliverables supporting this match")
    evidence_points: List[str] = Field(default_factory=list, description="Concrete evidence from employee record")
    growth_areas: List[str] = Field(default_factory=list, description="Skills or experience gaps to bridge")
    recommended_actions: List[str] = Field(default_factory=list, description="Clear next steps for the employee")
    decision_support_note: str = Field(
        default="AI recommendations are decision-support signals designed to empower employee development.",
        description="Responsible AI disclaimer"
    )

# ---------------------------------------------------------
# Career Roadmap Schemas
# ---------------------------------------------------------
class RoadmapStage(BaseModel):
    stage_number: int = Field(description="Sequential step: 1, 2, 3...")
    role_title: str = Field(description="Role or milestone title at this stage")
    estimated_months: int = Field(default=6, description="Estimated duration in months")
    focus_skills: List[str] = Field(default_factory=list, description="Key skills to acquire or deepen")
    milestones: List[str] = Field(default_factory=list, description="Concrete measurable milestones")
    recommended_projects: List[str] = Field(default_factory=list, description="Recommended stretch internal projects")
    recommended_learning: List[str] = Field(default_factory=list, description="Recommended learning resources and certifications")

class CareerRoadmapSchema(BaseModel):
    current_role: str = Field(description="Employee's current role")
    target_role: str = Field(description="Target aspirational role")
    estimated_total_months: int = Field(default=18, description="Estimated total roadmap duration in months")
    readiness_assessment: str = Field(description="Current state readiness evaluation")
    stages: List[RoadmapStage] = Field(default_factory=list, description="Step-by-step career path progression")

# ---------------------------------------------------------
# Grounded AI Career Assistant Schemas
# ---------------------------------------------------------
class CareerAssistantResponseSchema(BaseModel):
    answer: str = Field(description="Direct, grounded conversational response to employee career question")
    grounded_facts_used: List[str] = Field(default_factory=list, description="Actual profile/role/project data points referenced")
    suggested_next_steps: List[str] = Field(default_factory=list, description="Actionable career steps")
    suggested_prompts: List[str] = Field(default_factory=list, description="Relevant follow-up questions the employee might ask")

# ---------------------------------------------------------
# HR Workforce Intelligence Insights Schemas
# ---------------------------------------------------------
class HRWorkforceInsightsSchema(BaseModel):
    executive_summary: str = Field(description="High-level organizational talent readiness summary")
    emerging_risk_areas: List[str] = Field(default_factory=list, description="Identified critical skill gaps and talent bench deficits")
    top_mobility_opportunities: List[str] = Field(default_factory=list, description="Roles with high internal candidate availability")
    strategic_recommendations: List[str] = Field(default_factory=list, description="Recommended HR workforce upskilling interventions")

# ---------------------------------------------------------
# Staffing Recommendation Explainability Schemas
# ---------------------------------------------------------
class StaffingExplanationSchema(BaseModel):
    employee_name: str = Field(description="Name of the candidate recommended")
    project_title: str = Field(description="Title of the project or staffing assignment")
    overall_fit_summary: str = Field(description="Comprehensive explanation of fit")
    key_strengths: List[str] = Field(default_factory=list, description="Specific skills and verified projects supporting fit")
    potential_risks_or_gaps: List[str] = Field(default_factory=list, description="Missing skills or capacity constraints")
    decision_support_note: str = Field(
        default="AI staffing recommendations are decision-support signals designed to empower HR leaders.",
        description="Responsible AI disclaimer"
    )

