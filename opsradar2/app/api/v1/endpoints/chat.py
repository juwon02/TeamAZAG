from fastapi import APIRouter

router = APIRouter()


@router.post("/message")
async def chat_message(message: str):
    # 나중에 AI 파이프라인 연동 예정
    return {
        "response": "AI 파이프라인 연동 후 답변 가능합니다.",
        "sources": []
    }