from __future__ import annotations

import csv
import hashlib
import textwrap
from collections import Counter, defaultdict
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dummy_data" / "2022"
MASTER = OUT / "01_master_data"
RAW = OUT / "02_raw_documents"
STRUCTURED = OUT / "03_structured_csv"
EXPECTED = OUT / "04_expected_outputs_for_test"
MAPPING = OUT / "05_mapping"
PREVIEW = OUT / "06_loader_preview"
START_DATE = date(2022, 1, 1)
END_DATE = date(2022, 12, 31)


EMPLOYEES = [
    ("EMP-2022-001", "김도윤", "운영총괄팀", "운영총괄", "admin", "doyun.kim@example.invalid"),
    ("EMP-2022-002", "박서연", "영업관리팀", "선임 매니저", "manager", "seoyeon.park@example.invalid"),
    ("EMP-2022-003", "이민재", "영업관리팀", "매니저", "user", "minjae.lee@example.invalid"),
    ("EMP-2022-004", "정하늘", "영업관리팀", "매니저", "user", "haneul.jung@example.invalid"),
    ("EMP-2022-005", "최유진", "구매팀", "구매 리드", "manager", "yujin.choi@example.invalid"),
    ("EMP-2022-006", "강민호", "구매팀", "구매 매니저", "user", "minho.kang@example.invalid"),
    ("EMP-2022-007", "오지훈", "구매팀", "구매 담당", "user", "jihoon.oh@example.invalid"),
    ("EMP-2022-008", "한지우", "품질 클레임팀", "품질 리드", "manager", "jiwoo.han@example.invalid"),
    ("EMP-2022-009", "송태경", "품질 클레임팀", "품질 담당", "user", "taekyung.song@example.invalid"),
    ("EMP-2022-010", "배수민", "품질 클레임팀", "클레임 담당", "user", "sumin.bae@example.invalid"),
    ("EMP-2022-011", "윤예린", "물류팀", "물류 리드", "manager", "yerin.yoon@example.invalid"),
    ("EMP-2022-012", "임가은", "물류팀", "출고 담당", "user", "gaeun.lim@example.invalid"),
    ("EMP-2022-013", "문태오", "물류팀", "수출 담당", "user", "taeo.moon@example.invalid"),
    ("EMP-2022-014", "시스템 관리자", "시스템관리", "시스템 관리자", "admin", "system.admin@example.invalid"),
]

CUSTOMERS = [
    ("CUST-001", "Hyundai Mobis Tier2", "Korea", "장현우", "박서연", "High", "긴급 납품 요청과 월말 일정 변동이 잦음"),
    ("CUST-002", "Daesung Automotive", "Korea", "이보라", "박서연", "High", "급발주와 승인 일정이 촘촘함"),
    ("CUST-003", "Mirae EV Systems", "Korea", "서민규", "이민재", "Medium", "품질 이슈 재발 가능성"),
    ("CUST-004", "Hanil Motors", "Korea", "최가은", "정하늘", "Low", "정기 발주 중심이나 가격 협상 민감"),
    ("CUST-005", "Global Harness Vietnam", "Vietnam", "Nguyen Linh", "이민재", "Medium", "수출 서류와 통관 일정 주의"),
]

SUPPLIERS = [
    ("SUP-001", "TE Connectivity Korea", "Korea", "커넥터, 터미널", "21", "Price", "가격 공지와 구두 협의가 혼재"),
    ("SUP-002", "KET Supplier", "Korea", "터미널, 와이어하네스", "28", "Stock", "재고 부족 시 일정 변동 큼"),
    ("SUP-003", "Yazaki Parts Asia", "Japan", "릴레이, 케이블 어셈블리", "56", "LeadTime", "리드타임 변경 회신이 늦음"),
    ("SUP-004", "JST Components", "China", "센서 케이블, 커넥터", "35", "Quality", "품질 확인 회신이 느림"),
    ("SUP-005", "Local Cable Works", "Korea", "와이어하네스, 대체 케이블", "14", "Capacity", "긴급 대체품 대응 가능"),
]

PRODUCTS = [
    ("PROD-001", "AP-CN-204 커넥터", "Connector", "TE Connectivity Korea", "1250", "1800"),
    ("PROD-002", "AP-TM-118 터미널", "Terminal", "KET Supplier", "780", "2500"),
    ("PROD-003", "AP-SC-330 센서 케이블", "Sensor Cable", "JST Components", "4200", "900"),
    ("PROD-004", "AP-RL-450 릴레이", "Relay", "Yazaki Parts Asia", "3100", "700"),
    ("PROD-005", "AP-WH-220 와이어하네스", "Wire Harness", "KET Supplier", "5600", "650"),
    ("PROD-006", "AP-CB-510 케이블 어셈블리", "Cable Assembly", "Local Cable Works", "4800", "500"),
]


