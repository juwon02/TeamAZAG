"""AI summarization/extraction helpers with deterministic Korean fallback."""

from __future__ import annotations

import json
import re
from typing import Any

from app.ai.llm_client import chat_completion
from app.core.config import settings


async def answer_question(query: str, context: str) -> dict:
    if not query.strip():
        raise ValueError("query is required")
    if settings.AI_PROVIDER.lower() != "azure":
        return {"answer": _fallback_answer(query, context), "sources": []}

    prompt = f"""
아래 업무 문서 context만 근거로 질문에 한국어로 답하세요.
문서에 없는 내용은 추측하지 말고, 해당 내용을 찾을 수 없다고 말하세요.

[context]
{context or "관련 문서 없음"}

[question]
{query}
"""
    try:
        answer = await chat_completion(prompt, system_prompt="You are OpsRadar's RAG assistant.", temperature=0.1)
        return {"answer": answer, "sources": []}
    except Exception:
        return {"answer": _fallback_answer(query, context), "sources": []}


async def summarize_document(document_text: str) -> dict:
    text = _clean_text(document_text)
    if not text:
        return {"summary": "", "keywords": []}
    fallback = {"summary": _simple_summary(text), "keywords": _simple_keywords(text)}
    if settings.AI_PROVIDER.lower() != "azure":
        return fallback

    prompt = (
        "다음 운영 문서를 3줄 이내로 요약하고 핵심 키워드 5개를 JSON으로만 반환하세요.\n"
        '형식: {"summary":"", "keywords":[""]}\n\n'
        f"{text[:10000]}"
    )
    try:
        raw = await chat_completion(prompt, system_prompt="Return only valid JSON.", temperature=0.1)
        return _parse_json(raw, fallback)
    except Exception:
        return fallback


async def extract_todos(document_text: str) -> dict:
    text = _clean_text(document_text)
    if not text:
        return {"todos": [], "decisions": [], "issues": []}
    fallback = _heuristic_extract(text)
    if settings.AI_PROVIDER.lower() != "azure":
        return fallback

    prompt = f"""
다음 운영 문서에서 todos, decisions, issues를 JSON으로만 추출하세요.
문장 그대로 복사하기보다 실제 업무 항목으로 정리하세요.

형식:
{{
  "todos": [{{"content": "", "assignee": null, "due_date": null, "priority": "medium"}}],
  "decisions": [""],
  "issues": [{{"title": "", "description": "", "severity": "medium"}}]
}}

[문서]
{text[:10000]}
"""
    try:
        raw = await chat_completion(prompt, system_prompt="Return only valid JSON.", temperature=0.1)
        parsed = _parse_json(raw, fallback)
        return _normalize_extraction(parsed)
    except Exception:
        return fallback


def _parse_json(raw: str, fallback: dict) -> dict:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        return fallback
    return _normalize_extraction(parsed) if isinstance(parsed, dict) and "todos" in parsed else parsed if isinstance(parsed, dict) else fallback


def _normalize_extraction(data: dict[str, Any]) -> dict:
    todos = data.get("todos") if isinstance(data.get("todos"), list) else []
    decisions = data.get("decisions") if isinstance(data.get("decisions"), list) else []
    issues = data.get("issues") if isinstance(data.get("issues"), list) else []

    normalized_todos = []
    for item in todos[:20]:
        if isinstance(item, str):
            normalized_todos.append({"content": item, "assignee": None, "due_date": None, "priority": "medium"})
        elif isinstance(item, dict):
            content = item.get("content") or item.get("title")
            if content:
                normalized_todos.append(
                    {
                        "content": str(content),
                        "assignee": item.get("assignee"),
                        "due_date": item.get("due_date") or item.get("due_at"),
                        "priority": item.get("priority") or "medium",
                    }
                )

    normalized_issues = []
    for item in issues[:20]:
        if isinstance(item, str):
            normalized_issues.append({"title": item, "description": item, "severity": "medium"})
        elif isinstance(item, dict):
            title = item.get("title") or item.get("description")
            if title:
                normalized_issues.append(
                    {
                        "title": str(title),
                        "description": item.get("description") or str(title),
                        "severity": _normalize_severity(item.get("severity")),
                    }
                )

    return {
        "todos": normalized_todos,
        "decisions": [str(item) for item in decisions[:20]],
        "issues": normalized_issues,
    }


