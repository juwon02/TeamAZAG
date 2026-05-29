"""
config.py — 환경변수 설정
팀메모리 프로젝트 / 담당: 이성우
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── PostgreSQL ──────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://root:password@localhost:5432/team_memory"

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


settings = Settings()
