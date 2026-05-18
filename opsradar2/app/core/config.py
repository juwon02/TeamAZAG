from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # DB
    DATABASE_URL: str = "mysql+pymysql://user:password@localhost:3306/opsradar"

    # AI Provider (azure | gemini)
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_DEPLOYMENT: str = ""

    # Vector DB
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001

    class Config:
        env_file = ".env"


settings = Settings()
