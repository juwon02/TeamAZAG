from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DUMMY = ROOT / "dummy_data"
CSV_DIR = DUMMY / "03_structured_csv"
EXPECTED = DUMMY / "04_expected_outputs_for_test"
START_DATE = "2026-07-01"
END_DATE = "2026-12-31"


@dataclass(frozen=True)
class Scenario:
    num: int
    issue_id: str
    title: str
    issue_type: str
    start_date: str
    mid_date: str
    end_date: str
    customer_id: str
    customer: str
    supplier_id: str
    supplier: str
    product_id: str
    product: str
    teams: str
    severity: str
    status: str
    owner: str
    purchase_owner: str
    logistics_owner: str
    quality_owner: str
    description: str


SCENARIOS = [
    Scenario(10, "ISSUE-2026-010", "Hyundai Mobis Tier2 납기 일정 반복 변경 긴급 주문", "messy_due_date_change", "2026-07-08", "2026-07-18", "2026-07-29", "CUS-001", "Hyundai Mobis Tier2", "SUP-003", "Yazaki Parts Asia", "AP-WH-220", "AP-WH-220 와이어하네스", "영업관리팀;구매팀;물류팀", "High", "in_progress", "박서연", "최유진", "윤예린", "한지우", "고객 긴급 주문, 구매처 생산 일정 변경, 물류 출고 가능일이 서로 다르게 전달되어 확정 납기와 임시 납기가 섞인 상황"),
    Scenario(11, "ISSUE-2026-011", "Daesung Automotive 케이블 클레임 원인 불명확", "messy_claim_or_logistics_damage", "2026-08-04", "2026-08-12", "2026-08-22", "CUS-002", "Daesung Automotive", "SUP-005", "Local Cable Works", "AP-CB-510", "AP-CB-510 케이블 어셈블리", "품질 클레임팀;물류팀;영업관리팀", "Medium", "in_progress", "정하늘", "강민호", "윤예린", "한지우", "고객은 외관 이상을 제기했지만 생산 불량인지 운송 중 박스 손상인지 원인이 확정되지 않은 상황"),
    Scenario(12, "ISSUE-2026-012", "TE Connectivity Korea 단가 인상 공지와 구두 합의 충돌", "messy_price_conflict", "2026-09-01", "2026-09-14", "2026-09-26", "CUS-004", "Hanil Motors", "SUP-001", "TE Connectivity Korea", "AP-CN-204", "AP-CN-204 커넥터", "구매팀;영업관리팀;운영총괄팀", "High", "in_progress", "정하늘", "최유진", "윤예린", "김도윤", "공식 단가 인상 공지와 이전 구두 합의가 충돌하여 고객 단가 제안 기준과 마진 영향 계산이 불확실한 상황"),
    Scenario(13, "ISSUE-2026-013", "Global Harness Vietnam 월말 출고 확인 누락", "messy_month_end_shipment_confirmation", "2026-10-24", "2026-10-30", "2026-11-05", "CUS-005", "Global Harness Vietnam", "SUP-004", "JST Components", "AP-TM-118", "AP-TM-118 터미널", "물류팀;영업관리팀;운영총괄팀", "Medium", "closed", "이민재", "강민호", "윤예린", "한지우", "시스템상 출고 완료이나 고객 수령 확인이 늦게 도착해 월말 매출 인식 여부가 흔들린 상황"),
    Scenario(14, "ISSUE-2026-014", "Mirae EV Systems 담당자 휴가 중 임시 인수인계 누락", "messy_temporary_coverage_gap", "2026-12-05", "2026-12-12", "2026-12-20", "CUS-003", "Mirae EV Systems", "SUP-002", "KET Supplier", "AP-RL-450", "AP-RL-450 릴레이", "영업관리팀;구매팀", "Medium", "in_progress", "이민재", "최유진", "윤예린", "한지우", "담당자 휴가 중 고객 요청 일부가 임시 담당자에게 전달되지 않아 회신 지연과 Todo 누락이 발생한 상황"),
    Scenario(15, "ISSUE-2026-015", "Hanil Motors 대체품 승인과 원품 재입고 일정 혼선", "messy_substitute_approval_conflict", "2026-11-18", "2026-12-03", "2026-12-28", "CUS-004", "Hanil Motors", "SUP-005", "Local Cable Works", "AP-CB-510", "AP-CB-510 케이블 어셈블리", "영업관리팀;구매팀;품질 클레임팀;물류팀", "High", "in_progress", "정하늘", "강민호", "윤예린", "한지우", "대체품 선출고 가능성, 원품 재입고 일정, 고객 승인 조건이 문서마다 다르게 남아 확정 가능한 조치가 불명확한 상황"),
]


