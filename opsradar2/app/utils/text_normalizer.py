"""
텍스트 전처리 유틸
담당: 이성우
"""
import re


def normalize(text: str) -> str:
    """
    공백 정리, 특수문자 제거, 줄바꿈 통일 등
    parser_service에서 파싱 후 호출
    """
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    return text
