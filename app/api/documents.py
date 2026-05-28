"""
documents.py — 파일 업로드 및 AI 파이프라인 엔드포인트
팀메모리 프로젝트 / 담당: 이성우

POST /documents/upload      파일 업로드 + AI 파이프라인 백그라운드 실행
GET  /documents/            업로드된 문서 목록
GET  /documents/{id}/status 처리 상태 조회
DELETE /documents/{id}      문서 삭제
"""

import os
import shutil
import uuid
import logging
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

SUPPORTED_EXTENSIONS = {".txt", ".csv", ".pdf", ".docx"}

# 처리 상태 인메모리 저장 (DB 연동 전까지 사용)
_doc_store: dict[str, dict] = {}


# ────────────────────────────────────────────
# 백그라운드 AI 파이프라인
# ────────────────────────────────────────────

def _run_pipeline(file_path: str, document_id: str, doc_type: str) -> None:
    """
    file_parser → chunker → embedder → summarizer 순서로 실행.
    각 단계마다 진행률을 _doc_store에 업데이트.
    """
    try:
        # ── 1단계: 파싱 ──────────────────────────
        _set_status(document_id, "parsing", 10)
        from app.ai.file_parser import parse_file
        text, inferred_type = parse_file(file_path)
        final_type = doc_type or inferred_type

        # ── 2단계: 청킹 ──────────────────────────
        _set_status(document_id, "chunking", 30)
        from app.ai.chunker import chunk_file
        chunks = chunk_file(
            file_path=file_path,
            document_id=document_id,
            doc_type=final_type,
        )
        if not chunks:
            _set_status(document_id, "failed", 0, error="청크를 생성할 수 없습니다.")
            return

        # ── 3단계: 임베딩 ────────────────────────
        _set_status(document_id, "embedding", 60)
        from app.ai.embedder import embed_and_store
        if not embed_and_store(chunks):
            _set_status(document_id, "failed", 0, error="임베딩 저장에 실패했습니다.")
            return

        # ── 4단계: GPT 분석 ──────────────────────
        _set_status(document_id, "analyzing", 80)
        from app.ai.summarizer import extract_todos, summarize_document
        todos_result = extract_todos(text)
        summary_result = summarize_document(text)

        # ── 5단계: 완료 ──────────────────────────
        _doc_store[document_id].update({
            "status": "completed",
            "progress": 100,
            "doc_type": final_type,
            "char_count": len(text),
            "chunk_count": len(chunks),
            "todos": todos_result.get("todos", []),
            "decisions": todos_result.get("decisions", []),
            "issues": todos_result.get("issues", []),
            "summary": summary_result.get("summary", ""),
            "keywords": summary_result.get("keywords", []),
        })
        logger.info(f"[documents] 파이프라인 완료: {document_id}")

    except Exception as e:
        logger.error(f"[documents] 파이프라인 오류 ({document_id}): {e}")
        _set_status(document_id, "failed", 0, error=str(e))


def _set_status(document_id: str, status: str, progress: int, error: str = "") -> None:
    entry = _doc_store.setdefault(document_id, {})
    entry.update({"status": status, "progress": progress})
    if error:
        entry["error"] = error


# ────────────────────────────────────────────
# 엔드포인트
# ────────────────────────────────────────────

@router.post("/upload", status_code=202)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    doc_type: str = Form(default=""),
):
    """
    파일을 업로드하고 AI 파이프라인을 백그라운드에서 실행합니다.

    - **file**: 업로드할 파일 (.txt / .csv / .pdf / .docx)
    - **doc_type**: 문서 유형 힌트 (meeting/email/chat/csv/handover/report). 비워두면 자동 추론.
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

    _doc_store[document_id] = {
        "status": "queued",
        "progress": 0,
        "filename": file.filename,
        "file_path": save_path,
    }

    background_tasks.add_task(_run_pipeline, save_path, document_id, doc_type)

    return {
        "document_id": document_id,
        "filename": file.filename,
        "status": "queued",
        "message": "업로드 완료. AI 파이프라인이 백그라운드에서 실행됩니다.",
    }


@router.get("")
async def list_documents():
    """업로드된 문서 목록을 반환합니다."""
    return {
        "total": len(_doc_store),
        "documents": [
            {
                "document_id": doc_id,
                "filename": info.get("filename", ""),
                "status": info.get("status", "unknown"),
                "progress": info.get("progress", 0),
                "doc_type": info.get("doc_type", ""),
            }
            for doc_id, info in _doc_store.items()
        ],
    }


@router.get("/{document_id}/status")
async def get_document_status(document_id: str):
    """
    문서 처리 상태를 조회합니다.

    status 값: queued → parsing → chunking → embedding → analyzing → completed | failed
    """
    if document_id not in _doc_store:
        raise HTTPException(status_code=404, detail=f"문서 ID를 찾을 수 없습니다: {document_id}")

    info = _doc_store[document_id]
    is_done = info.get("status") == "completed"

    return {
        "document_id": document_id,
        "filename": info.get("filename", ""),
        "status": info.get("status", "unknown"),
        "progress": info.get("progress", 0),
        "error": info.get("error"),
        "result": {
            "doc_type": info.get("doc_type", ""),
            "char_count": info.get("char_count", 0),
            "chunk_count": info.get("chunk_count", 0),
            "summary": info.get("summary", ""),
            "keywords": info.get("keywords", []),
            "todos": info.get("todos", []),
            "decisions": info.get("decisions", []),
            "issues": info.get("issues", []),
        } if is_done else None,
    }


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: str):
    """업로드된 파일과 처리 상태를 삭제합니다."""
    if document_id not in _doc_store:
        raise HTTPException(status_code=404, detail=f"문서 ID를 찾을 수 없습니다: {document_id}")

    file_path = _doc_store[document_id].get("file_path", "")
    if file_path and os.path.exists(file_path):
        os.remove(file_path)

    del _doc_store[document_id]
