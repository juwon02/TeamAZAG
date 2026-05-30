"""Calendar API."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.calendar_repository import CalendarRepository
from app.services.calendar_service import CalendarService

router = APIRouter()


@router.get("")
@router.get("/")
async def get_events(db: AsyncSession = Depends(get_db)):
    service = CalendarService(CalendarRepository(db))
    return {"events": await service.list_events()}


@router.post("/")
async def create_event(body: dict, db: AsyncSession = Depends(get_db)):
    if not body.get("title") or not body.get("event_date"):
        raise HTTPException(400, "title and event_date are required")
    service = CalendarService(CalendarRepository(db))
    event = await service.create_event(body)
    return {"event": event}


@router.delete("/{event_id}")
async def delete_event(event_id: str, db: AsyncSession = Depends(get_db)):
    service = CalendarService(CalendarRepository(db))
    deleted = await service.delete_event(event_id)
    if not deleted:
        raise HTTPException(404, "event not found")
    return {"message": "deleted"}
