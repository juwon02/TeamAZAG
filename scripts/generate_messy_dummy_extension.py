from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DUMMY = ROOT / "dummy_data"
RAW = DUMMY / "02_raw_documents"
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
    Scenario(
        10,
        "ISSUE-2026-010",
        "Hyundai Mobis Tier2 납기 일정 반복 변경 긴급 주문",
        "messy_due_date_change",
        "2026-07-08",
        "2026-07-29",
        "CUS-001",
        "Hyundai Mobis Tier2",
        "SUP-003",
        "Yazaki Parts Asia",
        "AP-WH-220",
        "AP-WH-220 와이어하네스",
        "영업관리팀;구매팀;물류팀",
        "High",
        "in_progress",
        "박서연",
        "최유진",
        "윤예린",
        "한지우",
        "고객 긴급 주문과 구매처 생산 일정 변경, 물류 출고 가능일 확인이 서로 다르게 전달되어 확정 납기와 임시 납기가 혼재된 이슈",
    ),
    Scenario(
        11,
        "ISSUE-2026-011",
        "Daesung Automotive 케이블 클레임 원인 불명확",
        "messy_claim_or_logistics_damage",
        "2026-08-04",
        "2026-08-22",
        "CUS-002",
        "Daesung Automotive",
        "SUP-005",
        "Local Cable Works",
        "AP-CB-510",
        "AP-CB-510 케이블 어셈블리",
        "품질 클레임팀;물류팀;영업관리팀",
        "Medium",
        "in_progress",
        "정하늘",
        "강민호",
        "윤예린",
        "한지우",
        "고객은 외관 이상을 제기했지만 생산 불량인지 운송 중 박스 손상인지 원인이 확정되지 않은 클레임 이슈",
    ),
    Scenario(
        12,
        "ISSUE-2026-012",
        "TE Connectivity Korea 단가 인상 공지와 구두 합의 충돌",
        "messy_price_conflict",
        "2026-09-01",
        "2026-09-26",
        "CUS-004",
        "Hanil Motors",
        "SUP-001",
        "TE Connectivity Korea",
        "AP-CN-204",
        "AP-CN-204 커넥터",
        "구매팀;영업관리팀;운영총괄팀",
        "High",
        "in_progress",
        "정하늘",
        "최유진",
        "윤예린",
        "김도윤",
        "공식 단가 인상 공지와 이전 구두 합의가 충돌하여 고객 단가 제안 기준과 마진 영향 계산이 불확실한 이슈",
    ),
    Scenario(
        13,
        "ISSUE-2026-013",
        "Global Harness Vietnam 월말 출고 확인 누락",
        "messy_month_end_shipment_confirmation",
        "2026-10-24",
        "2026-11-05",
        "CUS-005",
        "Global Harness Vietnam",
        "SUP-004",
        "JST Components",
        "AP-TM-118",
        "AP-TM-118 터미널",
        "물류팀;영업관리팀;운영총괄팀",
        "Medium",
        "closed",
        "이민재",
        "강민호",
        "윤예린",
        "한지우",
        "시스템상 출고 완료이나 고객 수령 확인이 늦게 도착해 월말 매출 인식 여부가 흔들린 이슈",
    ),
    Scenario(
        14,
        "ISSUE-2026-014",
        "Mirae EV Systems 담당자 휴가 중 임시 인수인계 누락",
        "messy_temporary_coverage_gap",
        "2026-12-05",
        "2026-12-20",
        "CUS-003",
        "Mirae EV Systems",
        "SUP-002",
        "KET Supplier",
        "AP-RL-450",
        "AP-RL-450 릴레이",
        "영업관리팀;구매팀",
        "Medium",
        "in_progress",
        "이민재",
        "최유진",
        "윤예린",
        "한지우",
        "담당자 휴가 중 고객 요청 일부가 임시 담당자에게 전달되지 않아 회신 지연과 Todo 누락이 발생한 인수인계 이슈",
    ),
]


