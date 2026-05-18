"""
UC-01 AI 분석 — 파일 업로드 & 분석 상태
담당: 김성호 (백엔드) + 이성우 (AI 파이프라인)
"""
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

router = APIRouter()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    file_type: str = Form(...),  # email | meeting | chat | other
):
    """파일 업로드 → AI 분석 시작 (UC-01)"""
    # TODO: 김성호 — documents 테이블 저장
    # TODO: 이성우 — parser_service → embedding_service 트리거
    return {"status": "success", "document_id": "doc_001", "analysis_status": "parsing"}


@router.get("/{document_id}/status")
async def get_document_status(document_id: str):
    """분석 진행 상태 조회 (UC-01)"""
    # TODO: 김성호 — documents 테이블 status 조회
    return {"document_id": document_id, "analysis_status": "embedding", "progress": 60}


@router.get("")
async def get_documents():
    """업로드 이력 목록 조회 (UC-01)"""
    # TODO: 김성호 — documents 테이블 전체 조회
    return {"documents": []}
