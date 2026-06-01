"""Dashboard aggregation service."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def summary(self) -> dict:
        result = await self.db.execute(
            text(
                """
                SELECT
                  COUNT(*) FILTER (WHERE status = 'completed') AS done_todos,
                  COUNT(*) AS total_todos,
                  COUNT(*) FILTER (WHERE status = 'pending') AS pending_todos,
                  COUNT(*) FILTER (WHERE status = 'blocked') AS blocked_todos
                FROM todos
                """
            )
        )
        todo = dict(result.mappings().one())

        result = await self.db.execute(
            text(
                """
                SELECT
                  COUNT(*) FILTER (WHERE severity = 'high' AND status <> 'resolved') AS high_risk_count,
                  COUNT(*) FILTER (WHERE status = 'blocked') AS blocked_issues
                FROM issues
                """
            )
        )
        issue = dict(result.mappings().one())

        result = await self.db.execute(
            text("SELECT summary FROM ai_summaries ORDER BY created_at DESC LIMIT 1")
        )
        ai_summary = result.scalar_one_or_none() or ""

        total_todos = int(todo["total_todos"] or 0)
        done_todos = int(todo["done_todos"] or 0)
        completion_rate = round((done_todos / total_todos) * 100) if total_todos else 0

        return {
            "done_todos": done_todos,
            "total_todos": total_todos,
            "pending_todos": int(todo["pending_todos"] or 0),
            "todo_completion_rate": completion_rate,
            "high_risk_count": int(issue["high_risk_count"] or 0),
            "blocked_count": int(todo["blocked_todos"] or 0) + int(issue["blocked_issues"] or 0),
            "ai_summary": ai_summary,
            "recent_activities": [],
        }
