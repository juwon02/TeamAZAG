"""Calendar persistence for the v4 OpsRadar schema."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class CalendarRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, project_id: str | None = None) -> list[dict]:
        filters = []
        params = {}
        if project_id:
            filters.append("ce.project_id = CAST(:project_id AS uuid)")
            params["project_id"] = project_id
        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        result = await self.db.execute(
            text(
                f"""
                SELECT
                  ce.id::text AS id,
                  ce.title,
                  ce.starts_at::date::text AS event_date,
                  ce.event_type,
                  u.name AS person,
                  ce.source_type,
                  ce.approval_status,
                  ce.created_at
                FROM calendar_events ce
                LEFT JOIN project_members pm ON pm.id = ce.member_id
                LEFT JOIN users u ON u.id = pm.user_id
                {where_clause}
                ORDER BY ce.starts_at
                """
            ),
            params,
        )
        return [dict(row) for row in result.mappings().all()]

    async def create(self, data: dict) -> dict:
        result = await self.db.execute(
            text(
                """
                INSERT INTO calendar_events (
                  id, project_id, event_type, title, source_type,
                  approval_status, starts_at, created_at
                )
                VALUES (
                  gen_random_uuid(),
                  COALESCE(
                    CAST(:project_id AS uuid),
                    (SELECT id FROM projects ORDER BY created_at LIMIT 1)
                  ),
                  :event_type,
                  :title,
                  'manual',
                  'approved',
                  to_timestamp(:event_date, 'YYYY-MM-DD'),
                  now()
                )
                RETURNING id::text AS id, title, starts_at::date::text AS event_date, event_type
                """
            ),
            {
                "project_id": data.get("project_id"),
                "event_type": data.get("event_type", "meeting"),
                "title": data["title"],
                "event_date": data["event_date"],
            },
        )
        await self.db.commit()
        return dict(result.mappings().one())

    async def delete(self, event_id: str) -> bool:
        result = await self.db.execute(
            text("DELETE FROM calendar_events WHERE id = CAST(:event_id AS uuid)"),
            {"event_id": event_id},
        )
        await self.db.commit()
        return result.rowcount > 0
