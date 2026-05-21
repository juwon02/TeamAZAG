"""
Issue API 엔드포인트
담당: 박주원
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.services.issue_service import IssueService
from app.schemas.issue import IssueCreate, IssueUpdate

router = APIRouter()


@router.get("/", response_model=dict)
async def get_issues(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    service = IssueService(db)
    issues = await service.get_issues(
        status=status, risk_level=risk_level
    )
    return {"issues": issues}


@router.post("/", response_model=dict)
async def create_issue(
    body: IssueCreate,
    db: AsyncSession = Depends(get_db)
):
    service = IssueService(db)
    issue = await service.create_issue(body)
    return {"issue": issue}


@router.patch("/{issue_id}", response_model=dict)
async def update_issue(
    issue_id: str,
    body: IssueUpdate,
    db: AsyncSession = Depends(get_db)
):
    service = IssueService(db)
    issue = await service.update_issue(issue_id, body)
    return {"issue": issue}


@router.patch("/{issue_id}/resolve", response_model=dict)
async def resolve_issue(
    issue_id: str,
    db: AsyncSession = Depends(get_db)
):
    service = IssueService(db)
    issue = await service.resolve_issue(issue_id)
    return {"issue": issue}