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
            filters.append("i.severity = :severity")
            params["severity"] = risk_level
            
        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
        
        result = await self.db.execute(
            text(f"""
                SELECT
                  i.id::text AS id,
                  i.title,
                  i.status,
                  i.severity AS risk_level,
                  'manual' AS source,
                  i.approval_status,
                  COALESCE(u.name, 'Unassigned') AS assignee,
                  d.file_name::text AS document_id,
                  i.source_chunk_id::text AS source_chunk_id,
                  i.created_at,
                  i.updated_at
                FROM issues i
                LEFT JOIN document_chunks dc ON dc.id = i.source_chunk_id
                LEFT JOIN documents d ON d.id = i.source_document_id
                LEFT JOIN project_members pm ON pm.id = i.assignee_member_id
                LEFT JOIN users u ON u.id = pm.user_id
                {where_clause}
                ORDER BY i.created_at DESC
            """),
            params,
        )
        return [dict(row) for row in result.mappings().all()]

    async def create(self, data: dict) -> str:
        """Create a new issue."""
        result = await self.db.execute(
            text("""
                INSERT INTO issues 
                (project_id, title, severity, status, assignee_member_id, reporter_member_id,
                 source_document_id, source_chunk_id, approval_status, created_at, updated_at)
                VALUES (:project_id, :title, :severity, :status, :assignee_member_id, :reporter_member_id,
                        :source_document_id, :source_chunk_id, :approval_status, NOW(), NOW())
                RETURNING id::text
            """),
            {
                "project_id": data.get("project_id"),
                "title": data.get("title"),
                "severity": data.get("severity", "medium"),
                "status": data.get("status", "open"),
                "assignee_member_id": data.get("assignee_member_id"),
                "reporter_member_id": data.get("reporter_member_id"),
                "source_document_id": data.get("source_document_id"),
                "source_chunk_id": data.get("source_chunk_id"),
                "approval_status": data.get("approval_status", "pending"),
            }
        )
        await self.db.commit()
        return result.scalar()

    async def update(self, issue_id: str, data: dict) -> bool:
        """Update issue with multiple fields."""
        allowed_fields = {"status", "severity", "assignee_member_id", "approval_status"}
        update_fields = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_fields:
            return False
            
        set_clause = ", ".join([f"{k} = :{k}" for k in update_fields.keys()])
        update_fields["id"] = issue_id
        
        result = await self.db.execute(
            text(f"""
                UPDATE issues 
                SET {set_clause}, updated_at = NOW()
                WHERE id = :id
            """),
            update_fields
        )
        await self.db.commit()
        return result.rowcount > 0

    async def resolve(self, issue_id: str) -> bool:
        """Resolve an issue (set status to resolved)."""
        return await self.update(issue_id, {"status": "resolved"})

    async def delete(self, issue_id: str) -> bool:
        """Delete an issue."""
        result = await self.db.execute(
            text("DELETE FROM issues WHERE id = :id"),
            {"id": issue_id}
        )
        await self.db.commit()
        return result.rowcount > 0