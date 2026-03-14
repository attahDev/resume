
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JobDescriptionCreate(BaseModel):
    raw_text: str
    job_title: Optional[str] = None
    company:   Optional[str] = None


class JobDescriptionOut(BaseModel):
    id:        str
    job_title: Optional[str]
    company:   Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}