DOC_PLANS = [
    ("sales_emails", "고객 긴급 요청 메일", "sales request"),
    ("purchase_emails", "구매처 불확실 회신", "supplier reply"),
    ("chat_logs", "내부 혼선 채팅", "internal chat"),
    ("logistics_logs", "물류 확인 로그", "logistics log"),
    ("sales_emails", "고객 추가 확인 요청", "customer follow up"),
    ("meeting_notes", "운영 회의 메모", "ops meeting"),
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


def doc_id(s: Scenario, idx: int) -> str:
    return f"DOC-2026-{s.num:03d}-MESSY-{idx:03d}"


def doc_date(s: Scenario, idx: int) -> str:
    dates = {
        1: s.start_date,
        2: s.start_date,
        3: s.start_date,
        4: s.end_date,
        5: s.end_date,
        6: s.end_date,
    }
    return dates[idx]


def doc_author(s: Scenario, folder: str) -> str:
    if folder == "purchase_emails":
        return s.purchase_owner
    if folder == "logistics_logs":
        return s.logistics_owner
    if folder == "quality_claims":
        return s.quality_owner
    if folder == "meeting_notes":
        return "김도윤"
    return s.owner


def messy_body(s: Scenario, idx: int, label: str) -> str:
    uncertain = [
        "아마",
        "일단",
        "확인 중",
        "다음 주 초 예상",
        "가능하면",
        "우선 급한 건",
    ]
    lines = [
        f"# {label}: {s.title}",
        "",
        "## 메타데이터",
        f"- doc_id: {doc_id(s, idx)}",
        f"- related_issue_id: {s.issue_id}",
        f"- created_date: {doc_date(s, idx)}",
        f"- customer: {s.customer}",
        f"- supplier: {s.supplier}",
        f"- product: {s.product}",
        "",
        "## 본문",
        f"{s.customer} / {s.product} 건입니다. {uncertain[(idx - 1) % len(uncertain)]} {s.description}",
        f"담당자는 {s.owner}으로 보고 있는데, 구매 쪽은 {s.purchase_owner}, 물류는 {s.logistics_owner}가 따로 확인 중입니다.",
        "요청사항은 납기와 수량을 다시 맞추자는 쪽인데, 같은 요청이 메일과 채팅에 중복으로 남아 있습니다.",
        "리스크는 확정 정보와 임시 정보가 섞여 보고서에서 단정하면 안 된다는 점입니다.",
        "다음 액션: 고객에게 확정 가능한 범위를 회신하고, 구매처 회신과 출고 가능일을 다시 대조해야 합니다.",
    ]
    if idx in {2, 3, 5}:
        lines.append("참고: 날짜가 한 번 수정되었고 이전 메모와 최신 회신이 서로 맞지 않을 수 있습니다.")
    if idx in {3, 6}:
        lines.append("짧게 말하면 아직 결론 아님. 누가 최종 확인자인지도 한 번 더 봐야 함.")
    return "\n".join(lines) + "\n"


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
    rows: list[dict[str, str]] = []
    written = 0
    for scenario in SCENARIOS:
        for idx, (folder, doc_type, label) in enumerate(DOC_PLANS, 1):
            did = doc_id(scenario, idx)
            date_part = doc_date(scenario, idx)
            file_path = f"02_raw_documents/{folder}/{did}_{scenario.issue_type}_{date_part}.md"
            abs_path = DUMMY / file_path
            if write_text_once(abs_path, messy_body(scenario, idx, label)):
                written += 1
            rows.append(
                {
                    "doc_id": did,
                    "file_path": file_path,
                    "doc_type": doc_type,
                    "created_date": date_part,
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
        qty = str(800 + scenario.num * 35)
        orders.append(
            {
                "order_id": f"ORD-MESSY-2026-{suffix}",
                "order_date": scenario.start_date,
                "customer_id": scenario.customer_id,
                "product_id": scenario.product_id,
                "quantity": qty,
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
                "quantity": qty,
                "expected_arrival_date": scenario.end_date,
                "actual_arrival_date": "" if scenario.status != "closed" else scenario.end_date,
                "po_status": "Open" if scenario.status != "closed" else "Closed",
                "purchase_owner": scenario.purchase_owner,
                "related_issue_id": scenario.issue_id,
            }
        )
        shipments.append(
            {
                "shipment_id": f"SHP-MESSY-2026-{suffix}",
                "shipment_date": scenario.start_date,
                "customer_id": scenario.customer_id,
                "product_id": scenario.product_id,
                "quantity": qty,
                "carrier": "CJ Logistics",
                "shipping_method": "Truck" if scenario.customer_id != "CUS-005" else "Ocean",
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
    monthly = """# 2026-09 월간 보고서 expected output

## 기준 이슈
- ISSUE-2026-012: TE Connectivity Korea 단가 인상 공지와 구두 합의 충돌

## 기대되는 보고서 성격
- 공식 공지와 구두 합의가 충돌한다는 점을 명시한다.
- 고객 단가 제안은 확정값처럼 쓰지 않는다.
- 마진 영향 계산은 자료 불일치와 담당자 확인 필요 항목으로 남긴다.
- 구매팀, 영업관리팀, 운영총괄팀의 확인 범위를 분리한다.
- 너무 깔끔한 결론 대신 미확정 정보와 다음 액션을 포함한다.
"""
    handoff = """# 2026-12 인수인계 expected output

## 기준 이슈
- ISSUE-2026-014: Mirae EV Systems 담당자 휴가 중 임시 인수인계 누락

## 기대되는 인수인계 성격
- 휴가 전 전달 메모가 불완전하다는 점을 표시한다.
- 고객 요청이 메일과 채팅에 나뉘어 있음을 유지한다.
- 임시 담당자가 확정되지 않은 Todo를 임의로 완료 처리하지 않는다.
- 회신 지연 원인과 다음 확인 담당자를 분리한다.
- 결론보다 확인 필요 항목, 누락 가능성, 다음 액션을 우선 노출한다.
"""
    count = 0
    count += write_text_once(
        EXPECTED / "expected_monthly_report_messy_price_conflict_2026_09.md",
        monthly,
    )
    count += write_text_once(
        EXPECTED / "expected_handoff_temporary_coverage_gap_2026_12.md",
        handoff,
    )
    return count


def validate_paths(doc_rows: list[dict[str, str]]) -> tuple[int, list[str]]:
    missing = []
    for row in doc_rows:
        if not (DUMMY / row["file_path"]).exists():
            missing.append(row["file_path"])
    return len(missing), missing


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

    missing_count, missing = validate_paths(doc_rows)
    range_ok = all(START_DATE <= row["created_date"] <= END_DATE for row in doc_rows)

    print(f"추가된 issue 수: {added['issue_events.csv']}")
    print(f"추가된 raw document 수: {written_docs}")
    print("수정된 CSV 목록:")
    for name, count in added.items():
        print(f"- {name}: {count} rows")
    print(f"추가된 expected output 수: {expected_count}")
    print(f"날짜 범위 검증 결과: {'OK' if range_ok else 'FAIL'}")
    print(f"source_document_index 경로 검증 결과: {'OK' if missing_count == 0 else 'FAIL'}")
    if missing:
        print("\n".join(missing[:10]))
    print("05_db_seed_v2 수정 여부: False")
    print("실제 DB insert 여부: False")


if __name__ == "__main__":
    main()
