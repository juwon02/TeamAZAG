from __future__ import annotations

import hashlib
from datetime import date, timedelta


BANNED_RAW_PHRASES = (
    "이 내용은 완성된 보고서가 아니라",
    "단정하지 말고 근거 문서를",
    "현재 상태는",
    "요청사항:",
    "다음 액션:",
    "제목에는",
    "리스크 등급은",
    "AI가 추출",
    "AI 분석",
    "데이터 생성 의도",
    "보고서 작성 지시",
    "자동 추출이 헷갈릴",
)


REQUIRED_MARKERS = {
    "sales_emails": ("제목:", "보낸사람:", "받는사람:"),
    "purchase_emails": ("제목:", "보낸사람:", "받는사람:"),
    "quality_claims": ("클레임 접수 메모", "접수:", "품목:"),
    "logistics_logs": ("작업 로그", "08:40", "기록:"),
    "meeting_notes": ("회의 메모", "참석:", "작성:"),
    "chat_logs": ("내부 메신저", "09:12", "09:42"),
}


def stable_number(seed: str, minimum: int, maximum: int) -> int:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return minimum + int(digest[:8], 16) % (maximum - minimum + 1)


def _status_lines(status: str, variant: int) -> tuple[str, str]:
    normalized = status.lower()
    if normalized in {"closed", "resolved"}:
        internal = [
            "창고 쪽 처리는 끝났다고 전달받았습니다.",
            "담당 부서에서는 조치 완료로 정리했습니다.",
            "내부 일정표에는 완료로 표시되어 있습니다.",
        ][variant % 3]
        external = [
            "고객 수령 확인은 아직 오지 않아 종결 메일은 보내지 않았습니다.",
            "상대방 확인 메일이 없어 완료 안내는 잠시 보류했습니다.",
            "고객이 최종 수량을 확인한 뒤에 건을 닫기로 했습니다.",
        ][variant % 3]
    elif normalized in {"monitoring", "partially_resolved"}:
        internal = "우선 처리분은 반영됐고 잔량과 후속 확인은 계속 보고 있습니다."
        external = "고객은 전체 수량 확인 전까지 완료로 보지 않겠다고 했습니다."
    else:
        internal = "내부 확인이 진행 중이라 오늘 안에 확정하기는 어렵습니다."
        external = "고객에게는 임시 일정임을 알렸고 최종 회신은 보내지 않았습니다."
    return internal, external


