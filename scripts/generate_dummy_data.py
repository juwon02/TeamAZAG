from __future__ import annotations

import csv
import random
import shutil
from datetime import date, datetime, timedelta
from pathlib import Path

from operational_raw_documents import render_operational_document


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dummy_data"
RNG = random.Random(20260611)
START_DATE = date(2025, 6, 1)
END_DATE = date(2026, 6, 1)


EMPLOYEES = [
    ("EMP-001", "김도윤", "운영총괄팀", "운영총괄", "admin", "doyun.kim@autopartsone.kr"),
    ("EMP-002", "박서연", "영업관리팀", "선임 매니저", "manager", "seoyeon.park@autopartsone.kr"),
    ("EMP-003", "이민재", "영업관리팀", "매니저", "user", "minjae.lee@autopartsone.kr"),
    ("EMP-004", "정하늘", "영업관리팀", "매니저", "user", "haneul.jung@autopartsone.kr"),
    ("EMP-005", "최유진", "구매팀", "구매 리드", "manager", "yujin.choi@autopartsone.kr"),
    ("EMP-006", "강민호", "구매팀", "구매 담당", "user", "minho.kang@autopartsone.kr"),
    ("EMP-007", "오세진", "구매팀", "구매 담당", "user", "sejin.oh@autopartsone.kr"),
    ("EMP-008", "한지우", "품질 클레임팀", "품질 리드", "manager", "jiwoo.han@autopartsone.kr"),
    ("EMP-009", "송태현", "품질 클레임팀", "품질 담당", "user", "taehyun.song@autopartsone.kr"),
    ("EMP-010", "배수민", "품질 클레임팀", "품질 담당", "user", "sumin.bae@autopartsone.kr"),
    ("EMP-011", "윤예린", "물류팀", "물류 리드", "manager", "yerin.yoon@autopartsone.kr"),
    ("EMP-012", "권재윤", "물류팀", "물류 담당", "user", "jaeyoon.kwon@autopartsone.kr"),
    ("EMP-013", "문태준", "물류팀", "물류 담당", "user", "taejun.moon@autopartsone.kr"),
    ("EMP-014", "시스템 관리자", "시스템관리", "시스템 관리자", "admin", "admin@autopartsone.kr"),
]

CUSTOMERS = [
    ("CUS-001", "Hyundai Mobis Tier2", "Korea", "장현우", "박서연", "High", "월간 납기 변동과 긴급 납품 요청이 잦음"),
    ("CUS-002", "Daesung Automotive", "Korea", "이보라", "박서연", "High", "급발주와 고객 승인 일정이 촘촘함"),
    ("CUS-003", "Mirae EV Systems", "Korea", "서민규", "이민재", "Medium", "센서 케이블 품질 이슈 재발 가능성"),
    ("CUS-004", "Hanil Motors", "Korea", "최가은", "정하늘", "Low", "정기 발주 중심"),
    ("CUS-005", "Global Harness Vietnam", "Vietnam", "Nguyen Linh", "이민재", "Medium", "수출 서류와 통관 일정 주의 필요"),
]

SUPPLIERS = [
    ("SUP-001", "TE Connectivity Korea", "Korea", "커넥터, 터미널", 21, "Price", "분기별 가격 인상 공지가 빠름"),
    ("SUP-002", "KET Supplier", "Korea", "터미널, 와이어하네스", 28, "Stock", "재고 부족 시 리드타임 변동 큼"),
    ("SUP-003", "Yazaki Parts Asia", "Japan", "릴레이, 케이블 어셈블리", 56, "LeadTime", "12월 이후 리드타임 장기화"),
    ("SUP-004", "JST Components", "China", "센서 케이블, 커넥터", 35, "Quality", "품질 확인 요청 회신이 느림"),
    ("SUP-005", "Local Cable Works", "Korea", "와이어하네스, 대체 케이블", 14, "Capacity", "긴급 대체품 대응 가능"),
]

PRODUCTS = [
    ("AP-CN-204", "AP-CN-204 커넥터", "Connector", "TE Connectivity Korea", 1250, 1800),
    ("AP-TM-118", "AP-TM-118 터미널", "Terminal", "KET Supplier", 780, 2500),
    ("AP-SC-330", "AP-SC-330 센서 케이블", "Sensor Cable", "JST Components", 4200, 900),
    ("AP-RL-450", "AP-RL-450 릴레이", "Relay", "Yazaki Parts Asia", 3100, 700),
    ("AP-WH-220", "AP-WH-220 와이어하네스", "Wire Harness", "KET Supplier", 5600, 650),
    ("AP-CB-510", "AP-CB-510 케이블 어셈블리", "Cable Assembly", "Local Cable Works", 4800, 500),
]

KEY_ISSUES = [
    ("ISS-2025-006", "Daesung Automotive 긴급 발주 대응", "UrgentOrder", "2025-06-10", "2025-06-24", "CUS-002", "SUP-001", "AP-CN-204", "영업관리팀;구매팀;물류팀", "High", "Closed", "Daesung Automotive가 AP-CN-204 5,000개 긴급 납품을 요청하여 재고 확인, 구매처 협의, 출고 우선순위 조정이 발생함"),
    ("ISS-2025-008", "KET Supplier 재고 부족으로 납기 지연 가능", "SupplierStock", "2025-08-05", "2025-08-29", "CUS-001", "SUP-002", "AP-WH-220", "구매팀;영업관리팀", "High", "Closed", "KET Supplier의 AP-WH-220 재고 부족으로 Hyundai Mobis Tier2 납기 지연 위험이 발생함"),
    ("ISS-2025-009", "Global Harness Vietnam 수출 서류 누락 통관 지연", "ExportDelay", "2025-09-08", "2025-09-22", "CUS-005", "", "AP-CB-510", "물류팀;영업관리팀", "Medium", "Closed", "Global Harness Vietnam 출하 건에서 원산지 증명 서류 누락으로 통관 지연이 발생함"),
    ("ISS-2025-011", "Mirae EV Systems 센서 케이블 반복 클레임", "QualityClaim", "2025-11-04", "2025-12-03", "CUS-003", "SUP-004", "AP-SC-330", "품질 클레임팀;구매팀;영업관리팀", "High", "Monitoring", "Mirae EV Systems에서 AP-SC-330 센서 케이블 접촉 불량 클레임이 반복 접수됨"),
    ("ISS-2025-012", "Yazaki Parts Asia 리드타임 8주에서 12주 증가", "LeadTimeChange", "2025-12-02", "2026-01-10", "CUS-004", "SUP-003", "AP-RL-450", "구매팀;영업관리팀", "Medium", "Closed", "Yazaki Parts Asia가 AP-RL-450 리드타임을 8주에서 12주로 변경 공지함"),
    ("ISS-2026-002", "Hyundai Mobis Tier2 긴급 항공 이송", "ExpediteShipping", "2026-02-06", "2026-02-19", "CUS-001", "SUP-002", "AP-TM-118", "물류팀;영업관리팀;구매팀", "High", "Closed", "Hyundai Mobis Tier2 납기 대응을 위해 AP-TM-118 일부 수량을 항공 긴급 이송함"),
    ("ISS-2026-004", "TE Connectivity Korea 단가 7% 인상 통보", "PriceIncrease", "2026-04-03", "2026-05-02", "CUS-002", "SUP-001", "AP-CN-204", "구매팀;영업관리팀;운영총괄팀", "Medium", "Open", "TE Connectivity Korea가 주요 커넥터 단가 7% 인상을 통보하여 고객 단가 협상이 필요함"),
    ("ISS-2026-005", "박서연 담당 고객 인수인계 준비", "Handover", "2026-05-12", "2026-06-01", "CUS-001;CUS-002", "SUP-001;SUP-002", "AP-CN-204;AP-TM-118;AP-WH-220", "영업관리팀;구매팀;물류팀", "High", "Open", "박서연 담당 Hyundai Mobis Tier2와 Daesung Automotive 업무 일부를 이민재에게 인수인계해야 함"),
]

