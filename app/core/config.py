
"""
config.py — 환경변수 설정
팀메모리 프로젝트 / 담당: 이성우
"""
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # ── PostgreSQL ──────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://azag_user:1111@74.249.82.58:5432/azag_db"
    # ── Azure OpenAI ────────────────────────────
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_API_VERSION: str = "2024-02-01"
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT: str = "text-embedding-3-large"
    AZURE_OPENAI_CHAT_DEPLOYMENT: str = "gpt-4o"
    # ── FAISS ───────────────────────────────────
    FAISS_DIR: str = "./data/faiss"
    # ── FastAPI ─────────────────────────────────
    APP_ENV: str = "development"
    APP_PORT: int = 8000
    
    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
