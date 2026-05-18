"""
파일 파싱 서비스 — txt / csv / pdf / docx → 텍스트 추출
담당: 이성우
"""


def parse_file(file_path: str, file_type: str) -> str:
    """
    업로드된 파일을 텍스트로 변환
    TODO: 이성우 — 파일 형식별 파서 구현
      - txt/csv: 직접 읽기
      - pdf: PyPDF2 또는 pdfminer
      - docx: python-docx
    """
    raise NotImplementedError
