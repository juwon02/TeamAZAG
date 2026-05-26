"""UC-07 AI assistant endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    doc_type: Optional[str] = None
    document_id: Optional[str] = None


@router.post("")
async def chat(request: ChatRequest):
    """Answer a user question with retrieved operational context."""

    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="질문이 비어있습니다.")

    try:
        # 1단계: RAG 검색 (retriever)
        from app.ai.retriever import retrieve, build_context

        results = retrieve(
            query=request.message,
            top_k=3,
            doc_type=request.doc_type if request.doc_type else None,
        )

        # 관련 문서 없을 때
        if not results:
            return {
                "answer": "관련 운영 기록을 찾을 수 없습니다. 먼저 문서를 업로드해주세요.",
                "sources": [],
                "suggested_questions": [
                    "현재 진행 중인 이슈가 뭐야?",
                    "이번 주 할 일이 뭐야?",
                    "기술 스택이 뭐야?",
                ],
            }

        # 2단계: 컨텍스트 조합
        context = build_context(results)

        # 3단계: GPT 답변 생성 (summarizer)
        from app.ai.summarizer import answer_question

        answer_result = answer_question(
            query=request.message,
            context=context
        )

        # 출처 파일명 목록
        sources = list(set([r.get("source", "") for r in results if r.get("source")]))

        return {
            "answer": answer_result.get("answer", ""),
            "sources": sources,
            "suggested_questions": [
                "현재 진행 중인 이슈가 뭐야?",
                "이번 주 할 일이 뭐야?",
                "기술 스택이 뭐야?",
            ],
        }

    except FileNotFoundError:
        return {
            "answer": "아직 분석된 문서가 없습니다. 먼저 문서를 업로드해주세요.",
            "sources": [],
            "suggested_questions": [
                "문서를 업로드하면 질문할 수 있습니다.",
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 처리 중 오류: {str(e)}")
