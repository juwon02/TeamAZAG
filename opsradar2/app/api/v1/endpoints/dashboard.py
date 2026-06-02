"""Dashboard API."""

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary(project_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    return await DashboardService(db).summary(project_id=project_id)
