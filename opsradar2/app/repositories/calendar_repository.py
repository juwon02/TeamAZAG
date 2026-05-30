"""Calendar persistence for the v4 OpsRadar schema."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class CalendarRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[dict]:
        result = await self.db.execute(
            text(
                """
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
                ORDER BY ce.starts_at
                """
            )
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
                  (SELECT id FROM projects ORDER BY created_at LIMIT 1),
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
            data,
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
