"""
database.py — PostgreSQL 비동기 세션 (SQLAlchemy AsyncSession)
팀메모리 프로젝트 / 담당: 이성우
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.APP_ENV == "development"),
    pool_pre_ping=True,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    """FastAPI Depends용 — 비동기 DB 세션 주입."""
    async with AsyncSessionLocal() as session:
        yield session