CORE_ISSUES = [
    ("ISSUE-2022-001", "설 연휴 전 긴급 출고 일정 혼선", "urgent_shipment_conflict", "2022-01-10", "2022-01-28", "CUST-002", "SUP-001", "PROD-001", "영업관리팀;구매팀;물류팀", "Medium", "resolved", "부분 출고일과 잔량 입고일이 메일과 채팅마다 다르게 전달됨"),
    ("ISSUE-2022-002", "구매처 재고 부족과 대체품 검토", "supplier_stock_substitute", "2022-03-04", "2022-03-25", "CUST-001", "SUP-002", "PROD-002", "구매팀;영업관리팀", "High", "partially_resolved", "재고 부족 회신이 모호하고 대체품 고객 승인 필요 여부가 뒤늦게 확인됨"),
    ("ISSUE-2022-003", "수출 서류 누락으로 통관 지연", "export_document_gap", "2022-04-07", "2022-04-22", "CUST-005", "SUP-002", "PROD-005", "물류팀;영업관리팀", "Medium", "resolved", "원산지 증명서와 패킹리스트 중 누락 문서에 대한 부서별 설명이 다름"),
    ("ISSUE-2022-004", "반복 불량과 고객 조립 문제 사이 클레임", "quality_or_assembly_claim", "2022-05-09", "2022-05-31", "CUST-003", "SUP-005", "PROD-003", "품질 클레임팀;영업관리팀;구매팀", "High", "in_progress", "샘플 회수 전 생산 불량과 고객 조립 공정 가능성이 동시에 제기됨"),
    ("ISSUE-2022-005", "리드타임 변경 공지와 고객 발주 일정 충돌", "lead_time_conflict", "2022-07-01", "2022-07-29", "CUST-004", "SUP-003", "PROD-004", "구매팀;영업관리팀;운영총괄팀", "High", "in_progress", "공급처 리드타임이 8주에서 11~12주로 바뀌었으나 고객 발주 기준은 그대로임"),
    ("ISSUE-2022-006", "항공 이송 전환 비용 승인 지연", "air_freight_approval_delay", "2022-08-11", "2022-08-30", "CUST-001", "SUP-001", "PROD-001", "물류팀;구매팀;운영총괄팀", "Medium", "resolved", "항공 이송 필요성은 명확하지만 비용 부담 주체와 승인 시점이 불분명함"),
    ("ISSUE-2022-007", "단가 인상 공지와 기존 견적 적용 기준 충돌", "price_quote_conflict", "2022-10-03", "2022-10-28", "CUST-004", "SUP-001", "PROD-001", "구매팀;영업관리팀;운영총괄팀", "High", "in_progress", "공식 인상 공지와 기존 견적 유효 조건, 고객 반영 시점이 일치하지 않음"),
    ("ISSUE-2022-008", "담당자 부재로 고객 회신 누락", "temporary_owner_gap", "2022-12-05", "2022-12-23", "CUST-003", "SUP-002", "PROD-004", "영업관리팀;구매팀", "Medium", "in_progress", "휴가 전 전달 메모가 짧고 임시 담당자가 불명확해 고객 회신과 Todo가 누락됨"),
]

