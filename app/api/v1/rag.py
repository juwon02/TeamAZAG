"""
rag.py — RAG 기반 파일 업로드 및 AI 질문답변 통합 엔드포인트
팀메모리 프로젝트 / 담당: 이성우

파일 업로드: POST /rag/documents/upload
문서 목록: GET /rag/documents
문서 상태: GET /rag/documents/{document_id}/status
문서 삭제: DELETE /rag/documents/{document_id}
질문답변: POST /rag/chat
추출하기: POST /rag/chat/extract
"""

import os
import shutil
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, field_validator
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, get_db
from app.rag_models.document import Document, DocumentChunk, Todo, Issue

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rag", tags=["rag"])

# ============================================================================
# 상수
# ============================================================================
SUPPORTED_EXTENSIONS = {".txt", ".csv", ".pdf", ".docx"}
SUGGESTED_QUESTIONS = [
    "현재 진행 중인 이슈가 뭐야?",
    "이번 주 할 일이 뭐야?",
    "기술 스택이 뭐야?",
    "최근 회의에서 결정된 사항이 뭐야?",
]

# ============================================================================
# Pydantic 모델
# ============================================================================
class ChatRequest(BaseModel):
    message: str
    doc_type: Optional[str] = None
    document_id: Optional[str] = None
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


# ============================================================================
# 헬퍼 함수
# ============================================================================
async def _update_doc(document_id: str, **kwargs) -> None:
    """백그라운드 태스크 전용 — 자체 세션으로 Document 레코드 업데이트."""
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Document).where(Document.id == document_id).values(**kwargs)
        )
        await db.commit()


async def _run_pipeline(file_path: str, document_id: str, doc_type: str, project_id: str) -> None:
    """파이프라인 실행: 파싱 → 청킹 → 임베딩 → 분석"""
    try:
        await _update_doc(document_id, status="parsing", progress=10)
        from app.ai.file_parser import parse_file
        text, inferred_type = parse_file(file_path)
        final_type = doc_type or inferred_type

        await _update_doc(document_id, status="chunking", progress=30, doc_type=final_type)
        from app.ai.chunker import chunk_file
        chunks = chunk_file(file_path=file_path, doc_type=final_type)
        if not chunks:
            await _update_doc(document_id, status="failed", progress=0, error_msg="청크를 생성할 수 없습니다.")
            return

        async with AsyncSessionLocal() as db:
            for idx, chunk_dict in enumerate(chunks):
                chunk_text = chunk_dict.get("text", "")
                chunk_obj = DocumentChunk(
                    id=uuid.uuid4(),
                    document_id=uuid.UUID(document_id),
                    chunk_index=idx,
                    content=chunk_text,
                    token_count=len(chunk_text.split()) if chunk_text else 0
                )
                db.add(chunk_obj)
            await db.commit()

        await _update_doc(document_id, status="embedding", progress=60, chunk_count=len(chunks))
        from app.ai.embedder import embed_and_store
        try:
            if not embed_and_store(chunks):
                await _update_doc(document_id, status="failed", progress=0, error_msg="임베딩 저장에 실패했습니다.")
                return
        except Exception as e:
            logger.error(f"[rag] 임베딩 오류: {e}")
            await _update_doc(document_id, status="failed", progress=0, error_msg=str(e))
            return

        await _update_doc(document_id, status="analyzing", progress=80)
        from app.ai.summarizer import extract_todos, summarize_document
        todos_result = extract_todos(text)
        summary_result = summarize_document(text)

        async with AsyncSessionLocal() as db:
            for todo_item in todos_result.get("todos", []):
                todo_obj = Todo(
                    id=uuid.uuid4(),
                    project_id=uuid.UUID(project_id),
                    source_chunk_id=None,
                    title=todo_item.get("content", ""),
                    status="pending",
                    priority="medium",
                    assignee=todo_item.get("assignee"),
                    confidence_score=80
                )
                db.add(todo_obj)

            for issue_item in todos_result.get("issues", []):
                issue_obj = Issue(
                    id=uuid.uuid4(),
                    project_id=uuid.UUID(project_id),
                    source_chunk_id=None,
                    title=issue_item.get("title", ""),
                    severity=issue_item.get("severity", "medium"),
                    status="open",
                    description=None,
                    confidence_score=80
                )
                db.add(issue_obj)

            await db.commit()

        await _update_doc(
            document_id,
            status="completed",
            progress=100,
            char_count=len(text),
            summary=summary_result.get("summary", ""),
        )
        logger.info(f"[rag] 파이프라인 완료: {document_id}")

    except Exception as e:
        logger.error(f"[rag] 파이프라인 오류 ({document_id}): {e}")
        await _update_doc(document_id, status="failed", progress=0, error_msg=str(e))


