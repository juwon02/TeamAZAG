from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db


ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

app = FastAPI(title="TeamAZAG Backend", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

if FRONTEND_DIR.is_dir():
    app.mount("/front", StaticFiles(directory=FRONTEND_DIR, html=True), name="front")


class ChatMessageCreate(BaseModel):
    user_id: uuid.UUID | None = None
    content: str = Field(min_length=1)
    session_id: uuid.UUID | None = None


class AssistantRequest(BaseModel):
    question: str = Field(min_length=1)


class DocumentCreate(BaseModel):
    uploaded_by: uuid.UUID
    file_name: str = Field(min_length=1, max_length=255)
    file_type: str = Field(default="txt", max_length=50)
    source_type: str = Field(default="upload", max_length=50)
    storage_path: str | None = None
    status: str = "uploaded"


class TodoCreate(BaseModel):
    created_by: uuid.UUID
    assignee_id: uuid.UUID | None = None
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    status: str = "pending"
    priority: str = "medium"
    source_type: str = "manual"
    approval_status: str = "approved"
    confidence_score: int | None = Field(default=None, ge=0, le=100)
    due_date: str | None = None
    source_document_id: uuid.UUID | None = None
    source_chunk_id: uuid.UUID | None = None
    source_extraction_id: uuid.UUID | None = None
    linked_issue_id: uuid.UUID | None = None


class TodoUpdate(BaseModel):
    assignee_id: uuid.UUID | None = None
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: str | None = None


class TodoApprovalUpdate(BaseModel):
    reviewer_id: uuid.UUID
    approval_status: str


class IssueCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    reporter_id: uuid.UUID | None = None
    assignee_id: uuid.UUID | None = None
    source_document_id: uuid.UUID | None = None
    source_chunk_id: uuid.UUID | None = None
    source_extraction_id: uuid.UUID | None = None
    severity: str = "medium"
    status: str = "open"
    source_type: str = "manual"
    confidence_score: int | None = Field(default=None, ge=0, le=100)
    is_candidate: bool = False


class IssueUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    assignee_id: uuid.UUID | None = None
    severity: str | None = None
    status: str | None = None
    is_candidate: bool | None = None


def rows(result: Any) -> list[dict[str, Any]]:
    return [jsonable_encoder(dict(row)) for row in result.mappings().all()]


def one_or_404(db: Session, query: str, params: dict[str, Any], message: str) -> dict[str, Any]:
    row = db.execute(text(query), params).mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail=message)
    return jsonable_encoder(dict(row))


def ensure_project(db: Session, project_id: uuid.UUID) -> None:
    exists = db.execute(text("SELECT 1 FROM projects WHERE id = :project_id"), {"project_id": project_id}).first()
    if exists is None:
        raise HTTPException(status_code=404, detail="Project not found")


@app.get("/")
def root() -> RedirectResponse:
    return RedirectResponse(url="/front/index.html" if FRONTEND_DIR.is_dir() else "/health")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/dashboard")
def frontend_dashboard() -> dict[str, Any]:
    return {
        "summary": {
            "weekly": "Project dashboard, AI analysis, Todo approval, issue log, reports, handoff, and assistant are aligned for the local prototype.",
            "monthly": "Keep project_id as the boundary for every screen and API query.",
            "confidence": 82,
            "sources": ["frontend_final_v3", "schema.postgresql.sql", "dashboard-queries.postgresql.sql"],
        },
        "project_board": [
            {"name": "Planning", "status": "done"},
            {"name": "Frontend", "status": "final draft"},
            {"name": "Backend", "status": "API contract ready"},
            {"name": "AI analysis", "status": "mock pipeline"},
        ],
    }


@app.get("/api/assistant/chat")
def frontend_assistant_get(q: str = "") -> dict[str, str]:
    return {"answer": assistant_answer(q)}


@app.post("/api/assistant/chat")
def frontend_assistant(payload: AssistantRequest) -> dict[str, str]:
    return {"answer": assistant_answer(payload.question)}


def assistant_answer(question: str) -> str:
    lowered = question.lower()
    if "deadline" in lowered or "due" in lowered:
        return "The highest priority deadline risk is any approved Todo whose due date has passed and status is not completed."
    if "issue" in lowered or "risk" in lowered:
        return "Open and blocked issues should be reviewed first, ordered by severity and detection date."
    return "The backend now exposes project-scoped dashboard, Todo, issue, document, chat, report, and handoff endpoints."


