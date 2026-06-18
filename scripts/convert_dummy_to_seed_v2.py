from __future__ import annotations

import csv
import shutil
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DUMMY = ROOT / "dummy_data"
OUT = DUMMY / "05_db_seed_v2"
PROJECT_ID = "PROJ-001"
TEAM_ID = "TEAM-001"
START_DATE = date(2025, 6, 1)
END_DATE = date(2026, 6, 1)
NOW = "2026-06-01T09:00:00"

SEED_TABLES = [
    "teams.csv",
    "users.csv",
    "projects.csv",
    "project_members.csv",
    "departments.csv",
    "department_members.csv",
    "customers.csv",
    "suppliers.csv",
    "products.csv",
    "business_entities.csv",
    "customer_orders.csv",
    "purchase_orders.csv",
    "shipments.csv",
    "quality_claims.csv",
    "supplier_notices.csv",
    "approval_requests.csv",
    "documents.csv",
    "issues.csv",
    "todos.csv",
    "calendar_events.csv",
    "entity_links.csv",
    "weekly_reports.csv",
    "monthly_reports.csv",
    "report_sources.csv",
    "handoff_reports.csv",
    "handoff_sources.csv",
    "ai_summaries.csv",
]

DATE_FIELDS = {
    "teams.csv": ["created_at", "updated_at"],
    "users.csv": ["created_at", "updated_at"],
    "projects.csv": ["created_at", "updated_at"],
    "project_members.csv": ["created_at", "updated_at"],
    "departments.csv": ["created_at", "updated_at"],
    "department_members.csv": ["joined_at"],
    "customers.csv": ["created_at", "updated_at"],
    "suppliers.csv": ["created_at", "updated_at"],
    "products.csv": ["created_at", "updated_at"],
    "business_entities.csv": ["occurred_at", "due_at", "created_at", "updated_at", "deleted_at"],
    "customer_orders.csv": ["order_date", "requested_delivery_date", "created_at", "updated_at"],
    "purchase_orders.csv": ["po_date", "expected_arrival_date", "actual_arrival_date", "created_at", "updated_at"],
    "shipments.csv": ["shipment_date", "expected_delivery_date", "actual_delivery_date", "created_at", "updated_at"],
    "quality_claims.csv": ["first_claim_date", "latest_claim_date", "created_at", "updated_at"],
    "supplier_notices.csv": ["notice_date", "created_at", "updated_at"],
    "approval_requests.csv": ["requested_at", "decided_at", "created_at", "updated_at"],
    "documents.csv": ["created_date", "created_at", "updated_at"],
    "issues.csv": ["detected_at", "due_at", "created_at", "updated_at"],
    "todos.csv": ["due_at", "created_at", "updated_at"],
    "calendar_events.csv": ["start_at", "end_at", "created_at", "updated_at"],
    "entity_links.csv": ["created_at"],
    "weekly_reports.csv": ["period_start", "period_end", "created_at", "updated_at"],
    "monthly_reports.csv": ["period_start", "period_end", "created_at", "updated_at"],
    "report_sources.csv": ["created_at"],
    "handoff_reports.csv": ["created_at", "updated_at"],
    "handoff_sources.csv": ["created_at"],
    "ai_summaries.csv": ["created_at", "updated_at"],
}


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
    d = parse_date(value)
    if d < START_DATE:
        return START_DATE
    if d > END_DATE:
        return END_DATE
    return d


def dstr(value: str | date | None) -> str:
    return clamp_date(value).isoformat()


def dtstr(value: str | date | None) -> str:
    return f"{dstr(value)}T09:00:00"


def add_days(value: str | date, days: int) -> str:
    return dstr(clamp_date(value) + timedelta(days=days))


def split_ids(value: str) -> list[str]:
    return [x.strip() for x in (value or "").split(";") if x.strip()]


def ai_issue_id(issue_id: str) -> str:
    return f"AI-{issue_id.replace('_', '-').upper()}"


def priority_from_severity(severity: str) -> str:
    severity = (severity or "").lower()
    if severity == "high":
        return "high"
    if severity == "medium":
        return "medium"
    return "low"


def status_norm(value: str) -> str:
    return (value or "open").strip().lower().replace(" ", "_")


def short_preview(path: Path, limit: int = 240) -> str:
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = path.read_text(encoding="utf-8-sig")
    text = " ".join(text.split())
    return text[:limit]


