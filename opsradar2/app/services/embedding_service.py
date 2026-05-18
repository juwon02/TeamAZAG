"""
임베딩 서비스 — 텍스트 → 벡터 변환 → FAISS 저장
담당: 이성우
"""
import os
import faiss
import numpy as np
from app.core.config import settings


def embed_and_store(text: str, document_id: str) -> bool:
    """
    텍스트를 청크 분할 후 벡터 임베딩하여 FAISS 인덱스에 저장
    TODO: 이성우 — LangChain TextSplitter + Embedding 구현 후 아래 로직 완성
    """
    # TODO: 이성우 — 실제 임베딩 벡터로 교체
    raise NotImplementedError


def _load_or_create_index(dim: int) -> faiss.Index:
    """FAISS 인덱스 로드 또는 신규 생성"""
    path = settings.FAISS_INDEX_PATH
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if os.path.exists(path):
        return faiss.read_index(path)
    return faiss.IndexFlatL2(dim)


def _save_index(index: faiss.Index) -> None:
    """FAISS 인덱스 파일로 저장"""
    faiss.write_index(index, settings.FAISS_INDEX_PATH)
