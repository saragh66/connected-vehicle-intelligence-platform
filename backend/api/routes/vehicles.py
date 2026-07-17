from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.database.repositories.vehicle_repository import VehicleRepository
from backend.database.repositories.telemetry_repository import TelemetryRepository
from backend.api.schemas.vehicle import VehicleResponse, VehicleCreate, VehicleDetail, VehicleWithHealth

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("/", response_model=list[VehicleResponse])
def list_vehicles(db: Session = Depends(get_db)):
    repo = VehicleRepository(db)
    return repo.get_all()


@router.get("/with-health", response_model=list[VehicleWithHealth])
def list_vehicles_with_health(db: Session = Depends(get_db)):
    repo = VehicleRepository(db)
    return repo.get_all_with_health()


@router.get("/{vehicle_id}", response_model=VehicleDetail)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle_repo = VehicleRepository(db)
    vehicle = vehicle_repo.get_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    telemetry_repo = TelemetryRepository(db)
    total_records = telemetry_repo.count_by_vehicle(vehicle_id)

    return {
        "id": vehicle.id,
        "vehicle_code": vehicle.vehicle_code,
        "model": vehicle.model,
        "created_at": vehicle.created_at,
        "total_records": total_records,
    }


@router.post("/", response_model=VehicleResponse, status_code=201)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    repo = VehicleRepository(db)
    return repo.create(vehicle_code=payload.vehicle_code, model=payload.model)