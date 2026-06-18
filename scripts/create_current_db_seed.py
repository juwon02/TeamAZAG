from __future__ import annotations

import csv
import hashlib
import json
import shutil
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DUMMY = ROOT / "dummy_data"
OUT = DUMMY / "06_current_db_seed"
CSV_OUT = OUT / "csv"
SQL_OUT = OUT / "sql"
NOW = "2026-06-01T09:00:00+09:00"
START_DATE = date(2025, 6, 1)
END_DATE = date(2026, 12, 31)
MESSY_ISSUE_IDS = {f"ISSUE-2026-{idx:03d}" for idx in range(10, 16)}


TABLE_HEADERS = {
    "teams": ["id", "name", "created_at", "updated_at"],
    "users": ["id", "team_id", "name", "email", "role", "created_at", "updated_at"],
    "projects": ["id", "team_id", "name", "description", "status", "created_at", "updated_at"],
    "project_members": ["id", "team_id", "project_id", "user_id", "role", "status", "joined_at"],
    "documents": ["id", "project_id", "uploaded_by_member_id", "file_name", "file_type", "mime_type", "storage_uri", "content_hash", "analysis_status", "progress", "error_message", "created_at", "updated_at"],
    "issues": ["id", "project_id", "assignee_member_id", "reporter_member_id", "source_document_id", "title", "description", "severity", "status", "source_type", "approval_status", "confidence_score", "is_candidate", "risk_reason", "domino_chain", "due_at", "created_at", "updated_at"],
    "todos": ["id", "project_id", "assignee_member_id", "created_by_member_id", "reviewed_by_member_id", "source_document_id", "linked_issue_id", "title", "description", "status", "priority", "source_type", "approval_status", "confidence_score", "due_at", "created_at", "updated_at"],
    "calendar_events": ["id", "project_id", "member_id", "event_type", "title", "source_type", "approval_status", "starts_at", "ends_at", "created_at"],
    "weekly_reports": ["id", "project_id", "created_by_member_id", "week_start", "week_end", "content", "progress_rate", "created_at"],
    "monthly_reports": ["id", "project_id", "created_by_member_id", "month_start", "month_end", "content", "progress_rate", "created_at"],
    "handoff_reports": ["id", "project_id", "from_member_id", "to_member_id", "handoff_type", "content", "created_at"],
    "chat_messages": ["id", "project_id", "member_id", "role", "content", "sources_json", "model_name", "created_at"],
    "ai_summaries": ["id", "document_id", "project_id", "todo_count", "issue_count", "blocked_count", "summary", "extracted_json", "model_name", "created_at"],
}


ENUMS = {
    ("projects", "status"): {"active", "archived", "completed"},
    ("project_members", "role"): {"admin", "member", "viewer"},
    ("project_members", "status"): {"active", "inactive"},
    ("documents", "file_type"): {"email", "meeting", "chat", "issue_log", "other"},
    ("documents", "analysis_status"): {"uploaded", "parsing", "chunking", "embedding", "analyzing", "completed", "failed"},
    ("issues", "severity"): {"low", "medium", "high", "critical"},
    ("issues", "status"): {"open", "in_progress", "blocked", "resolved"},
    ("issues", "source_type"): {"ai", "manual"},
    ("issues", "approval_status"): {"pending", "approved", "rejected"},
    ("todos", "status"): {"pending", "in_progress", "completed", "blocked"},
    ("todos", "priority"): {"low", "medium", "high"},
    ("todos", "source_type"): {"ai", "manual"},
    ("todos", "approval_status"): {"pending", "approved", "rejected"},
    ("calendar_events", "event_type"): {"absence", "deadline", "milestone", "meeting"},
    ("calendar_events", "source_type"): {"ai", "manual", "chat"},
    ("calendar_events", "approval_status"): {"pending", "approved", "rejected"},
    ("chat_messages", "role"): {"user", "assistant"},
}


