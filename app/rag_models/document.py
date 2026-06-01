"""
document.py — Document ORM 모델 (UUID 기반, ERD 정규화)
팀메모리 프로젝트 / 담당: 이성우
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid as uuid_lib

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    doc_type = Column(String(50))
    status = Column(String(50), default="queued")
    progress = Column(Integer, default=0)
    char_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    error_msg = Column(Text)
    summary = Column(Text)
    keywords = Column(JSONB, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Todo(Base):
    __tablename__ = "todos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False)
    source_chunk_id = Column(UUID(as_uuid=True), ForeignKey("document_chunks.id"))
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="pending")
    priority = Column(String(20), default="medium")
    assignee = Column(String(255))
    confidence_score = Column(Integer, default=0)
    due_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Issue(Base):
    __tablename__ = "issues"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False)
    source_chunk_id = Column(UUID(as_uuid=True), ForeignKey("document_chunks.id"))
    title = Column(String(255), nullable=False)
    severity = Column(String(20), default="medium")
    status = Column(String(50), default="open")
    description = Column(Text)
    confidence_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FaissIndex(Base):
    """FAISS 벡터 인덱스 메타데이터"""
    __tablename__ = "faiss_indexes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    index_path = Column(String(500), nullable=False)
    vector_count = Column(Integer, default=0)
    embedding_model = Column(String(100), default="text-embedding-3-large")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmbeddingJob(Base):
    """임베딩 작업 추적"""
    __tablename__ = "embedding_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    progress = Column(Integer, default=0)  # 0-100
    total_chunks = Column(Integer, default=0)
    processed_chunks = Column(Integer, default=0)
    error_msg = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)