GENERAL_ISSUES = [
    ("ISSUE-2022-009", "2월 고객 납기 재확인", "delivery_recheck", "2022-02-03", "2022-02-12", "CUST-001", "SUP-002", "PROD-005", "영업관리팀;물류팀", "Low", "resolved", "고객 요청일과 내부 출고 예정일을 재확인한 일반 이슈"),
    ("ISSUE-2022-010", "2월 품목 코드 오기입", "product_code_typo", "2022-02-17", "2022-02-25", "CUST-002", "SUP-001", "PROD-001", "영업관리팀;구매팀", "Low", "resolved", "메일 제목의 품목 코드가 본문과 달라 정정이 필요함"),
    ("ISSUE-2022-011", "6월 구매처 회신 지연", "supplier_reply_delay", "2022-06-02", "2022-06-14", "CUST-003", "SUP-004", "PROD-003", "구매팀;품질 클레임팀", "Medium", "resolved", "품질 확인 회신 예정일이 두 차례 변경됨"),
    ("ISSUE-2022-012", "6월 출고 수량 정정", "shipment_quantity_fix", "2022-06-16", "2022-06-27", "CUST-004", "SUP-005", "PROD-006", "물류팀;영업관리팀", "Medium", "resolved", "출고 로그와 고객 수령 수량 차이를 정정함"),
    ("ISSUE-2022-013", "9월 내부 담당자 변경", "owner_change", "2022-09-02", "2022-09-13", "CUST-005", "SUP-003", "PROD-004", "영업관리팀;물류팀", "Low", "resolved", "수출 담당 변경이 일부 메일에만 반영됨"),
    ("ISSUE-2022-014", "9월 반복 Todo 미완료", "repeated_todo_open", "2022-09-16", "2022-09-29", "CUST-002", "SUP-001", "PROD-001", "영업관리팀;구매팀", "Medium", "in_progress", "같은 확인 요청 Todo가 중복 생성되고 일부가 미완료로 남음"),
    ("ISSUE-2022-015", "11월 월말 마감 확인", "month_end_check", "2022-11-02", "2022-11-14", "CUST-005", "SUP-004", "PROD-002", "물류팀;운영총괄팀", "Low", "resolved", "출고 완료와 고객 수령 확인 시점이 달라 마감 기준을 확인함"),
    ("ISSUE-2022-016", "11월 고객 단가 업데이트 누락", "customer_price_update_gap", "2022-11-16", "2022-11-29", "CUST-002", "SUP-001", "PROD-001", "영업관리팀;구매팀", "Medium", "in_progress", "내부 단가표는 변경됐지만 고객 회신 초안에는 이전 가격이 남음"),
]

ISSUES = CORE_ISSUES + GENERAL_ISSUES
DOC_TYPES = ["sales_emails", "purchase_emails", "quality_claims", "logistics_logs", "meeting_notes", "chat_logs"]
DOC_LABELS = ["고객 요청", "구매처 회신", "품질 확인", "물류 기록", "운영 회의", "내부 채팅"]
AUTHORS = {"sales_emails": "박서연", "purchase_emails": "최유진", "quality_claims": "한지우", "logistics_logs": "윤예린", "meeting_notes": "김도윤", "chat_logs": "이민재"}


def write_csv(path: Path, headers: list[str], rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in headers})


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def parse_date(value: str) -> date:
    return date.fromisoformat(value)


def spread_date(start: str, end: str, index: int, count: int) -> date:
    start_date = parse_date(start)
    end_date = parse_date(end)
    span = max(0, (end_date - start_date).days)
    return start_date + timedelta(days=min(span, round(span * index / max(1, count - 1))))


def deterministic_number(prefix: str, seed: str, minimum: int, maximum: int) -> int:
    digest = hashlib.sha256(f"{prefix}:{seed}".encode("utf-8")).hexdigest()
    return minimum + int(digest[:8], 16) % (maximum - minimum + 1)


def build_documents() -> tuple[list[dict[str, str]], Counter]:
    rows: list[dict[str, str]] = []
    monthly = Counter()
    for issue_index, issue in enumerate(ISSUES):
        issue_id, title, issue_type, start, end, customer, supplier, product, teams, severity, status, description = issue
        count = 12 if issue_index < len(CORE_ISSUES) else 4
        for idx in range(count):
            folder = DOC_TYPES[idx % len(DOC_TYPES)]
            label = DOC_LABELS[idx % len(DOC_LABELS)]
            created = spread_date(start, end, idx, count)
            monthly[created.month] += 1
            doc_id = f"DOC-2022-{issue_index + 1:03d}-{idx + 1:03d}"
            file_name = f"{doc_id}_{issue_type}_{created.isoformat()}.md"
            file_path = f"02_raw_documents/{folder}/{file_name}"
            author = AUTHORS[folder]
            related_team = teams.split(";")[idx % len(teams.split(";"))]
            uncertainty = ["아마", "일단", "확인 중", "다음 주 초 예상", "확정 아님", "담당자 재확인 필요"][idx % 6]
            body = "\n".join([
                f"doc_id: {doc_id}",
                f"doc_type: {folder}",
                f"created_date: {created.isoformat()}",
                f"author: {author}",
                f"related_team: {related_team}",
                f"related_customer_id: {customer}",
                f"related_supplier_id: {supplier}",
                f"related_product_id: {product}",
                f"related_issue_id: {issue_id}",
                "--------------------------------",
                "",
                f"{label} 관련 메모입니다. {uncertainty}. {description}",
                f"제목에는 {title}로 적었는데 이전 메일에서는 표현이 조금 달랐습니다.",
                "고객 요청 날짜와 내부 확인 날짜가 한 번 수정되어 최신 기준을 다시 봐야 합니다.",
                f"담당자는 {author}로 보이지만 최종 승인자와 회신 주체는 아직 분명하지 않습니다.",
                "같은 확인 요청이 메일과 채팅에 중복으로 남아 있습니다.",
                f"현재 상태는 {status}로 기록했지만 일부 문서에는 완료처럼 적힌 부분도 있습니다.",
                f"리스크 등급은 {severity}이며 단정하지 말고 근거 문서를 함께 확인해야 합니다.",
                "요청사항: 최신 수량, 날짜, 고객 승인 필요 여부를 다시 맞춰 주세요.",
                "다음 액션: 담당자 확인 후 고객 회신 초안을 업데이트합니다.",
                "이 내용은 완성된 보고서가 아니라 당시 업무 자료입니다.",
                "",
            ])
            write_text(OUT / file_path, body)
            rows.append({
                "doc_id": doc_id, "file_path": file_path, "doc_type": folder,
                "created_date": created.isoformat(), "author": author,
                "related_team": related_team, "related_customer_id": customer,
                "related_supplier_id": supplier, "related_product_id": product,
                "related_issue_id": issue_id,
                "summary_hint": f"{title} 관련 비정형 {label} 자료. 날짜 변경, 담당자 불명확, 중복 요청 포함",
            })
    return rows, monthly