REQUIRED_COLUMNS = {
    "teams": {"id", "name", "created_at", "updated_at"},
    "users": {"id", "name", "email", "role", "created_at", "updated_at"},
    "projects": {"id", "team_id", "name", "status", "created_at", "updated_at"},
    "project_members": {"id", "team_id", "project_id", "user_id", "role", "status", "joined_at"},
    "documents": {"id", "project_id", "file_name", "file_type", "analysis_status", "progress", "created_at", "updated_at"},
    "issues": {"id", "project_id", "title", "severity", "status", "source_type", "approval_status", "is_candidate", "created_at", "updated_at"},
    "todos": {"id", "project_id", "title", "status", "priority", "source_type", "approval_status", "created_at", "updated_at"},
    "calendar_events": {"id", "project_id", "event_type", "title", "source_type", "approval_status", "starts_at", "created_at"},
    "weekly_reports": {"id", "project_id", "week_start", "week_end", "created_at"},
    "monthly_reports": {"id", "project_id", "month_start", "month_end", "created_at"},
    "handoff_reports": {"id", "project_id", "handoff_type", "created_at"},
    "chat_messages": {"id", "project_id", "role", "content", "created_at"},
    "ai_summaries": {"id", "project_id", "todo_count", "issue_count", "blocked_count", "created_at"},
}


MAX_LENGTHS = {
    ("teams", "name"): 100,
    ("users", "name"): 100,
    ("users", "email"): 255,
    ("users", "role"): 50,
    ("projects", "name"): 150,
    ("documents", "file_name"): 255,
    ("documents", "file_type"): 50,
    ("documents", "mime_type"): 100,
    ("documents", "storage_uri"): 500,
    ("documents", "content_hash"): 128,
    ("issues", "title"): 500,
    ("issues", "severity"): 20,
    ("issues", "status"): 50,
    ("todos", "title"): 500,
    ("calendar_events", "title"): 255,
    ("handoff_reports", "handoff_type"): 50,
    ("chat_messages", "model_name"): 100,
    ("ai_summaries", "model_name"): 100,
}


def seed_uuid(key: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"https://teamazag.local/dummy/{key}"))


TEAM_ID = seed_uuid("team/ops")
PROJECT_ID = seed_uuid("project/ops-2026")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, headers: list[str], rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        writer.writerows({header: row.get(header, "") for header in headers} for row in rows)


def parse_date(value: str | date | None) -> date:
    if isinstance(value, date):
        return value
    if not value:
        return START_DATE
    return datetime.fromisoformat(str(value)[:10]).date()


def dstr(value: str | date | None) -> str:
    parsed = parse_date(value)
    return max(START_DATE, min(END_DATE, parsed)).isoformat()


def dtstr(value: str | date | None) -> str:
    return f"{dstr(value)}T09:00:00+09:00"


def add_days(value: str | date, days: int) -> str:
    return dstr(parse_date(value) + timedelta(days=days))


def issue_status(value: str) -> str:
    normalized = (value or "open").strip().lower()
    if normalized in {"closed", "done", "completed", "resolved"}:
        return "resolved"
    if normalized in {"monitoring", "in_progress", "partially_resolved"}:
        return "in_progress"
    if normalized == "blocked":
        return "blocked"
    return "open"


def priority(value: str) -> str:
    normalized = (value or "medium").strip().lower()
    return normalized if normalized in {"low", "medium", "high"} else "medium"


def sql_value(value: object) -> str:
    if value is None or value == "":
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def insert_sql(table: str, headers: list[str], rows: list[dict[str, object]]) -> str:
    values = ["(" + ", ".join(sql_value(row.get(header, "")) for header in headers) + ")" for row in rows]
    return f"INSERT INTO {table} ({', '.join(headers)}) VALUES\n  " + ",\n  ".join(values) + "\nON CONFLICT (id) DO NOTHING;\n"


def document_file_type(doc_type: str) -> str:
    if "메일" in doc_type:
        return "email"
    if "회의" in doc_type:
        return "meeting"
    if "채팅" in doc_type or "대화" in doc_type:
        return "chat"
    if "클레임" in doc_type or "이슈" in doc_type:
        return "issue_log"
    return "other"


