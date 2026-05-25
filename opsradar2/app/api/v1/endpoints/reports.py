"""
Reports API
담당: 박주원
"""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.report import Report

router = APIRouter()


@router.get("/")
async def get_reports(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Report).order_by(Report.created_at.desc())
    )
    reports = result.scalars().all()
    return {"reports": [
        {
            "id": r.id,
            "period": r.period,
            "start_date": r.start_date,
            "end_date": r.end_date,
            "content": r.content,
            "created_at": str(r.created_at)
        } for r in reports
    ]}


@router.post("/generate")
async def generate_report(
    period: str = "weekly",
    db: AsyncSession = Depends(get_db)
):
    # 나중에 AI 연결 예정 — 지금은 껍데기
    from datetime import datetime
    report_id = str(uuid.uuid4())
    content = f"""
## {period} 운영 보고서

### 📌 개요
AI 파이프라인 연동 후 자동 생성될 예정입니다.

### 📋 주요 현황
- Todo 현황: DB에서 집계 예정
- 이슈 현황: DB에서 집계 예정

### 🔍 AI 분석
AI 파이프라인 연동 후 자동 작성됩니다.
    """.strip()

    result = await db.execute(select(Report))
    from app.models.report import Report as ReportModel
    report = ReportModel(
        id=report_id,
        period=period,
        start_date=datetime.now().strftime("%Y-%m-%d"),
        end_date=datetime.now().strftime("%Y-%m-%d"),
        content=content,
    )
    db.add(report)
    await db.commit()

    return {
        "report": {
            "id": report_id,
            "period": period,
            "content": content
        }
    }