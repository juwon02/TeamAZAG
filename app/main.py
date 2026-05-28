"""
main.py — TeamMemory FastAPI 애플리케이션 진입점
팀메모리 프로젝트 / 담당: 이성우

실행:
    uvicorn app.main:app --reload --port 8000
    http://localhost:8000/docs  → Swagger UI
"""

import logging
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.documents import router as documents_router
from app.api.chat import router as chat_router

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── 시작 ──────────────────────────────────
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    faiss_dir = os.getenv("FAISS_DIR", "./faiss_db")
    from app.ai.embedder import get_index_count
    try:
        count = get_index_count()
        logger.info(f"FAISS DB 로드 완료: {count}개 벡터 ({faiss_dir})")
    except Exception:
        logger.warning(f"FAISS DB 없음. 문서를 업로드하면 자동 생성됩니다. ({faiss_dir})")

    yield

    # ── 종료 ──────────────────────────────────
    logger.info("TeamMemory API 종료")


app = FastAPI(
    title="TeamMemory API",
    version="0.1.0",
    description=(
        "팀 운영 문서를 AI로 분석하는 RAG 기반 챗봇 API.\n\n"
        "**주요 기능:**\n"
        "- 문서 업로드 및 자동 분석 (Todo/결정사항/이슈 추출)\n"
        "- RAG 기반 질문 답변\n"
        "- FAISS 벡터 검색"
    ),
    lifespan=lifespan,
)

# CORS — 개발 환경에서는 전체 허용, 운영에서는 도메인 지정 필요
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(documents_router, prefix="/documents", tags=["documents"])
app.include_router(chat_router, prefix="/chat", tags=["chat"])


@app.get("/", tags=["health"])
def root():
    return {
        "service": "TeamMemory API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
def health_check():
    """서비스 상태 확인."""
    from app.ai.embedder import get_index_count
    try:
        vector_count = get_index_count()
    except Exception:
        vector_count = 0

    return {
        "status": "ok",
        "faiss_vectors": vector_count,
    }
