"""Schema stub: analysis — implemented in a later phase."""
"""Pydantic schemas for analysis endpoints."""
import uuid
from datetime import datetime
from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    resume_id: uuid.UUID
    job_description: str
    job_title: str = ""
    company: str = ""


class AnalysisSummary(BaseModel):
    analysis_id: uuid.UUID
    job_title: str | None
    company: str | None
    overall_score: int | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisResponse(BaseModel):
    analysis_id: uuid.UUID
    status: str
    overall_score: int | None = None
    skills_score: int | None = None
    experience_score: int | None = None
    keywords_score: int | None = None
    matched_skills: list | None = None
    missing_skills: list | None = None
    recommendations: str | None = None
    model_version: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}