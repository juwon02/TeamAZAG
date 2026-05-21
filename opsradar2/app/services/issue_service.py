"""
Issue 비즈니스 로직
담당: 박주원
"""
import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.issue_repository import IssueRepository
from app.schemas.issue import IssueCreate, IssueUpdate


class IssueService:
    def __init__(self, db: AsyncSession):
        self.repo = IssueRepository(db)

    async def get_issues(self, status=None, risk_level=None):
        return await self.repo.get_all(
            status=status, risk_level=risk_level
        )

    async def create_issue(self, data: IssueCreate):
        return await self.repo.create({
            "id": str(uuid.uuid4()),
            "title": data.title,
            "description": data.description,
            "risk_level": data.risk_level,
            "assignee": data.assignee,
            "status": "open",
            "source": "manual",
            "confidence": None,
        })

    async def update_issue(self, issue_id: str, data: IssueUpdate):
        issue = await self.repo.get_by_id(issue_id)
        if not issue:
            raise HTTPException(status_code=404, detail="이슈를 찾을 수 없어요")
        update_data = data.model_dump(exclude_none=True)
        return await self.repo.update(issue, update_data)

    async def resolve_issue(self, issue_id: str):
        issue = await self.repo.get_by_id(issue_id)
        if not issue:
            raise HTTPException(status_code=404, detail="이슈를 찾을 수 없어요")
        return await self.repo.update(issue, {"status": "resolved"})