DOC_PLANS = [
    ("sales_emails", "고객 최초 요청 메일", "customer initial request", "start"),
    ("purchase_emails", "구매처 1차 회신", "supplier first reply", "start"),
    ("chat_logs", "내부 긴급 채팅", "internal urgent chat", "start"),
    ("logistics_logs", "물류 가능일 확인 로그", "logistics availability log", "mid"),
    ("sales_emails", "고객 추가 확인 메일", "customer follow up", "mid"),
    ("meeting_notes", "운영 회의 메모", "ops meeting note", "mid"),
    ("purchase_emails", "구매처 재확인 메일", "supplier recheck", "mid"),
    ("chat_logs", "담당자 간 단문 채팅", "short internal chat", "mid"),
    ("quality_claims", "품질 확인 초안", "quality draft", "mid"),
    ("logistics_logs", "출고 상태 정정 로그", "shipment correction log", "end"),
    ("sales_emails", "고객 회신 지연 관련 메일", "delayed reply mail", "end"),
    ("meeting_notes", "월간 리스크 회의 메모", "monthly risk note", "end"),
    ("purchase_emails", "구매 조건 확인 메일", "purchase condition mail", "end"),
    ("chat_logs", "인수인계 확인 채팅", "handoff check chat", "end"),
]


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def append_rows(path: Path, key: str, rows: list[dict[str, str]]) -> int:
    existing = read_rows(path)
    existing_ids = {row[key] for row in existing}
    new_rows = [row for row in rows if row[key] not in existing_ids]
    if not new_rows:
        return 0
    with path.open("a", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(existing[0].keys()))
        for row in new_rows:
            writer.writerow({field: row.get(field, "") for field in writer.fieldnames})
    return len(new_rows)


def write_text_once(path: Path, text: str) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        return False
    path.write_text(text, encoding="utf-8")
    return True


def doc_id(scenario: Scenario, idx: int) -> str:
    return f"DOC-2026-{scenario.num:03d}-MESSY-{idx:03d}"


def doc_date(scenario: Scenario, phase: str) -> str:
    if phase == "start":
        return scenario.start_date
    if phase == "end":
        return scenario.end_date
    return scenario.mid_date


def doc_author(scenario: Scenario, folder: str) -> str:
    if folder == "purchase_emails":
        return scenario.purchase_owner
    if folder == "logistics_logs":
        return scenario.logistics_owner
    if folder == "quality_claims":
        return scenario.quality_owner
    if folder == "meeting_notes":
        return "김도윤"
    return scenario.owner


def messy_body(scenario: Scenario, idx: int, label: str, date_value: str) -> str:
    uncertain = ["아마", "일단", "확인 중", "다음 주 초 예상", "가능하면", "우선 급한 건", "잠정", "최종 아님"]
    fragments = [
        "메일에는 급하다고 되어 있는데 채팅에서는 아직 확정 전이라고 적혀 있습니다.",
        "고객명, 구매처명, 품목명이 본문 중간에 섞여 있어 자동 추출이 헷갈릴 수 있습니다.",
        "같은 요청이 두 번 반복되었고 한 번은 날짜가 수정되었습니다.",
        "담당자는 적혀 있지만 최종 승인자가 누구인지는 다시 확인해야 합니다.",
        "리스크는 납기, 단가, 품질, 출고 확인 중 어디에 걸리는지 문서마다 표현이 다릅니다.",
        "다음 액션은 회신, 재확인, 승인 요청이 섞여 있고 우선순위가 명확하지 않습니다.",
    ]
    return "\n".join(
        [
            f"# {label}: {scenario.title}",
            "",
            "## 메타데이터",
            f"- doc_id: {doc_id(scenario, idx)}",
            f"- related_issue_id: {scenario.issue_id}",
            f"- created_date: {date_value}",
            f"- customer: {scenario.customer}",
            f"- supplier: {scenario.supplier}",
            f"- product: {scenario.product}",
            "",
            "## 본문",
            f"{uncertain[idx % len(uncertain)]} {scenario.customer} / {scenario.product} 건입니다. {scenario.description}",
            f"담당자는 {scenario.owner}으로 보이나 구매 {scenario.purchase_owner}, 물류 {scenario.logistics_owner}, 품질 {scenario.quality_owner}가 각자 다른 메모를 남겼습니다.",
            fragments[idx % len(fragments)],
            fragments[(idx + 2) % len(fragments)],
            "요청사항: 고객 회신 전 최신 날짜와 수량을 다시 맞춰야 합니다.",
            "리스크: 임시 정보가 보고서에서 확정처럼 쓰이면 안 됩니다.",
            "다음 액션: 담당자, 요청사항, 리스크, 다음 액션을 분리해서 재확인합니다.",
            "",
        ]
    )


