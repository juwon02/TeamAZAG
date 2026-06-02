"""Todo persistence for the v4 OpsRadar schema."""

from typing import Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class TodoRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, status: Optional[str] = None, source: Optional[str] = None) -> list[dict]:
        filters = []
        params = {}
        
        if status:
            filters.append("t.status = :status")
            params["status"] = status
            
        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
        
        result = await self.db.execute(
            text(f"""
                SELECT
                  t.id::text AS id,
                  t.title,
                  t.status,
                  t.priority,
                  COALESCE(u.name, 'Unassigned') AS assignee,
                  'manual' AS source,
                  t.approval_status,
                  d.file_name::text AS document_id,
                  t.source_chunk_id::text AS source_chunk_id,
                  t.created_at
                FROM todos t
                LEFT JOIN document_chunks dc ON dc.id = t.source_chunk_id
                LEFT JOIN documents d ON d.id = t.source_document_id
                LEFT JOIN project_members pm ON pm.id = t.assignee_member_id
                LEFT JOIN users u ON u.id = pm.user_id
                {where_clause}
                ORDER BY t.created_at DESC
            """),
            params,
        )
        return [dict(row) for row in result.mappings().all()]

    async def create(self, data: dict) -> str:
        """Create a new todo."""
        result = await self.db.execute(
            text("""
                INSERT INTO todos 
                (project_id, title, status, priority, assignee_member_id, 
                 source_document_id, source_chunk_id, approval_status, created_at, updated_at)
                VALUES (:project_id, :title, :status, :priority, :assignee_member_id,
                        :source_document_id, :source_chunk_id, :approval_status, NOW(), NOW())
                RETURNING id::text
            """),
            {
                "project_id": data.get("project_id"),
                "title": data.get("title"),
                "status": data.get("status", "open"),
                "priority": data.get("priority", "medium"),
                "assignee_member_id": data.get("assignee_member_id"),
                "source_document_id": data.get("source_document_id"),
                "source_chunk_id": data.get("source_chunk_id"),
                "approval_status": data.get("approval_status", "pending"),
            }
        )
        await self.db.commit()
        return result.scalar()

    async def update_status(self, todo_id: str, status: str) -> bool:
        """Update todo status."""
        result = await self.db.execute(
            text("""
                UPDATE todos 
                SET status = :status, updated_at = NOW()
                WHERE id = :id
            """),
            {"status": status, "id": todo_id}
        )
        await self.db.commit()
        return result.rowcount > 0

    async def update(self, todo_id: str, data: dict) -> bool:
        """Update todo with multiple fields."""
        allowed_fields = {"status", "priority", "assignee_member_id", "approval_status"}
        update_fields = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_fields:
            return False
            
        set_clause = ", ".join([f"{k} = :{k}" for k in update_fields.keys()])
        update_fields["id"] = todo_id
        update_fields["updated_at"] = "NOW()"
        
        result = await self.db.execute(
            text(f"""
                UPDATE todos 
                SET {set_clause}, updated_at = NOW()
                WHERE id = :id
            """),
            update_fields
        )
        await self.db.commit()
        return result.rowcount > 0

    async def delete(self, todo_id: str) -> bool:
        """Delete a todo."""
        result = await self.db.execute(
            text("DELETE FROM todos WHERE id = :id"),
            {"id": todo_id}
        )
        await self.db.commit()
        return result.rowcount > 0
