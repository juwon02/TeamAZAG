from __future__ import annotations

import csv
import shutil
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DUMMY = ROOT / "dummy_data"
OUT = DUMMY / "06_current_db_seed"
CSV_OUT = OUT / "csv"
SQL_OUT = OUT / "sql"

TEAM_ID = "DUMMY-TEAM-OPS"
PROJECT_ID = "DUMMY-PROJ-OPS-2026"
NOW = "2026-06-01T09:00:00"
START_DATE = date(2025, 6, 1)
END_DATE = date(2026, 12, 31)
MESSY_ISSUE_IDS = {f"ISSUE-2026-{idx:03d}" for idx in range(10, 15)}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, headers: list[str], rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({h: row.get(h, "") for h in headers})


def parse_date(value: str | date | None) -> date:
    if isinstance(value, date):
        return value
    if not value:
        return START_DATE
    return datetime.fromisoformat(str(value)[:10]).date()


def clamp_date(value: str | date | None) -> date:
    parsed = parse_date(value)
    if parsed < START_DATE:
        return START_DATE
    if parsed > END_DATE:
        return END_DATE
    return parsed


def dstr(value: str | date | None) -> str:
    return clamp_date(value).isoformat()


def dtstr(value: str | date | None) -> str:
    return f"{dstr(value)}T09:00:00"


def add_days(value: str | date, days: int) -> str:
    return dstr(clamp_date(value) + timedelta(days=days))


def norm_status(value: str) -> str:
    status = (value or "open").strip().lower()
    if status in {"closed", "done", "completed"}:
        return "completed"
    if status in {"monitoring", "in_progress"}:
        return "in_progress"
    return "open"


def priority(severity: str) -> str:
    severity = (severity or "").strip().lower()
    if severity == "high":
        return "high"
    if severity == "medium":
        return "medium"
    return "low"


def sql_value(value: object) -> str:
    if value is None or value == "":
        return "NULL"
    text = str(value).replace("'", "''")
    return f"'{text}'"


def insert_sql(table: str, headers: list[str], rows: list[dict[str, object]]) -> str:
    if not rows:
        return ""
    cols = ", ".join(headers)
    values = []
    for row in rows:
        values.append("(" + ", ".join(sql_value(row.get(h, "")) for h in headers) + ")")
    return f"INSERT INTO {table} ({cols}) VALUES\n  " + ",\n  ".join(values) + "\nON CONFLICT (id) DO NOTHING;\n"