def build_issue_rows() -> list[dict[str, str]]:
    return [
        {
            "issue_id": s.issue_id,
            "issue_title": s.title,
            "issue_type": s.issue_type,
            "start_date": s.start_date,
            "end_date": s.end_date,
            "related_customer_id": s.customer_id,
            "related_supplier_id": s.supplier_id,
            "related_product_id": s.product_id,
            "related_teams": s.teams,
            "severity": s.severity,
            "status": s.status,
            "description": s.description,
        }
        for s in SCENARIOS
    ]


def build_doc_rows() -> tuple[list[dict[str, str]], int]:
    existing_docs = {row["doc_id"]: row for row in read_rows(CSV_DIR / "source_document_index.csv")}
    rows: list[dict[str, str]] = []
    written = 0
    for scenario in SCENARIOS:
        for idx, (folder, doc_type, label, phase) in enumerate(DOC_PLANS, 1):
            current_doc_id = doc_id(scenario, idx)
            if current_doc_id in existing_docs:
                rows.append(existing_docs[current_doc_id])
                continue
            date_value = doc_date(scenario, phase)
            file_path = f"02_raw_documents/{folder}/{current_doc_id}_{scenario.issue_type}_{date_value}.md"
            if write_text_once(DUMMY / file_path, messy_body(scenario, idx, label, date_value)):
                written += 1
            rows.append(
                {
                    "doc_id": current_doc_id,
                    "file_path": file_path,
                    "doc_type": doc_type,
                    "created_date": date_value,
                    "author": doc_author(scenario, folder),
                    "related_team": scenario.teams.split(";")[0],
                    "related_customer_id": scenario.customer_id,
                    "related_supplier_id": scenario.supplier_id,
                    "related_product_id": scenario.product_id,
                    "related_issue_id": scenario.issue_id,
                    "summary_hint": f"{scenario.title} 관련 비정형 자료. 담당자, 요청사항, 리스크, 다음 액션 포함",
                }
            )
    return rows, written


def build_business_rows() -> dict[str, list[dict[str, str]]]:
    orders = []
    purchase_orders = []
    shipments = []
    claims = []
    for scenario in SCENARIOS:
        suffix = f"{scenario.num:03d}"
        quantity = str(800 + scenario.num * 35)
        orders.append(
            {
                "order_id": f"ORD-MESSY-2026-{suffix}",
                "order_date": scenario.start_date,
                "customer_id": scenario.customer_id,
                "product_id": scenario.product_id,
                "quantity": quantity,
                "requested_delivery_date": scenario.end_date,
                "order_status": scenario.status,
                "sales_owner": scenario.owner,
                "related_issue_id": scenario.issue_id,
            }
        )
        purchase_orders.append(
            {
                "po_id": f"PO-MESSY-2026-{suffix}",
                "po_date": scenario.start_date,
                "supplier_id": scenario.supplier_id,
                "product_id": scenario.product_id,
                "quantity": quantity,
                "expected_arrival_date": scenario.end_date,
                "actual_arrival_date": scenario.end_date if scenario.status == "closed" else "",
                "po_status": "Closed" if scenario.status == "closed" else "Open",
                "purchase_owner": scenario.purchase_owner,
                "related_issue_id": scenario.issue_id,
            }
        )
        shipments.append(
            {
                "shipment_id": f"SHP-MESSY-2026-{suffix}",
                "shipment_date": scenario.mid_date,
                "customer_id": scenario.customer_id,
                "product_id": scenario.product_id,
                "quantity": quantity,
                "carrier": "CJ Logistics",
                "shipping_method": "Ocean" if scenario.customer_id == "CUS-005" else "Truck",
                "expected_delivery_date": scenario.end_date,
                "actual_delivery_date": scenario.end_date if scenario.status == "closed" else "",
                "shipment_status": scenario.status,
                "logistics_owner": scenario.logistics_owner,
                "related_issue_id": scenario.issue_id,
            }
        )
        claims.append(
            {
                "claim_id": f"CLM-MESSY-2026-{suffix}",
                "claim_date": scenario.end_date,
                "customer_id": scenario.customer_id,
                "product_id": scenario.product_id,
                "defect_type": scenario.issue_type,
                "defect_quantity": "0" if scenario.num in {10, 12, 14} else "24",
                "severity": scenario.severity,
                "claim_status": scenario.status,
                "quality_owner": scenario.quality_owner,
                "related_issue_id": scenario.issue_id,
            }
        )
    return {
        "orders.csv": orders,
        "purchase_orders.csv": purchase_orders,
        "shipments.csv": shipments,
        "claims.csv": claims,
    }


