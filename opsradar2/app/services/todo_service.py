"""
Todo 비즈니스 로직
담당: 박주원
"""
import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.todo_repository import TodoRepository
from app.schemas.todo import TodoCreate, TodoUpdate


class TodoService:
    def __init__(self, db: AsyncSession):
        self.repo = TodoRepository(db)

    async def get_todos(self, status=None, source=None):
        todos = await self.repo.get_all(status=status, source=source)
        return [self._to_dict(t) for t in todos]

    async def create_todo(self, data: TodoCreate):
        todo = await self.repo.create({
            "id": str(uuid.uuid4()),
            "title": data.title,
            "priority": data.priority,
            "assignee": data.assignee,
            "due_date": data.due_date,
            "status": "pending",
            "source": "manual",
            "confidence": None,
        })
        return self._to_dict(todo)

    async def update_todo(self, todo_id: str, data: TodoUpdate):
        todo = await self.repo.get_by_id(todo_id)
        if not todo:
            raise HTTPException(status_code=404, detail="Todo를 찾을 수 없어요")
        update_data = data.model_dump(exclude_none=True)
        todo = await self.repo.update(todo, update_data)
        return self._to_dict(todo)

    async def approve_todo(self, todo_id: str):
        todo = await self.repo.get_by_id(todo_id)
        if not todo:
            raise HTTPException(status_code=404, detail="Todo를 찾을 수 없어요")
        todo = await self.repo.update(todo, {"status": "in_progress"})
        return self._to_dict(todo)

    async def delete_todo(self, todo_id: str):
        todo = await self.repo.get_by_id(todo_id)
        if not todo:
            raise HTTPException(status_code=404, detail="Todo를 찾을 수 없어요")
        await self.repo.delete(todo)
        return {"message": "삭제 완료"}

    def _to_dict(self, todo):
        return {
            "id": todo.id,
            "title": todo.title,
            "status": todo.status,
            "priority": todo.priority,
            "assignee": todo.assignee,
            "source": todo.source,
            "confidence": todo.confidence,
            "due_date": str(todo.due_date) if todo.due_date else None,
            "created_at": str(todo.created_at) if todo.created_at else None,
        }