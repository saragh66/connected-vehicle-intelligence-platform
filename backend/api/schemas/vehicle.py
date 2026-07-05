from pydantic import BaseModel
from datetime import datetime


class VehicleResponse(BaseModel):
    id: int
    vehicle_code: str
    model: str | None
    created_at: datetime

    class Config:
        from_attributes = True  # permet de convertir un objet SQLAlchemy en JSON