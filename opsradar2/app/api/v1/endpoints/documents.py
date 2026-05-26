"""UC-01 document upload and processing status endpoints."""
import os
import shutil
import uuid
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, BackgroundTasks

router = APIRouter()

# 업로드 파일 임시 저장 경로
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 문서 처리 상태 임시 저장 (DB 연동 전까지 메모리 사용)
doc_status: dict = {}


def _run_ai_pipeline(file_path: str, document_id: str, doc_type: str):
    """
    AI 파이프라인 실행 (BackgroundTasks로 비동기 실행)
    file_parser → chunker → embedder → summarizer
    """
    try:
        # 1단계: 상태 업데이트 — parsing
        doc_status[document_id] = {"status": "parsing", "progress": 10}

        from app.ai.file_parser import parse_file
        text, inferred_type = parse_file(file_path)
        final_type = doc_type if doc_type else inferred_type

        # 2단계: 상태 업데이트 — chunking
        doc_status[document_id] = {"status": "chunking", "progress": 30}

        from app.ai.chunker import chunk_file
        chunks = chunk_file(
            file_path=file_path,
            document_id=document_id,
            doc_type=final_type
        )

        if not chunks:
            doc_status[document_id] = {"status": "failed", "progress": 0, "error": "청크 생성 실패"}
            return

        # 3단계: 상태 업데이트 — embedding
        doc_status[document_id] = {"status": "embedding", "progress": 60}

        from app.ai.embedder import embed_and_store
        success = embed_and_store(chunks)

        if not success:
            doc_status[document_id] = {"status": "failed", "progress": 0, "error": "임베딩 실패"}
            return

        # 4단계: 상태 업데이트 — analyzing (GPT 분석)
        doc_status[document_id] = {"status": "analyzing", "progress": 80}

        from app.ai.summarizer import extract_todos, summarize_document
        todos_result = extract_todos(text)
        summary_result = summarize_document(text)

        # 5단계: 완료
        doc_status[document_id] = {
            "status": "completed",
            "progress": 100,
            "todos": todos_result.get("todos", []),
            "decisions": todos_result.get("decisions", []),
            "issues": todos_result.get("issues", []),
            "summary": summary_result.get("summary", ""),
            "keywords": summary_result.get("keywords", []),
        }

    except Exception as e:
        doc_status[document_id] = {
            "status": "failed",
            "progress": 0,
            "error": str(e)
        }


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    file_type: str = Form(...),
):
    """Upload a document and start the AI processing pipeline."""

    # 지원 형식 확인
    supported = {".txt", ".csv", ".pdf", ".docx"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식: {ext}. 지원 형식: {', '.join(supported)}"
        )

    # 파일 저장
    document_id = str(uuid.uuid4())[:8]
    save_path = os.path.join(UPLOAD_DIR, f"{document_id}_{file.filename}")

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # 초기 상태 설정
    doc_status[document_id] = {"status": "parsing", "progress": 0}

    # AI 파이프라인 백그라운드 실행
    background_tasks.add_task(_run_ai_pipeline, save_path, document_id, file_type)

    return {
        "status": "success",
        "document_id": document_id,
        "filename": file.filename,
        "analysis_status": "parsing"
    }


@router.get("/{document_id}/status")
async def get_document_status(document_id: str):
    """Return document processing status."""
    if document_id not in doc_status:
        raise HTTPException(status_code=404, detail=f"문서 ID를 찾을 수 없습니다: {document_id}")

    status = doc_status[document_id]
    return {
        "document_id": document_id,
        "analysis_status": status.get("status", "unknown"),
        "progress": status.get("progress", 0),
        "result": {
            "todos": status.get("todos", []),
            "decisions": status.get("decisions", []),
            "issues": status.get("issues", []),
            "summary": status.get("summary", ""),
            "keywords": status.get("keywords", []),
        } if status.get("status") == "completed" else None,
        "error": status.get("error")
    }


@router.get("")
async def get_documents():
    """List uploaded documents."""
    return {
        "documents": [
            {"document_id": doc_id, "status": info.get("status")}
            for doc_id, info in doc_status.items()
        ]
    }
