"""
document.py — Document ORM 모델
팀메모리 프로젝트 / 담당: 이성우

저장 내용:
  - 파일 메타데이터 (이름, 경로, 유형)
  - AI 파이프라인 처리 상태 및 진행률
  - GPT 분석 결과 (요약, 할일, 결정사��, 이슈)

벡터 데이터는 FAISS에 ��도 저장. 이 모델은 메타데이터만 담음.
"""
from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    # ── 기본 정보 ───────────────────────────────
    id = Column(String(8), primary_key=True)          # uuid hex[:8]
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    doc_type = Column(String(50), default="")          # meeting/email/chat/csv/handover/report

    # ── 파이프라인 상태 ─────────────────────────
    status = Column(String(50), default="queued")      # queued→parsing→chunking→embedding→analyzing→completed|failed
    progress = Column(Integer, default=0)              # 0~100
    char_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    error_msg = Column(Text, nullable=True)

    # ── AI 분석 결과 ────────────────────────────
    summary = Column(Text, default="")
    keywords = Column(JSONB, default=list)             # ["키워드1", ...]
    todos = Column(JSONB, default=list)                # [{"content": ..., "assignee": ..., "due_date": ...}]
    decisions = Column(JSONB, default=list)            # ["결정사항1", ...]
    issues = Column(JSONB, default=list)               # [{"title": ..., "description": ..., "severity": ...}]

    # ── 타임스탬프 ──────────────────────────────
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
