"""
documents.py — 파일 업로드 및 AI 파이프라인 엔드포인트
팀메모리 프로젝트 / 담당: 이성우

POST   /documents/upload      파일 업로드 + AI 파이프라인 백그라운드 실행
GET    /documents/            업로드된 문서 목록 (DB 조회)
GET    /documents/{id}/status 처리 상태 조회 (DB 조회)
DELETE /documents/{id}        문서 삭제 (파일 + DB)
"""

import os
import shutil
import uuid
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, get_db
from app.models.document import Document

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

SUPPORTED_EXTENSIONS = {".txt", ".csv", ".pdf", ".docx"}


# ────────────────────────────────────────────
# 내부 헬퍼
# ────────────────────────────────────────────

async def _update_doc(document_id: str, **kwargs) -> None:
    """백그라운드 태스크 전용 — 자체 세션으로 Document 레코드 업데이트."""
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Document).where(Document.id == document_id).values(**kwargs)
        )
        await db.commit()


# ────────────────────────────────────────────
# 백그라운드 AI 파이프라인
# ────────────────────────────────────────────

async def _run_pipeline(file_path: str, document_id: str, doc_type: str) -> None:
    """
    file_parser → chunker → embedder → summarizer 순서로 실행.
    각 단계마다 DB의 status/progress 컬럼을 업데이트.
    AI 파이프라인(chunker, embedder, retriever, summarizer)은 그대로 사용.
    """
    try:
        # ── 1단계: 파싱 ──────────────────────────
        await _update_doc(document_id, status="parsing", progress=10)
        from app.ai.file_parser import parse_file
        text, inferred_type = parse_file(file_path)
        final_type = doc_type or inferred_type

        # ── 2단계: 청킹 ──────────────────────────
        await _update_doc(document_id, status="chunking", progress=30, doc_type=final_type)
        from app.ai.chunker import chunk_file
        chunks = chunk_file(
            file_path=file_path,
            document_id=document_id,
            doc_type=final_type,
        )
        if not chunks:
            await _update_doc(document_id, status="failed", progress=0,
                              error_msg="청크를 생성할 수 없습니다.")
            return

        # ── 3단계: 임베딩 ────────────────────────
        await _update_doc(document_id, status="embedding", progress=60,
                          chunk_count=len(chunks))
        from app.ai.embedder import embed_and_store
        if not embed_and_store(chunks):
            await _update_doc(document_id, status="failed", progress=0,
                              error_msg="임베딩 저장에 실패했습니다.")
            return

        # ── 4단계: GPT 분석 ──────────────────────
        await _update_doc(document_id, status="analyzing", progress=80)
        from app.ai.summarizer import extract_todos, summarize_document
        todos_result = extract_todos(text)
        summary_result = summarize_document(text)

        # ── 5단계: 완료 — 모든 결과를 DB에 저장 ──
        await _update_doc(
            document_id,
            status="completed",
            progress=100,
            char_count=len(text),
            summary=summary_result.get("summary", ""),
            keywords=summary_result.get("keywords", []),
            todos=todos_result.get("todos", []),
            decisions=todos_result.get("decisions", []),
            issues=todos_result.get("issues", []),
        )
        logger.info(f"[documents] 파이프라인 완료: {document_id}")

    except Exception as e:
        logger.error(f"[documents] 파이프라인 오류 ({document_id}): {e}")
        await _update_doc(document_id, status="failed", progress=0, error_msg=str(e))


# ────────────────────────────────────────────
# 엔드포인트
# ────────────────────────────────────────────

@router.post("/upload", status_code=202)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    doc_type: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
):
    """
    파일을 업로드하고 AI 파이프라인을 백그라운드에서 실행합니다.

    - **file**: 업로드할 파일 (.txt / .csv / .pdf / .docx)
    - **doc_type**: 문서 유형 힌트. 비워두면 파일명으로 자동 추론.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식: '{ext}'. 지원 형식: {', '.join(sorted(SUPPORTED_EXTENSIONS))}",
        )

    document_id = uuid.uuid4().hex[:8]
    save_path = os.path.join(UPLOAD_DIR, f"{document_id}_{file.filename}")

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # DB에 초기 레코드 저장
    doc = Document(
        id=document_id,
        filename=file.filename or "",
        file_path=save_path,
        doc_type=doc_type,
        status="queued",
        progress=0,
    )
    db.add(doc)
    await db.commit()

    background_tasks.add_task(_run_pipeline, save_path, document_id, doc_type)

    return {
        "document_id": document_id,
        "filename": file.filename,
        "status": "queued",
        "message": "업로드 완료. AI 파이프라인이 백그라운드에서 실행됩니다.",
    }


@router.get("")
async def list_documents(db: AsyncSession = Depends(get_db)):
    """업로드된 문서 목록을 반환합니다."""
    result = await db.execute(
        select(Document).order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()

    return {
        "total": len(docs),
        "documents": [
            {
                "document_id": d.id,
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
    """
    문서 처리 상태를 조회합니다.

    status 값: queued → parsing → chunking → embedding → analyzing → completed | failed
    """
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail=f"문서 ID를 찾을 수 없습니다: {document_id}")

    is_done = doc.status == "completed"

    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "status": doc.status,
        "progress": doc.progress,
        "error": doc.error_msg,
        "result": {
            "doc_type": doc.doc_type,
            "char_count": doc.char_count,
            "chunk_count": doc.chunk_count,
            "summary": doc.summary,
            "keywords": doc.keywords or [],
            "todos": doc.todos or [],
            "decisions": doc.decisions or [],
            "issues": doc.issues or [],
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
