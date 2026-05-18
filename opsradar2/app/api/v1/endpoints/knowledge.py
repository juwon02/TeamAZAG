"""
UC-06 지식 전달 — 온보딩 / 인수인계
담당: 김성호 (조회 API) + 이성우 (문서 요약)
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/onboarding")
async def get_onboarding():
    """신규 입사자 온보딩 문서 (UC-06A)"""
    # TODO: 이성우 — ai_analysis_service 기반 온보딩 문서 생성
    return {
        "project_overview": "",
        "current_status": "",
        "recent_decisions": [],
        "key_risks": [],
        "reference_documents": [],
    }


@router.get("/handover")
async def get_handover():
    """재직자 인수인계 문서 (UC-06B)"""
    # TODO: 이성우 — ai_analysis_service 기반 인수인계 문서 생성
    return {
        "in_progress_tasks": [],
        "priority_todos": [],
        "blocked_items": [],
        "recent_changes": [],
        "reference_documents": [],
    }
