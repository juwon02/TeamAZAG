"""
UC-07 AI Assistant — RAG 기반 자연어 질의응답
담당: 이성우 (RAG + LangChain) + 김성호 (chat_messages 저장)
"""
from fastapi import APIRouter

router = APIRouter()


@router.post("")
async def chat(message: dict):
    """자연어 질문 → RAG 기반 답변 (UC-07)"""
    # TODO: 이성우 — rag_service → ai_analysis_service 호출
    # TODO: 김성호 — chat_messages 테이블 저장
    return {
        "answer": "",
        "sources": [],
        "suggested_questions": [],
    }
