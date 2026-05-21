"""
Issue 모델
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Issue(Base):
    __tablename__ = "issues"

    id = Column(String(36), primary_key=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    risk_level = Column(String(20))
    status = Column(String(50))
    source = Column(String(20))
    confidence = Column(String(10))
    assignee = Column(String(100))
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())