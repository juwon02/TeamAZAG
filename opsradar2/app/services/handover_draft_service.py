"""AI handover document drafting — mirrors report_draft_service pattern."""

from __future__ import annotations

import json
from typing import Any

from app.ai.llm_client import AzureOpenAIConfigError, chat_completion
from app.core.config import settings


SYSTEM_PROMPT = (
    "너는 운영 인수인계 문서를 작성하는 어시스턴트다. "
    "제공된 업무 데이터에만 근거해 작성하고, "
    "데이터에 없는 내용은 절대 지어내지 마라. "
    "추측이 필요하면 '확인 필요'로 표기. "
    "grounding JSON의 todos 배열에 실제로 존재하는 항목만 '업무'로 적어라. "
    "이슈를 업무로 바꿔 적거나, 없는 Todo를 만들지 마라. "
    "데이터에 없으면 '없음'으로 표기하는 것이 지어내는 것보다 항상 낫다. "
    "이슈를 누락하는 것은 업무를 지어내는 것만큼 나쁘다. "
    "모든 이슈는 남기되, 없는 Todo는 만들지 마라."
)

HANDOVER_PROMPT = """다음은 {owner}님이 {receiver}님에게 인계하는 업무 데이터입니다.
후임자가 이 문서만 읽고 업무를 즉시 파악할 수 있도록, 아래 4개 섹션으로 작성하세요.

## 1. 인수인계 개요 (3~4문장)
- 이 담당자가 주로 어떤 고객사/품목/이슈를 다뤘는지 맥락으로 요약.
- 단순 나열 금지. 업무들을 엮어서 "무슨 상황인지" 서술.
- 데이터에 근거 없는 일반적 조언("추가 지원 필요", "안정화 필요" 등)은 쓰지 마라. 구체적 근거가 있을 때만 서술.

## 2. 우선순위 및 즉시 조치 사항
- 후임자가 먼저 손대야 할 순서대로. High 우선순위와 마감 임박 건을 앞에.
- 각 항목: [무엇을] [왜 급한지] [다음 액션].
- 가장 시급한 1순위는 왜 나머지보다 먼저인지 한 문장으로 명시하라(예: "재발 시 분기 전체 납품 중단 위험이라 최우선").

## 3. 진행 중 업무 및 이슈 (인과 관계 중심)
- Todo와 이슈를 별도 목록으로 나열하지 마라. 대신 "이슈 → 그로 인해 생긴 Todo" 형태로 묶어서 서술하라.
- 예시 형식:
    ▸ [이슈] AP-CB-510 품질 클레임 복수 고객 반복 (배수민)
      └ 원인: 구조적 품질 결함 추정, 재발방지책 미수립
      └ 이 이슈로 생긴 업무:
          · 구조적 원인 분석 및 재발방지안 수립 (배수민, High)
          · 불량 샘플 회수 및 출하검사 기록 요청 (배수민)
      └ 근거: DOC-0138
- 이슈와 직접 연결 안 되는 독립 Todo는 마지막에 "기타 진행 업무"로 모아라.
- 같은 품목/고객사 건은 묶어서 보여줘 후임자가 패턴을 보게 하라.
- grounding의 모든 이슈는 빠짐없이 §3에 항목으로 남겨라. 어떤 이슈도 누락하지 마라. 이슈에 연결된 Todo가 없으면, 그 이슈를 삭제하지 말고 반드시 이렇게 남겨라:
    ▸ [이슈] (이슈 제목) (담당자)
      └ 원인/상태: (grounding의 내용)
      └ 직접 연결된 후속 업무: 없음 (후임자 판단 필요)
      └ 근거: (문서명)
  연결 Todo가 없다는 이유로 이슈 자체를 빼는 것은 인수인계 누락이므로 금지한다. 이슈 제목 자체를 업무처럼 재서술하지 마라.

## 4. 참고 자료
- 각 업무의 근거 문서(file_name)를 출처로 표기. 데이터에 있는 것만.
- 같은 문서가 여러 업무의 근거면 한 번만 적고 "(N개 업무 공통 근거)"로 표기.

업무 데이터(JSON):
{grounding_json}

주의: JSON에 없는 고객사/숫자/날짜를 지어내지 마라. 빈 항목은 "해당 없음"으로.

Markdown 본문만 출력하고, 코드 블록이나 작성 과정 설명은 포함하지 마라."""


class HandoverDraftService:
    """Generate a handover document when Azure OpenAI is configured."""

    async def generate(self, handover_input: dict[str, Any]) -> str | None:
        if settings.AI_PROVIDER.lower() != "azure":
            return None

        owner = handover_input.get("owner") or "전임자"
        receiver = handover_input.get("receiver") or "후임자"
        grounding_json = json.dumps(handover_input, ensure_ascii=False, default=str, indent=2)
        user_message = HANDOVER_PROMPT.format(
            owner=owner,
            receiver=receiver,
            grounding_json=grounding_json,
        )

        try:
            content = (await chat_completion(
                user_message,
                system_prompt=SYSTEM_PROMPT,
                temperature=0.2,
            )).strip()
        except (AzureOpenAIConfigError, ModuleNotFoundError, RuntimeError, ValueError):
            return None
        except Exception:
            return None

        return content if self._is_complete(content) else None

    @staticmethod
    def _is_complete(content: str) -> bool:
        required = ["## 1.", "## 2.", "## 3.", "## 4."]
        return len(content) >= 200 and all(marker in content for marker in required)
