from typing import Literal

from pydantic import BaseModel, Field


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1200)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatHistoryMessage] = Field(default_factory=list, max_length=6)


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict] = Field(default_factory=list)
    related_todos: list[dict] = Field(default_factory=list)
    related_issues: list[dict] = Field(default_factory=list)
    suggested_questions: list[str] = Field(default_factory=list)
    mode: Literal["ai", "fallback"] = "fallback"
