"""
Dashboard API
담당: 박주원
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.todo import Todo
from app.models.issue import Issue

router = APIRouter()

@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)):

    # Todo 집계
    total_todos = await db.execute(select(func.count(Todo.id)))
    total = total_todos.scalar() or 0

    done_todos = await db.execute(
        select(func.count(Todo.id)).where(Todo.status == 'done')
    )
    done = done_todos.scalar() or 0

    pending_todos = await db.execute(
        select(func.count(Todo.id)).where(Todo.status == 'pending')
    )
    pending = pending_todos.scalar() or 0

    # 이슈 집계
    high_risk = await db.execute(
        select(func.count(Issue.id)).where(
            Issue.risk_level == 'high',
            Issue.status != 'resolved'
        )
    )
    high_risk_count = high_risk.scalar() or 0

    blocked = await db.execute(
        select(func.count(Issue.id)).where(
            Issue.status == 'in_progress'
        )
    )
    blocked_count = blocked.scalar() or 0

    # 완료율 계산
    rate = int((done / total * 100)) if total > 0 else 0

    return {
        "total_todos": total,
        "done_todos": done,
        "pending_todos": pending,
        "todo_completion_rate": rate,
        "high_risk_count": high_risk_count,
        "blocked_count": blocked_count,
    }