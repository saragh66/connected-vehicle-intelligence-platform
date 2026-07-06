from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
import math

from backend.database.connection import get_db
from backend.database.repositories.telemetry_repository import TelemetryRepository
from backend.database.repositories.vehicle_repository import VehicleRepository
from backend.api.schemas.telemetry import PaginatedTelemetry, TelemetryStats

router = APIRouter(prefix="/vehicles", tags=["Telemetry"])


@router.get("/{vehicle_id}/telemetry", response_model=PaginatedTelemetry)
def get_vehicle_telemetry(
    vehicle_id: int,
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(100, ge=1, le=1000, description="Nombre de lignes par page"),
    start_date: datetime | None = Query(None, description="Filtre: date de début (ISO 8601)"),
    end_date: datetime | None = Query(None, description="Filtre: date de fin (ISO 8601)"),
    db: Session = Depends(get_db),
):
    vehicle_repo = VehicleRepository(db)
    vehicle = vehicle_repo.get_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    telemetry_repo = TelemetryRepository(db)
    results, total = telemetry_repo.get_by_vehicle_paginated(
        vehicle_id=vehicle_id,
        page=page,
        page_size=page_size,
        start_date=start_date,
        end_date=end_date,
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "data": results,
    }


@router.get("/{vehicle_id}/stats", response_model=TelemetryStats)
def get_vehicle_stats(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle_repo = VehicleRepository(db)
    vehicle = vehicle_repo.get_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    telemetry_repo = TelemetryRepository(db)
    stats = telemetry_repo.get_stats_by_vehicle(vehicle_id)
    if not stats:
        raise HTTPException(status_code=404, detail="No telemetry data for this vehicle")

    return {
        "vehicle_id": vehicle_id,
        "vehicle_code": vehicle.vehicle_code,
        **stats,
    }