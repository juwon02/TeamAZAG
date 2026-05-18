"""
RAG 검색 서비스 — 질문 → 관련 청크 검색
담당: 이성우
"""
from typing import List


def search(query: str, top_k: int = 5) -> List[dict]:
    """
    ChromaDB에서 질문과 유사한 청크 검색
    TODO: 이성우 — LangChain VectorStore retriever 구현
    Returns: [{"content": str, "document_id": str, "score": float}]
    """
    raise NotImplementedError
