"""
main.py — TeamMemory FastAPI 애플리케이션 진입점
팀메모리 프로젝트 / 담당: 이성우

실행:
    uvicorn app.main:app --reload --port 8000
    http://localhost:8000/docs  → Swagger UI
"""

import logging
import os
import sys
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Windows 콘솔 CP949 환경에서 이모지 출력 오류 방지
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.core.config import settings
from app.core.database import engine, Base
from app.models import document  # noqa: F401 — Base에 테이블 등록

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── DB 테이블 자동 생성 ───────────────────
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("PostgreSQL 테이블 초기화 완료")
    except Exception as e:
        logger.error(f"DB 연결 실패: {e}")

    # ── uploads 디렉토리 ──────────────────────
    os.makedirs("uploads", exist_ok=True)

    # ── FAISS 상태 확인 ───────────────────────
    from app.ai.embedder import get_index_count
    try:
        count = get_index_count()
        logger.info(f"FAISS DB 로드 완료: {count}개 벡터 ({settings.FAISS_DIR})")
    except Exception:
        logger.warning(f"FAISS DB 없음. 문서 업로드 시 자동 생성됩니다. ({settings.FAISS_DIR})")

    yield

    # ── 종료 — DB 엔진 해제 ──────────────────
    await engine.dispose()
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
