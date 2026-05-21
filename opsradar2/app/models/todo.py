"""
Todo 모델
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from app.core.database import Base


class Todo(Base):
    __tablename__ = "todos"

    id = Column(String(36), primary_key=True)
    title = Column(String(500), nullable=False)
    status = Column(String(50), default="pending")
    priority = Column(String(20))
    assignee = Column(String(100))
    source = Column(String(20))
    confidence = Column(Integer)
    due_date = Column(Date, nullable=True)          # ← 추가
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=True)
    linked_issue_id = Column(String(36), ForeignKey("issues.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())