def build_orders(count: int = 80) -> list[dict[str, object]]:
    rows = []
    for idx in range(count):
        issue = ISSUES[idx % len(ISSUES)]
        issue_id, _, _, start, end, customer, _, product, _, _, status, _ = issue
        order_date = spread_date(start, end, idx % 4, 4)
        requested = min(END_DATE, order_date + timedelta(days=deterministic_number("order-days", str(idx), 5, 24)))
        rows.append({"order_id": f"ORD-2022-{idx + 1:04d}", "order_date": order_date.isoformat(), "customer_id": customer, "product_id": product, "quantity": deterministic_number("order-qty", str(idx), 120, 5200), "requested_delivery_date": requested.isoformat(), "order_status": "completed" if status == "resolved" else "in_progress", "sales_owner": ["박서연", "이민재", "정하늘"][idx % 3], "related_issue_id": issue_id})
    return rows


def build_purchase_orders(count: int = 72) -> list[dict[str, object]]:
    rows = []
    for idx in range(count):
        issue = ISSUES[idx % len(ISSUES)]
        issue_id, _, _, start, _, _, supplier, product, _, _, status, _ = issue
        po_date = parse_date(start) + timedelta(days=idx % 6)
        expected = min(END_DATE, po_date + timedelta(days=deterministic_number("po-days", str(idx), 10, 45)))
        actual = "" if status != "resolved" or idx % 3 == 0 else min(END_DATE, expected + timedelta(days=(idx % 5) - 2)).isoformat()
        rows.append({"po_id": f"PO-2022-{idx + 1:04d}", "po_date": po_date.isoformat(), "supplier_id": supplier, "product_id": product, "quantity": deterministic_number("po-qty", str(idx), 200, 6000), "expected_arrival_date": expected.isoformat(), "actual_arrival_date": actual, "po_status": "Closed" if actual else "Open", "purchase_owner": ["최유진", "강민호", "오지훈"][idx % 3], "related_issue_id": issue_id})
    return rows


def build_shipments(count: int = 72) -> list[dict[str, object]]:
    rows = []
    for idx in range(count):
        issue = ISSUES[idx % len(ISSUES)]
        issue_id, _, _, start, end, customer, _, product, _, _, status, _ = issue
        ship_date = spread_date(start, end, idx % 5, 5)
        expected = min(END_DATE, ship_date + timedelta(days=deterministic_number("ship-days", str(idx), 2, 14)))
        actual = "" if status != "resolved" or idx % 4 == 0 else min(END_DATE, expected + timedelta(days=(idx % 3) - 1)).isoformat()
        rows.append({"shipment_id": f"SHP-2022-{idx + 1:04d}", "shipment_date": ship_date.isoformat(), "customer_id": customer, "product_id": product, "quantity": deterministic_number("ship-qty", str(idx), 100, 4800), "carrier": ["CJ Logistics", "Hanjin", "DHL", "Korea Post"][idx % 4], "shipping_method": "Ocean" if customer == "CUST-005" else "Truck", "expected_delivery_date": expected.isoformat(), "actual_delivery_date": actual, "shipment_status": "delivered" if actual else "in_progress", "logistics_owner": ["윤예린", "임가은", "문태오"][idx % 3], "related_issue_id": issue_id})
    return rows


