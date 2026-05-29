"""
documents.py — 파일 업로드 및 AI 파이프라인 엔드포인트 (UUID + 새 테이블 기반)
팀메모리 프로젝트 / 담당: 이성우
"""

import os
import shutil
import uuid
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, get_db
from app.models.document import Document, DocumentChunk, Todo, Issue

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])

SUPPORTED_EXTENSIONS = {".txt", ".csv", ".pdf", ".docx"}


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
                # chunk_dict는 {"text": "...", "metadata": {...}} 형식
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
            logger.error(f"[documents] 임베딩 오류: {e}")
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
        logger.info(f"[documents] 파이프라인 완료: {document_id}")

    except Exception as e:
        logger.error(f"[documents] 파이프라인 오류 ({document_id}): {e}")
        await _update_doc(document_id, status="failed", progress=0, error_msg=str(e))


@router.post("/upload", status_code=202)
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


@router.get("")
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


@router.get("/{document_id}/status")
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


@router.delete("/{document_id}", status_code=204)
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
