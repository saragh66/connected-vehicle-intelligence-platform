from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from backend.database.connection import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_code = Column(String, unique=True, index=True, nullable=False)
    model = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())