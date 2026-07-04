from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.database.connection import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)

    alert_type = Column(String, nullable=False)      # ex: "overheating", "high_rpm"
    severity = Column(String, nullable=False)          # "low" | "medium" | "high"
    message = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())