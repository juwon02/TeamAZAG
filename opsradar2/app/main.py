from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router
from app.core.config import settings
from app.core.database import engine, Base
from app.models import document, todo, issue  # ← 이렇게 바꾸기

app = FastAPI(
    title="OpsRadar API",
    version="1.0.0",
    description="운영 인텔리전스 AI — 백엔드 API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "OpsRadar"}