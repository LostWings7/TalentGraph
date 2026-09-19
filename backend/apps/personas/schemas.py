"""Pydantic schemas for Gemini structured persona extraction."""
from typing import List, Optional
from pydantic import BaseModel, Field

class ExtractedSkillItem(BaseModel):
    name: str = Field(description="Canonical or clean name of the skill")
    category: str = Field(
        default="Backend", 
        description="Category: AI/ML, Backend, Frontend, Data Engineering, Cloud & DevOps, Security, Leadership & Product"
    )
    proficiency: str = Field(default="Intermediate", description="Beginner, Intermediate, Advanced, Expert")
    confidence: float = Field(default=0.85, ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    source: str = Field(default="explicit", description="explicit, project_inferred, learning, or ai_discovered")
    evidence: str = Field(default="", description="Grounding context or outcome proving this capability")
    freshness_year: Optional[int] = Field(default=2024, description="Most recent year this skill was actively applied")

class ExtractedProjectItem(BaseModel):
    project_name: str = Field(description="Name or title of project")
    role_in_project: str = Field(default="Core Contributor", description="Employee role in project")
    technologies: str = Field(default="", description="Comma-separated tools/frameworks/languages used")
    outcomes: str = Field(default="", description="Measurable impact or deliverables")
    evidence: str = Field(default="", description="Specific artifact, metrics, or architecture contribution")
    duration_months: int = Field(default=6, description="Project duration in months")

class ExtractedCertificationItem(BaseModel):
    certification_name: str = Field(description="Official certification title")
    issuing_organization: str = Field(default="", description="e.g. AWS, Linux Foundation, Snowflake, dbt Labs")
    issue_date: Optional[str] = Field(default="", description="YYYY-MM-DD or year")
    skills_verified: str = Field(default="", description="Key skills validated by this credential")

class ExtractedLearningItem(BaseModel):
    title: str = Field(description="Course or training title")
    provider: str = Field(default="Internal Academy", description="Internal Academy, Coursera, DeepLearning.AI, O'Reilly, etc.")
    difficulty: str = Field(default="Intermediate", description="Beginner, Intermediate, Advanced")
    status: str = Field(default="Completed", description="Completed, In Progress, Not Started")
    skills_acquired: str = Field(default="", description="Skills learned")
    outcome: str = Field(default="", description="Assessment score, capstone project, or badge")

class ExtractedWorkHistoryItem(BaseModel):
    company: str = Field(description="Employer name")
    role: str = Field(description="Role title")
    department: Optional[str] = Field(default="", description="Department or business unit")
    highlights: str = Field(default="", description="Key achievements and technologies")

class ExtractedPersonaSchema(BaseModel):
    name: str = Field(description="Full name of employee")
    email: str = Field(description="Corporate email address")
    department: str = Field(
        default="Engineering",
        description="One of: Engineering, AI Research, Data Platform, Cloud Architecture, Product, Security"
    )
    current_role: str = Field(description="Current professional title")
    years_experience: float = Field(default=3.0, ge=0.0, description="Total years of professional experience")
    education: str = Field(default="", description="Degree, Major, and University")
    certifications_summary: str = Field(default="", description="Summary of certifications")
    bio: str = Field(default="", description="2-3 sentence executive professional bio")
    interests: str = Field(default="", description="Career interests or aspirational domains")
    target_role: Optional[str] = Field(default=None, description="Aspirational career target role if mentioned or inferred")
    skills: List[ExtractedSkillItem] = Field(default_factory=list, description="All explicit, inferred, and discovered skills with evidence")
    projects: List[ExtractedProjectItem] = Field(default_factory=list, description="Key projects and deliverables")
    certifications: List[ExtractedCertificationItem] = Field(default_factory=list, description="Certifications earned")
    learning: List[ExtractedLearningItem] = Field(default_factory=list, description="Learning courses completed or in progress")
    work_history: List[ExtractedWorkHistoryItem] = Field(default_factory=list, description="Past work experience")
    strengths: List[str] = Field(default_factory=list, description="Top 3-5 technical and functional strengths")
    growth_areas: List[str] = Field(default_factory=list, description="Top 2-3 growth areas or skill gaps")