def build_claims(count: int = 24) -> list[dict[str, object]]:
    rows = []
    for idx in range(count):
        issue = ISSUES[idx % len(ISSUES)]
        issue_id, _, issue_type, start, end, customer, _, product, _, severity, status, _ = issue
        claim_date = spread_date(start, end, idx % 3, 3)
        rows.append({"claim_id": f"CLM-2022-{idx + 1:04d}", "claim_date": claim_date.isoformat(), "customer_id": customer, "product_id": product, "defect_type": issue_type, "defect_quantity": deterministic_number("claim-qty", str(idx), 1, 85), "severity": severity, "claim_status": status, "quality_owner": ["한지우", "송태경", "배수민"][idx % 3], "related_issue_id": issue_id})
    return rows


def build_mapping_files() -> None:
    write_text(MAPPING / "mapping.md", """# 2022 Source Seed Mapping

This dataset is a business-source seed, not a DB-ready seed. Loaders must inspect the current PostgreSQL schema before insertion.

## Transformation rules
- Convert source string IDs with deterministic UUID5 using `source_type + ':' + source_id`.
- Map `file_path` to `documents.storage_uri`, `doc_type` to `documents.file_type`, and `created_date` to `documents.created_at`.
- Put raw body text into `document_chunks.content`; use the file name as `documents.file_name`.
- Map `related_issue_id` to `todos.linked_issue_id` where the current schema supports it.
- Resolve employee names to current user/member UUIDs before setting assignees or handoff owners.
- Normalize all status values against current CHECK constraints.
- Fill required columns only with documented defaults; never invent relationship IDs.

## FK and load rules
Load teams, users, projects, project_members, documents, document_chunks, issues, todos, and calendar/report/handoff tables in parent-first order. Validate orphans and row counts after every stage. Tables absent from the current schema must be skipped.
""")
    status_rows = [
        {"source_value": "resolved", "target_value": "completed", "target_table": "issues", "note": "Closed after evidence review"},
        {"source_value": "partially_resolved", "target_value": "in_progress", "target_table": "issues", "note": "Keep unresolved actions open"},
        {"source_value": "in_progress", "target_value": "in_progress", "target_table": "issues", "note": "Direct mapping"},
        {"source_value": "Open", "target_value": "open", "target_table": "purchase_orders", "note": "Normalize case"},
        {"source_value": "Closed", "target_value": "completed", "target_table": "purchase_orders", "note": "Normalize enum"},
        {"source_value": "delivered", "target_value": "completed", "target_table": "shipments", "note": "Delivered shipment"},
    ]
    write_csv(MAPPING / "status_mapping.csv", ["source_value", "target_value", "target_table", "note"], status_rows)
    column_rows = [
        ("source_document_index.csv", "doc_id", "documents", "id", "uuid5('document:' + value)", "yes", ""),
        ("source_document_index.csv", "file_path", "documents", "storage_uri", "prefix dummy_data/2022/", "yes", ""),
        ("source_document_index.csv", "doc_type", "documents", "file_type", "normalize enum", "yes", "other"),
        ("source_document_index.csv", "created_date", "documents", "created_at", "date to timestamp", "yes", ""),
        ("issue_events.csv", "issue_id", "issues", "id", "uuid5('issue:' + value)", "yes", ""),
        ("issue_events.csv", "status", "issues", "status", "status_mapping.csv", "yes", "open"),
        ("issue_events.csv", "severity", "issues", "severity", "lowercase", "yes", "medium"),
        ("generated todo", "owner_name", "todos", "assignee_member_id", "lookup user then project_member", "no", "null"),
        ("generated todo", "related_issue_id", "todos", "linked_issue_id", "uuid5('issue:' + value)", "no", "null"),
        ("calendar preview", "start_at", "calendar_events", "starts_at", "timestamp", "yes", ""),
        ("calendar preview", "end_at", "calendar_events", "ends_at", "timestamp", "yes", ""),
        ("weekly preview", "period_start", "weekly_reports", "week_start", "date", "yes", ""),
        ("weekly preview", "period_end", "weekly_reports", "week_end", "date", "yes", ""),
        ("monthly preview", "period_start", "monthly_reports", "month_start", "date", "yes", ""),
        ("monthly preview", "period_end", "monthly_reports", "month_end", "date", "yes", ""),
        ("handoff preview", "content", "handoff_reports", "content", "text", "yes", ""),
    ]
    write_csv(MAPPING / "column_mapping.csv", ["source_file", "source_column", "target_table", "target_column", "transform_rule", "required", "default_value"], [dict(zip(["source_file", "source_column", "target_table", "target_column", "transform_rule", "required", "default_value"], row)) for row in column_rows])
    write_text(MAPPING / "id_mapping_rules.md", """# ID Mapping Rules

- Source IDs remain human-readable in the source CSV files.
- Preview IDs use UUID5 with a fixed namespace and `source_type:source_id` as the name.
- The same source ID always produces the same UUID.
- Different source types use different prefixes to prevent collisions.
- Parent IDs must be mapped before child IDs.
- Loader logs must retain both source ID and generated UUID for reconciliation.
""")
    write_text(MAPPING / "load_order.md", """# Suggested Load Order

1. teams
2. users
3. projects
4. project_members
5. documents
6. document_chunks
7. issues
8. todos
9. calendar_events
10. weekly_reports
11. monthly_reports
12. handoff_reports
13. chat_messages
14. ai_summaries

Only load tables and columns present in the current database schema. Run orphan, count, and status-distribution checks after each stage.
""")


