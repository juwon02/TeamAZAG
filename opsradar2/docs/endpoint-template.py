"""Template for a new OpsRadar API feature."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db


router = APIRouter()


@router.get("")
async def list_items(db: AsyncSession = Depends(get_db)):
    # Keep endpoint logic thin. Instantiate service/repository here, then
    # delegate business decisions to the service layer.
    return {"items": []}


@router.post("")
async def create_item(body: dict, db: AsyncSession = Depends(get_db)):
    if not body.get("title"):
        raise HTTPException(400, "title is required")
    return {"status": "success"}
