"""
Knowledge (인수인계) API
담당: 박주원
"""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter()


@router.get("/")
async def get_knowledge_list():
    # 나중에 DB 모델 추가 예정
    return {
        "documents": [
            {
                "id": "1",
                "type": "onboarding",
                "title": "신규 입사자 온보딩 문서",
                "created_at": "2026-05-10"
            },
            {
                "id": "2",
                "type": "handover",
                "title": "박주원 → 신규 프론트 담당자",
                "created_at": "2026-05-08"
            }
        ]
    }


@router.post("/generate")
async def generate_knowledge(
    doc_type: str = "onboarding"
):
    # 나중에 AI 연결 예정
    content = ""
    if doc_type == "onboarding":
        content = """
## 신규 입사자 온보딩 문서

### 프로젝트 개요
OpsRadar — 운영 인텔리전스 AI 시스템

### 기술 스택
- Backend: FastAPI + PostgreSQL
- Frontend: HTML/JS
- AI: Azure OpenAI + FAISS

### 현재 운영 상태
AI 파이프라인 연동 후 자동 생성됩니다.
        """.strip()
    else:
        content = """
## 인수인계 문서

### 현재 진행 업무
AI 파이프라인 연동 후 자동 생성됩니다.

### 주요 이슈
DB에서 자동 집계 예정입니다.
        """.strip()

    return {
        "document": {
            "id": str(uuid.uuid4()),
            "type": doc_type,
            "content": content
        }
    }