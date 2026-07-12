from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.database.repositories.vehicle_repository import VehicleRepository
from backend.database.repositories.telemetry_repository import TelemetryRepository
from backend.api.schemas.ai import AIQuestionRequest, AIAnswerResponse
from backend.rag.pipeline import ask_diagnostic_question

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/ask", response_model=AIAnswerResponse)
def ask_ai(payload: AIQuestionRequest, db: Session = Depends(get_db)):
    vehicle_data = None
    vehicle_code = None

    if payload.vehicle_id is not None:
        vehicle_repo = VehicleRepository(db)
        vehicle = vehicle_repo.get_by_id(payload.vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        telemetry_repo = TelemetryRepository(db)
        health = telemetry_repo.get_health_score(payload.vehicle_id)

        vehicle_code = vehicle.vehicle_code
        vehicle_data = {
            "vehicle_code": vehicle.vehicle_code,
            "health_score": health["health_score"] if health else None,
            "anomaly_count": health["anomaly_count"] if health else None,
            "anomaly_rate": health["anomaly_rate"] if health else None,
        }

    result = ask_diagnostic_question(payload.question, vehicle_data)

    return {
        "question": result["question"],
        "answer": result["answer"],
        "sources": result["sources"],
        "vehicle_id": payload.vehicle_id,
        "vehicle_code": vehicle_code,
    }