# ============================================================================
# 문서 관련 엔드포인트
# ============================================================================
@router.post("/documents/upload", status_code=202)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    doc_type: str = Form(default=""),
    project_id: str = Form(default="00000000-0000-0000-0000-000000000000"),
    db: AsyncSession = Depends(get_db),
):
    """파일을 업로드하고 AI 파이프라인을 백그라운드에서 실행합니다."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식: {ext}")

    document_id = str(uuid.uuid4())
    os.makedirs("uploads", exist_ok=True)
    save_path = os.path.join("uploads", f"{document_id}_{file.filename}")

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    doc = Document(
        id=uuid.UUID(document_id),
        project_id=uuid.UUID(project_id),
        filename=file.filename or "",
        file_path=save_path,
        doc_type=doc_type,
        status="queued",
        progress=0,
    )
    db.add(doc)
    await db.commit()

    background_tasks.add_task(_run_pipeline, save_path, document_id, doc_type, project_id)

    return {
        "document_id": document_id,
        "filename": file.filename,
        "status": "queued",
        "message": "업로드 완료. AI 파이프라인이 백그라운드에서 실행됩니다.",
    }


@router.get("/documents")
async def list_documents(db: AsyncSession = Depends(get_db)):
    """업로드된 문서 목록을 반환합니다."""
    result = await db.execute(select(Document).order_by(Document.created_at.desc()))
    docs = result.scalars().all()
    return {
        "total": len(docs),
        "documents": [
            {
                "document_id": str(d.id),
                "filename": d.filename,
                "status": d.status,
                "progress": d.progress,
                "doc_type": d.doc_type,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in docs
        ],
    }


@router.get("/documents/{document_id}/status")
async def get_document_status(document_id: str, db: AsyncSession = Depends(get_db)):
    """문서 처리 상태를 조회합니다."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail=f"문서 ID를 찾을 수 없습니다: {document_id}")

    is_done = doc.status == "completed"

    todos_result = await db.execute(select(Todo).where(Todo.project_id == doc.project_id))
    todos = todos_result.scalars().all()

    issues_result = await db.execute(select(Issue).where(Issue.project_id == doc.project_id))
    issues = issues_result.scalars().all()

    return {
        "document_id": str(doc.id),
        "filename": doc.filename,
        "status": doc.status,
        "progress": doc.progress,
        "error": doc.error_msg,
        "result": {
            "doc_type": doc.doc_type,
            "char_count": doc.char_count,
            "chunk_count": doc.chunk_count,
            "summary": doc.summary,
            "todos": [{"id": str(t.id), "title": t.title, "status": t.status, "priority": t.priority, "assignee": t.assignee} for t in todos],
            "issues": [{"id": str(i.id), "title": i.title, "severity": i.severity, "status": i.status} for i in issues],
        } if is_done else None,
    }


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(document_id: str, db: AsyncSession = Depends(get_db)):
    """업로드된 파일과 DB 레코드를 삭제합니다."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail=f"문서 ID를 찾을 수 없습니다: {document_id}")

    if doc.file_path and os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    await db.execute(delete(Document).where(Document.id == document_id))
    await db.commit()


# ============================================================================
# Chat (RAG Q&A) 엔드포인트
# ============================================================================
@router.post("/chat")
async def chat(request: ChatRequest):
    """
    RAG 기반 질문 답변.

    1. retriever로 FAISS 검색 (내부에서 score 0.41 미만 자동 필터링)
    2. results 비어있으면 업무 무관 질문으로 판단 → 거절
    3. build_context로 프롬프트 컨텍스트 구성
    4. summarizer로 GPT 답변 생성
    """
    try:
        from app.ai.retriever import retrieve, build_context

        results = retrieve(
            query=request.message,
            top_k=request.top_k,
            doc_type=request.doc_type,
        )

        # 결과 없음 = 업무 무관 질문 or 관련 문서 없음
        if not results:
            return {
                "answer": "죄송합니다. 저는 업무 관련 문서 분석만 지원합니다. 📄\n회의록, 보고서, 이메일 등 업무 문서를 업로드 후 질문해주세요.",
                "sources": [],
                "chunk_count": 0,
                "suggested_questions": SUGGESTED_QUESTIONS,
            }

        # 문서 기반 GPT 답변
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
        return {
            "answer": "죄송합니다. 저는 업무 관련 문서 분석만 지원합니다. 📄\n회의록, 보고서, 이메일 등 업무 문서를 업로드 후 질문해주세요.",
            "sources": [],
            "chunk_count": 0,
            "suggested_questions": SUGGESTED_QUESTIONS,
        }

    except (ConnectionError, TimeoutError, RuntimeError) as e:
        logger.error(f"[rag/chat] AI 오류: {e}")
        raise HTTPException(status_code=503, detail=f"AI 서비스 오류: {str(e)}")

    except Exception as e:
        logger.error(f"[rag/chat] 예상치 못한 오류: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.post("/chat/extract")
async def extract_todos(request: ExtractRequest):
    """
    텍스트에서 Todo, 결정사항, 이슈를 자동 추출합니다.
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
        logger.error(f"[rag/chat/extract] AI 오류: {e}")
        raise HTTPException(status_code=503, detail=f"AI 서비스 오류: {str(e)}")

    except Exception as e:
        logger.error(f"[rag/chat/extract] 예상치 못한 오류: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")