LOADER_SCRIPT = r'''from __future__ import annotations

import csv
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "dummy_data" / "2022"
OUT = SOURCE / "06_loader_preview" / "out_preview"
NAMESPACE = uuid.UUID("9f16729a-7f4d-4a4a-85c6-44da0cb08780")


def read_csv(path: Path):
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, headers, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def mapped_id(source_type: str, source_id: str) -> str:
    return str(uuid.uuid5(NAMESPACE, f"{source_type}:{source_id}"))


def main() -> None:
    docs = read_csv(SOURCE / "03_structured_csv" / "source_document_index.csv")
    issues = read_csv(SOURCE / "03_structured_csv" / "issue_events.csv")
    employees = read_csv(SOURCE / "01_master_data" / "employees.csv")
    status_map = {(r["target_table"], r["source_value"]): r["target_value"] for r in read_csv(SOURCE / "05_mapping" / "status_mapping.csv")}
    missing_paths = [r["file_path"] for r in docs if not (SOURCE / r["file_path"]).exists()]
    issue_ids = {r["issue_id"] for r in issues}
    orphan_docs = [r["doc_id"] for r in docs if r["related_issue_id"] and r["related_issue_id"] not in issue_ids]

    document_rows = [{"source_id": r["doc_id"], "id": mapped_id("document", r["doc_id"]), "project_id": mapped_id("project", "PROJECT-2022"), "file_name": Path(r["file_path"]).name, "file_type": "other", "storage_uri": f"dummy_data/2022/{r['file_path']}", "created_at": f"{r['created_date']}T09:00:00", "analysis_status": "pending"} for r in docs]
    issue_rows = [{"source_id": r["issue_id"], "id": mapped_id("issue", r["issue_id"]), "project_id": mapped_id("project", "PROJECT-2022"), "title": r["issue_title"], "status": status_map.get(("issues", r["status"]), "open"), "severity": r["severity"].lower(), "created_at": f"{r['start_date']}T09:00:00"} for r in issues]
    todo_rows = [{"source_id": f"TODO-{r['issue_id']}", "id": mapped_id("todo", f"TODO-{r['issue_id']}"), "project_id": mapped_id("project", "PROJECT-2022"), "title": f"[PREVIEW] {r['issue_title']} 확인", "status": "open", "priority": r["severity"].lower(), "linked_issue_id": mapped_id("issue", r["issue_id"]), "assignee_member_id": ""} for r in issues]

    write_csv(OUT / "documents_preview.csv", list(document_rows[0]), document_rows)
    write_csv(OUT / "issues_preview.csv", list(issue_rows[0]), issue_rows)
    write_csv(OUT / "todos_preview.csv", list(todo_rows[0]), todo_rows)
    print(f"source documents: {len(docs)}")
    print(f"preview documents rows: {len(document_rows)}")
    print(f"preview issues rows: {len(issue_rows)}")
    print(f"preview todo candidates: {len(todo_rows)}")
    print(f"missing file paths: {len(missing_paths)}")
    print(f"orphan issue/document links: {len(orphan_docs)}")
    print(f"status mapping failures: {sum(1 for r in issue_rows if r['status'] == 'open' and next(x for x in issues if x['issue_id'] == r['source_id'])['status'] != 'in_progress')}")
    print("expected output mixed into input: False")
    print("actual DB insert: False")


if __name__ == "__main__":
    main()
'''