def render_operational_document(
    *,
    doc_id: str,
    folder: str,
    doc_type: str,
    created_date: str,
    author: str,
    related_team: str,
    customer: str,
    customer_contact: str,
    supplier: str,
    product: str,
    issue_id: str,
    issue_title: str,
    issue_description: str = "",
    status: str = "Open",
    quantity: int | None = None,
    due_date: str | None = None,
) -> str:
    created = date.fromisoformat(created_date)
    variant = stable_number(doc_id, 0, 8)
    quantity = quantity or stable_number(f"qty:{doc_id}", 120, 4800)
    first_date = date.fromisoformat(due_date) if due_date else created + timedelta(days=3 + variant % 5)
    revised_date = first_date + timedelta(days=2 + variant % 4)
    available = max(50, quantity - (variant % 4 + 1) * 100)
    internal_status, external_status = _status_lines(status, variant)
    customer = customer or "고객사"
    customer_contact = customer_contact or "고객 담당자"
    supplier = supplier or "협력사"
    product = product or "해당 품목"
    issue_title = issue_title or "납기 및 수량 확인"

    if folder == "sales_emails":
        body = f"""제목: [{customer}] {product} 납기 및 수량 확인
보낸사람: {customer_contact} <customer-contact@example.invalid>
받는사람: {author} <sales@example.invalid>
보낸시각: {created_date} 09:{10 + variant:02d}

안녕하세요.

{product} {quantity:,}개는 {first_date.strftime('%m/%d')} 입고로 전달받았습니다.
오늘 통화에서는 {revised_date.strftime('%m/%d')} 전후라고 하셔서 생산 계획에 어느 날짜를 넣어야 할지 확인 부탁드립니다.
전량이 어렵다면 먼저 출고할 수 있는 수량과 잔량 일정을 나누어 알려 주세요.

저희 쪽 생산 투입 순서가 걸려 있어 오후까지 회신이 없으면 기존 일정으로 진행하기 어렵습니다.
최종 출고표 확인 후 답변 부탁드립니다.

{customer_contact} 드림
"""
    elif folder == "purchase_emails":
        body = f"""제목: RE: {product} 재고 및 출하 일정
보낸사람: {supplier} 영업담당 <supplier-contact@example.invalid>
받는사람: {author} <purchase@example.invalid>
보낸시각: {created_date} 14:{5 + variant:02d}

{author}님,

현재 바로 준비 가능한 수량은 {available:,}개입니다. 나머지 {quantity - available:,}개는 생산 일정을 다시 확인하고 있습니다.
우선분은 {first_date.strftime('%m/%d')} 출하로 잡아 두었지만 확정 출하표에는 아직 반영되지 않았습니다.
잔량은 {revised_date.strftime('%m/%d')} 전후로 보고 있으며 원자재 입고에 따라 하루 이틀 움직일 수 있습니다.

대체 사양으로 진행하실 경우 고객 승인 여부를 먼저 알려 주셔야 자재를 확보할 수 있습니다.
확정되는 대로 다시 메일드리겠습니다.

감사합니다.
{supplier} 영업팀
"""
    elif folder == "quality_claims":
        body = f"""클레임 접수 메모
접수: {created_date} {10 + variant:02d}:20 / 전화
고객: {customer} ({customer_contact})
품목: {product}
수량: 확인 대상 {quantity:,}개 중 이상 주장 {max(1, quantity // 41)}개

- 고객은 조립 중 체결 상태가 일정하지 않았다고 함.
- 생산 LOT 사진은 흐려서 원본을 다시 받기로 함.
- 동일 증상 샘플 {1 + variant % 3}개를 회수하기로 했으나 발송일은 미정.
- {supplier}에서는 출하검사 때 이상이 없었다고 구두로 답변함.
- 고객 공정 조건과 운송 중 포장 상태도 함께 확인하기로 함.

{external_status}
메모 작성: {author}
"""
    elif folder == "logistics_logs":
        body = f"""{created_date} 입출고 작업 로그

08:40  {product} {quantity:,}개 작업 요청 접수. 고객 요청일 {first_date.strftime('%m/%d')}.
10:15  창고 피킹 가능 수량 {available:,}개 확인. 요청 수량과 차이 있어 {related_team}에 문의.
13:05  운송사 배차는 {revised_date.strftime('%m/%d')} 도착 기준으로 임시 예약.
15:30  {supplier} 포장명세 수량과 창고 실물이 맞지 않아 송장 발행 보류.
17:10  {internal_status}
17:25  {external_status}

기록: {author}
"""
    elif folder == "meeting_notes":
        background = issue_description.rstrip(".") if issue_description else issue_title
        body = f"""{created.strftime('%m/%d')} 운영 회의 메모
참석: {author}, 영업 박서연, 구매 최유진, 물류 윤예린

- {issue_title}
- 확인 배경: {background}
- 고객이 말한 날짜는 {first_date.strftime('%m/%d')}, 구매팀이 받은 날짜는 {revised_date.strftime('%m/%d')} 전후
- 먼저 준비 가능한 수량은 {available:,}개로 들었으나 창고 재확인 필요
- 고객 회신 담당은 {author}로 적혀 있으나 휴가 일정과 겹치는지 확인
- {internal_status}
- {external_status}
- 내일 오전 공급처 수량 확인 후 다시 공유

작성: {author}
"""
    else:
        body = f"""[{created_date} 내부 메신저]

09:12 {author}: {product} 건 고객이 {first_date.strftime('%m/%d')} 맞냐고 다시 물어봤어요.
09:14 최유진: {supplier} 메일에는 잔량이 {revised_date.strftime('%m/%d')}라고 왔습니다. 우선분만 먼저 나갈 수 있어요.
09:18 윤예린: 창고 수량은 {available:,}개로 보여요. 전량 출고 표시는 아직 하지 말아주세요.
09:26 박서연: 그러면 고객한테 부분 출고라고 먼저 말할까요? 어제는 완료 예정이라고 전달했습니다.
09:31 {author}: {internal_status}
09:35 박서연: {external_status}
09:42 최유진: 공급처 담당자가 외근이라 최종 답은 오후 늦게 올 것 같습니다.
"""

    metadata = "\n".join(
        [
            f"문서ID: {doc_id}",
            f"작성일: {created_date}",
            f"문서유형: {doc_type}",
            f"작성자: {author}",
            f"관련팀: {related_team}",
            f"고객사: {customer}",
            f"구매처: {supplier}",
            f"품목: {product}",
            f"관련이슈: {issue_id or '일반 운영'} / {issue_title}",
            "--------------------------------",
            "",
        ]
    )
    return metadata + body.strip() + "\n"


def validate_operational_body(text: str, folder: str) -> list[str]:
    body = text.split("--------------------------------", 1)[-1]
    errors = [f"금지 문장 포함: {phrase}" for phrase in BANNED_RAW_PHRASES if phrase in body]
    for marker in REQUIRED_MARKERS[folder]:
        if marker not in body:
            errors.append(f"{folder} 형식 누락: {marker}")
    return errors
