"""Report business logic."""

from app.repositories.report_repository import ReportRepository
from app.services.report_draft_service import ReportDraftService


class ReportService:
    def __init__(self, repo: ReportRepository):
        self.repo = repo

    async def generate_report(
        self,
        period: str,
        project_id: str | None = None,
        start_date: str | None = None,
    ) -> dict:
        normalized_period = "monthly" if period == "monthly" else "weekly"
        prepared = await self.repo.prepare_generation(
            normalized_period,
            project_id=project_id,
            start_date=start_date,
        )
        ai_content = await ReportDraftService().generate(normalized_period, prepared["report_input"])
        content = ai_content or self.repo.fallback_content(prepared)
        result = await self.repo.store_generated(prepared, content)
        result["generation_mode"] = "ai" if ai_content else "fallback"
        return result

    async def update_report(self, report_id: str, content: str) -> bool:
        return await self.repo.update(report_id, content)

    async def delete_report(self, report_id: str) -> bool:
        return await self.repo.delete(report_id)

    async def list_reports(self, project_id: str | None = None) -> list[dict]:
        return await self.repo.get_all(project_id=project_id)

    async def review_check(self, project_id: str | None = None) -> dict:
        return await self.repo.review_check(project_id=project_id)