def safe_member_id(name: str, member_by_name: dict[str, str], default: str = "PM-001") -> str:
    return member_by_name.get(name, default)


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    employees = read_csv(DUMMY / "01_master_data" / "employees.csv")
    customers_src = read_csv(DUMMY / "01_master_data" / "customers.csv")
    suppliers_src = read_csv(DUMMY / "01_master_data" / "suppliers.csv")
    products_src = read_csv(DUMMY / "01_master_data" / "products.csv")
    orders_src = read_csv(DUMMY / "03_structured_csv" / "orders.csv")
    purchase_src = read_csv(DUMMY / "03_structured_csv" / "purchase_orders.csv")
    shipments_src = read_csv(DUMMY / "03_structured_csv" / "shipments.csv")
    claims_src = read_csv(DUMMY / "03_structured_csv" / "claims.csv")
    issues_src = read_csv(DUMMY / "03_structured_csv" / "issue_events.csv")
    documents_src = read_csv(DUMMY / "03_structured_csv" / "source_document_index.csv")

    users: list[dict[str, object]] = []
    project_members: list[dict[str, object]] = []
    member_by_name: dict[str, str] = {}
    for idx, emp in enumerate(employees, 1):
        user_id = f"USER-{idx:03d}"
        member_id = f"PM-{idx:03d}"
        users.append({
            "id": user_id,
            "name": emp["name"],
            "email": emp["email"],
            "role": emp["role"],
            "created_at": NOW,
            "updated_at": NOW,
        })
        project_members.append({
            "id": member_id,
            "project_id": PROJECT_ID,
            "user_id": user_id,
            "role": emp["permission_level"],
            "status": "active",
            "created_at": NOW,
            "updated_at": NOW,
        })
        member_by_name[emp["name"]] = member_id

    department_defs = [
        ("DEPT-001", "운영총괄팀", "OPS"),
        ("DEPT-002", "영업관리팀", "SALES"),
        ("DEPT-003", "구매팀", "PURCHASE"),
        ("DEPT-004", "품질 클레임팀", "QUALITY"),
        ("DEPT-005", "물류팀", "LOGISTICS"),
        ("DEPT-006", "시스템관리", "SYSTEM"),
    ]
    dept_by_team = {name: dep_id for dep_id, name, _ in department_defs}
    departments = []
    department_members = []
    for dep_id, name, code in department_defs:
        emp_for_dept = [e for e in employees if e["team"] == name]
        manager = emp_for_dept[0]["name"] if emp_for_dept else employees[0]["name"]
        departments.append({
            "id": dep_id,
            "project_id": PROJECT_ID,
            "name": name,
            "code": code,
            "manager_member_id": safe_member_id(manager, member_by_name),
            "status": "active",
            "created_at": NOW,
            "updated_at": NOW,
        })
    dep_member_no = 1
    for emp in employees:
        dep_id = dept_by_team.get(emp["team"], "DEPT-001")
        department_members.append({
            "id": f"DM-{dep_member_no:03d}",
            "department_id": dep_id,
            "project_member_id": safe_member_id(emp["name"], member_by_name),
            "position_title": emp["role"],
            "is_primary": "true",
            "joined_at": START_DATE.isoformat(),
        })
        dep_member_no += 1

    teams = [{
        "id": TEAM_ID,
        "name": "AutoParts One Korea",
        "description": "자동차 부품 B2B 운영관리 더미데이터 팀",
        "created_at": NOW,
        "updated_at": NOW,
    }]
    projects = [{
        "id": PROJECT_ID,
        "team_id": TEAM_ID,
        "name": "AutoParts One Korea 운영관리 프로젝트",
        "description": "고객 발주, 구매 지연, 품질 클레임, 물류 차질, 단가 변경, 인수인계 테스트용 프로젝트",
        "status": "active",
        "created_at": NOW,
        "updated_at": NOW,
    }]

    customers = []
    for row in customers_src:
        customers.append({
            "id": row["customer_id"],
            "project_id": PROJECT_ID,
            "customer_name": row["customer_name"],
            "region": row["region"],
            "main_contact": row["main_contact"],
            "internal_owner_member_id": safe_member_id(row["internal_owner"], member_by_name),
            "risk_level": row["risk_level"],
            "notes": row["notes"],
            "created_at": NOW,
            "updated_at": NOW,
        })

    suppliers = []
    for row in suppliers_src:
        suppliers.append({
            "id": row["supplier_id"],
            "project_id": PROJECT_ID,
            "supplier_name": row["supplier_name"],
            "region": row["region"],
            "main_products": row["main_products"],
            "default_lead_time_days": row["default_lead_time_days"],
            "risk_type": row["risk_type"],
            "notes": row["notes"],
            "created_at": NOW,
            "updated_at": NOW,
        })
    supplier_id_by_name = {s["supplier_name"]: s["id"] for s in suppliers}

    products = []
    for row in products_src:
        products.append({
            "id": row["product_id"],
            "project_id": PROJECT_ID,
            "product_name": row["product_name"],
            "category": row["category"],
            "main_supplier_id": supplier_id_by_name.get(row["main_supplier"], ""),
            "unit_price": row["unit_price"],
            "safety_stock_qty": row["safety_stock_qty"],
            "status": "active",
            "created_at": NOW,
            "updated_at": NOW,
        })

    business_entities: list[dict[str, object]] = []
    business_entity_by_source: dict[tuple[str, str], str] = {}
    business_entities_by_issue: dict[str, list[str]] = defaultdict(list)

    def add_be(prefix: str, number: int, entity_type: str, source_key: tuple[str, str], title: str, summary: str, status: str, priority: str, owner: str, department_id: str, occurred_at: str, due_at: str, related_issue_id: str = "") -> str:
        be_id = f"BE-{prefix}-{number:04d}"
        business_entities.append({
            "id": be_id,
            "project_id": PROJECT_ID,
            "entity_type": entity_type,
            "title": title,
            "summary": summary,
            "status": status_norm(status),
            "priority": priority,
            "owner_member_id": owner,
            "department_id": department_id,
            "occurred_at": dstr(occurred_at),
            "due_at": dstr(due_at),
            "created_at": dtstr(occurred_at),
            "updated_at": NOW,
            "deleted_at": "",
        })
        business_entity_by_source[source_key] = be_id
        if related_issue_id:
            business_entities_by_issue[related_issue_id].append(be_id)
        return be_id

    customer_orders = []
    for idx, row in enumerate(orders_src, 1):
        owner = safe_member_id(row["sales_owner"], member_by_name)
        be_id = add_be("ORDER", idx, "customer_order", ("order", row["order_id"]), f"고객 주문 {row['order_id']}", f"{row['customer_id']} {row['product_id']} {row['quantity']}개 주문", row["order_status"], "medium", owner, "DEPT-002", row["order_date"], row["requested_delivery_date"], row["related_issue_id"])
        customer_orders.append({
            "id": row["order_id"],
            "business_entity_id": be_id,
            "project_id": PROJECT_ID,
            "customer_id": row["customer_id"],
            "product_id": row["product_id"],
            "quantity": row["quantity"],
            "order_date": dstr(row["order_date"]),
            "requested_delivery_date": dstr(row["requested_delivery_date"]),
            "status": status_norm(row["order_status"]),
            "sales_owner_member_id": owner,
            "related_issue_id": row["related_issue_id"],
            "created_at": dtstr(row["order_date"]),
            "updated_at": NOW,
        })

    purchase_orders = []
    for idx, row in enumerate(purchase_src, 1):
        owner = safe_member_id(row["purchase_owner"], member_by_name)
        be_id = add_be("PO", idx, "purchase_order", ("purchase_order", row["po_id"]), f"구매 발주 {row['po_id']}", f"{row['supplier_id']} {row['product_id']} {row['quantity']}개 구매 발주", row["po_status"], "medium", owner, "DEPT-003", row["po_date"], row["expected_arrival_date"], row["related_issue_id"])
        purchase_orders.append({
            "id": row["po_id"],
            "business_entity_id": be_id,
            "project_id": PROJECT_ID,
            "supplier_id": row["supplier_id"],
            "product_id": row["product_id"],
            "quantity": row["quantity"],
            "po_date": dstr(row["po_date"]),
            "expected_arrival_date": dstr(row["expected_arrival_date"]),
            "actual_arrival_date": dstr(row["actual_arrival_date"]),
            "status": status_norm(row["po_status"]),
            "purchase_owner_member_id": owner,
            "related_issue_id": row["related_issue_id"],
            "created_at": dtstr(row["po_date"]),
            "updated_at": NOW,
        })

    shipments = []
    for idx, row in enumerate(shipments_src, 1):
        owner = safe_member_id(row["logistics_owner"], member_by_name)
        be_id = add_be("SHIP", idx, "shipment", ("shipment", row["shipment_id"]), f"출하 {row['shipment_id']}", f"{row['customer_id']} {row['product_id']} {row['quantity']}개 출하", row["shipment_status"], "medium", owner, "DEPT-005", row["shipment_date"], row["expected_delivery_date"], row["related_issue_id"])
        shipments.append({
            "id": row["shipment_id"],
            "business_entity_id": be_id,
            "project_id": PROJECT_ID,
            "customer_id": row["customer_id"],
            "product_id": row["product_id"],
            "quantity": row["quantity"],
            "shipment_date": dstr(row["shipment_date"]),
            "carrier": row["carrier"],
            "shipping_method": row["shipping_method"],
            "expected_delivery_date": dstr(row["expected_delivery_date"]),
            "actual_delivery_date": dstr(row["actual_delivery_date"]),
            "status": status_norm(row["shipment_status"]),
            "logistics_owner_member_id": owner,
            "related_issue_id": row["related_issue_id"],
            "created_at": dtstr(row["shipment_date"]),
            "updated_at": NOW,
        })

    quality_claims = []
    for idx, row in enumerate(claims_src, 1):
        owner = safe_member_id(row["quality_owner"], member_by_name)
        be_id = add_be("CLAIM", idx, "quality_claim", ("claim", row["claim_id"]), f"품질 클레임 {row['claim_id']}", f"{row['customer_id']} {row['product_id']} {row['defect_type']} {row['defect_quantity']}개", row["claim_status"], priority_from_severity(row["severity"]), owner, "DEPT-004", row["claim_date"], row["claim_date"], row["related_issue_id"])
        quality_claims.append({
            "id": row["claim_id"],
            "business_entity_id": be_id,
            "project_id": PROJECT_ID,
            "customer_id": row["customer_id"],
            "product_id": row["product_id"],
            "defect_type": row["defect_type"],
            "defect_quantity": row["defect_quantity"],
            "severity": row["severity"],
            "status": status_norm(row["claim_status"]),
            "quality_owner_member_id": owner,
            "first_claim_date": dstr(row["claim_date"]),
            "latest_claim_date": dstr(row["claim_date"]),
            "related_issue_id": row["related_issue_id"],
            "created_at": dtstr(row["claim_date"]),
            "updated_at": NOW,
        })

    supplier_notice_types = {
        "SupplierStock": "stock_shortage",
        "LeadTimeChange": "lead_time_change",
        "PriceIncrease": "price_change",
        "InboundSplit": "supplier_delay",
        "SupplierReview": "supplier_notice",
    }
    supplier_notices = []
    for idx, row in enumerate([r for r in issues_src if r["issue_type"] in supplier_notice_types], 1):
        supplier_id = split_ids(row["related_supplier_id"])[0] if split_ids(row["related_supplier_id"]) else ""
        product_id = split_ids(row["related_product_id"])[0] if split_ids(row["related_product_id"]) else ""
        owner = safe_member_id("최유진", member_by_name)
        be_id = add_be("NOTICE", idx, "supplier_notice", ("supplier_notice", row["issue_id"]), row["issue_title"], row["description"], row["status"], priority_from_severity(row["severity"]), owner, "DEPT-003", row["start_date"], row["end_date"], row["issue_id"])
        supplier_notices.append({
            "id": f"SN-{idx:04d}",
            "business_entity_id": be_id,
            "project_id": PROJECT_ID,
            "supplier_id": supplier_id,
            "product_id": product_id,
            "notice_type": supplier_notice_types[row["issue_type"]],
            "title": row["issue_title"],
            "description": row["description"],
            "notice_date": dstr(row["start_date"]),
            "severity": row["severity"],
            "status": status_norm(row["status"]),
            "related_issue_id": row["issue_id"],
            "created_at": dtstr(row["start_date"]),
            "updated_at": NOW,
        })

    approval_issue_types = {"ExpediteShipping": "urgent_air_shipping", "PriceIncrease": "price_change", "AlternativePart": "alternative_supplier", "Handover": "customer_communication"}
    approval_requests = []
    for idx, row in enumerate([r for r in issues_src if r["issue_type"] in approval_issue_types], 1):
        requester = safe_member_id("박서연", member_by_name)
        approver = safe_member_id("김도윤", member_by_name)
        be_id = add_be("APPROVAL", idx, "approval_request", ("approval_request", row["issue_id"]), f"승인 요청: {row['issue_title']}", row["description"], row["status"], priority_from_severity(row["severity"]), requester, "DEPT-001", row["start_date"], row["end_date"], row["issue_id"])
        approval_requests.append({
            "id": f"APR-{idx:04d}",
            "business_entity_id": be_id,
            "project_id": PROJECT_ID,
            "request_title": f"승인 요청: {row['issue_title']}",
            "request_type": approval_issue_types[row["issue_type"]],
            "requester_member_id": requester,
            "approver_member_id": approver,
            "target_entity_id": business_entities_by_issue.get(row["issue_id"], [""])[0],
            "status": "approved" if row["status"] == "Closed" else "requested",
            "requested_at": dstr(row["start_date"]),
            "decided_at": dstr(row["end_date"]) if row["status"] == "Closed" else "",
            "description": row["description"],
            "related_issue_id": row["issue_id"],
            "created_at": dtstr(row["start_date"]),
            "updated_at": NOW,
        })

    documents = []
    for row in documents_src:
        if "04_expected_outputs_for_test" in row["file_path"]:
            continue
        raw_path = DUMMY / row["file_path"]
        documents.append({
            "id": row["doc_id"],
            "project_id": PROJECT_ID,
            "title": f"{row['doc_type']} - {row['doc_id']}",
            "file_path": row["file_path"],
            "doc_type": row["doc_type"],
            "created_date": dstr(row["created_date"]),
            "author": row["author"],
            "related_team": row["related_team"],
            "related_issue_id": row["related_issue_id"],
            "content_preview": short_preview(raw_path),
            "created_at": dtstr(row["created_date"]),
            "updated_at": NOW,
        })

    issues = []
    for row in issues_src:
        issues.append({
            "id": ai_issue_id(row["issue_id"]),
            "project_id": PROJECT_ID,
            "title": row["issue_title"],
            "issue_type": row["issue_type"],
            "severity": row["severity"],
            "status": status_norm(row["status"]),
            "description": row["description"],
            "detected_at": dstr(row["start_date"]),
            "due_at": dstr(row["end_date"]),
            "related_issue_id": row["issue_id"],
            "source": "dummy_seed",
            "created_at": dtstr(row["start_date"]),
            "updated_at": NOW,
        })

    todos = []
    todo_templates = [
        ("가능 수량과 고객 영향도 확인", "관련 문서와 CSV를 확인해 수량, 고객 영향도, 지연 사유를 정리합니다."),
        ("다음 액션 및 담당자 회신", "담당 부서 회신을 취합하고 미완료 항목을 업데이트합니다."),
    ]
    todo_no = 1
    for issue in issues_src:
        be_for_issue = business_entities_by_issue.get(issue["issue_id"], [""])[0]
        for offset, (suffix, desc) in enumerate(todo_templates, 1):
            due_at = add_days(issue["start_date"], 3 + offset)
            owner = safe_member_id("박서연" if issue["related_customer_id"] else "최유진", member_by_name)
            todos.append({
                "id": f"TODO-{todo_no:04d}",
                "project_id": PROJECT_ID,
                "title": f"{issue['issue_title']} - {suffix}",
                "description": desc,
                "status": "open" if issue["status"] != "Closed" else "done",
                "priority": priority_from_severity(issue["severity"]),
                "owner_member_id": owner,
                "due_at": due_at,
                "source_type": "issue",
                "source_id": ai_issue_id(issue["issue_id"]),
                "related_issue_id": issue["issue_id"],
                "created_at": dtstr(issue["start_date"]),
                "updated_at": NOW,
            })
            todo_no += 1

    calendar_events = []
    for idx, todo in enumerate(todos, 1):
        calendar_events.append({
            "id": f"CAL-{idx:04d}",
            "project_id": PROJECT_ID,
            "title": f"마감: {todo['title']}",
            "event_type": "todo_due",
            "start_at": dtstr(todo["due_at"]),
            "end_at": dtstr(todo["due_at"]),
            "related_todo_id": todo["id"],
            "related_issue_id": todo["related_issue_id"],
            "created_at": NOW,
            "updated_at": NOW,
        })

    entity_links = []
    link_no = 1

    def add_link(source_type: str, source_id: str, be_id: str, link_type: str, reason: str, score: str = "0.86") -> None:
        nonlocal link_no
        if not be_id:
            return
        entity_links.append({
            "id": f"EL-{link_no:05d}",
            "project_id": PROJECT_ID,
            "source_type": source_type,
            "source_id": source_id,
            "business_entity_id": be_id,
            "link_type": link_type,
            "link_reason": reason,
            "confidence_score": score,
            "created_at": NOW,
        })
        link_no += 1

    for doc in documents:
        for be_id in business_entities_by_issue.get(doc["related_issue_id"], [])[:6]:
            add_link("document", doc["id"], be_id, "source", "source_document_index.related_issue_id 기반 연결", "0.88")
    for issue in issues:
        for be_id in business_entities_by_issue.get(issue["related_issue_id"], [])[:8]:
            add_link("issue", issue["id"], be_id, "related", "issue_events.related_issue_id 기반 연결", "0.90")
    for todo in todos:
        for be_id in business_entities_by_issue.get(todo["related_issue_id"], [])[:3]:
            add_link("todo", todo["id"], be_id, "related", "Todo가 같은 issue_id 업무 객체를 참조", "0.82")

    report_issue_ids = ["ISS-2025-006", "ISS-2025-011", "ISS-2026-002"]
    weekly_reports = []
    for idx, issue_id in enumerate(report_issue_ids, 1):
        issue = next(r for r in issues_src if r["issue_id"] == issue_id)
        weekly_reports.append({
            "id": f"WR-{idx:04d}",
            "project_id": PROJECT_ID,
            "title": f"주간 보고서 seed - {issue['issue_title']}",
            "period_start": dstr(issue["start_date"]),
            "period_end": add_days(issue["start_date"], 6),
            "summary": issue["description"],
            "status": "draft",
            "source": "dummy_seed",
            "created_at": dtstr(issue["start_date"]),
            "updated_at": NOW,
        })

    monthly_issue_ids = ["ISS-2025-012", "ISS-2026-004", "ISS-2026-005"]
    monthly_reports = []
    for idx, issue_id in enumerate(monthly_issue_ids, 1):
        issue = next(r for r in issues_src if r["issue_id"] == issue_id)
        start = clamp_date(issue["start_date"]).replace(day=1)
        monthly_reports.append({
            "id": f"MR-{idx:04d}",
            "project_id": PROJECT_ID,
            "title": f"월간 보고서 seed - {issue['issue_title']}",
            "period_start": dstr(start),
            "period_end": dstr(min(END_DATE, start + timedelta(days=30))),
            "summary": issue["description"],
            "status": "draft",
            "source": "dummy_seed",
            "created_at": dtstr(issue["start_date"]),
            "updated_at": NOW,
        })

    report_sources = []
    rs_no = 1
    for report_type, reports in [("weekly_report", weekly_reports), ("monthly_report", monthly_reports)]:
        for report in reports:
            issue_id = next((i["issue_id"] for i in issues_src if i["issue_title"] in report["title"]), "")
            for be_id in business_entities_by_issue.get(issue_id, [])[:3]:
                report_sources.append({
                    "id": f"RS-{rs_no:04d}",
                    "project_id": PROJECT_ID,
                    "report_type": report_type,
                    "report_id": report["id"],
                    "source_type": "business_entity",
                    "source_id": be_id,
                    "business_entity_id": be_id,
                    "reason": "보고서 seed 검증용 업무 객체 참조",
                    "created_at": NOW,
                })
                add_link(report_type, report["id"], be_id, "summarized_in", "보고서가 업무 객체를 요약", "0.80")
                rs_no += 1
            for doc in [d for d in documents if d["related_issue_id"] == issue_id][:2]:
                report_sources.append({
                    "id": f"RS-{rs_no:04d}",
                    "project_id": PROJECT_ID,
                    "report_type": report_type,
                    "report_id": report["id"],
                    "source_type": "document",
                    "source_id": doc["id"],
                    "business_entity_id": business_entities_by_issue.get(issue_id, [""])[0],
                    "reason": "보고서 생성 근거 문서",
                    "created_at": NOW,
                })
                rs_no += 1

    handoff_reports = [{
        "id": "HR-0001",
        "project_id": PROJECT_ID,
        "title": "박서연에서 이민재로 고객 업무 인수인계 seed",
        "from_member_id": safe_member_id("박서연", member_by_name),
        "to_member_id": safe_member_id("이민재", member_by_name),
        "scope_summary": "Hyundai Mobis Tier2와 Daesung Automotive 고객 업무, 긴급 납품, 단가 인상, 미완료 Todo 범위",
        "generated_summary": "담당 고객별 납기 리스크, 공급처 회신, 단가 협상, 다음 액션을 issue_events와 todos 기반으로 요약한 seed입니다.",
        "status": "draft",
        "source": "dummy_seed",
        "created_at": NOW,
        "updated_at": NOW,
    }]
    handoff_sources = []
    hs_no = 1
    for issue_id in ["ISS-2026-005", "ISS-2026-004", "ISS-2026-002", "ISS-2025-006"]:
        for be_id in business_entities_by_issue.get(issue_id, [])[:4]:
            handoff_sources.append({
                "id": f"HS-{hs_no:04d}",
                "project_id": PROJECT_ID,
                "handoff_report_id": "HR-0001",
                "source_type": "business_entity",
                "source_id": be_id,
                "business_entity_id": be_id,
                "reason": "인수인계 범위에 포함된 고객/공급 업무 객체",
                "created_at": NOW,
            })
            add_link("handoff_report", "HR-0001", be_id, "handoff_scope", "인수인계서 범위 업무 객체", "0.92")
            hs_no += 1
        for todo in [t for t in todos if t["related_issue_id"] == issue_id][:2]:
            handoff_sources.append({
                "id": f"HS-{hs_no:04d}",
                "project_id": PROJECT_ID,
                "handoff_report_id": "HR-0001",
                "source_type": "todo",
                "source_id": todo["id"],
                "business_entity_id": business_entities_by_issue.get(issue_id, [""])[0],
                "reason": "인수인계 미완료 Todo",
                "created_at": NOW,
            })
            hs_no += 1

    ai_summaries = []
    for idx, doc in enumerate(documents[:30], 1):
        ai_summaries.append({
            "id": f"SUM-DOC-{idx:04d}",
            "project_id": PROJECT_ID,
            "source_type": "document",
            "source_id": doc["id"],
            "summary": doc["content_preview"][:180],
            "key_points": f"관련 이슈: {doc['related_issue_id']}; 관련팀: {doc['related_team']}",
            "created_at": NOW,
            "updated_at": NOW,
        })
    for idx, issue in enumerate(issues, 1):
        ai_summaries.append({
            "id": f"SUM-ISSUE-{idx:04d}",
            "project_id": PROJECT_ID,
            "source_type": "issue",
            "source_id": issue["id"],
            "summary": issue["description"][:180],
            "key_points": f"severity={issue['severity']}; status={issue['status']}",
            "created_at": NOW,
            "updated_at": NOW,
        })

    tables: dict[str, tuple[list[str], list[dict[str, object]]]] = {
        "teams.csv": (["id", "name", "description", "created_at", "updated_at"], teams),
        "users.csv": (["id", "name", "email", "role", "created_at", "updated_at"], users),
        "projects.csv": (["id", "team_id", "name", "description", "status", "created_at", "updated_at"], projects),
        "project_members.csv": (["id", "project_id", "user_id", "role", "status", "created_at", "updated_at"], project_members),
        "departments.csv": (["id", "project_id", "name", "code", "manager_member_id", "status", "created_at", "updated_at"], departments),
        "department_members.csv": (["id", "department_id", "project_member_id", "position_title", "is_primary", "joined_at"], department_members),
        "customers.csv": (["id", "project_id", "customer_name", "region", "main_contact", "internal_owner_member_id", "risk_level", "notes", "created_at", "updated_at"], customers),
        "suppliers.csv": (["id", "project_id", "supplier_name", "region", "main_products", "default_lead_time_days", "risk_type", "notes", "created_at", "updated_at"], suppliers),
        "products.csv": (["id", "project_id", "product_name", "category", "main_supplier_id", "unit_price", "safety_stock_qty", "status", "created_at", "updated_at"], products),
        "business_entities.csv": (["id", "project_id", "entity_type", "title", "summary", "status", "priority", "owner_member_id", "department_id", "occurred_at", "due_at", "created_at", "updated_at", "deleted_at"], business_entities),
        "customer_orders.csv": (["id", "business_entity_id", "project_id", "customer_id", "product_id", "quantity", "order_date", "requested_delivery_date", "status", "sales_owner_member_id", "related_issue_id", "created_at", "updated_at"], customer_orders),
        "purchase_orders.csv": (["id", "business_entity_id", "project_id", "supplier_id", "product_id", "quantity", "po_date", "expected_arrival_date", "actual_arrival_date", "status", "purchase_owner_member_id", "related_issue_id", "created_at", "updated_at"], purchase_orders),
        "shipments.csv": (["id", "business_entity_id", "project_id", "customer_id", "product_id", "quantity", "shipment_date", "carrier", "shipping_method", "expected_delivery_date", "actual_delivery_date", "status", "logistics_owner_member_id", "related_issue_id", "created_at", "updated_at"], shipments),
        "quality_claims.csv": (["id", "business_entity_id", "project_id", "customer_id", "product_id", "defect_type", "defect_quantity", "severity", "status", "quality_owner_member_id", "first_claim_date", "latest_claim_date", "related_issue_id", "created_at", "updated_at"], quality_claims),
        "supplier_notices.csv": (["id", "business_entity_id", "project_id", "supplier_id", "product_id", "notice_type", "title", "description", "notice_date", "severity", "status", "related_issue_id", "created_at", "updated_at"], supplier_notices),
        "approval_requests.csv": (["id", "business_entity_id", "project_id", "request_title", "request_type", "requester_member_id", "approver_member_id", "target_entity_id", "status", "requested_at", "decided_at", "description", "related_issue_id", "created_at", "updated_at"], approval_requests),
        "documents.csv": (["id", "project_id", "title", "file_path", "doc_type", "created_date", "author", "related_team", "related_issue_id", "content_preview", "created_at", "updated_at"], documents),
        "issues.csv": (["id", "project_id", "title", "issue_type", "severity", "status", "description", "detected_at", "due_at", "related_issue_id", "source", "created_at", "updated_at"], issues),
        "todos.csv": (["id", "project_id", "title", "description", "status", "priority", "owner_member_id", "due_at", "source_type", "source_id", "related_issue_id", "created_at", "updated_at"], todos),
        "calendar_events.csv": (["id", "project_id", "title", "event_type", "start_at", "end_at", "related_todo_id", "related_issue_id", "created_at", "updated_at"], calendar_events),
        "entity_links.csv": (["id", "project_id", "source_type", "source_id", "business_entity_id", "link_type", "link_reason", "confidence_score", "created_at"], entity_links),
        "weekly_reports.csv": (["id", "project_id", "title", "period_start", "period_end", "summary", "status", "source", "created_at", "updated_at"], weekly_reports),
        "monthly_reports.csv": (["id", "project_id", "title", "period_start", "period_end", "summary", "status", "source", "created_at", "updated_at"], monthly_reports),
        "report_sources.csv": (["id", "project_id", "report_type", "report_id", "source_type", "source_id", "business_entity_id", "reason", "created_at"], report_sources),
        "handoff_reports.csv": (["id", "project_id", "title", "from_member_id", "to_member_id", "scope_summary", "generated_summary", "status", "source", "created_at", "updated_at"], handoff_reports),
        "handoff_sources.csv": (["id", "project_id", "handoff_report_id", "source_type", "source_id", "business_entity_id", "reason", "created_at"], handoff_sources),
        "ai_summaries.csv": (["id", "project_id", "source_type", "source_id", "summary", "key_points", "created_at", "updated_at"], ai_summaries),
    }

    for filename in SEED_TABLES:
        headers, rows = tables[filename]
        write_csv(OUT / filename, headers, rows)

    validation = validate(tables)
    write_readme(validation, tables)

    print(f"생성된 seed 폴더 경로: {OUT}")
    print("생성된 seed CSV 파일 목록:")
    for filename in SEED_TABLES:
        print(f"- {filename}: {len(tables[filename][1])} rows")
    print(f"business_entities 개수: {len(business_entities)}")
    print(f"entity_links 개수: {len(entity_links)}")
    print(f"날짜 범위 초과 건수: {validation['date_overflow_count']}")
    print(f"business_entity_id 누락 건수: {validation['missing_business_entity_id_count']}")
    print(f"orphan link 건수: {validation['orphan_link_count']}")
    print(f"expected_outputs_for_test 사용 여부: {validation['expected_outputs_used']}")


