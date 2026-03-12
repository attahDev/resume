"""Schema stub: resume — implemented in a later phase."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ResumeOut(BaseModel):
    id:        str
    filename:  str
    file_size: Optional[int]
    mime_type: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}