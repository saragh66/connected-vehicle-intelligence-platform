from pydantic import BaseModel
from datetime import datetime


class TelemetryResponse(BaseModel):
    id: int
    vehicle_id: int
    timestamp: datetime
    engine_coolant_temp: float | None
    intake_manifold_pressure: float | None
    engine_rpm: float | None
    vehicle_speed: float | None
    intake_air_temp: float | None
    air_flow_rate: float | None
    throttle_position: float | None
    ambient_air_temp: float | None
    accelerator_pedal_d: float | None
    accelerator_pedal_e: float | None

    class Config:
        from_attributes = True


class TelemetryStats(BaseModel):
    vehicle_id: int
    vehicle_code: str
    total_records: int
    avg_speed: float | None
    max_speed: float | None
    avg_rpm: float | None
    max_rpm: float | None
    avg_coolant_temp: float | None
    max_coolant_temp: float | None


class PaginatedTelemetry(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    data: list[TelemetryResponse]