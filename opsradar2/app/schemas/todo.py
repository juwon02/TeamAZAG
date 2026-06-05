from pydantic import BaseModel
from typing import Optional


class TodoCreate(BaseModel):
    title: str
    priority: Optional[str] = "medium"
    assignee: Optional[str] = None


class TodoUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None


class TodoResponse(BaseModel):
    todo_id: str
    title: str
    status: str
    priority: str
    assignee: Optional[str]
    source: str
    confidence: Optional[int]
    document_id: Optional[str]
    source_file_name: Optional[str] = None
    source_uploaded_at: Optional[str] = None
    created_at: str
