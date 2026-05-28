"""
chat.py — AI 질문답변 및 할일 추출 엔드포인트
팀메모리 프로젝트 / 담당: 이성우

POST /chat/          RAG 기반 질문 답변
POST /chat/extract   문서 텍스트에서 Todo/결정사항/이슈 추출
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

logger = logging.getLogger(__name__)
router = APIRouter()

SUGGESTED_QUESTIONS = [
    "현재 진행 중인 이슈가 뭐야?",
    "이번 주 할 일이 뭐야?",
    "기술 스택이 뭐야?",
    "최근 회의에서 결정된 사항이 뭐야?",
]


# ────────────────────────────────────────────
# 요청 / 응답 스키마
# ────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    doc_type: Optional[str] = None      # 필터: meeting/email/chat/csv/handover/report
    document_id: Optional[str] = None   # 특정 문서 ID 필터
    top_k: int = 3

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("질문이 비어있습니다.")
        return v.strip()

    @field_validator("top_k")
    @classmethod
    def top_k_range(cls, v: int) -> int:
        if not (1 <= v <= 10):
            raise ValueError("top_k는 1~10 사이여야 합니다.")
        return v

    @field_validator("doc_type")
    @classmethod
    def valid_doc_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = {"meeting", "email", "chat", "csv", "handover", "report"}
        if v not in valid:
            raise ValueError(f"doc_type은 {valid} 중 하나여야 합니다.")
        return v


class ExtractRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("텍스트가 비어있습니다.")
        return v.strip()


# ────────────────────────────────────────────
# 엔드포인트
# ────────────────────────────────────────────

@router.post("")
async def chat(request: ChatRequest):
    """
    RAG 기반 질문 답변.

    1. retriever로 FAISS 검색
    2. build_context로 프롬프트 컨텍스트 구성
    3. summarizer로 GPT 답변 생성
    """
    try:
        from app.ai.retriever import retrieve, build_context

        results = retrieve(
            query=request.message,
            top_k=request.top_k,
            doc_type=request.doc_type,
        )

        if not results:
            return {
                "answer": "관련 운영 기록을 찾을 수 없습니다. 먼저 문서를 업로드해주세요.",
                "sources": [],
                "chunk_count": 0,
                "suggested_questions": SUGGESTED_QUESTIONS,
            }

        context = build_context(results)

        from app.ai.summarizer import answer_question
        answer_result = answer_question(query=request.message, context=context)

        sources = sorted(set(r.get("source", "") for r in results if r.get("source")))

        return {
            "answer": answer_result.get("answer", ""),
            "sources": sources,
            "chunk_count": len(results),
            "suggested_questions": SUGGESTED_QUESTIONS,
        }

    except FileNotFoundError:
        # FAISS DB가 아직 없는 경우
        return {
            "answer": "아직 분석된 문서가 없습니다. 먼저 문서를 업로드해주세요.",
            "sources": [],
            "chunk_count": 0,
            "suggested_questions": ["문서를 업로드하면 질문할 수 있습니다."],
        }

    except (ConnectionError, TimeoutError, RuntimeError) as e:
        logger.error(f"[chat] AI 오류: {e}")
        raise HTTPException(status_code=503, detail=f"AI 서비스 오류: {str(e)}")

    except Exception as e:
        logger.error(f"[chat] 예상치 못한 오류: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.post("/extract")
async def extract_todos(request: ExtractRequest):
    """
    텍스트에서 Todo, 결정사항, 이슈를 자동 추출합니다.

    - **text**: 분석할 문서 텍스트 (10,000자 초과 시 앞 10,000자만 사용)
    """
    try:
        from app.ai.summarizer import extract_todos as ai_extract

        result = ai_extract(request.text)

        return {
            "todos": result.get("todos", []),
            "decisions": result.get("decisions", []),
            "issues": result.get("issues", []),
            "counts": {
                "todos": len(result.get("todos", [])),
                "decisions": len(result.get("decisions", [])),
                "issues": len(result.get("issues", [])),
            },
        }

    except (ConnectionError, TimeoutError, RuntimeError) as e:
        logger.error(f"[chat/extract] AI 오류: {e}")
        raise HTTPException(status_code=503, detail=f"AI 서비스 오류: {str(e)}")

    except Exception as e:
        logger.error(f"[chat/extract] 예상치 못한 오류: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")
