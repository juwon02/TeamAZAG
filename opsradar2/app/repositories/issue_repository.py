"""Issue persistence for the v4 OpsRadar schema."""

from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class IssueRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _columns(self, table_name: str) -> set[str]:
        result = await self.db.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = :table_name
                """
            ),
            {"table_name": table_name},
        )
        return {row[0] for row in result.all()}

    async def create(self, data: dict) -> dict:
        result = await self.db.execute(
            text(
                """
                INSERT INTO issues (
                  id, project_id, assignee_member_id, title, description,
                  severity, status, source_type, approval_status, domino_chain,
                  created_at, updated_at
                )
                SELECT
                  gen_random_uuid(),
                  selected_project.id,
                  pm.id,
                  :title,
                  :description,
                  COALESCE(:severity, 'medium'),
                  COALESCE(:status, 'open'),
                  'manual',
                  'approved',
                  :domino_impact,
                  now(),
                  now()
                FROM (
                  SELECT COALESCE(
                    CAST(:project_id AS uuid),
                    (SELECT id FROM projects ORDER BY created_at LIMIT 1)
                  ) AS id
                ) selected_project
                LEFT JOIN users u ON u.name = :assignee
                LEFT JOIN project_members pm
                  ON pm.project_id = selected_project.id
                 AND pm.user_id = u.id
                RETURNING
                  id::text AS id,
                  title,
                  description,
                  severity,
                  severity AS risk_level,
                  status,
                  'manual' AS source,
                  domino_chain AS domino_impact,
                  created_at
                """
            ),
            {
                "project_id": data.get("project_id"),
                "title": data["title"],
                "description": data.get("description"),
                "severity": data.get("severity"),
                "status": data.get("status"),
                "assignee": data.get("assignee"),
                "domino_impact": data.get("domino_impact"),
            },
        )
        await self.db.commit()
        return dict(result.mappings().one())

    async def get_all(self, status: Optional[str] = None, risk_level: Optional[str] = None) -> list[dict]:
        issue_columns = await self._columns("issues")
        chunk_columns = await self._columns("document_chunks")

        filters = []
        params = {}
        if "approval_status" in issue_columns:
            filters.append("i.approval_status <> 'rejected'")
        if status:
            filters.append("i.status = :status")
            params["status"] = status
        if risk_level:
            filters.append("i.severity = :risk_level")
            params["risk_level"] = risk_level
        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        if "approval_status" in issue_columns:
            approval_expr = "i.approval_status"
        elif "is_candidate" in issue_columns:
            approval_expr = "CASE WHEN i.is_candidate THEN 'pending' ELSE 'approved' END"
        else:
            approval_expr = "'approved'"

        description_expr = "i.description" if "description" in issue_columns else "NULL::text"
        source_expr = "i.source_type" if "source_type" in issue_columns else "'manual'"
        confidence_expr = "i.confidence_score" if "confidence_score" in issue_columns else "NULL::integer"
        updated_at_expr = "i.updated_at" if "updated_at" in issue_columns else "i.created_at"
        source_chunk_expr = "i.source_chunk_id::text" if "source_chunk_id" in issue_columns else "NULL::text"
        domino_expr = "i.domino_chain" if "domino_chain" in issue_columns else "NULL::text"

        joins = []
        assignee_expr = "NULL::text"
        if "assignee_member_id" in issue_columns:
            joins.append("LEFT JOIN project_members pm ON pm.id = i.assignee_member_id")
            joins.append("LEFT JOIN users u ON u.id = pm.user_id")
            assignee_expr = "u.name"
        elif "assignee_id" in issue_columns:
            joins.append("LEFT JOIN users u ON u.id = i.assignee_id")
            assignee_expr = "u.name"

        document_expr = "NULL::text"
        if "source_chunk_id" in issue_columns and "document_id" in chunk_columns:
            joins.append("LEFT JOIN document_chunks dc ON dc.id = i.source_chunk_id")
            document_expr = "dc.document_id::text"
        elif "source_document_id" in issue_columns:
            document_expr = "i.source_document_id::text"

        joins_sql = "\n                ".join(joins)

        result = await self.db.execute(
            text(
                f"""
                SELECT
                  i.id::text AS id,
                  i.title,
                  {description_expr} AS description,
                  i.status,
                  i.severity,
                  i.severity AS risk_level,
                  {source_expr} AS source,
                  {confidence_expr} AS confidence,
                  {assignee_expr} AS assignee,
                  {document_expr} AS document_id,
                  {source_chunk_expr} AS source_chunk_id,
                  {approval_expr} AS approval_status,
                  {domino_expr} AS domino_impact,
                  i.created_at,
                  {updated_at_expr} AS updated_at
                FROM issues i
                {joins_sql}
                {where_clause}
                ORDER BY i.created_at DESC
                """
            ),
            params,
        )
        return [dict(row) for row in result.mappings().all()]

    async def exists(self, issue_id: str) -> bool:
        result = await self.db.execute(
            text("SELECT EXISTS(SELECT 1 FROM issues WHERE id = CAST(:issue_id AS uuid))"),
            {"issue_id": issue_id},
        )
        return bool(result.scalar_one())

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
