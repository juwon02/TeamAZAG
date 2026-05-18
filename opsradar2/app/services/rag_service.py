"""
RAG 검색 서비스 — 질문 → FAISS 검색 → 관련 청크 반환
담당: 이성우
"""
import faiss
import numpy as np
from typing import List
from app.core.config import settings


def search(query: str, top_k: int = 5) -> List[dict]:
    """
    FAISS 인덱스에서 질문과 유사한 청크 검색
    TODO: 이성우 — 실제 임베딩 + FAISS 검색 로직 구현
    Returns: [{"content": str, "document_id": str, "score": float}]
    """
    raise NotImplementedError


def _load_index() -> faiss.Index:
    """저장된 FAISS 인덱스 로드"""
    return faiss.read_index(settings.FAISS_INDEX_PATH)
