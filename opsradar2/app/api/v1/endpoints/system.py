"""Runtime metadata for frontend clients."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

router = APIRouter()


@router.get("/health")
async def api_health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "service": "OpsRadar",
        "app": "opsradar2",
        "api_version": "v1",
        "db_schema": settings.DB_SCHEMA,
        "db": db_status,
    }



@router.get("/frontend-config")
async def frontend_config():
    return {
        "apiBase": "/api/v1",
        "healthPath": "/api/v1/system/health",
        "docsPath": "/docs",
        "features": {
            "dashboard": True,
            "todos": True,
            "issues": True,
            "calendar": True,
            "reports": True,
            "assistant": True,
            "handoff": True,
        },
    }
