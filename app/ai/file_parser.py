"""
file_parser.py — 파일 텍스트 추출 모듈
팀메모리 (OpsRadar) 프로젝트 / 담당: 이성우

역할: 업로드된 파일에서 순수 텍스트만 추출.
      chunker.py가 이 텍스트를 받아서 청킹함.

지원 형식 (요구사항 4-1):
  - .txt  : 텍스트 그대로 읽기
  - .csv  : 행별로 텍스트 변환
  - .pdf  : pymupdf로 텍스트 추출
  - .docx : python-docx로 텍스트 추출

사용 방법:
    from app.ai.file_parser import parse_file

    text, doc_type = parse_file("uploads/meeting.pdf")
    # text = "회의 내용 전체 텍스트..."
    # doc_type = "meeting" (파일명으로 자동 추론)
"""

import os
import csv
import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# 지원 확장자
SUPPORTED_EXTENSIONS = {".txt", ".csv", ".pdf", ".docx"}

# 파일 크기 제한 (10MB)
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


def parse_file(file_path: str) -> tuple[str, str]:
    """
    파일을 읽어서 (텍스트, doc_type) 반환.

    Args:
        file_path: 업로드된 파일 경로
                   예: "uploads/meeting_2026_05_14.pdf"

    Returns:
        (text, doc_type) 튜플
        - text    : 추출된 순수 텍스트
        - doc_type: 추론된 문서 유형
                    "meeting" | "email" | "chat" | "csv" | "handover" | "report"

    Raises:
        FileNotFoundError : 파일 없음
        ValueError        : 지원하지 않는 형식 or 빈 파일 or 용량 초과
        RuntimeError      : 텍스트 추출 실패
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"[file_parser] 파일을 찾을 수 없습니다: {file_path}")

    # 파일 크기 확인
    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"[file_parser] 파일 크기 초과: {file_size / 1024 / 1024:.1f}MB "
            f"(최대 {MAX_FILE_SIZE_BYTES / 1024 / 1024:.0f}MB)"
        )

    filename = os.path.basename(file_path)
    ext = os.path.splitext(filename)[1].lower()

    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"[file_parser] 지원하지 않는 파일 형식: {ext}\n"
            f"  지원 형식: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    logger.info(f"[file_parser] 파싱 시작: {filename} ({file_size / 1024:.1f}KB)")
    print(f"[file_parser] 파싱 시작: {filename} ({file_size / 1024:.1f}KB)")

    # 확장자별 파싱
    if ext == ".txt":
        text = _parse_txt(file_path)
    elif ext == ".csv":
        text = _parse_csv(file_path)
    elif ext == ".pdf":
        text = _parse_pdf(file_path)
    elif ext == ".docx":
        text = _parse_docx(file_path)

    if not text or not text.strip():
        raise ValueError(f"[file_parser] 텍스트를 추출할 수 없습니다: {file_path}")

    doc_type = _infer_doc_type(filename)

    print(f"[file_parser] 완료: {len(text)}자 추출 / 유형: {doc_type}")
    logger.info(f"[file_parser] 완료: {len(text)}자 추출 / 유형: {doc_type}")

    return text, doc_type


def parse_files_bulk(file_paths: list[str]) -> list[dict]:
    """
    여러 파일을 한꺼번에 파싱.
    개별 파일 오류 시 건너뛰고 계속 진행.

    Args:
        file_paths: 파일 경로 리스트

    Returns:
        [
            {"file_path": "...", "text": "...", "doc_type": "meeting"},
            ...
        ]
    """
    results = []
    errors = []

    for file_path in file_paths:
        try:
            text, doc_type = parse_file(file_path)
            results.append({
                "file_path": file_path,
                "text": text,
                "doc_type": doc_type,
            })
        except FileNotFoundError as e:
            logger.error(str(e))
            errors.append(file_path)
        except ValueError as e:
            logger.error(str(e))
            errors.append(file_path)
        except Exception as e:
            logger.error(f"[file_parser] 예상치 못한 오류 ({file_path}): {e}")
            errors.append(file_path)

    if errors:
        print(f"[file_parser] 경고: {len(errors)}개 파일 파싱 실패 → {errors}")

    print(f"[file_parser] 전체 {len(file_paths)}개 파일 → {len(results)}개 성공")
    return results


def get_supported_extensions() -> set:
    """지원하는 파일 확장자 목록 반환."""
    return SUPPORTED_EXTENSIONS.copy()


# ────────────────────────────────────────────
# 내부 파싱 함수
# ────────────────────────────────────────────

def _parse_txt(file_path: str) -> str:
    """TXT 파일 읽기. UTF-8 실패 시 CP949 재시도."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        logger.warning(f"[file_parser] UTF-8 실패, CP949 재시도: {file_path}")
        try:
            with open(file_path, "r", encoding="cp949") as f:
                return f.read()
        except UnicodeDecodeError:
            raise RuntimeError(f"[file_parser] 인코딩 오류: {file_path}")


