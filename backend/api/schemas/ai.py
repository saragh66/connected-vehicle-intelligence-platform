from pydantic import BaseModel


class ConversationMessage(BaseModel):
    role: str
    content: str


class AIQuestionRequest(BaseModel):
    question: str
    vehicle_id: int | None = None
    conversation_history: list[ConversationMessage] = []


class AIAnswerResponse(BaseModel):
    question: str
    answer: str
    sources: list[str]
    vehicle_id: int | None = None
    vehicle_code: str | None = None