@app.get("/projects")
def list_projects(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    return rows(
        db.execute(
            text(
                """
                SELECT p.*, t.name AS team_name, u.name AS created_by_name
                FROM projects p
                JOIN teams t ON t.id = p.team_id
                JOIN users u ON u.id = p.created_by
                ORDER BY p.created_at DESC
                """
            )
        )
    )


@app.get("/users/{user_id}/projects")
def projects_visible_to_user(user_id: uuid.UUID, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    return rows(
        db.execute(
            text(
                """
                SELECT p.*, pm.role AS member_role, t.name AS team_name
                FROM project_members pm
                JOIN projects p ON p.id = pm.project_id
                JOIN teams t ON t.id = p.team_id
                WHERE pm.user_id = :user_id
                ORDER BY p.created_at DESC
                """
            ),
            {"user_id": user_id},
        )
    )


@app.get("/projects/{project_id}/dashboard")
def project_dashboard(project_id: uuid.UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    ensure_project(db, project_id)
    summary = one_or_404(
        db,
        """
        SELECT
          p.id AS project_id,
          p.name AS project_name,
          p.status AS project_status,
          COUNT(t.id) FILTER (WHERE t.approval_status = 'approved') AS total_todos,
          COUNT(t.id) FILTER (WHERE t.approval_status = 'approved' AND t.status = 'completed') AS completed_todos,
          COUNT(t.id) FILTER (
            WHERE t.approval_status = 'approved'
              AND t.status <> 'completed'
              AND t.due_date IS NOT NULL
              AND t.due_date < now()
          ) AS delayed_todos,
          COUNT(t.id) FILTER (WHERE t.source_type = 'ai' AND t.approval_status = 'pending') AS pending_ai_todos,
          (
            SELECT COUNT(*)
            FROM issues i
            WHERE i.project_id = p.id
              AND i.is_candidate = false
              AND i.status IN ('open', 'in_progress', 'blocked')
          ) AS unresolved_issues,
          (
            SELECT COUNT(*)
            FROM documents d
            WHERE d.project_id = p.id
          ) AS document_count,
          (
            SELECT hr.handoff_score
            FROM handoff_reports hr
            WHERE hr.project_id = p.id
            ORDER BY hr.created_at DESC
            LIMIT 1
          ) AS latest_handoff_score
        FROM projects p
        LEFT JOIN todos t ON t.project_id = p.id
        WHERE p.id = :project_id
        GROUP BY p.id
        """,
        {"project_id": project_id},
        "Project not found",
    )
    return summary


@app.get("/projects/{project_id}/todos")
def list_todos(project_id: uuid.UUID, approval_status: str | None = None, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    ensure_project(db, project_id)
    approval_filter = "AND t.approval_status = :approval_status" if approval_status else ""
    return rows(
        db.execute(
            text(
                f"""
                SELECT t.*, assignee.name AS assignee_name, creator.name AS created_by_name
                FROM todos t
                LEFT JOIN users assignee ON assignee.id = t.assignee_id
                JOIN users creator ON creator.id = t.created_by
                WHERE t.project_id = :project_id
                {approval_filter}
                ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
                """
            ),
            {"project_id": project_id, "approval_status": approval_status},
        )
    )


@app.get("/projects/{project_id}/todos/ai-pending")
def list_pending_ai_todos(project_id: uuid.UUID, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    ensure_project(db, project_id)
    return rows(
        db.execute(
            text(
                """
                SELECT t.*, d.file_name AS source_file_name, dc.page_number AS source_page_number
                FROM todos t
                LEFT JOIN documents d ON d.id = t.source_document_id
                LEFT JOIN document_chunks dc ON dc.id = t.source_chunk_id
                WHERE t.project_id = :project_id
                  AND t.source_type = 'ai'
                  AND t.approval_status = 'pending'
                ORDER BY t.confidence_score DESC NULLS LAST, t.created_at DESC
                """
            ),
            {"project_id": project_id},
        )
    )


@app.post("/projects/{project_id}/todos", status_code=201)
def create_todo(project_id: uuid.UUID, payload: TodoCreate, db: Session = Depends(get_db)) -> dict[str, Any]:
    ensure_project(db, project_id)
    todo = one_or_404(
        db,
        """
        INSERT INTO todos (
          project_id, assignee_id, created_by, source_document_id, source_chunk_id,
          source_extraction_id, linked_issue_id, title, description, status, priority,
          source_type, approval_status, confidence_score, due_date
        )
        VALUES (
          :project_id, :assignee_id, :created_by, :source_document_id, :source_chunk_id,
          :source_extraction_id, :linked_issue_id, :title, :description, :status, :priority,
          :source_type, :approval_status, :confidence_score, CAST(:due_date AS timestamp)
        )
        RETURNING *
        """,
        {"project_id": project_id, **payload.model_dump()},
        "Could not create Todo",
    )
    db.commit()
    return todo


@app.patch("/todos/{todo_id}")
def update_todo(todo_id: uuid.UUID, payload: TodoUpdate, db: Session = Depends(get_db)) -> dict[str, Any]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return one_or_404(db, "SELECT * FROM todos WHERE id = :todo_id", {"todo_id": todo_id}, "Todo not found")
    set_sql = ", ".join(f"{key} = :{key}" for key in updates)
    todo = one_or_404(
        db,
        f"UPDATE todos SET {set_sql}, updated_at = now() WHERE id = :todo_id RETURNING *",
        {"todo_id": todo_id, **updates},
        "Todo not found",
    )
    db.commit()
    return todo


@app.patch("/todos/{todo_id}/approval")
def update_todo_approval(todo_id: uuid.UUID, payload: TodoApprovalUpdate, db: Session = Depends(get_db)) -> dict[str, Any]:
    if payload.approval_status not in {"approved", "rejected"}:
        raise HTTPException(status_code=422, detail="approval_status must be approved or rejected")
    todo = one_or_404(
        db,
        """
        UPDATE todos
        SET approval_status = :approval_status,
            reviewed_by = :reviewer_id,
            reviewed_at = now(),
            updated_at = now()
        WHERE id = :todo_id
          AND source_type = 'ai'
        RETURNING *
        """,
        {"todo_id": todo_id, **payload.model_dump()},
        "AI Todo not found",
    )
    db.commit()
    return todo


@app.get("/projects/{project_id}/issues")
def list_issues(project_id: uuid.UUID, is_candidate: bool | None = None, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    ensure_project(db, project_id)
    candidate_filter = "AND i.is_candidate = :is_candidate" if is_candidate is not None else ""
    return rows(
        db.execute(
            text(
                f"""
                SELECT i.*, reporter.name AS reporter_name, assignee.name AS assignee_name, d.file_name AS source_file_name
                FROM issues i
                LEFT JOIN users reporter ON reporter.id = i.reporter_id
                LEFT JOIN users assignee ON assignee.id = i.assignee_id
                LEFT JOIN documents d ON d.id = i.source_document_id
                WHERE i.project_id = :project_id
                {candidate_filter}
                ORDER BY
                  CASE i.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
                  i.created_at DESC
                """
            ),
            {"project_id": project_id, "is_candidate": is_candidate},
        )
    )


@app.post("/projects/{project_id}/issues", status_code=201)
def create_issue(project_id: uuid.UUID, payload: IssueCreate, db: Session = Depends(get_db)) -> dict[str, Any]:
    ensure_project(db, project_id)
    issue = one_or_404(
        db,
        """
        INSERT INTO issues (
          project_id, reporter_id, assignee_id, source_document_id, source_chunk_id,
          source_extraction_id, title, description, severity, status, source_type,
          confidence_score, is_candidate, detected_at
        )
        VALUES (
          :project_id, :reporter_id, :assignee_id, :source_document_id, :source_chunk_id,
          :source_extraction_id, :title, :description, :severity, :status, :source_type,
          :confidence_score, :is_candidate, now()
        )
        RETURNING *
        """,
        {"project_id": project_id, **payload.model_dump()},
        "Could not create issue",
    )
    db.commit()
    return issue


@app.patch("/issues/{issue_id}")
def update_issue(issue_id: uuid.UUID, payload: IssueUpdate, db: Session = Depends(get_db)) -> dict[str, Any]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return one_or_404(db, "SELECT * FROM issues WHERE id = :issue_id", {"issue_id": issue_id}, "Issue not found")
    set_sql = ", ".join(f"{key} = :{key}" for key in updates)
    issue = one_or_404(
        db,
        f"UPDATE issues SET {set_sql}, updated_at = now() WHERE id = :issue_id RETURNING *",
        {"issue_id": issue_id, **updates},
        "Issue not found",
    )
    db.commit()
    return issue


@app.get("/projects/{project_id}/documents")
def list_documents(project_id: uuid.UUID, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    ensure_project(db, project_id)
    return rows(
        db.execute(
            text(
                """
                SELECT d.*, uploader.name AS uploaded_by_name, COUNT(dc.id) AS chunk_count
                FROM documents d
                JOIN users uploader ON uploader.id = d.uploaded_by
                LEFT JOIN document_chunks dc ON dc.document_id = d.id
                WHERE d.project_id = :project_id
                GROUP BY d.id, uploader.name
                ORDER BY d.uploaded_at DESC, d.created_at DESC
                """
            ),
            {"project_id": project_id},
        )
    )


@app.post("/projects/{project_id}/documents", status_code=201)
def create_document(project_id: uuid.UUID, payload: DocumentCreate, db: Session = Depends(get_db)) -> dict[str, Any]:
    ensure_project(db, project_id)
    storage_path = payload.storage_path or f"local://projects/{project_id}/{payload.file_name}"
    document = one_or_404(
        db,
        """
        INSERT INTO documents (
          project_id, uploaded_by, file_name, file_type, source_type, storage_path, status
        )
        VALUES (
          :project_id, :uploaded_by, :file_name, :file_type, :source_type, :storage_path, :status
        )
        RETURNING *
        """,
        {"project_id": project_id, **payload.model_dump(exclude={"storage_path"}), "storage_path": storage_path},
        "Could not create document",
    )
    db.commit()
    return document


@app.post("/projects/{project_id}/chat", status_code=201)
@app.post("/projects/{project_id}/chat/messages", status_code=201)
def create_chat_message(project_id: uuid.UUID, payload: ChatMessageCreate, db: Session = Depends(get_db)) -> dict[str, Any]:
    ensure_project(db, project_id)
    session_id = payload.session_id or db.execute(
        text(
            """
            INSERT INTO chat_sessions (project_id, user_id, title)
            VALUES (:project_id, :user_id, 'Default conversation')
            RETURNING id
            """
        ),
        {"project_id": project_id, "user_id": payload.user_id},
    ).scalar_one()
    message = one_or_404(
        db,
        """
        INSERT INTO chat_messages (chat_session_id, user_id, role, content)
        VALUES (:chat_session_id, :user_id, 'user', :content)
        RETURNING *
        """,
        {"chat_session_id": session_id, "user_id": payload.user_id, "content": payload.content},
        "Could not create chat message",
    )
    db.commit()
    return message


@app.get("/projects/{project_id}/chat/messages")
def list_chat_messages(project_id: uuid.UUID, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    ensure_project(db, project_id)
    return rows(
        db.execute(
            text(
                """
                SELECT
                  cm.*,
                  cs.project_id,
                  COALESCE(
                    jsonb_agg(
                      jsonb_build_object(
                        'document_id', cms.document_id,
                        'chunk_id', cms.chunk_id,
                        'source_label', cms.source_label,
                        'page_number', cms.page_number
                      )
                    ) FILTER (WHERE cms.id IS NOT NULL),
                    '[]'::jsonb
                  ) AS sources_json
                FROM chat_messages cm
                JOIN chat_sessions cs ON cs.id = cm.chat_session_id
                LEFT JOIN chat_message_sources cms ON cms.chat_message_id = cm.id
                WHERE cs.project_id = :project_id
                GROUP BY cm.id, cs.project_id
                ORDER BY cm.created_at ASC
                """
            ),
            {"project_id": project_id},
        )
    )


@app.get("/projects/{project_id}/handoff/latest")
def latest_handoff(project_id: uuid.UUID, db: Session = Depends(get_db)) -> dict[str, Any] | None:
    ensure_project(db, project_id)
    report = db.execute(
        text(
            """
            SELECT hr.*
            FROM handoff_reports hr
            WHERE hr.project_id = :project_id
            ORDER BY hr.created_at DESC
            LIMIT 1
            """
        ),
        {"project_id": project_id},
    ).mappings().first()
    if report is None:
        return None

    items = rows(
        db.execute(
            text(
                """
                SELECT *
                FROM handoff_items
                WHERE handoff_report_id = :handoff_report_id
                ORDER BY
                  CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
                  created_at DESC
                """
            ),
            {"handoff_report_id": report["id"]},
        )
    )
    payload = jsonable_encoder(dict(report))
    payload["items"] = items
    return payload

