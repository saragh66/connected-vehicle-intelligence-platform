from pydantic import BaseModel


class AIQuestionRequest(BaseModel):
    question: str
    vehicle_id: int | None = None


class AIAnswerResponse(BaseModel):
    question: str
    answer: str
    sources: list[str]
    vehicle_id: int | None = None
    vehicle_code: str | None = None