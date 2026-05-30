"""Issue persistence for the v4 OpsRadar schema."""

from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class IssueRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, status: Optional[str] = None, risk_level: Optional[str] = None) -> list[dict]:
        filters = []
        params = {}
        if status:
            filters.append("i.status = :status")
            params["status"] = status
        if risk_level:
            filters.append("i.severity = :risk_level")
            params["risk_level"] = risk_level
        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
        result = await self.db.execute(
            text(
                f"""
                SELECT
                  i.id::text AS id,
                  i.title,
                  i.status,
                  i.severity AS risk_level,
                  CASE WHEN i.approval_status = 'pending' THEN 'ai' ELSE 'manual' END AS source,
                  i.confidence_score AS confidence,
                  u.name AS assignee,
                  dc.document_id::text AS document_id,
                  i.source_chunk_id::text AS source_chunk_id,
                  i.approval_status,
                  i.created_at,
                  i.updated_at
                FROM issues i
                LEFT JOIN project_members pm ON pm.id = i.assignee_member_id
                LEFT JOIN users u ON u.id = pm.user_id
                LEFT JOIN document_chunks dc ON dc.id = i.source_chunk_id
                {where_clause}
                ORDER BY i.created_at DESC
                """
            ),
            params,
        )
        return [dict(row) for row in result.mappings().all()]

    async def update(self, issue_id: str, data: dict) -> bool:
        allowed = {key: value for key, value in data.items() if key in {"status", "approval_status"}}
        if not allowed:
            return True

        assignments = ", ".join(f"{key} = :{key}" for key in allowed)
        result = await self.db.execute(
            text(f"UPDATE issues SET {assignments}, updated_at = now() WHERE id = CAST(:issue_id AS uuid)"),
            {"issue_id": issue_id, **allowed},
        )
        await self.db.commit()
        return result.rowcount > 0

    async def resolve(self, issue_id: str) -> bool:
        return await self.update(issue_id, {"status": "resolved"})
