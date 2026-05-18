"""
AI 분석 서비스 — 텍스트 → Todo/이슈/요약 추출
담당: 이성우
AI_PROVIDER 환경변수로 gemini | azure 전환
"""
from app.core.config import settings


def extract_todos(text: str) -> list:
    """
    문서에서 Todo 항목 추출
    TODO: 이성우 — LLM 프롬프팅 구현
    Returns: [{"title": str, "priority": str, "confidence": int}]
    """
    raise NotImplementedError


def extract_issues(text: str) -> list:
    """
    문서에서 리스크/이슈 탐지
    TODO: 이성우 — LLM 프롬프팅 구현
    Returns: [{"title": str, "risk_level": str, "confidence": str}]
    """
    raise NotImplementedError


def summarize(text: str, period: str = "daily") -> str:
    """
    운영 요약 생성 (일/주/월 단위)
    TODO: 이성우 — LLM 요약 프롬프팅 구현
    """
    raise NotImplementedError


def _get_llm():
    """
    AI_PROVIDER 환경변수 기반으로 LLM 인스턴스 반환
    gemini → ChatGoogleGenerativeAI
    azure  → AzureChatOpenAI
    """
    if settings.AI_PROVIDER == "azure":
        from langchain_openai import AzureChatOpenAI
        return AzureChatOpenAI(
            azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_API_KEY,
        )
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=settings.GEMINI_API_KEY,
    )
