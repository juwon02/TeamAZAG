from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentResponse(BaseModel):
    id: str
    file_name: str
    file_type: Optional[str]
    analysis_status: str
    progress: int
    created_at: datetime

    class Config:
        from_attributes = True