from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.database.repositories.vehicle_repository import VehicleRepository
from backend.database.repositories.telemetry_repository import TelemetryRepository
from backend.api.schemas.vehicle import VehicleResponse, VehicleCreate, VehicleDetail, VehicleWithHealth, AnomalyCause
from backend.api.schemas.vehicle import FleetAnomalyType
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


@router.get("/{vehicle_id}/anomaly-causes", response_model=list[AnomalyCause])
def get_anomaly_causes(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle_repo = VehicleRepository(db)
    vehicle = vehicle_repo.get_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    telemetry_repo = TelemetryRepository(db)
    return telemetry_repo.get_top_anomaly_causes(vehicle_id)


@router.post("/", response_model=VehicleResponse, status_code=201)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    repo = VehicleRepository(db)
    return repo.create(vehicle_code=payload.vehicle_code, model=payload.model)


@router.get("/fleet/anomaly-types", response_model=list[FleetAnomalyType])
def get_fleet_anomaly_types(db: Session = Depends(get_db)):
    telemetry_repo = TelemetryRepository(db)
    counts = telemetry_repo.get_fleet_top_anomaly_types()
    return [{"sensor_label": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]
from backend.api.schemas.vehicle import HealthTrendPoint

@router.get("/{vehicle_id}/health-trend", response_model=list[HealthTrendPoint])
def get_health_trend(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle_repo = VehicleRepository(db)
    vehicle = vehicle_repo.get_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    telemetry_repo = TelemetryRepository(db)
    return telemetry_repo.get_health_trend(vehicle_id)