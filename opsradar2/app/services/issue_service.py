"""Issue business logic."""

from typing import Optional

from app.repositories.issue_repository import IssueRepository


class IssueService:
    def __init__(self, repo: IssueRepository):
        self.repo = repo

    async def list_issues(self, status: Optional[str] = None, risk_level: Optional[str] = None) -> list[dict]:
        return await self.repo.get_all(status=status, risk_level=risk_level)

    async def update_issue(self, issue_id: str, data: dict) -> bool:
        return await self.repo.update(issue_id, data)

    async def resolve_issue(self, issue_id: str) -> bool:
        return await self.repo.resolve(issue_id)