def build_preview_files() -> None:
    write_text(PREVIEW / "load_2022_source_seed_preview.py", LOADER_SCRIPT)
    write_text(PREVIEW / "README.md", """# 2022 Loader Preview

This tool does not connect to or insert into a database. It previews deterministic UUID conversion, status normalization, column mapping, and FK candidates.

Run:
```bash
python dummy_data/2022/06_loader_preview/load_2022_source_seed_preview.py
```

Generated preview CSV files are written under `out_preview/`. Review current PostgreSQL schema constraints before building a real loader.
""")
    write_text(PREVIEW / "validation_queries.sql", """-- Examples only. Confirm the current schema before execution.
-- Documents without a project
SELECT id FROM documents WHERE project_id IS NULL;
-- Document chunks without a document
SELECT dc.id FROM document_chunks dc LEFT JOIN documents d ON d.id = dc.document_id WHERE d.id IS NULL;
-- Todos linked to a missing issue
SELECT t.id FROM todos t LEFT JOIN issues i ON i.id = t.linked_issue_id WHERE t.linked_issue_id IS NOT NULL AND i.id IS NULL;
-- Issue status distribution
SELECT status, COUNT(*) FROM issues GROUP BY status ORDER BY status;
-- Todos with no assignee
SELECT id, title FROM todos WHERE assignee_member_id IS NULL;
-- Weekly report period errors
SELECT id FROM weekly_reports WHERE week_start > week_end;
-- Handoff reports missing owners
SELECT id FROM handoff_reports WHERE from_member_id IS NULL OR to_member_id IS NULL;
""")


def build_expected_outputs() -> None:
    write_text(EXPECTED / "expected_weekly_report_sample_2022.md", """# Weekly Report Expected Output Sample - 2022

## Reference issue
ISSUE-2022-004 반복 불량과 고객 조립 문제 사이 클레임

## Expected behavior
- Separate confirmed defects from hypotheses.
- Show sample recovery pending, supplier analysis pending, and customer assembly possibility as confirmation-required items.
- Preserve contradictory ownership and dates.
- List open actions without presenting them as completed.
""")
    write_text(EXPECTED / "expected_monthly_report_sample_2022.md", """# Monthly Report Expected Output Sample - 2022

## Reference issue
ISSUE-2022-007 단가 인상 공지와 기존 견적 적용 기준 충돌

## Expected behavior
- Distinguish official notice from verbal agreement.
- Keep customer price reflection and margin impact as unresolved.
- Identify purchasing, sales, and operations confirmations separately.
- Avoid a clean single-number conclusion when evidence conflicts.
""")
    write_text(EXPECTED / "expected_handoff_sample_2022.md", """# Handoff Expected Output Sample - 2022

## Reference issue
ISSUE-2022-008 담당자 부재로 고객 회신 누락

## Expected behavior
- Surface missing handoff notes and unclear temporary ownership.
- Keep delayed customer replies and immediately required Todo items visible.
- Do not invent a confirmed assignee.
- Include evidence references and confirmation-required items.
""")


def build_readme(counts: dict[str, int], monthly: Counter) -> None:
    issue_lines = "\n".join(f"{idx + 1}. `{row[0]}` {row[1]}" for idx, row in enumerate(CORE_ISSUES))
    count_lines = "\n".join(f"- `{name}`: {count} rows" for name, count in counts.items())
    month_lines = "\n".join(f"- 2022-{month:02d}: {monthly[month]} documents" for month in range(1, 13))
    write_text(OUT / "README.md", f"""# AutoParts One Korea 2022 Business Source Seed

## Purpose
This isolated 2022 dataset tests report and handoff generation from fragmented operational source material. It is not a DB-ready seed and must not be inserted directly into PostgreSQL.

## Why it is separate
All outputs live under `dummy_data/2022/`. Existing dummy data, `05_db_seed_v2`, and `06_current_db_seed` are not modified by this generator.

## Core scenarios
{issue_lines}

## Generated row counts
{count_lines}

## Monthly document density
{month_lines}

## Usage
```bash
python scripts/generate_2022_source_seed.py
python dummy_data/2022/06_loader_preview/load_2022_source_seed_preview.py
```

The loader is preview-only. Review `05_mapping/`, current DB constraints, and preview validation results before implementing any real import. Expected outputs are test references and must never be mixed into service upload input.
""")


def validate(documents: list[dict[str, str]], csv_sets: dict[str, list[dict[str, object]]], monthly: Counter) -> list[str]:
    errors = []
    if len(documents) < 120:
        errors.append("source documents below 120")
    per_issue = Counter(row["related_issue_id"] for row in documents)
    for issue in CORE_ISSUES:
        if per_issue[issue[0]] < 10:
            errors.append(f"{issue[0]} has fewer than 10 documents")
    for month in range(1, 13):
        if monthly[month] < 8:
            errors.append(f"2022-{month:02d} has fewer than 8 documents")
    for row in documents:
        if not (OUT / row["file_path"]).exists():
            errors.append(f"missing document: {row['file_path']}")
        if not ("2022-01-01" <= row["created_date"] <= "2022-12-31"):
            errors.append(f"document date out of range: {row['doc_id']}")
    for name, rows in csv_sets.items():
        date_keys = [key for key in rows[0] if key.endswith("_date")] if rows else []
        for row in rows:
            for key in date_keys:
                value = str(row.get(key, ""))
                if value and not ("2022-01-01" <= value <= "2022-12-31"):
                    errors.append(f"{name} date out of range: {key}={value}")
    return errors


