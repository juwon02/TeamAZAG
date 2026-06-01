"""
main.py — FastAPI 메인 애플리케이션
OpsRadar + RAG 통합
"""

import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.rag import router as rag_router

# 환경 변수 로드
load_dotenv()

# 로거 설정
logger = logging.getLogger(__name__)

# ============================================================================
# 데이터베이스 초기화
# ============================================================================
async def init_db():
    """데이터베이스 테이블 생성"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("PostgreSQL 테이블 초기화 완료")


async def init_faiss():
    """FAISS 인덱스 로드"""
    from app.ai.embedder import get_index_count
    count = get_index_count()
    logger.info(f"FAISS DB 로드 완료: {count}개 벡터 (./data/faiss)")


# ============================================================================
# 애플리케이션 라이프사이클
# ============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작/종료 이벤트"""
    # 시작
    await init_db()
    await init_faiss()
    
    yield
    
    # 종료
    logger.info("애플리케이션 종료")


# ============================================================================
# FastAPI 애플리케이션 생성
# ============================================================================
app = FastAPI(
    title="TeamMemory API",
    description="RAG 기반 AI 문서 분석 및 협업 플랫폼",
    version="1.0.0",
    lifespan=lifespan,
)

# ============================================================================
# CORS 설정
# ============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# 라우터 등록
# ============================================================================
# RAG API (파일 업로드, Q&A, 추출)
app.include_router(rag_router)

# ============================================================================
# 기본 엔드포인트
# ============================================================================
@app.get("/")
async def root():
    """API 정보"""
    return {
        "name": "TeamMemory API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "rag": "/rag/documents/upload, /rag/chat, etc.",
        }
    }


@app.get("/health")
async def health():
    """헬스 체크"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)