GENERAL_ISSUES = [
    ("ISS-2025-007", "Hanil Motors 정기 발주 수량 변경", "OrderChange", "2025-07-12", "2025-07-18", "CUS-004", "", "AP-RL-450", "영업관리팀", "Low", "Closed", "Hanil Motors가 7월 정기 발주 수량을 일부 조정함"),
    ("ISS-2025-010", "Local Cable Works 대체품 승인 검토", "AlternativePart", "2025-10-11", "2025-10-25", "CUS-003", "SUP-005", "AP-CB-510", "구매팀;품질 클레임팀", "Medium", "Closed", "센서 케이블 대체 출하 가능성을 검토함"),
    ("ISS-2026-001", "월초 재고 실사 차이 조정", "Inventory", "2026-01-05", "2026-01-12", "", "", "AP-TM-118", "물류팀", "Low", "Closed", "월초 재고 실사에서 시스템 수량과 실물 수량 차이를 조정함"),
    ("ISS-2026-003", "Mirae EV Systems 개선대책 회신 지연", "CustomerFollowUp", "2026-03-03", "2026-03-15", "CUS-003", "SUP-004", "AP-SC-330", "품질 클레임팀;영업관리팀", "Medium", "Closed", "개선대책서 회신 일정이 지연되어 고객 후속 안내가 필요함"),
    ("ISS-2026-006", "Vietnam향 포장 라벨 문구 수정", "ExportLabel", "2026-05-18", "2026-05-27", "CUS-005", "", "AP-CB-510", "물류팀", "Low", "Open", "Global Harness Vietnam향 박스 라벨에 PO 번호 표기 방식 변경 요청이 접수됨"),
    ("ISS-2025-013", "KET Supplier 월말 입고 분할", "InboundSplit", "2025-12-20", "2026-01-08", "CUS-001", "SUP-002", "AP-TM-118", "구매팀;물류팀", "Medium", "Closed", "KET Supplier 월말 입고가 두 차례로 분할됨"),
    ("ISS-2026-007", "고객별 월간 리스크 태그 정리", "Reporting", "2026-05-20", "2026-06-01", "CUS-001;CUS-002;CUS-003", "", "", "운영총괄팀;영업관리팀", "Low", "Open", "월간 보고서용 고객별 리스크 태그를 정리함"),
    ("ISS-2025-014", "JST Components 검사 성적서 보완", "QualityDocs", "2025-11-18", "2025-11-29", "CUS-003", "SUP-004", "AP-SC-330", "품질 클레임팀;구매팀", "Medium", "Closed", "검사 성적서 항목 누락에 대한 보완 요청이 진행됨"),
    ("ISS-2026-008", "Daesung Automotive 신규 안전재고 기준 협의", "SafetyStock", "2026-03-22", "2026-04-12", "CUS-002", "SUP-001", "AP-CN-204", "영업관리팀;구매팀", "Medium", "Open", "긴급 발주 재발 방지를 위해 고객별 안전재고 기준을 협의함"),
    ("ISS-2026-009", "분기 공급사 평가 자료 취합", "SupplierReview", "2026-04-18", "2026-04-30", "", "SUP-001;SUP-002;SUP-003", "", "구매팀", "Low", "Closed", "분기 공급사 납기, 품질, 단가 변동 데이터를 취합함"),
]

DOC_TYPES = {
    "sales_emails": ["고객 발주 메일", "고객 납기 문의", "고객 불만 메일", "단가 협상 메일", "수출 고객 커뮤니케이션 메일"],
    "purchase_emails": ["구매처 견적 회신", "구매처 재고 부족 안내", "리드타임 변경 공지", "단가 인상 공지", "대체품 가능 여부 회신"],
    "quality_claims": ["클레임 접수표", "불량 원인 분석 메모", "개선대책 요청", "고객 회신 초안", "공급처 품질 확인 요청"],
    "logistics_logs": ["입고 로그", "출고 로그", "배송 지연 기록", "통관 지연 기록", "긴급 항공 이송 승인 요청"],
    "meeting_notes": ["주간 운영 회의록", "월간 리스크 회의록", "품질 클레임 대응 회의록", "단가 협상 회의록", "인수인계 준비 회의록"],
    "chat_logs": ["팀 내부 진행 대화", "담당자 확인 요청", "Todo 노출 대화", "Blocked 상태 대화", "팀장 승인 요청 대화"],
}


def ensure_dirs() -> None:
    # Regenerate only the source-data areas owned by this script. Historical and
    # DB seed folders under dummy_data are independent artifacts.
    for name in ["01_master_data", "02_raw_documents", "03_structured_csv", "04_expected_outputs_for_test"]:
        target = OUT / name
        if target.exists():
            shutil.rmtree(target)
    for path in [
        OUT / "01_master_data",
        OUT / "02_raw_documents" / "sales_emails",
        OUT / "02_raw_documents" / "purchase_emails",
        OUT / "02_raw_documents" / "quality_claims",
        OUT / "02_raw_documents" / "logistics_logs",
        OUT / "02_raw_documents" / "meeting_notes",
        OUT / "02_raw_documents" / "chat_logs",
        OUT / "03_structured_csv",
        OUT / "04_expected_outputs_for_test",
    ]:
        path.mkdir(parents=True, exist_ok=True)