def main() -> None:
    for folder in DOC_TYPES:
        (RAW / folder).mkdir(parents=True, exist_ok=True)

    write_csv(MASTER / "employees.csv", ["employee_id", "name", "team", "role", "permission_level", "email"], [dict(zip(["employee_id", "name", "team", "role", "permission_level", "email"], row)) for row in EMPLOYEES])
    write_csv(MASTER / "customers.csv", ["customer_id", "customer_name", "region", "main_contact", "internal_owner", "risk_level", "notes"], [dict(zip(["customer_id", "customer_name", "region", "main_contact", "internal_owner", "risk_level", "notes"], row)) for row in CUSTOMERS])
    write_csv(MASTER / "suppliers.csv", ["supplier_id", "supplier_name", "region", "main_products", "default_lead_time_days", "risk_type", "notes"], [dict(zip(["supplier_id", "supplier_name", "region", "main_products", "default_lead_time_days", "risk_type", "notes"], row)) for row in SUPPLIERS])
    write_csv(MASTER / "products.csv", ["product_id", "product_name", "category", "main_supplier", "unit_price", "safety_stock_qty"], [dict(zip(["product_id", "product_name", "category", "main_supplier", "unit_price", "safety_stock_qty"], row)) for row in PRODUCTS])

    documents, monthly = build_documents()
    issue_rows = [dict(zip(["issue_id", "issue_title", "issue_type", "start_date", "end_date", "related_customer_id", "related_supplier_id", "related_product_id", "related_teams", "severity", "status", "description"], row)) for row in ISSUES]
    orders = build_orders()
    purchase_orders = build_purchase_orders()
    shipments = build_shipments()
    claims = build_claims()
    csv_sets = {"orders.csv": orders, "purchase_orders.csv": purchase_orders, "shipments.csv": shipments, "claims.csv": claims, "issue_events.csv": issue_rows, "source_document_index.csv": documents}

    headers = {
        "orders.csv": ["order_id", "order_date", "customer_id", "product_id", "quantity", "requested_delivery_date", "order_status", "sales_owner", "related_issue_id"],
        "purchase_orders.csv": ["po_id", "po_date", "supplier_id", "product_id", "quantity", "expected_arrival_date", "actual_arrival_date", "po_status", "purchase_owner", "related_issue_id"],
        "shipments.csv": ["shipment_id", "shipment_date", "customer_id", "product_id", "quantity", "carrier", "shipping_method", "expected_delivery_date", "actual_delivery_date", "shipment_status", "logistics_owner", "related_issue_id"],
        "claims.csv": ["claim_id", "claim_date", "customer_id", "product_id", "defect_type", "defect_quantity", "severity", "claim_status", "quality_owner", "related_issue_id"],
        "issue_events.csv": ["issue_id", "issue_title", "issue_type", "start_date", "end_date", "related_customer_id", "related_supplier_id", "related_product_id", "related_teams", "severity", "status", "description"],
        "source_document_index.csv": ["doc_id", "file_path", "doc_type", "created_date", "author", "related_team", "related_customer_id", "related_supplier_id", "related_product_id", "related_issue_id", "summary_hint"],
    }
    for name, rows in csv_sets.items():
        write_csv(STRUCTURED / name, headers[name], rows)

    build_expected_outputs()
    build_mapping_files()
    build_preview_files()
    counts = {name: len(rows) for name, rows in csv_sets.items()}
    build_readme(counts, monthly)
    errors = validate(documents, csv_sets, monthly)

    print(f"generated root: {OUT}")
    print(f"source documents: {len(documents)}")
    print(f"monthly minimum: {min(monthly.values())}")
    print(f"core issues: {len(CORE_ISSUES)}")
    print(f"general issues: {len(GENERAL_ISSUES)}")
    for name, count in counts.items():
        print(f"{name}: {count}")
    print("expected outputs: 3")
    print("mapping files: 5")
    print("loader preview created: True")
    print(f"date/path validation: {'OK' if not errors else 'FAIL'}")
    print("sensitive data included: False")
    if errors:
        raise SystemExit("\n".join(errors[:20]))


if __name__ == "__main__":
    main()
