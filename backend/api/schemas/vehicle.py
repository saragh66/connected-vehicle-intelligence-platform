from pydantic import BaseModel
from datetime import datetime


class VehicleResponse(BaseModel):
    id: int
    vehicle_code: str
    model: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class VehicleCreate(BaseModel):
    vehicle_code: str
    model: str | None = None


class VehicleDetail(VehicleResponse):
    total_records: int


class VehicleWithHealth(BaseModel):
    id: int
    vehicle_code: str
    model: str | None
    total_records: int
    anomaly_count: int
    anomaly_rate: float
    health_score: float


class AnomalyCause(BaseModel):
    timestamp: datetime
    sensor: str
    sensor_label: str
    value: float | None
    deviation: float   
class FleetAnomalyType(BaseModel):
    sensor_label: str
    count: int
class HealthTrendPoint(BaseModel):
    date: str
    total_records: int
    anomaly_count: int
    anomaly_rate: float
    health_score: float