def _parse_csv(file_path: str) -> str:
    """
    CSV 파일 읽기.
    각 행을 "컬럼명: 값 / 컬럼명: 값" 형태의 텍스트로 변환.
    chunker.py의 csv 청킹 방식과 호환됨.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="cp949") as f:
            content = f.read()

    reader = csv.DictReader(io.StringIO(content))
    lines = []
    for row in reader:
        line = " / ".join([f"{k}: {v}" for k, v in row.items() if v])
        if line.strip():
            lines.append(line)

    return "\n".join(lines)


def _parse_pdf(file_path: str) -> str:
    """
    PDF 파일 텍스트 추출.
    pymupdf(fitz) 우선 시도, 없으면 pypdf 사용.
    """
    # pymupdf 시도 (더 정확함)
    try:
        import fitz  # pymupdf
        doc = fitz.open(file_path)
        pages = []
        for page_num, page in enumerate(doc):
            page_text = page.get_text()
            if page_text.strip():
                pages.append(f"[페이지 {page_num + 1}]\n{page_text}")
        doc.close()
        text = "\n\n".join(pages)
        if text.strip():
            return text
    except ImportError:
        logger.warning("[file_parser] pymupdf 없음, pypdf 시도")
    except Exception as e:
        logger.warning(f"[file_parser] pymupdf 실패: {e}, pypdf 시도")

    # pypdf 폴백
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        pages = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                pages.append(f"[페이지 {i + 1}]\n{page_text}")
        text = "\n\n".join(pages)
        if text.strip():
            return text
    except ImportError:
        raise RuntimeError(
            "[file_parser] PDF 파싱 패키지가 없습니다.\n"
            "  → pip install pymupdf 또는 pip install pypdf"
        )
    except Exception as e:
        raise RuntimeError(f"[file_parser] PDF 파싱 실패: {e}")

    raise RuntimeError(f"[file_parser] PDF에서 텍스트를 추출할 수 없습니다: {file_path}")


def _parse_docx(file_path: str) -> str:
    """
    DOCX 파일 텍스트 추출.
    python-docx 사용. 단락(paragraph) 단위로 추출.
    """
    try:
        from docx import Document
        doc = Document(file_path)
        paragraphs = []
        for para in doc.paragraphs:
            text = para.text.strip()
            if text:
                paragraphs.append(text)
        return "\n".join(paragraphs)
    except ImportError:
        raise RuntimeError(
            "[file_parser] python-docx가 없습니다.\n"
            "  → pip install python-docx"
        )
    except Exception as e:
        raise RuntimeError(f"[file_parser] DOCX 파싱 실패: {e}")


def _infer_doc_type(filename: str) -> str:
    """파일명으로 문서 유형 자동 추론."""
    name = filename.lower()
    if any(k in name for k in ["meeting", "회의", "minutes"]):
        return "meeting"
    if any(k in name for k in ["email", "mail", "메일"]):
        return "email"
    if any(k in name for k in ["chat", "slack", "채팅", "대화"]):
        return "chat"
    if name.endswith(".csv") or any(k in name for k in ["task", "todo", "업무"]):
        return "csv"
    if any(k in name for k in ["handover", "인수인계", "onboard"]):
        return "handover"
    if any(k in name for k in ["report", "보고", "status", "현황"]):
        return "report"
    return "report"  # 기본값


# ────────────────────────────────────────────
# 직접 실행 테스트
# ────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO)

    print("=" * 50)
    print("file_parser.py 테스트")
    print("=" * 50)

    TEST_FILES = [
        "dummy/documents/meeting_2026_05_11_final.txt",
        "dummy/documents/tasks_2026_05_week2.csv",
    ]

    # 지원 형식 확인
    print(f"\n지원 형식: {get_supported_extensions()}")

    # 오류 케이스 테스트
    print("\n[테스트 1] 없는 파일")
    try:
        parse_file("dummy/documents/없는파일.pdf")
    except FileNotFoundError as e:
        print(f"✅ FileNotFoundError 정상 처리: {e}")

    print("\n[테스트 2] 지원하지 않는 형식")
    try:
        parse_file("dummy/documents/test.xlsx")
    except (FileNotFoundError, ValueError) as e:
        print(f"✅ 오류 정상 처리: {e}")

    # 정상 파싱 테스트
    print("\n[테스트 3] TXT 파일 파싱")
    try:
        text, doc_type = parse_file(TEST_FILES[0])
        print(f"✅ 성공: {len(text)}자 / 유형: {doc_type}")
        print(f"   미리보기: {text[:80]}...")
    except Exception as e:
        print(f"❌ 실패: {e}")

    print("\n[테스트 4] CSV 파일 파싱")
    try:
        text, doc_type = parse_file(TEST_FILES[1])
        print(f"✅ 성공: {len(text)}자 / 유형: {doc_type}")
        print(f"   미리보기: {text[:80]}...")
    except Exception as e:
        print(f"❌ 실패: {e}")

    print("\n✅ file_parser.py 테스트 완료!")
    print("PDF 테스트: pip install pymupdf 후 PDF 파일로 테스트하세요.")
    print("DOCX 테스트: pip install python-docx 후 DOCX 파일로 테스트하세요.")
