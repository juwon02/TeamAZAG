"""Document endpoints.

Upload processing is intentionally kept as a placeholder for the local DB
verification pass so the API can boot without multipart dependencies.
"""

from fastapi import APIRouter

router = APIRouter()


@router.post("/upload")
async def upload_document(body: dict):
    return {
        "status": "not_implemented",
        "document_id": body.get("document_id"),
        "analysis_status": "queued",
    }


@router.get("/{document_id}/status")
async def get_document_status(document_id: str):
    return {"document_id": document_id, "analysis_status": "completed", "progress": 100}


@router.get("")
async def get_documents():
    return {"documents": []}
