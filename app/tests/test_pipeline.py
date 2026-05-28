"""
test_pipeline.py — FastAPI 엔드포인트 + AI 파이프라인 통합 테스트
팀메모리 프로젝트 / 담당: 이성우

실행:
    pytest app/tests/test_pipeline.py -v
    pytest app/tests/test_pipeline.py -v -k "test_health"   # 특정 테스트만

전제조건:
    - .env 파일에 AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT 설정
    - dummy/documents/ 폴더에 테스트 문서 존재
    - pip install pytest httpx
"""

import os
import io
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

DUMMY_TXT = "dummy/documents/meeting_2026_05_11_final.txt"
DUMMY_CSV = "dummy/documents/tasks_2026_05_week2.csv"


# ────────────────────────────────────────────
# 헬스체크
# ────────────────────────────────────────────

def test_root():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["service"] == "TeamMemory API"


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert "faiss_vectors" in res.json()


# ────────────────────────────────────────────
# 문서 업로드
# ────────────────────────────────────────────

def test_upload_unsupported_extension():
    """지원하지 않는 확장자는 400을 반환해야 한다."""
    res = client.post(
        "/documents/upload",
        files={"file": ("test.xlsx", b"fake content", "application/octet-stream")},
        data={"doc_type": ""},
    )
    assert res.status_code == 400
    assert "지원하지 않는 파일 형식" in res.json()["detail"]


def test_upload_txt_file():
    """TXT 파일 업로드 시 202와 document_id를 반환해야 한다."""
    if not os.path.exists(DUMMY_TXT):
        pytest.skip(f"더미 파일 없음: {DUMMY_TXT}")

    with open(DUMMY_TXT, "rb") as f:
        res = client.post(
            "/documents/upload",
            files={"file": (os.path.basename(DUMMY_TXT), f, "text/plain")},
            data={"doc_type": "meeting"},
        )

    assert res.status_code == 202
    body = res.json()
    assert "document_id" in body
    assert body["status"] == "queued"


def test_upload_csv_file():
    """CSV 파일 업로드 시 202를 반환해야 한다."""
    if not os.path.exists(DUMMY_CSV):
        pytest.skip(f"더미 파일 없음: {DUMMY_CSV}")

    with open(DUMMY_CSV, "rb") as f:
        res = client.post(
            "/documents/upload",
            files={"file": (os.path.basename(DUMMY_CSV), f, "text/csv")},
            data={"doc_type": "csv"},
        )

    assert res.status_code == 202
    assert "document_id" in res.json()


# ────────────────────────────────────────────
# 문서 목록 / 상태
# ────────────────────────────────────────────

def test_list_documents():
    """문서 목록 조회는 항상 200을 반환해야 한다."""
    res = client.get("/documents")
    assert res.status_code == 200
    body = res.json()
    assert "total" in body
    assert "documents" in body


def test_get_status_not_found():
    """존재하지 않는 document_id는 404를 반환해야 한다."""
    res = client.get("/documents/nonexistent123/status")
    assert res.status_code == 404


def test_upload_then_status():
    """업로드 후 상태 조회가 가능해야 한다."""
    if not os.path.exists(DUMMY_TXT):
        pytest.skip(f"더미 파일 없음: {DUMMY_TXT}")

    with open(DUMMY_TXT, "rb") as f:
        upload_res = client.post(
            "/documents/upload",
            files={"file": (os.path.basename(DUMMY_TXT), f, "text/plain")},
            data={"doc_type": "meeting"},
        )
    assert upload_res.status_code == 202
    document_id = upload_res.json()["document_id"]

    status_res = client.get(f"/documents/{document_id}/status")
    assert status_res.status_code == 200
    body = status_res.json()
    assert body["document_id"] == document_id
    assert body["status"] in {"queued", "parsing", "chunking", "embedding", "analyzing", "completed", "failed"}


def test_delete_document():
    """업로드 후 삭제하면 204, 이후 상태 조회는 404여야 한다."""
    if not os.path.exists(DUMMY_TXT):
        pytest.skip(f"더미 파일 없음: {DUMMY_TXT}")

    with open(DUMMY_TXT, "rb") as f:
        upload_res = client.post(
            "/documents/upload",
            files={"file": (os.path.basename(DUMMY_TXT), f, "text/plain")},
            data={"doc_type": "meeting"},
        )
    document_id = upload_res.json()["document_id"]

    del_res = client.delete(f"/documents/{document_id}")
    assert del_res.status_code == 204

    status_res = client.get(f"/documents/{document_id}/status")
    assert status_res.status_code == 404


# ────────────────────────────────────────────
# 챗봇
# ────────────────────────────────────────────

def test_chat_empty_message():
    """빈 질문은 422를 반환해야 한다."""
    res = client.post("/chat", json={"message": ""})
    assert res.status_code == 422


def test_chat_invalid_doc_type():
    """잘못된 doc_type은 422를 반환해야 한다."""
    res = client.post("/chat", json={"message": "테스트", "doc_type": "invalid_type"})
    assert res.status_code == 422


def test_chat_invalid_top_k():
    """범위를 벗어난 top_k는 422를 반환해야 한다."""
    res = client.post("/chat", json={"message": "테스트", "top_k": 99})
    assert res.status_code == 422


def test_chat_no_documents():
    """FAISS DB가 없거나 비어있을 때도 200과 안내 메시지를 반환해야 한다."""
    res = client.post("/chat", json={"message": "현재 이슈가 뭐야?"})
    assert res.status_code == 200
    body = res.json()
    assert "answer" in body
    assert "sources" in body
    assert "suggested_questions" in body


def test_chat_with_doc_type_filter():
    """doc_type 필터를 지정해도 정상 동작해야 한다."""
    res = client.post("/chat", json={"message": "회의 내용 요약해줘", "doc_type": "meeting"})
    assert res.status_code == 200


# ────────────────────────────────────────────
# 할일 추출
# ────────────────────────────────────────────

def test_extract_empty_text():
    """빈 텍스트는 422를 반환해야 한다."""
    res = client.post("/chat/extract", json={"text": ""})
    assert res.status_code == 422


def test_extract_todos():
    """텍스트에서 Todo 추출 시 200과 구조화된 결과를 반환해야 한다."""
    sample_text = (
        "오늘 회의에서 이성우는 다음 주까지 API 명세서를 작성하기로 했다. "
        "기술 스택은 FastAPI + FAISS로 확정되었다. "
        "DB 스키마 설계가 아직 미완료 상태라 다음 회의에서 논의가 필요하다."
    )
    res = client.post("/chat/extract", json={"text": sample_text})
    assert res.status_code == 200
    body = res.json()
    assert "todos" in body
    assert "decisions" in body
    assert "issues" in body
    assert "counts" in body
    assert isinstance(body["todos"], list)
    assert isinstance(body["decisions"], list)
    assert isinstance(body["issues"], list)
