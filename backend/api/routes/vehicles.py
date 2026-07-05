from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.database.repositories.vehicle_repository import VehicleRepository
from backend.api.schemas.vehicle import VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("/", response_model=list[VehicleResponse])
def list_vehicles(db: Session = Depends(get_db)):
    repo = VehicleRepository(db)
    return repo.get_all()