def doc_file_type(doc_type: str) -> str:
    if "메일" in doc_type:
        return "email"
    if "회의" in doc_type:
        return "meeting"
    if "채팅" in doc_type:
        return "chat"
    if "이슈" in doc_type or "클레임" in doc_type:
        return "issue_log"
    return "other"


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    CSV_OUT.mkdir(parents=True, exist_ok=True)
    SQL_OUT.mkdir(parents=True, exist_ok=True)

    employees = read_csv(DUMMY / "01_master_data" / "employees.csv")
    issue_events = read_csv(DUMMY / "03_structured_csv" / "issue_events.csv")
    source_docs = read_csv(DUMMY / "03_structured_csv" / "source_document_index.csv")

    users: list[dict[str, object]] = []
    members: list[dict[str, object]] = []
    member_by_name: dict[str, str] = {}
    for idx, employee in enumerate(employees[:8], 1):
        user_id = f"DUMMY-USER-{idx:03d}"
        member_id = f"DUMMY-PM-{idx:03d}"
        role = "admin" if employee["permission_level"] == "admin" else "member"
        users.append({
            "id": user_id,
            "team_id": TEAM_ID,
            "name": employee["name"],
            "email": employee["email"],
            "role": role,
            "created_at": NOW,
            "updated_at": NOW,
        })
        members.append({
            "id": member_id,
            "project_id": PROJECT_ID,
            "user_id": user_id,
            "role": role,
            "status": "active",
            "created_at": NOW,
            "updated_at": NOW,
        })
        member_by_name[employee["name"]] = member_id

    teams = [{
        "id": TEAM_ID,
        "name": "[DUMMY] AutoParts One 운영팀",
        "description": "[DUMMY] 로컬 데모용 운영 인수인계 seed 팀",
        "created_at": NOW,
        "updated_at": NOW,
    }]
    projects = [{
        "id": PROJECT_ID,
        "team_id": TEAM_ID,
        "name": "[DUMMY] OpsRadar2 운영 인수인계 데모",
        "description": "[DUMMY] 문서 업로드, 분석, Todo, 이슈, 리포트, 인수인계 흐름 검증용 seed",
        "status": "active",
        "created_at": NOW,
        "updated_at": NOW,
    }]

    base_issues = issue_events[:9]
    messy_issues = [row for row in issue_events if row["issue_id"] in MESSY_ISSUE_IDS]
    selected_issues = base_issues + messy_issues
    issue_ids = {row["issue_id"] for row in selected_issues}
    docs_by_issue: dict[str, list[dict[str, str]]] = defaultdict(list)
    for doc in source_docs:
        issue_id = doc.get("related_issue_id", "")
        if issue_id in issue_ids and len(docs_by_issue[issue_id]) < 4:
            docs_by_issue[issue_id].append(doc)

    selected_docs: list[dict[str, str]] = []
    for issue in selected_issues:
        selected_docs.extend(docs_by_issue[issue["issue_id"]])
    if len(selected_docs) < 30:
        used = {doc["doc_id"] for doc in selected_docs}
        for doc in source_docs:
            if doc["doc_id"] not in used and doc.get("file_path", "").startswith("02_raw_documents/"):
                selected_docs.append(doc)
                used.add(doc["doc_id"])
            if len(selected_docs) >= 32:
                break
    selected_docs = selected_docs[:64]

    documents = []
    for idx, doc in enumerate(selected_docs, 1):
        documents.append({
            "id": f"DUMMY-DOC-{idx:03d}",
            "project_id": PROJECT_ID,
            "uploaded_by_member_id": member_by_name.get(doc.get("author", ""), "DUMMY-PM-001"),
            "file_name": Path(doc["file_path"]).name,
            "file_type": doc_file_type(doc.get("doc_type", "")),
            "storage_uri": f"dummy_data/{doc['file_path']}",
            "summary": f"[DUMMY] {doc.get('summary_hint', '')}",
            "source_doc_id": doc["doc_id"],
            "created_at": dtstr(doc.get("created_date")),
            "updated_at": dtstr(doc.get("created_date")),
        })

    issues = []
    todos = []
    calendar_events = []
    ai_summaries = []
    for idx, issue in enumerate(selected_issues, 1):
        issue_seed_id = f"DUMMY-ISSUE-{idx:03d}"
        start = issue.get("start_date", "")
        due = issue.get("end_date", "") or add_days(start, 14)
        issues.append({
            "id": issue_seed_id,
            "project_id": PROJECT_ID,
            "title": f"[DUMMY] {issue['issue_title']}",
            "issue_type": issue["issue_type"],
            "severity": issue["severity"].lower(),
            "status": norm_status(issue["status"]),
            "description": f"[DUMMY] {issue['description']}",
            "detected_at": dtstr(start),
            "due_at": dtstr(due),
            "source": "dummy_current_seed",
            "created_at": dtstr(start),
            "updated_at": NOW,
        })
        ai_summaries.append({
            "id": f"DUMMY-AI-ISSUE-{idx:03d}",
            "project_id": PROJECT_ID,
            "source_type": "issue",
            "source_id": issue_seed_id,
            "summary": f"[DUMMY] {issue['issue_title']} 관련 리스크, 담당자, 요청사항, 다음 액션 요약",
            "key_points": "담당자 확인; 요청사항 추적; 리스크 관리; 다음 액션 등록",
            "created_at": NOW,
            "updated_at": NOW,
        })
        for step in range(1, 4):
            todo_id = f"DUMMY-TODO-{idx:03d}-{step}"
            todo_due = add_days(start, step * 2)
            todos.append({
                "id": todo_id,
                "project_id": PROJECT_ID,
                "title": f"[DUMMY] {issue['issue_title']} 액션 {step}",
                "description": f"[DUMMY] {issue['issue_type']} 대응 Todo {step}: 담당자 확인, 요청사항 정리, 리스크 업데이트",
                "status": "done" if issue["status"].lower() == "closed" else "open",
                "priority": priority(issue["severity"]),
                "owner_member_id": members[(idx + step) % len(members)]["id"],
                "due_at": dtstr(todo_due),
                "source_type": "issue",
                "source_id": issue_seed_id,
                "created_at": dtstr(start),
                "updated_at": NOW,
            })
            calendar_events.append({
                "id": f"DUMMY-CAL-{idx:03d}-{step}",
                "project_id": PROJECT_ID,
                "title": f"[DUMMY] {issue['issue_title']} 후속 일정 {step}",
                "event_type": "todo_due",
                "start_at": dtstr(todo_due),
                "end_at": dtstr(todo_due),
                "related_todo_id": todo_id,
                "related_issue_id": issue_seed_id,
                "created_at": NOW,
                "updated_at": NOW,
            })

    weekly_reports = []
    for idx, issue in enumerate(selected_issues[:3], 1):
        weekly_reports.append({
            "id": f"DUMMY-WEEKLY-{idx:03d}",
            "project_id": PROJECT_ID,
            "title": f"[DUMMY] 주간 운영 리포트 {idx}",
            "period_start": dstr(issue["start_date"]),
            "period_end": dstr(add_days(issue["start_date"], 6)),
            "summary": f"[DUMMY] {issue['issue_title']} 중심 주간 이슈, Todo, 리스크 요약",
            "status": "published",
            "source": "dummy_current_seed",
            "created_at": NOW,
            "updated_at": NOW,
        })

    monthly_reports = []
    monthly_specs = [
        ("2026-09-01", "[DUMMY] 2026-09 단가 인상 공지와 구두 합의 충돌 리포트", "공식 공지와 구두 합의가 충돌하여 고객 단가 제안 기준을 확인해야 하는 월간 요약"),
        ("2026-12-01", "[DUMMY] 2026-12 임시 인수인계 누락 리스크 리포트", "담당자 휴가 중 고객 요청과 Todo가 분산되어 회신 지연이 발생한 월간 요약"),
    ]
    for idx, (month_start, title, summary) in enumerate(monthly_specs, 1):
        monthly_reports.append({
            "id": f"DUMMY-MONTHLY-{idx:03d}",
            "project_id": PROJECT_ID,
            "title": title,
            "period_start": dstr(month_start),
            "period_end": dstr(add_days(month_start, 29)),
            "summary": f"[DUMMY] {summary}",
            "status": "published",
            "source": "dummy_current_seed",
            "created_at": NOW,
            "updated_at": NOW,
        })

    handoff_reports = []
    handoff_specs = [
        ("영업-구매-물류 납기 변경 인수인계", "납기 일정이 여러 번 바뀐 긴급 주문의 임시 납기, 확정 납기, 다음 액션"),
        ("Mirae EV Systems 임시 담당자 인수인계 누락", "휴가 전 전달 메모와 고객 요청이 분산된 상태의 담당자 확인 필요 항목"),
    ]
    for idx, (title, scope) in enumerate(handoff_specs, 1):
        handoff_reports.append({
            "id": f"DUMMY-HANDOFF-{idx:03d}",
            "project_id": PROJECT_ID,
            "title": f"[DUMMY] {title}",
            "from_member_id": members[0]["id"],
            "to_member_id": members[idx]["id"],
            "scope_summary": f"[DUMMY] {scope}",
            "generated_summary": "[DUMMY] 문서와 issue_events 기반으로 미확정 정보, 담당자 확인, 다음 액션을 분리한 인수인계 데모 요약",
            "status": "ready",
            "source": "dummy_current_seed",
            "created_at": NOW,
            "updated_at": NOW,
        })

    chat_messages = []
    for idx, issue in enumerate(selected_issues[:9], 1):
        chat_messages.append({
            "id": f"DUMMY-CHAT-{idx:03d}",
            "project_id": PROJECT_ID,
            "sender_member_id": members[idx % len(members)]["id"],
            "message": f"[DUMMY] {issue['issue_title']} 진행 상황과 다음 액션 확인",
            "source_type": "issue",
            "source_id": f"DUMMY-ISSUE-{idx:03d}",
            "created_at": NOW,
            "updated_at": NOW,
        })

    tables: dict[str, tuple[list[str], list[dict[str, object]]]] = {
        "teams": (["id", "name", "description", "created_at", "updated_at"], teams),
        "users": (["id", "team_id", "name", "email", "role", "created_at", "updated_at"], users),
        "projects": (["id", "team_id", "name", "description", "status", "created_at", "updated_at"], projects),
        "project_members": (["id", "project_id", "user_id", "role", "status", "created_at", "updated_at"], members),
        "documents": (["id", "project_id", "uploaded_by_member_id", "file_name", "file_type", "storage_uri", "summary", "source_doc_id", "created_at", "updated_at"], documents),
        "issues": (["id", "project_id", "title", "issue_type", "severity", "status", "description", "detected_at", "due_at", "source", "created_at", "updated_at"], issues),
        "todos": (["id", "project_id", "title", "description", "status", "priority", "owner_member_id", "due_at", "source_type", "source_id", "created_at", "updated_at"], todos),
        "calendar_events": (["id", "project_id", "title", "event_type", "start_at", "end_at", "related_todo_id", "related_issue_id", "created_at", "updated_at"], calendar_events),
        "weekly_reports": (["id", "project_id", "title", "period_start", "period_end", "summary", "status", "source", "created_at", "updated_at"], weekly_reports),
        "monthly_reports": (["id", "project_id", "title", "period_start", "period_end", "summary", "status", "source", "created_at", "updated_at"], monthly_reports),
        "handoff_reports": (["id", "project_id", "title", "from_member_id", "to_member_id", "scope_summary", "generated_summary", "status", "source", "created_at", "updated_at"], handoff_reports),
        "chat_messages": (["id", "project_id", "sender_member_id", "message", "source_type", "source_id", "created_at", "updated_at"], chat_messages),
        "ai_summaries": (["id", "project_id", "source_type", "source_id", "summary", "key_points", "created_at", "updated_at"], ai_summaries),
    }

    for table, (headers, rows) in tables.items():
        write_csv(CSV_OUT / f"{table}.csv", headers, rows)

    insert_parts = [
        "-- OpsRadar2 current DB compatible dummy seed\n",
        "-- Apply after the current application schema/migrations are ready.\n",
        "BEGIN;\n",
    ]
    for table, (headers, rows) in tables.items():
        insert_parts.append(insert_sql(table, headers, rows))
    insert_parts.append("COMMIT;\n")
    (SQL_OUT / "insert_current_seed.sql").write_text("\n".join(insert_parts), encoding="utf-8")

    clear_order = list(reversed(list(tables.keys())))
    clear_parts = [
        "-- Clear only OpsRadar2 [DUMMY] current seed rows.\n",
        "BEGIN;\n",
    ]
    for table in clear_order:
        ids = [row["id"] for row in tables[table][1]]
        quoted = ", ".join(sql_value(value) for value in ids)
        clear_parts.append(f"DELETE FROM {table} WHERE id IN ({quoted});\n")
    clear_parts.append("COMMIT;\n")
    (SQL_OUT / "clear_current_seed.sql").write_text("\n".join(clear_parts), encoding="utf-8")

    readme_rows = "\n".join(f"- `{name}.csv`: {len(rows)} rows" for name, (_, rows) in tables.items())
    (OUT / "README.md").write_text(
        f"""# OpsRadar2 Current DB Seed

This folder contains a minimal [DUMMY] seed for local demos of document upload, analysis, Todo, issue, report, chat, and handoff flows.

## Files
- `csv/`: table-shaped CSV files
- `sql/insert_current_seed.sql`: PostgreSQL insert script
- `sql/clear_current_seed.sql`: cleanup script for this seed only
- `current-seed-compatibility-check.md`: compatibility notes and verification summary

## Row counts
{readme_rows}

## Usage
```bash
python scripts/create_current_db_seed.py
psql -h 127.0.0.1 -p 5432 -U postgres -d azag_db -f dummy_data/06_current_db_seed/sql/insert_current_seed.sql
```

To remove only this demo seed:

```bash
psql -h 127.0.0.1 -p 5432 -U postgres -d azag_db -f dummy_data/06_current_db_seed/sql/clear_current_seed.sql
```

The expected-output test samples are not used as seed input.
""",
        encoding="utf-8",
    )

    (OUT / "current-seed-compatibility-check.md").write_text(
        f"""# Current Seed Compatibility Check

## Scope
- Generated from `dummy_data/02_raw_documents` and `dummy_data/03_structured_csv`.
- Did not modify `dummy_data/05_db_seed_v2`.
- Did not use the expected-output test folder as input seed data.

## Included demo coverage
- Documents: {len(documents)}
- Key issues: {len(issues)}
- Todos: {len(todos)}
- Calendar events: {len(calendar_events)}
- Weekly reports: {len(weekly_reports)}
- Monthly reports: {len(monthly_reports)}
- Handoff reports: {len(handoff_reports)}
- Chat messages: {len(chat_messages)}
- AI summaries: {len(ai_summaries)}

## Compatibility note
The `dummy` branch available in this local checkout does not contain a tracked database schema file. The seed therefore uses the current OpsRadar2 v2 table contracts already represented by the existing seed converter, but keeps the output smaller and cleanup-safe with fixed `DUMMY-*` IDs and `[DUMMY]` titles.

If a target database lacks optional tables such as `weekly_reports`, `monthly_reports`, `handoff_reports`, `chat_messages`, or `ai_summaries`, load only the CSV/SQL sections for tables present in that database.

## Safety
- All generated rows use fixed `DUMMY-*` IDs or `[DUMMY]` labels.
- Cleanup deletes by generated IDs only.
- No local environment files are read.
""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
