from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://azaguser:1111@localhost:5432/azag_db"
    AI_PROVIDER: str = "azure"
    GEMINI_API_KEY: str = ""        # ← 추가
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_DEPLOYMENT: str = ""
    FAISS_INDEX_PATH: str = "data/faiss/index.faiss"

    class Config:
        env_file = ".env"
        extra = "ignore"            # ← 추가 (모르는 변수 무시)

settings = Settings()