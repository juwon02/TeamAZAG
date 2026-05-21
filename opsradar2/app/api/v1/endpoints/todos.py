"""
Todo API 엔드포인트
담당: 박주원
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.services.todo_service import TodoService
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse

router = APIRouter()


@router.get("/", response_model=dict)
async def get_todos(
    status: Optional[str] = None,
    source: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    service = TodoService(db)
    todos = await service.get_todos(status=status, source=source)
    return {"todos": todos}


@router.post("/", response_model=dict)
async def create_todo(
    body: TodoCreate,
    db: AsyncSession = Depends(get_db)
):
    service = TodoService(db)
    todo = await service.create_todo(body)
    return {"todo": todo}


@router.patch("/{todo_id}", response_model=dict)
async def update_todo(
    todo_id: str,
    body: TodoUpdate,
    db: AsyncSession = Depends(get_db)
):
    service = TodoService(db)
    todo = await service.update_todo(todo_id, body)
    return {"todo": todo}


@router.patch("/{todo_id}/approve", response_model=dict)
async def approve_todo(
    todo_id: str,
    db: AsyncSession = Depends(get_db)
):
    service = TodoService(db)
    todo = await service.approve_todo(todo_id)
    return {"todo": todo}


@router.delete("/{todo_id}", response_model=dict)
async def delete_todo(
    todo_id: str,
    db: AsyncSession = Depends(get_db)
):
    service = TodoService(db)
    return await service.delete_todo(todo_id)