def write_csv(path: Path, headers: list[str], rows: list[tuple | list]) -> None:
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)


def parse_day(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def clamp_date(value: date) -> date:
    if value < START_DATE:
        return START_DATE
    if value > END_DATE:
        return END_DATE
    return value


def random_day() -> date:
    return START_DATE + timedelta(days=RNG.randint(0, (END_DATE - START_DATE).days))


def month_dates() -> list[date]:
    dates: list[date] = []
    current = START_DATE + timedelta(days=2)
    while current <= END_DATE:
        dates.append(current)
        current += timedelta(days=RNG.choice([2, 3, 4]))
    return dates


def issue_for_day(day: date) -> tuple | None:
    candidates = []
    for issue in KEY_ISSUES + GENERAL_ISSUES:
        start = parse_day(issue[3]) - timedelta(days=4)
        end = parse_day(issue[4]) + timedelta(days=5)
        if start <= day <= end:
            candidates.append(issue)
    return RNG.choice(candidates) if candidates else None


def pick_customer(issue: tuple | None) -> tuple[str, str]:
    if issue and issue[5]:
        cid = issue[5].split(";")[0]
        row = next(c for c in CUSTOMERS if c[0] == cid)
        return row[0], row[1]
    row = RNG.choice(CUSTOMERS)
    return row[0], row[1]


def pick_supplier(issue: tuple | None) -> tuple[str, str]:
    if issue and issue[6]:
        sid = issue[6].split(";")[0]
        row = next(s for s in SUPPLIERS if s[0] == sid)
        return row[0], row[1]
    row = RNG.choice(SUPPLIERS)
    return row[0], row[1]


def pick_product(issue: tuple | None) -> tuple[str, str]:
    if issue and issue[7]:
        pid = issue[7].split(";")[0]
        row = next(p for p in PRODUCTS if p[0] == pid)
        return row[0], row[1]
    row = RNG.choice(PRODUCTS)
    return row[0], row[1]


def employee_by_team(team: str) -> str:
    pool = [e for e in EMPLOYEES if e[2] == team]
    return RNG.choice(pool)[1]


def make_doc_body(doc_id: str, folder: str, doc_type: str, day: date, issue: tuple | None) -> tuple[str, dict[str, str]]:
    cid, cname = pick_customer(issue)
    sid, sname = pick_supplier(issue)
    pid, pname = pick_product(issue)
    issue_id = issue[0] if issue else ""
    issue_title = issue[1] if issue else "정기 운영 확인"
    author = {
        "sales_emails": employee_by_team("영업관리팀"),
        "purchase_emails": employee_by_team("구매팀"),
        "quality_claims": employee_by_team("품질 클레임팀"),
        "logistics_logs": employee_by_team("물류팀"),
        "meeting_notes": employee_by_team("운영총괄팀"),
        "chat_logs": employee_by_team("영업관리팀"),
    }[folder]
    related_team = {
        "sales_emails": "영업관리팀",
        "purchase_emails": "구매팀",
        "quality_claims": "품질 클레임팀",
        "logistics_logs": "물류팀",
        "meeting_notes": "운영총괄팀",
        "chat_logs": "영업관리팀",
    }[folder]
    due = day + timedelta(days=RNG.choice([2, 3, 5, 7, 10]))
    risk = issue[9] if issue else RNG.choice(["Low", "Medium"])
    status = issue[10] if issue else RNG.choice(["Open", "Closed", "Monitoring"])
    quantity = RNG.choice([400, 600, 800, 1200, 2500, 5000])

    customer_contact = next(row[3] for row in CUSTOMERS if row[0] == cid)
    content = render_operational_document(
        doc_id=doc_id,
        folder=folder,
        doc_type=doc_type,
        created_date=day.isoformat(),
        author=author,
        related_team=related_team,
        customer=cname,
        customer_contact=customer_contact,
        supplier=sname,
        product=pname,
        issue_id=issue_id,
        issue_title=issue_title,
        issue_description=issue[11] if issue else "정기 발주와 입출고 일정 확인",
        status=status,
        quantity=quantity,
        due_date=due.isoformat(),
    )
    # Keep the seeded generation sequence compatible with the original dataset.
    if folder == "chat_logs":
        employee_by_team("구매팀")
        employee_by_team("물류팀")
    summary = f"{cname} / {pname} / {issue_title} 관련 {folder} 업무 기록"
    meta = {
        "doc_id": doc_id,
        "doc_type": doc_type,
        "created_date": day.isoformat(),
        "author": author,
        "related_team": related_team,
        "related_customer_id": cid,
        "related_supplier_id": sid,
        "related_product_id": pid,
        "related_issue_id": issue_id,
        "summary_hint": summary,
    }
    return content, meta


def generate_documents() -> list[dict[str, str]]:
    docs: list[dict[str, str]] = []
    dates = month_dates()
    folders = list(DOC_TYPES.keys())
    doc_no = 1

    for month in range(1, 13):
        base = START_DATE + timedelta(days=31 * (month - 1))
        month_pool = [d for d in dates if d.month == base.month and d.year == base.year]
        if not month_pool:
            month_pool = [base]
        for _ in range(12):
            day = RNG.choice(month_pool)
            issue = issue_for_day(day)
            folder = RNG.choice(folders)
            doc_type = RNG.choice(DOC_TYPES[folder])
            doc_id = f"DOC-{doc_no:04d}"
            content, meta = make_doc_body(doc_id, folder, doc_type, day, issue)
            path = OUT / "02_raw_documents" / folder / f"{doc_id}_{folder}_{day.isoformat()}.md"
            path.write_text(content, encoding="utf-8")
            meta["file_path"] = str(path.relative_to(OUT)).replace("\\", "/")
            docs.append(meta)
            doc_no += 1

    # Guarantee at least five source documents per key issue.
    for issue in KEY_ISSUES:
        existing = [d for d in docs if d["related_issue_id"] == issue[0]]
        for _ in range(max(0, 5 - len(existing))):
            day = clamp_date(parse_day(issue[3]) + timedelta(days=RNG.randint(0, 12)))
            folder = RNG.choice(folders)
            doc_type = RNG.choice(DOC_TYPES[folder])
            doc_id = f"DOC-{doc_no:04d}"
            content, meta = make_doc_body(doc_id, folder, doc_type, day, issue)
            path = OUT / "02_raw_documents" / folder / f"{doc_id}_{folder}_{day.isoformat()}.md"
            path.write_text(content, encoding="utf-8")
            meta["file_path"] = str(path.relative_to(OUT)).replace("\\", "/")
            docs.append(meta)
            doc_no += 1

    return docs


def generate_structured_csv() -> None:
    def product_for_issue(issue_id: str) -> str:
        issue = next((i for i in KEY_ISSUES + GENERAL_ISSUES if i[0] == issue_id), None)
        return issue[7].split(";")[0] if issue and issue[7] else RNG.choice(PRODUCTS)[0]

    issue_ids = [i[0] for i in KEY_ISSUES + GENERAL_ISSUES]
    orders = []
    purchase_orders = []
    shipments = []
    claims = []

    for i in range(1, 131):
        day = random_day()
        issue_id = RNG.choice(issue_ids + [""] * 3)
        cid = RNG.choice(CUSTOMERS)[0]
        if issue_id:
            issue = next(x for x in KEY_ISSUES + GENERAL_ISSUES if x[0] == issue_id)
            if issue[5]:
                cid = issue[5].split(";")[0]
        pid = product_for_issue(issue_id) if issue_id else RNG.choice(PRODUCTS)[0]
        requested_delivery_date = clamp_date(day + timedelta(days=RNG.randint(7, 45)))
        orders.append((f"ORD-{i:05d}", day.isoformat(), cid, pid, RNG.randint(200, 6000), requested_delivery_date.isoformat(), RNG.choice(["Confirmed", "Shipped", "Delayed", "Closed"]), employee_by_team("영업관리팀"), issue_id))

    for i in range(1, 111):
        day = random_day()
        issue_id = RNG.choice(issue_ids + [""] * 2)
        supplier = RNG.choice(SUPPLIERS)[0]
        if issue_id:
            issue = next(x for x in KEY_ISSUES + GENERAL_ISSUES if x[0] == issue_id)
            if issue[6]:
                supplier = issue[6].split(";")[0]
        eta = clamp_date(day + timedelta(days=RNG.randint(14, 70)))
        actual = clamp_date(eta + timedelta(days=RNG.choice([-2, 0, 1, 3, 7, 14])))
        purchase_orders.append((f"PO-{i:05d}", day.isoformat(), supplier, product_for_issue(issue_id) if issue_id else RNG.choice(PRODUCTS)[0], RNG.randint(500, 8000), eta.isoformat(), actual.isoformat(), RNG.choice(["Open", "Partially Received", "Received", "Delayed"]), employee_by_team("구매팀"), issue_id))

    for i in range(1, 111):
        day = random_day()
        issue_id = RNG.choice(issue_ids + [""] * 2)
        cid = RNG.choice(CUSTOMERS)[0]
        if issue_id:
            issue = next(x for x in KEY_ISSUES + GENERAL_ISSUES if x[0] == issue_id)
            if issue[5]:
                cid = issue[5].split(";")[0]
        eta = clamp_date(day + timedelta(days=RNG.randint(1, 20)))
        actual = clamp_date(eta + timedelta(days=RNG.choice([-1, 0, 0, 2, 5, 9])))
        shipments.append((f"SHP-{i:05d}", day.isoformat(), cid, product_for_issue(issue_id) if issue_id else RNG.choice(PRODUCTS)[0], RNG.randint(100, 5000), RNG.choice(["CJ Logistics", "DHL", "FedEx", "Korea Express", "Hanjin"]), RNG.choice(["Truck", "Air", "Sea", "Courier"]), eta.isoformat(), actual.isoformat(), RNG.choice(["Delivered", "In Transit", "Delayed", "Customs Hold"]), employee_by_team("물류팀"), issue_id))

    claim_issue_pool = ["ISS-2025-011", "ISS-2026-003", "ISS-2025-014", "ISS-2025-010", ""]
    for i in range(1, 31):
        day = random_day()
        issue_id = RNG.choice(claim_issue_pool)
        issue = next((x for x in KEY_ISSUES + GENERAL_ISSUES if x[0] == issue_id), None)
        cid = issue[5].split(";")[0] if issue and issue[5] else RNG.choice(CUSTOMERS)[0]
        pid = issue[7].split(";")[0] if issue and issue[7] else RNG.choice(PRODUCTS)[0]
        claims.append((f"CLM-{i:05d}", day.isoformat(), cid, pid, RNG.choice(["접촉 불량", "외관 손상", "핀 배열 불일치", "라벨 오류", "작동 불량"]), RNG.randint(5, 180), RNG.choice(["Low", "Medium", "High"]), RNG.choice(["Received", "Under Analysis", "Corrective Action", "Closed"]), employee_by_team("품질 클레임팀"), issue_id))

    write_csv(OUT / "03_structured_csv" / "orders.csv", ["order_id", "order_date", "customer_id", "product_id", "quantity", "requested_delivery_date", "order_status", "sales_owner", "related_issue_id"], orders)
    write_csv(OUT / "03_structured_csv" / "purchase_orders.csv", ["po_id", "po_date", "supplier_id", "product_id", "quantity", "expected_arrival_date", "actual_arrival_date", "po_status", "purchase_owner", "related_issue_id"], purchase_orders)
    write_csv(OUT / "03_structured_csv" / "shipments.csv", ["shipment_id", "shipment_date", "customer_id", "product_id", "quantity", "carrier", "shipping_method", "expected_delivery_date", "actual_delivery_date", "shipment_status", "logistics_owner", "related_issue_id"], shipments)
    write_csv(OUT / "03_structured_csv" / "claims.csv", ["claim_id", "claim_date", "customer_id", "product_id", "defect_type", "defect_quantity", "severity", "claim_status", "quality_owner", "related_issue_id"], claims)


def write_expected_outputs() -> None:
    weekly = """# 주간 보고서 샘플 - Mirae EV Systems 반복 클레임

## 기간
2025-11-03 ~ 2025-11-09

## 핵심 요약
- Mirae EV Systems의 AP-SC-330 센서 케이블 접촉 불량 클레임이 반복 접수되었습니다.
- 품질 클레임팀은 JST Components 검사 성적서와 입고 검사 기록을 대조해야 합니다.
- 고객 회신 초안에는 임시 선별 출하, 원인 분석 일정, 개선대책 회신 예정일을 포함합니다.

## Todo
- 한지우: 2025-11-10까지 불량 샘플 사진과 LOT 정보를 취합
- 최유진: JST Components에 검사 성적서 보완 요청
- 이민재: 고객에게 1차 분석 일정 안내
"""
    monthly = """# 월간 보고서 샘플 - 단가 인상 및 고객 협상

## 기간
2026-04-01 ~ 2026-04-30

## 핵심 이슈
- TE Connectivity Korea가 AP-CN-204 커넥터 단가 7% 인상을 통보했습니다.
- Daesung Automotive와 Hyundai Mobis Tier2는 긴급 발주 이력이 있어 가격 전가와 안전재고 기준을 함께 협의해야 합니다.
- 구매팀은 대체 공급처 가능성과 기존 발주분 적용 예외 여부를 확인 중입니다.

## 리스크
- 고객 단가 협상 지연 시 5월 출고분 마진 저하 가능
- 공급처 회신 지연 시 월간 보고서의 확정 단가 표기가 어려움
"""
    handover = """# 인수인계서 샘플 - 박서연에서 이민재로 고객 업무 이관

## 인수인계 대상
- 기존 담당자: 박서연
- 신규 담당자: 이민재
- 고객사: Hyundai Mobis Tier2, Daesung Automotive

## 고객별 주의사항
- Hyundai Mobis Tier2: AP-TM-118과 AP-WH-220 납기 리스크가 자주 발생하며, 긴급 항공 이송 승인 이력이 있습니다.
- Daesung Automotive: AP-CN-204 긴급 발주와 TE 단가 인상 협상이 연결되어 있어 고객 안내 문구를 일관되게 유지해야 합니다.

## 미완료 Todo
- 2026-06-03까지 고객별 미완료 Todo 목록 재확인
- TE Connectivity Korea 7% 단가 인상분 적용 시점 확인
- KET Supplier 재고 부족 발생 시 대체 출하 가능 수량 확인
"""
    base = OUT / "04_expected_outputs_for_test"
    (base / "expected_weekly_report_sample.md").write_text(weekly, encoding="utf-8")
    (base / "expected_monthly_report_sample.md").write_text(monthly, encoding="utf-8")
    (base / "expected_handover_sample.md").write_text(handover, encoding="utf-8")


def append_scenario_9_outputs() -> None:
    issue_id = "ISSUE-2026-009"
    customer_id = "CUS-004"
    supplier_id = "SUP-005"
    product_id = "AP-CB-510"

    def append_csv(path: Path, row: dict[str, str], key: str) -> None:
        with path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            headers = reader.fieldnames or []
        if any(existing.get(key) == row[key] for existing in rows):
            return
        rows.append(row)
        with path.open("w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)

    docs = [
        {
            "doc_id": "DOC-2026-0513-SALES-009-001",
            "folder": "sales_emails",
            "filename": "DOC-2026-0513-SALES-009-001_hanil_quantity_mismatch_claim.md",
            "doc_type": "고객 수량 불일치 클레임 접수 메일",
            "created_date": "2026-05-13",
            "author": "정하늘",
            "related_team": "영업관리팀",
            "summary_hint": "Hanil Motors AP-CB-510 입고 수량 1,850개와 출고 처리 2,000개 불일치 클레임 접수",
            "body": [
                "Hanil Motors에서 AP-CB-510 케이블 어셈블리 입고 검사 결과 수량 불일치가 발생했다고 접수했습니다.",
                "고객 검수 기준 입고 확인 수량은 1,850개이며 당사 출고 로그에는 2,000개가 처리된 것으로 표시되어 있습니다.",
                "부족 수량 150개가 실제 미출고인지, 포장 단위 오류인지, 운송 중 분실인지 확인이 필요합니다.",
                "고객은 월말 생산 일정 영향 가능성을 언급하며 2026-05-16 오전까지 1차 확인 결과를 요청했습니다.",
                "담당자 정하늘은 물류팀에 출고 검수표, 패킹 리스트, 운송장 인수증 대조를 요청했습니다.",
                "리스크는 Medium이며, 확인 지연 시 고객 라인 투입 일정과 추가 재출고 판단에 영향이 있습니다.",
                "다음 액션은 물류팀 확인 결과를 취합해 고객 중간 회신 초안을 작성하는 것입니다.",
            ],
        },
        {
            "doc_id": "DOC-2026-0513-LOG-009-002",
            "folder": "logistics_logs",
            "filename": "DOC-2026-0513-LOG-009-002_internal_shipment_log.md",
            "doc_type": "내부 출고 로그",
            "created_date": "2026-05-13",
            "author": "윤예린",
            "related_team": "물류팀",
            "summary_hint": "AP-CB-510 2,000개 출고 처리와 패킹 리스트 실물 대조 필요",
            "body": [
                "2026-05-12 출고 시스템에는 Hanil Motors향 AP-CB-510 케이블 어셈블리 2,000개가 출고 처리되어 있습니다.",
                "출고 reference는 SHP-00111이며 운송사는 CJ Logistics, 배송 방식은 Truck으로 기록되어 있습니다.",
                "출고 검수표에는 박스 20개 기준으로 박스당 100개 포장으로 표기되어 있습니다.",
                "고객 입고 검수 결과 1,850개만 확인되었다는 클레임이 접수되어 패킹 리스트와 실제 박스 수량 재확인이 필요합니다.",
                "물류팀은 CCTV 기록, 출고 검수표 서명, 운송장 인수증을 2026-05-16까지 확인하기로 했습니다.",
                "리스크는 출고 검수 누락 또는 운송 중 일부 분실 가능성입니다.",
                "다음 액션은 부족분 150개 재출고 가능 여부와 차액 조정 필요성을 함께 검토하는 것입니다.",
            ],
        },
        {
            "doc_id": "DOC-2026-0514-CHAT-009-003",
            "folder": "chat_logs",
            "filename": "DOC-2026-0514-CHAT-009-003_sales_logistics_quality_check.md",
            "doc_type": "영업 물류 품질 확인 대화",
            "created_date": "2026-05-14",
            "author": "정하늘",
            "related_team": "영업관리팀",
            "summary_hint": "수량 불일치 클레임에 대한 영업관리팀, 물류팀, 품질 클레임팀 확인 대화",
            "body": [
                "[정하늘] Hanil Motors에서 AP-CB-510 입고 수량이 1,850개만 확인됐다고 클레임을 공유했습니다.",
                "[윤예린] 내부 출고 로그는 2,000개 처리로 되어 있어 출고 검수표와 패킹 리스트를 먼저 확인하겠습니다.",
                "[한지우] 제품 품질 불량은 아니지만 quantity_mismatch 클레임으로 접수하고 원인 분류를 열어두겠습니다.",
                "[정하늘] 고객은 월말 생산 일정 영향 가능성을 말해서 중간 회신 일정이 필요합니다.",
                "[윤예린] 운송장 인수증과 박스 수량 사진이 남아 있는지 확인하겠습니다.",
                "[한지우] 원인은 패킹 오류, 출고 검수 누락, 운송 중 분실, 고객 입고 검수 오류 네 가지로 분류하겠습니다.",
                "다음 액션은 2026-05-16 오전까지 부서별 확인 결과를 모아 고객에게 1차 회신하는 것입니다.",
            ],
        },
        {
            "doc_id": "DOC-2026-0516-CLAIM-009-004",
            "folder": "quality_claims",
            "filename": "DOC-2026-0516-CLAIM-009-004_quantity_mismatch_claim.md",
            "doc_type": "수량 불일치 클레임 접수표",
            "created_date": "2026-05-16",
            "author": "한지우",
            "related_team": "품질 클레임팀",
            "summary_hint": "shipment_quantity_mismatch 클레임 접수 및 원인 후보 분류",
            "body": [
                "클레임 유형은 shipment_quantity_mismatch로 분류했습니다.",
                "대상 고객은 Hanil Motors이며 대상 품목은 AP-CB-510 케이블 어셈블리입니다.",
                "고객 입고 확인 수량은 1,850개이고 내부 출고 처리 수량은 2,000개로 차이는 150개입니다.",
                "현재까지 제품 기능 또는 외관 품질 불량 증거는 확인되지 않았습니다.",
                "원인 후보는 패킹 오류, 출고 검수 누락, 운송 중 분실, 고객 입고 검수 오류입니다.",
                "품질 클레임팀은 물류팀의 출고 검수표와 운송 증빙을 근거로 원인 분류를 확정해야 합니다.",
                "다음 액션은 부족분 재출고 필요 여부와 고객 회신 문구를 영업관리팀과 함께 확정하는 것입니다.",
            ],
        },
        {
            "doc_id": "DOC-2026-0517-MEET-009-005",
            "folder": "meeting_notes",
            "filename": "DOC-2026-0517-MEET-009-005_quantity_mismatch_response.md",
            "doc_type": "수량 불일치 대응 회의록",
            "created_date": "2026-05-17",
            "author": "김도윤",
            "related_team": "운영총괄팀",
            "summary_hint": "Hanil Motors 수량 불일치 대응 회의 및 부서별 액션 정리",
            "body": [
                "회의에서는 Hanil Motors AP-CB-510 수량 불일치 클레임의 고객 영향도와 부서별 확인 항목을 정리했습니다.",
                "영업관리팀은 고객 회신 일정과 월말 생산 영향도를 관리하기로 했습니다.",
                "물류팀은 출고 검수표, CCTV 기록, 패킹 리스트, 운송장 인수증을 대조하기로 했습니다.",
                "품질 클레임팀은 수량 불일치 클레임을 제품 불량과 분리해 원인 후보를 관리하기로 했습니다.",
                "부족분 150개는 재출고 가능 재고가 확인되면 임시 보완 출고를 검토합니다.",
                "차액 조정은 고객 입고 검수 오류 가능성이 배제된 뒤 논의하기로 했습니다.",
                "다음 액션은 2026-05-20까지 고객 중간 회신과 재출고 가능 여부를 확정하는 것입니다.",
            ],
        },
        {
            "doc_id": "DOC-2026-0520-SALES-009-006",
            "folder": "sales_emails",
            "filename": "DOC-2026-0520-SALES-009-006_customer_interim_reply.md",
            "doc_type": "고객 중간 회신 초안",
            "created_date": "2026-05-20",
            "author": "정하늘",
            "related_team": "영업관리팀",
            "summary_hint": "출고 검수표와 패킹 리스트 대조 중이며 재출고 또는 차액 조정 가능성 안내",
            "body": [
                "Hanil Motors에 전달할 중간 회신 초안입니다.",
                "당사는 내부 출고 로그 기준 AP-CB-510 2,000개 출고 처리 사실을 확인했습니다.",
                "고객 입고 확인 수량 1,850개와 차이가 있어 출고 검수표, 패킹 리스트, 운송장 인수증을 대조 중입니다.",
                "부족분 150개에 대해서는 원인 확인 후 재출고 또는 차액 조정 가능성을 안내합니다.",
                "월말 생산 일정에 영향이 없도록 2026-05-21까지 재고 가능 수량을 우선 확인합니다.",
                "리스크는 최종 원인 확정 전 고객 신뢰도 저하와 긴급 출고 비용 발생 가능성입니다.",
                "다음 액션은 물류팀 증빙 확인 결과와 재출고 가능 재고를 반영해 최종 회신을 발송하는 것입니다.",
            ],
        },
        {
            "doc_id": "DOC-2026-0521-PURCHASE-009-007",
            "folder": "purchase_emails",
            "filename": "DOC-2026-0521-PURCHASE-009-007_reshipment_stock_check.md",
            "doc_type": "부족분 재출고 가능 재고 확인 메일",
            "created_date": "2026-05-21",
            "author": "최유진",
            "related_team": "구매팀",
            "summary_hint": "AP-CB-510 부족분 150개 이상 즉시 출고 가능 재고 확인",
            "body": [
                "Local Cable Works에 AP-CB-510 케이블 어셈블리 재출고 가능 재고를 확인했습니다.",
                "부족분 150개 이상은 긴급 출고 가능한 재고로 확인되었습니다.",
                "단, 재출고 실행 여부는 물류팀의 출고 검수표 대조 결과와 고객 입고 검수 재확인 결과에 따라 결정합니다.",
                "재출고가 필요한 경우 예상 출고일은 2026-05-22이며 고객 도착 예정일은 2026-05-24입니다.",
                "구매팀은 추가 비용 발생 가능성과 공급처 긴급 대응 가능 여부를 기록했습니다.",
                "리스크는 원인 확정 전 재출고 시 중복 보상으로 처리될 가능성입니다.",
                "다음 액션은 운영총괄팀 승인 후 재출고 또는 차액 조정 중 하나를 선택하는 것입니다.",
            ],
        },
    ]

    for doc in docs:
        path = OUT / "02_raw_documents" / doc["folder"] / doc["filename"]
        body = render_operational_document(
            doc_id=doc["doc_id"],
            folder=doc["folder"],
            doc_type=doc["doc_type"],
            created_date=doc["created_date"],
            author=doc["author"],
            related_team=doc["related_team"],
            customer="Hanil Motors",
            customer_contact="최가은",
            supplier="Local Cable Works",
            product="AP-CB-510 케이블 어셈블리",
            issue_id=issue_id,
            issue_title="Hanil Motors 수량 불일치 클레임",
            issue_description="고객 입고 수량 1,850개와 내부 출고 처리 2,000개의 차이를 확인 중",
            status="in_progress",
            quantity=2000,
            due_date="2026-05-20",
        )
        path.write_text(body, encoding="utf-8")

    append_csv(
        OUT / "03_structured_csv" / "issue_events.csv",
        {
            "issue_id": issue_id,
            "issue_title": "Hanil Motors 수량 불일치 클레임",
            "issue_type": "quantity_mismatch_claim",
            "start_date": "2026-05-13",
            "end_date": "2026-05-24",
            "related_customer_id": customer_id,
            "related_supplier_id": supplier_id,
            "related_product_id": product_id,
            "related_teams": "영업관리팀;물류팀;품질 클레임팀",
            "severity": "Medium",
            "status": "in_progress",
            "description": "고객 입고 검사 수량과 내부 출고 처리 수량이 일치하지 않아 확인 및 재출고 또는 차액 조정 검토가 필요한 이슈",
        },
        "issue_id",
    )
    append_csv(
        OUT / "03_structured_csv" / "orders.csv",
        {
            "order_id": "ORD-00131",
            "order_date": "2026-05-02",
            "customer_id": customer_id,
            "product_id": product_id,
            "quantity": "2000",
            "requested_delivery_date": "2026-05-15",
            "order_status": "issue_reported",
            "sales_owner": "정하늘",
            "related_issue_id": issue_id,
        },
        "order_id",
    )
    append_csv(
        OUT / "03_structured_csv" / "shipments.csv",
        {
            "shipment_id": "SHP-00111",
            "shipment_date": "2026-05-12",
            "customer_id": customer_id,
            "product_id": product_id,
            "quantity": "2000",
            "carrier": "CJ Logistics",
            "shipping_method": "Truck",
            "expected_delivery_date": "2026-05-15",
            "actual_delivery_date": "2026-05-15",
            "shipment_status": "issue_reported",
            "logistics_owner": "윤예린",
            "related_issue_id": issue_id,
        },
        "shipment_id",
    )
    append_csv(
        OUT / "03_structured_csv" / "claims.csv",
        {
            "claim_id": "CLM-00031",
            "claim_date": "2026-05-16",
            "customer_id": customer_id,
            "product_id": product_id,
            "defect_type": "quantity_mismatch",
            "defect_quantity": "150",
            "severity": "Medium",
            "claim_status": "in_progress",
            "quality_owner": "한지우",
            "related_issue_id": issue_id,
        },
        "claim_id",
    )

    for doc in docs:
        append_csv(
            OUT / "03_structured_csv" / "source_document_index.csv",
            {
                "doc_id": doc["doc_id"],
                "file_path": f"02_raw_documents/{doc['folder']}/{doc['filename']}",
                "doc_type": doc["doc_type"],
                "created_date": doc["created_date"],
                "author": doc["author"],
                "related_team": doc["related_team"],
                "related_customer_id": customer_id,
                "related_supplier_id": supplier_id,
                "related_product_id": product_id,
                "related_issue_id": issue_id,
                "summary_hint": doc["summary_hint"],
            },
            "doc_id",
        )

    expected = """# 이슈 인수인계서 - Hanil Motors 수량 불일치 클레임

## 현재 진행 중 업무
- Hanil Motors AP-CB-510 케이블 어셈블리 2,000개 출고 건에서 고객 입고 확인 수량이 1,850개로 보고되었습니다.
- 내부 출고 로그, 패킹 리스트, 운송장 인수증, 고객 입고 검수 결과를 대조 중입니다.
- 부족분 150개에 대해 재출고 또는 차액 조정 가능성을 검토하고 있습니다.

## 미해결 리스크
- 출고 검수 누락, 패킹 오류, 운송 중 분실, 고객 입고 검수 오류 중 원인이 확정되지 않았습니다.
- 월말 생산 일정에 영향이 있을 수 있어 고객 중간 회신 일정 관리가 필요합니다.

## 관련 부서별 확인사항
- 영업관리팀: 고객 회신 일정과 최종 안내 문구 관리
- 물류팀: 출고 검수표, CCTV, 패킹 리스트, 운송장 인수증 대조
- 품질 클레임팀: quantity_mismatch 클레임 접수 및 원인 분류
- 구매팀: 부족분 150개 이상 재출고 가능 재고 확인

## 참고 자료
- DOC-2026-0513-SALES-009-001
- DOC-2026-0513-LOG-009-002
- DOC-2026-0516-CLAIM-009-004
- SHP-00111, CLM-00031, ORD-00131

## 다음 액션
- 2026-05-21까지 고객 중간 회신 발송
- 2026-05-22까지 부족분 재출고 또는 차액 조정 방향 결정
- 2026-05-24까지 이슈 상태를 in_progress에서 closed 또는 monitoring으로 변경

## 인수자 주의사항
이 파일은 검증용 expected output 샘플이며 실제 서비스 업로드 대상이 아닙니다. 실제 입력에는 raw_documents와 structured_csv만 사용해야 합니다.
"""
    (OUT / "04_expected_outputs_for_test" / "expected_handoff_quantity_mismatch_sample.md").write_text(expected, encoding="utf-8")

    readme = """# AutoParts One Korea 더미 데이터

## 목적
이 데이터셋은 자동차 부품 B2B 운영관리 시나리오에서 AI가 보고서, Todo, 리스크, 인수인계서 초안을 생성하는 기능을 검증하기 위한 더미 데이터입니다.

## 폴더 구조
- `01_master_data`: 직원, 고객사, 구매처, 품목 기준정보
- `02_raw_documents`: 메일, 품질 클레임, 물류 로그, 회의록, 채팅 로그 원천 문서
- `03_structured_csv`: 주문, 구매, 출하, 클레임, 이슈 이벤트, 문서 인덱스 CSV
- `04_expected_outputs_for_test`: 개발 검증용 결과 샘플이며 실제 서비스 업로드 대상이 아닙니다.
- `05_db_seed_v2`: OpsRadar2 v2 MVP DB seed CSV

## 특수 시나리오 9개
1. 2025년 6월 Daesung Automotive 긴급 발주 대응
2. 2025년 8월 KET Supplier 재고 부족과 납기 지연 가능성
3. 2025년 9월 Global Harness Vietnam 수출 서류 누락과 통관 지연
4. 2025년 11월 Mirae EV Systems 센서 케이블 반복 클레임
5. 2025년 12월 Yazaki Parts Asia 리드타임 8주에서 12주 증가
6. 2026년 2월 Hyundai Mobis Tier2 긴급 항공 이송
7. 2026년 4월 TE Connectivity Korea 단가 7% 인상 통보
8. 2026년 5~6월 박서연 담당 고객 업무 일부 인수인계
9. 2026년 5월 Hanil Motors 수량 불일치 클레임

## 신규 시나리오 9 설명
Hanil Motors 입고 검사에서 AP-CB-510 케이블 어셈블리 2,000개 중 1,850개만 확인되어 내부 출고 수량과 고객 입고 수량이 불일치한 상황입니다. 영업관리팀, 물류팀, 품질 클레임팀이 공동으로 출고 검수표, 패킹 리스트, 운송장 인수증, 고객 입고 검수 결과를 대조해야 합니다. 인수인계서에는 출고 검증, 재출고 가능성, 고객 회신 일정, 차액 조정 검토가 추출되어야 합니다.

## 서비스 입력 데이터와 expected output의 차이
`02_raw_documents`와 `03_structured_csv`는 실제 서비스 업로드 및 분석 대상입니다. `04_expected_outputs_for_test`는 검증용 샘플 결과물이므로 실제 서비스 입력에 포함하면 안 됩니다.

## 재생성 명령어
```bash
python scripts/generate_dummy_data.py
python scripts/convert_dummy_to_seed_v2.py
```
"""
    (ROOT / "README_dummy_data.md").write_text(readme, encoding="utf-8")


def write_readme() -> None:
    readme = """# AutoParts One Korea 더미 데이터

## 1. 목적
이 데이터셋은 자동차 부품 유통/공급 운영 시나리오에서 AI가 보고서와 인수인계서 초안을 생성하는 기능을 테스트하기 위한 1년치 더미 데이터입니다. 실제 서비스 입력 대상은 `02_raw_documents`와 `03_structured_csv`입니다.

## 2. 폴더 구조
- `01_master_data`: 직원, 고객사, 구매처, 품목 기준정보
- `02_raw_documents`: 메일, 클레임, 물류 로그, 회의록, 채팅 로그 원천 문서
- `03_structured_csv`: 주문, 구매, 출하, 클레임, 이슈 이벤트, 문서 인덱스 CSV
- `04_expected_outputs_for_test`: 개발 검증용 샘플 결과물 3개

## 3. 서비스 입력 데이터와 expected output의 차이
`02_raw_documents`와 `03_structured_csv`는 AI가 실제로 분석해야 하는 입력 데이터입니다. `04_expected_outputs_for_test`는 모델이 만들 수 있는 결과 형태를 확인하기 위한 정답 예시이며, 실제 업로드 또는 분석 대상에 포함하면 안 됩니다.

## 4. 특수 시나리오 8개
1. 2025년 6월 Daesung Automotive 긴급 발주 대응
2. 2025년 8월 KET Supplier 재고 부족과 납기 지연 가능성
3. 2025년 9월 Global Harness Vietnam 수출 서류 누락과 통관 지연
4. 2025년 11월 Mirae EV Systems 센서 케이블 반복 클레임
5. 2025년 12월 Yazaki Parts Asia 리드타임 8주에서 12주 증가
6. 2026년 2월 Hyundai Mobis Tier2 긴급 항공 이송
7. 2026년 4월 TE Connectivity Korea 단가 7% 인상 통보
8. 2026년 5~6월 박서연 담당 고객 업무 일부 인수인계

## 5. 인수인계 테스트 방법
1. `02_raw_documents`와 `03_structured_csv`만 업로드합니다.
2. 박서연 담당 고객인 Hyundai Mobis Tier2와 Daesung Automotive를 대상으로 인수인계서 생성을 요청합니다.
3. 결과에 고객별 미완료 Todo, 주요 이슈, 리스크, 담당자, 마감일, 다음 액션이 포함되는지 확인합니다.
4. `04_expected_outputs_for_test/expected_handover_sample.md`는 비교용으로만 사용합니다.

## 6. 주의사항
`04_expected_outputs_for_test`는 실제 업로드 대상이 아닙니다. 이 폴더를 AI 입력에 포함하면 평가가 오염될 수 있습니다.

## 재생성
```bash
python scripts/generate_dummy_data.py
```
"""
    (ROOT / "README_dummy_data.md").write_text(readme, encoding="utf-8")


def main() -> None:
    ensure_dirs()
    write_csv(OUT / "01_master_data" / "employees.csv", ["employee_id", "name", "team", "role", "permission_level", "email"], EMPLOYEES)
    write_csv(OUT / "01_master_data" / "customers.csv", ["customer_id", "customer_name", "region", "main_contact", "internal_owner", "risk_level", "notes"], CUSTOMERS)
    write_csv(OUT / "01_master_data" / "suppliers.csv", ["supplier_id", "supplier_name", "region", "main_products", "default_lead_time_days", "risk_type", "notes"], SUPPLIERS)
    write_csv(OUT / "01_master_data" / "products.csv", ["product_id", "product_name", "category", "main_supplier", "unit_price", "safety_stock_qty"], PRODUCTS)
    docs = generate_documents()
    generate_structured_csv()
    write_csv(
        OUT / "03_structured_csv" / "issue_events.csv",
        ["issue_id", "issue_title", "issue_type", "start_date", "end_date", "related_customer_id", "related_supplier_id", "related_product_id", "related_teams", "severity", "status", "description"],
        KEY_ISSUES + GENERAL_ISSUES,
    )
    write_csv(
        OUT / "03_structured_csv" / "source_document_index.csv",
        ["doc_id", "file_path", "doc_type", "created_date", "author", "related_team", "related_customer_id", "related_supplier_id", "related_product_id", "related_issue_id", "summary_hint"],
        [[d[h] for h in ["doc_id", "file_path", "doc_type", "created_date", "author", "related_team", "related_customer_id", "related_supplier_id", "related_product_id", "related_issue_id", "summary_hint"]] for d in docs],
    )
    write_expected_outputs()
    write_readme()
    append_scenario_9_outputs()

    csv_files = list(OUT.rglob("*.csv"))
    docs_count = len(list((OUT / "02_raw_documents").rglob("*.md")))
    expected_count = len(list((OUT / "04_expected_outputs_for_test").rglob("*.md")))
    print(f"생성 완료: {OUT}")
    print(f"CSV 파일: {len(csv_files)}개")
    print(f"원천 문서: {docs_count}개")
    print(f"expected output 샘플: {expected_count}개")
    print(f"총 파일: {len(list(OUT.rglob('*')))}개")


if __name__ == "__main__":
    main()