def validate(tables: dict[str, tuple[list[str], list[dict[str, object]]]]) -> dict[str, object]:
    date_overflow = []
    for filename, (_, rows) in tables.items():
        for row in rows:
            for field in DATE_FIELDS.get(filename, []):
                value = str(row.get(field, "") or "")
                if not value:
                    continue
                try:
                    d = parse_date(value)
                except ValueError:
                    continue
                if d < START_DATE or d > END_DATE:
                    date_overflow.append(f"{filename}:{row.get('id')}:{field}={value}")

    missing_be = []
    for filename in ["customer_orders.csv", "purchase_orders.csv", "shipments.csv", "quality_claims.csv", "supplier_notices.csv", "approval_requests.csv"]:
        for row in tables[filename][1]:
            if not row.get("business_entity_id"):
                missing_be.append(f"{filename}:{row.get('id')}")

    be_ids = {row["id"] for row in tables["business_entities.csv"][1]}
    orphan_links = []
    for row in tables["entity_links.csv"][1]:
        if row["business_entity_id"] not in be_ids:
            orphan_links.append(row["id"])
    for filename in ["report_sources.csv", "handoff_sources.csv"]:
        for row in tables[filename][1]:
            be_id = row.get("business_entity_id")
            if be_id and be_id not in be_ids:
                orphan_links.append(f"{filename}:{row.get('id')}")

    expected_used = any(
        "04_expected_outputs_for_test" in str(row.get("file_path", ""))
        for row in tables["documents.csv"][1]
    )
    return {
        "date_overflow_count": len(date_overflow),
        "date_overflow": date_overflow,
        "missing_business_entity_id_count": len(missing_be),
        "missing_business_entity_id": missing_be,
        "orphan_link_count": len(orphan_links),
        "orphan_links": orphan_links,
        "expected_outputs_used": expected_used,
    }


