"""
Todo 스키마
담당: 박주원
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Todo 생성할 때 받는 데이터
class TodoCreate(BaseModel):
    title: str
    priority: str = "medium"        # high | medium | low
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None


# Todo 수정할 때 받는 데이터
class TodoUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None    # pending | in_progress | completed
    priority: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None


# 응답으로 내보내는 데이터
class TodoResponse(BaseModel):
    id: str
    title: str
    status: str
    priority: str
    assignee: Optional[str]
    source: str                     # ai | manual
    confidence: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True