def _simple_summary(text: str) -> str:
    lines = _meaningful_lines(text)
    issue_lines = [line for line in lines if _contains_any(line, ("문제", "이슈", "issue", "리스크", "위험", "오류", "장애", "지연", "timeout", "초과"))]
    todo_lines = [line for line in lines if _contains_any(line, ("todo", "해야", "필요", "담당", "마감", "점검", "확인", "조치"))]

    parts = []
    if issue_lines:
        parts.append(f"주요 이슈: {issue_lines[0]}")
    if todo_lines:
        parts.append(f"우선 조치: {todo_lines[0]}")
    if len(lines) > 1:
        extra = next((line for line in lines if line not in issue_lines[:1] and line not in todo_lines[:1]), None)
        if extra:
            parts.append(f"참고: {extra}")

    selected = parts or lines[:3]
    return " ".join(selected)[:700]


def _simple_keywords(text: str) -> list[str]:
    text = _clean_text(text)
    words = re.findall(r"[A-Za-z가-힣0-9]{3,}", text)
    stopwords = {"content", "date", "todo", "issue", "작성자", "운영로그"}
    counts: dict[str, int] = {}
    for word in words:
        if word.lower() in stopwords:
            continue
        counts[word] = counts.get(word, 0) + 1
    return [word for word, _ in sorted(counts.items(), key=lambda item: item[1], reverse=True)[:5]]


def _heuristic_extract(text: str) -> dict:
    lines = _meaningful_lines(text)
    todos = []
    decisions = []
    issues = []
    for line in lines:
        lowered = line.lower()
        if any(token in lowered for token in ("todo", "해야", "필요", "완료", "담당", "마감", "점검", "확인", "조치")):
            todos.append({"content": line[:300], "assignee": _guess_assignee(line), "due_date": None, "priority": _guess_priority(line)})
        if any(token in lowered for token in ("결정", "확정", "합의", "decision")):
            decisions.append(line[:300])
        if any(token in lowered for token in ("issue", "문제", "blocked", "리스크", "위험", "오류", "장애", "지연", "timeout", "초과")):
            issues.append({"title": line[:160], "description": line[:300], "severity": _guess_severity(line)})
    return {"todos": todos[:20], "decisions": decisions[:20], "issues": issues[:20]}


def _guess_assignee(text: str) -> str | None:
    match = re.search(r"(담당자?\s*[A-Za-z가-힣0-9]+|[A-Za-z가-힣0-9]+)\s*(?:가|이)\s*", text)
    return match.group(1).replace("담당자", "").strip() if match else None


def _guess_priority(text: str) -> str:
    lowered = text.lower()
    if any(token in lowered for token in ("긴급", "critical", "high", "장애", "초과", "timeout")):
        return "high"
    if any(token in lowered for token in ("낮음", "low")):
        return "low"
    return "medium"


def _guess_severity(text: str) -> str:
    lowered = text.lower()
    if any(token in lowered for token in ("critical", "장애", "초과", "timeout", "high")):
        return "high"
    if any(token in lowered for token in ("low", "낮음")):
        return "low"
    return "medium"


def _normalize_severity(value: Any) -> str:
    lowered = str(value or "").lower()
    if lowered in {"high", "critical"}:
        return "high"
    if lowered == "low":
        return "low"
    return "medium"


def _fallback_answer(query: str, context: str) -> str:
    context = _clean_text(context)
    if context:
        return f"업로드된 문서 기준으로 확인했습니다.\n\n{_simple_summary(context)}"
    return "관련 문서를 찾지 못했습니다. 먼저 회의록, 보고서, 인수인계 문서를 업로드해주세요."


def _clean_text(text: str) -> str:
    return (text or "").replace("\ufeff", "").replace("\u200b", "").strip()


def _meaningful_lines(text: str) -> list[str]:
    lines = []
    for raw in re.split(r"\n+|(?<=[.!?])\s+", _clean_text(text)):
        line = raw.strip(" \t\r-•")
        if not line:
            continue
        if re.match(r"^(date|작성자)\s*[:：]", line, flags=re.IGNORECASE):
            continue
        line = re.sub(r"^(운영\s*로그|todo|issue|content|내용|마감)\s*[:：]\s*", "", line, flags=re.IGNORECASE)
        if line:
            lines.append(line[:500])
    return lines


def _contains_any(text: str, tokens: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(token in lowered for token in tokens)