def write_readme(validation: dict[str, object], tables: dict[str, tuple[list[str], list[dict[str, object]]]]) -> None:
    insert_order = "\n".join(f"{idx}. {name[:-4]}" for idx, name in enumerate(SEED_TABLES, 1))
    table_list = "\n".join(f"- `{name}`: {len(tables[name][1])} rows" for name in SEED_TABLES)
    text = f"""# OpsRadar2 v2 MVP Seed Data

> **Compatibility warning:** This folder targets an expanded candidate schema with tables such as `business_entities`, `entity_links`, and `approval_requests`. Those tables are not present in the current `SeongWoo-new2` `opsradar2/schema.sql`. Do not load these CSV files directly into the current database. Use `dummy_data/06_current_db_seed` for the current application schema.

## 1. 목적
이 seed 데이터는 기존 `dummy_data`의 원천 문서와 flat CSV를 OpsRadar2 v2 MVP DB 구조에 맞게 적재하기 위한 CSV 묶음입니다.

## 2. 원본 dummy_data와 v2 seed의 차이
원본은 문서와 업무 CSV를 분리해 AI 분석 입력을 검증하는 구조입니다. v2 seed는 `business_entities`를 중심으로 주문, 구매, 출하, 클레임, 공급처 공지, 승인 요청, AI 결과물을 연결합니다.

## 3. 생성된 테이블 목록
{table_list}

## 4. business_entities 역할
`business_entities`는 실제 업무 객체의 허브입니다. customer_order, purchase_order, shipment, quality_claim, supplier_notice, approval_request가 모두 하나의 업무 객체 ID를 가집니다.

## 5. entity_links 역할
`entity_links`는 문서, 이슈, Todo, 보고서, 인수인계서가 어떤 업무 객체와 연결되는지 저장합니다. AI 결과가 실제 업무 데이터로 추적될 수 있게 하는 핵심 연결 테이블입니다.

## 6. report_sources / handoff_sources 역할
`report_sources`는 주간/월간 보고서가 참조한 업무 객체, 문서, 이슈를 저장합니다. `handoff_sources`는 인수인계서가 포함한 업무 객체와 Todo를 저장합니다.

## 7. expected_outputs_for_test 제외 이유
`04_expected_outputs_for_test`는 검증용 정답 샘플입니다. 실제 seed 입력으로 사용하면 AI 결과와 입력 데이터가 섞여 평가가 오염될 수 있어 제외했습니다.

## 8. DB insert 권장 순서
{insert_order}

## 9. 검증 결과 요약
- 날짜 범위 초과 건수: {validation['date_overflow_count']}
- business_entity_id 누락 건수: {validation['missing_business_entity_id_count']}
- orphan link 건수: {validation['orphan_link_count']}
- expected_outputs_for_test 사용 여부: {validation['expected_outputs_used']}

## 재생성 명령어
```bash
python scripts/convert_dummy_to_seed_v2.py
```
"""
    (OUT / "README.md").write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