def write_expected_outputs() -> int:
    expected_files = {
        "expected_monthly_report_messy_price_conflict_2026_09.md": """# 2026-09 월간 보고서 expected output

## 기준 이슈
- ISSUE-2026-012: TE Connectivity Korea 단가 인상 공지와 구두 합의 충돌

## 기대되는 보고서 성격
- 공식 공지와 구두 합의가 충돌한다는 점을 명시한다.
- 고객 단가 제안은 확정값처럼 쓰지 않는다.
- 마진 영향 계산은 자료 불일치와 담당자 확인 필요 항목으로 남긴다.
- 구매팀, 영업관리팀, 운영총괄팀의 확인 범위를 분리한다.
- 너무 깔끔한 결론 대신 미확정 정보와 다음 액션을 포함한다.
""",
        "expected_handoff_temporary_coverage_gap_2026_12.md": """# 2026-12 인수인계 expected output

## 기준 이슈
- ISSUE-2026-014: Mirae EV Systems 담당자 휴가 중 임시 인수인계 누락

## 기대되는 인수인계 성격
- 휴가 전 전달 메모가 불완전하다는 점을 표시한다.
- 고객 요청이 메일과 채팅에 나뉘어 있음을 유지한다.
- 임시 담당자가 확정되지 않은 Todo를 임의로 완료 처리하지 않는다.
- 회신 지연 원인과 다음 확인 담당자를 분리한다.
- 결론보다 확인 필요 항목, 누락 가능성, 다음 액션을 우선 노출한다.
""",
    }
    count = 0
    for name, content in expected_files.items():
        if write_text_once(EXPECTED / name, content):
            count += 1
    return count


def main() -> None:
    issue_rows = build_issue_rows()
    doc_rows, written_docs = build_doc_rows()
    business_rows = build_business_rows()
    expected_count = write_expected_outputs()

    added = {
        "issue_events.csv": append_rows(CSV_DIR / "issue_events.csv", "issue_id", issue_rows),
        "source_document_index.csv": append_rows(CSV_DIR / "source_document_index.csv", "doc_id", doc_rows),
    }
    for name, rows in business_rows.items():
        key = {
            "orders.csv": "order_id",
            "purchase_orders.csv": "po_id",
            "shipments.csv": "shipment_id",
            "claims.csv": "claim_id",
        }[name]
        added[name] = append_rows(CSV_DIR / name, key, rows)

    missing = [row["file_path"] for row in doc_rows if not (DUMMY / row["file_path"]).exists()]
    range_ok = all(START_DATE <= row["created_date"] <= END_DATE for row in doc_rows)

    print(f"추가된 issue 수: {added['issue_events.csv']}")
    print(f"추가된 raw document 수: {written_docs}")
    print("수정된 CSV 목록:")
    for name, count in added.items():
        print(f"- {name}: {count} rows")
    print(f"추가된 expected output 수: {expected_count}")
    print(f"날짜 범위 검증 결과: {'OK' if range_ok else 'FAIL'}")
    print(f"source_document_index 경로 검증 결과: {'OK' if not missing else 'FAIL'}")
    print("05_db_seed_v2 수정 여부: False")
    print("실제 DB insert 여부: False")


if __name__ == "__main__":
    main()