def validate_tables(tables: dict[str, list[dict[str, object]]]) -> None:
    errors: list[str] = []
    ids: dict[str, set[str]] = {}
    for table, rows in tables.items():
        expected = TABLE_HEADERS[table]
        ids[table] = {str(row["id"]) for row in rows}
        if len(ids[table]) != len(rows):
            errors.append(f"{table}: duplicate primary key")
        for row_number, row in enumerate(rows, 2):
            extra = set(row) - set(expected)
            missing = set(expected) - set(row)
            if extra or missing:
                errors.append(f"{table}:{row_number} columns extra={sorted(extra)} missing={sorted(missing)}")
            try:
                uuid.UUID(str(row["id"]))
            except (ValueError, TypeError):
                errors.append(f"{table}:{row_number} invalid UUID id={row.get('id')}")
            for column in REQUIRED_COLUMNS[table]:
                if row.get(column) in {None, ""}:
                    errors.append(f"{table}:{row_number} required column is blank: {column}")
            for (length_table, column), maximum in MAX_LENGTHS.items():
                if length_table == table and len(str(row.get(column, ""))) > maximum:
                    errors.append(f"{table}:{row_number} {column} exceeds VARCHAR({maximum})")
            for (enum_table, column), allowed in ENUMS.items():
                if enum_table == table and str(row.get(column, "")) not in allowed:
                    errors.append(f"{table}:{row_number} invalid {column}={row.get(column)}")

    foreign_keys = [
        ("users", "team_id", "teams"),
        ("projects", "team_id", "teams"),
        ("project_members", "team_id", "teams"),
        ("project_members", "project_id", "projects"),
        ("project_members", "user_id", "users"),
        ("documents", "project_id", "projects"),
        ("documents", "uploaded_by_member_id", "project_members"),
        ("issues", "project_id", "projects"),
        ("issues", "assignee_member_id", "project_members"),
        ("issues", "reporter_member_id", "project_members"),
        ("issues", "source_document_id", "documents"),
        ("todos", "project_id", "projects"),
        ("todos", "assignee_member_id", "project_members"),
        ("todos", "created_by_member_id", "project_members"),
        ("todos", "reviewed_by_member_id", "project_members"),
        ("todos", "source_document_id", "documents"),
        ("todos", "linked_issue_id", "issues"),
        ("calendar_events", "project_id", "projects"),
        ("calendar_events", "member_id", "project_members"),
        ("weekly_reports", "project_id", "projects"),
        ("weekly_reports", "created_by_member_id", "project_members"),
        ("monthly_reports", "project_id", "projects"),
        ("monthly_reports", "created_by_member_id", "project_members"),
        ("handoff_reports", "project_id", "projects"),
        ("handoff_reports", "from_member_id", "project_members"),
        ("handoff_reports", "to_member_id", "project_members"),
        ("chat_messages", "project_id", "projects"),
        ("chat_messages", "member_id", "project_members"),
        ("ai_summaries", "document_id", "documents"),
        ("ai_summaries", "project_id", "projects"),
    ]
    for table, column, parent in foreign_keys:
        for row_number, row in enumerate(tables[table], 2):
            value = str(row.get(column, ""))
            if value and value not in ids[parent]:
                errors.append(f"{table}:{row_number} orphan {column}={value}")

    unique_checks = [
        ("users", ("email",)),
        ("project_members", ("project_id", "user_id")),
        ("weekly_reports", ("project_id", "week_start")),
        ("monthly_reports", ("project_id", "month_start")),
    ]
    for table, columns in unique_checks:
        keys = [tuple(str(row[column]) for column in columns) for row in tables[table]]
        if len(keys) != len(set(keys)):
            errors.append(f"{table}: duplicate unique key {columns}")

    for row_number, row in enumerate(tables["weekly_reports"], 2):
        if str(row["week_start"]) > str(row["week_end"]):
            errors.append(f"weekly_reports:{row_number} week_start after week_end")
    for row_number, row in enumerate(tables["monthly_reports"], 2):
        if str(row["month_start"]) > str(row["month_end"]):
            errors.append(f"monthly_reports:{row_number} month_start after month_end")

    if errors:
        raise ValueError("Current DB seed validation failed:\n- " + "\n- ".join(errors[:50]))


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    CSV_OUT.mkdir(parents=True, exist_ok=True)
    SQL_OUT.mkdir(parents=True, exist_ok=True)

    employees = read_csv(DUMMY / "01_master_data" / "employees.csv")
    issue_events = read_csv(DUMMY / "03_structured_csv" / "issue_events.csv")
    source_docs = read_csv(DUMMY / "03_structured_csv" / "source_document_index.csv")

    teams = [{"id": TEAM_ID, "name": "[DUMMY] AutoParts One 운영팀", "created_at": NOW, "updated_at": NOW}]
    users: list[dict[str, object]] = []
    project_members: list[dict[str, object]] = []
    member_by_name: dict[str, str] = {}
    for index, employee in enumerate(employees[:8], 1):
        user_id = seed_uuid(f"user/{employee['employee_id']}")
        member_id = seed_uuid(f"project-member/{employee['employee_id']}")
        role = "admin" if employee["permission_level"] == "admin" else "member"
        users.append({"id": user_id, "team_id": TEAM_ID, "name": employee["name"], "email": employee["email"], "role": role, "created_at": NOW, "updated_at": NOW})
        project_members.append({"id": member_id, "team_id": TEAM_ID, "project_id": PROJECT_ID, "user_id": user_id, "role": role, "status": "active", "joined_at": NOW})
        member_by_name[employee["name"]] = member_id

    projects = [{"id": PROJECT_ID, "team_id": TEAM_ID, "name": "[DUMMY] OpsRadar2 운영 인수인계 데모", "description": "문서 분석, Todo, 이슈, 리포트, 인수인계 흐름 검증용 seed", "status": "active", "created_at": NOW, "updated_at": NOW}]

    selected_issues = issue_events[:9] + [row for row in issue_events if row["issue_id"] in MESSY_ISSUE_IDS]
    selected_issue_ids = {row["issue_id"] for row in selected_issues}
    docs_by_issue: dict[str, list[dict[str, str]]] = defaultdict(list)
    for doc in source_docs:
        if doc.get("related_issue_id") in selected_issue_ids and len(docs_by_issue[doc["related_issue_id"]]) < 6:
            docs_by_issue[doc["related_issue_id"]].append(doc)
    selected_docs = [doc for issue in selected_issues for doc in docs_by_issue[issue["issue_id"]]][:96]

    documents: list[dict[str, object]] = []
    document_id_by_source: dict[str, str] = {}
    for doc in selected_docs:
        document_id = seed_uuid(f"document/{doc['doc_id']}")
        document_id_by_source[doc["doc_id"]] = document_id
        source_path = DUMMY / doc["file_path"]
        content_hash = hashlib.sha256(source_path.read_bytes()).hexdigest()
        documents.append({
            "id": document_id,
            "project_id": PROJECT_ID,
            "uploaded_by_member_id": member_by_name.get(doc.get("author", ""), project_members[0]["id"]),
            "file_name": source_path.name,
            "file_type": document_file_type(doc.get("doc_type", "")),
            "mime_type": "text/markdown",
            "storage_uri": f"dummy_data/{doc['file_path']}",
            "content_hash": content_hash,
            "analysis_status": "completed",
            "progress": 100,
            "error_message": "",
            "created_at": dtstr(doc.get("created_date")),
            "updated_at": dtstr(doc.get("created_date")),
        })

    first_document_by_issue = {issue_id: document_id_by_source[docs[0]["doc_id"]] for issue_id, docs in docs_by_issue.items() if docs}
    issues: list[dict[str, object]] = []
    todos: list[dict[str, object]] = []
    calendar_events: list[dict[str, object]] = []
    issue_id_map: dict[str, str] = {}
    for index, issue in enumerate(selected_issues, 1):
        issue_id = seed_uuid(f"issue/{issue['issue_id']}")
        issue_id_map[issue["issue_id"]] = issue_id
        source_document_id = first_document_by_issue.get(issue["issue_id"], "")
        assignee = project_members[index % len(project_members)]["id"]
        due_at = dtstr(issue.get("end_date") or add_days(issue["start_date"], 14))
        normalized_status = issue_status(issue["status"])
        issues.append({
            "id": issue_id, "project_id": PROJECT_ID, "assignee_member_id": assignee,
            "reporter_member_id": project_members[0]["id"], "source_document_id": source_document_id,
            "title": f"[DUMMY] {issue['issue_title']}", "description": issue["description"],
            "severity": priority(issue["severity"]), "status": normalized_status,
            "source_type": "manual", "approval_status": "approved", "confidence_score": 85,
            "is_candidate": False, "risk_reason": issue["description"], "domino_chain": "납기 -> 고객 생산 일정 -> 긴급 운송 비용",
            "due_at": due_at, "created_at": dtstr(issue["start_date"]), "updated_at": NOW,
        })
        for step in range(1, 4):
            todo_id = seed_uuid(f"todo/{issue['issue_id']}/{step}")
            todo_status = "completed" if normalized_status == "resolved" else "pending"
            todo_due = dtstr(add_days(issue["start_date"], step * 2))
            owner = project_members[(index + step) % len(project_members)]["id"]
            todos.append({
                "id": todo_id, "project_id": PROJECT_ID, "assignee_member_id": owner,
                "created_by_member_id": project_members[0]["id"], "reviewed_by_member_id": "",
                "source_document_id": source_document_id, "linked_issue_id": issue_id,
                "title": f"[DUMMY] {issue['issue_title']} 확인 {step}",
                "description": f"{issue['issue_type']} 대응에 필요한 일정·수량·담당자 확인",
                "status": todo_status, "priority": priority(issue["severity"]), "source_type": "manual",
                "approval_status": "approved", "confidence_score": 85, "due_at": todo_due,
                "created_at": dtstr(issue["start_date"]), "updated_at": NOW,
            })
            calendar_events.append({
                "id": seed_uuid(f"calendar/{issue['issue_id']}/{step}"), "project_id": PROJECT_ID,
                "member_id": owner, "event_type": "deadline", "title": f"[DUMMY] {issue['issue_title']} 확인 기한",
                "source_type": "manual", "approval_status": "approved", "starts_at": todo_due,
                "ends_at": todo_due, "created_at": NOW,
            })

    weekly_reports = []
    for index, week_start in enumerate(["2026-07-04", "2026-08-01", "2026-09-05"], 1):
        weekly_reports.append({"id": seed_uuid(f"weekly/{week_start}"), "project_id": PROJECT_ID, "created_by_member_id": project_members[0]["id"], "week_start": week_start, "week_end": add_days(week_start, 6), "content": f"[DUMMY] 주간 운영 이슈와 Todo 진행 현황 {index}", "progress_rate": 60 + index * 10, "created_at": NOW})

    monthly_reports = []
    for month_start, month_end, content in [("2026-09-01", "2026-09-30", "단가 인상 공지와 구두 합의 충돌 점검"), ("2026-12-01", "2026-12-31", "임시 인수인계 누락과 회신 지연 점검")]:
        monthly_reports.append({"id": seed_uuid(f"monthly/{month_start}"), "project_id": PROJECT_ID, "created_by_member_id": project_members[0]["id"], "month_start": month_start, "month_end": month_end, "content": f"[DUMMY] {content}", "progress_rate": 70, "created_at": NOW})

    handoff_reports = [
        {"id": seed_uuid("handoff/due-date"), "project_id": PROJECT_ID, "from_member_id": project_members[0]["id"], "to_member_id": project_members[1]["id"], "handoff_type": "general", "content": "[DUMMY] 변경된 납기와 부분 출고 수량, 고객 미회신 항목 인수인계", "created_at": NOW},
        {"id": seed_uuid("handoff/coverage"), "project_id": PROJECT_ID, "from_member_id": project_members[1]["id"], "to_member_id": project_members[2]["id"], "handoff_type": "temporary_coverage", "content": "[DUMMY] 휴가 기간 임시 담당자와 미완료 고객 회신 인수인계", "created_at": NOW},
    ]

    chat_messages = []
    for index, issue in enumerate(selected_issues[:9], 1):
        linked_issue = issue_id_map[issue["issue_id"]]
        chat_messages.append({"id": seed_uuid(f"chat/{issue['issue_id']}"), "project_id": PROJECT_ID, "member_id": project_members[index % len(project_members)]["id"], "role": "user", "content": f"[DUMMY] {issue['issue_title']} 진행 상황을 확인해 주세요.", "sources_json": json.dumps([{"type": "issue", "id": linked_issue}], ensure_ascii=False), "model_name": "", "created_at": NOW})

    ai_summaries = []
    for index, issue in enumerate(selected_issues, 1):
        source_document_id = first_document_by_issue.get(issue["issue_id"], "")
        ai_summaries.append({"id": seed_uuid(f"ai-summary/{issue['issue_id']}"), "document_id": source_document_id, "project_id": PROJECT_ID, "todo_count": 3, "issue_count": 1, "blocked_count": 1 if issue_status(issue["status"]) == "blocked" else 0, "summary": f"[DUMMY] {issue['issue_title']} 관련 일정·수량·담당자 요약", "extracted_json": json.dumps({"source_issue_id": issue["issue_id"], "severity": priority(issue["severity"])}, ensure_ascii=False), "model_name": "dummy-seed", "created_at": NOW})

    tables = {
        "teams": teams, "users": users, "projects": projects, "project_members": project_members,
        "documents": documents, "issues": issues, "todos": todos, "calendar_events": calendar_events,
        "weekly_reports": weekly_reports, "monthly_reports": monthly_reports,
        "handoff_reports": handoff_reports, "chat_messages": chat_messages, "ai_summaries": ai_summaries,
    }
    validate_tables(tables)

    for table, rows in tables.items():
        write_csv(CSV_OUT / f"{table}.csv", TABLE_HEADERS[table], rows)

    insert_parts = ["-- OpsRadar2 schema.sql compatible dummy seed", "SET search_path TO opsradar2, public;", "BEGIN;"]
    insert_parts.extend(insert_sql(table, TABLE_HEADERS[table], rows) for table, rows in tables.items())
    insert_parts.append("COMMIT;\n")
    (SQL_OUT / "insert_current_seed.sql").write_text("\n\n".join(insert_parts), encoding="utf-8")

    clear_parts = ["-- Clear only rows generated by this seed.", "SET search_path TO opsradar2, public;", "BEGIN;"]
    for table in reversed(list(tables)):
        quoted = ", ".join(sql_value(row["id"]) for row in tables[table])
        clear_parts.append(f"DELETE FROM {table} WHERE id IN ({quoted});")
    clear_parts.append("COMMIT;\n")
    (SQL_OUT / "clear_current_seed.sql").write_text("\n".join(clear_parts), encoding="utf-8")

    row_lines = "\n".join(f"- `{table}.csv`: {len(rows)} rows" for table, rows in tables.items())
    (OUT / "README.md").write_text(f"""# OpsRadar2 Current DB Seed

This seed matches `opsradar2/schema.sql` from `SeongWoo-new2` (plus optional auth migration columns left to database defaults).

## Row counts
{row_lines}

## Generate and validate
```bash
python scripts/create_current_db_seed.py
python scripts/validate_current_db_seed.py
```

## Load
```bash
psql -h 127.0.0.1 -p 5432 -U postgres -d azag_db -f dummy_data/06_current_db_seed/sql/insert_current_seed.sql
```

All identifiers are deterministic UUIDs. The SQL sets `search_path` to `opsradar2, public`. Expected-output samples and `05_db_seed_v2` are not loaded.
""", encoding="utf-8")

    (OUT / "current-seed-compatibility-check.md").write_text(f"""# Current Seed Compatibility Check

## Schema basis
- Contract: `origin/SeongWoo-new2:opsradar2/schema.sql`
- Tables generated: {len(tables)}
- CSV rows generated: {sum(len(rows) for rows in tables.values())}
- Deterministic UUID PK/FK values: yes
- Header, enum and FK validation: passed
- Actual DB insert executed: no

## Exclusions
- `dummy_data/05_db_seed_v2` uses an expanded candidate schema and is not directly loadable into the current database.
- `dummy_data/04_expected_outputs_for_test` is not used as seed input.
- Authentication migration columns use database defaults; no authentication credential is generated.
""", encoding="utf-8")

    print(f"generated current seed: {OUT}")
    print(f"tables: {len(tables)}")
    print(f"rows: {sum(len(rows) for rows in tables.values())}")
    print("schema validation: OK")
    print("actual DB insert: False")


if __name__ == "__main__":
    main()
