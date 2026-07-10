from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from backend.database.connection import Base


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)

    timestamp = Column(DateTime(timezone=True), nullable=False)
    engine_coolant_temp = Column(Float, nullable=True)
    intake_manifold_pressure = Column(Float, nullable=True)
    engine_rpm = Column(Float, nullable=True)
    vehicle_speed = Column(Float, nullable=True)
    intake_air_temp = Column(Float, nullable=True)
    air_flow_rate = Column(Float, nullable=True)
    throttle_position = Column(Float, nullable=True)
    ambient_air_temp = Column(Float, nullable=True)
    accelerator_pedal_d = Column(Float, nullable=True)
    accelerator_pedal_e = Column(Float, nullable=True)

    # Champs ML — Anomaly Detection
    anomaly_score = Column(Float, nullable=True, index=True)
    is_anomaly = Column(Boolean, nullable=True, index=True)
    model_version = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())