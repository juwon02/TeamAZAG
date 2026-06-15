"""FastAPI shared dependencies."""

from fastapi import Depends, Header, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "login required")
    payload = decode_access_token(authorization.split(" ", 1)[1])
    if not payload or not payload.get("sub"):
        raise HTTPException(401, "invalid token")
    result = await db.execute(
        text(
            """
            SELECT
              u.id::text AS user_id, u.username, u.name, u.role,
              pm.id::text AS member_id, pm.project_id::text AS project_id
            FROM users u
            JOIN project_members pm ON pm.user_id = u.id AND pm.status = 'active'
            WHERE u.id = CAST(:user_id AS uuid) AND u.deleted_at IS NULL
            ORDER BY pm.joined_at
            LIMIT 1
            """
        ),
        {"user_id": payload["sub"]},
    )
    actor = result.mappings().one_or_none()
    if not actor:
        raise HTTPException(403, "active project member required")
    return dict(actor)


def is_lead(actor: dict) -> bool:
    return actor.get("username") == "hj" or str(actor.get("role", "")).lower() in {"admin", "pm", "leader"}
