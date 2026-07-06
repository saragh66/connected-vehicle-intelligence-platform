from sqlalchemy.orm import Session
from backend.database.models.vehicle import Vehicle


class VehicleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> list[Vehicle]:
        return self.db.query(Vehicle).all()

    def get_by_id(self, vehicle_id: int) -> Vehicle | None:
        return self.db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    def create(self, vehicle_code: str, model: str | None = None) -> Vehicle:
        vehicle = Vehicle(vehicle_code=vehicle_code, model=model)
        self.db.add(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def get_or_create(self, vehicle_code: str) -> Vehicle:
        """Récupère un véhicule existant par son code, ou le crée s'il n'existe pas."""
        vehicle = self.db.query(Vehicle).filter(Vehicle.vehicle_code == vehicle_code).first()
        if vehicle:
            return vehicle
        return self.create(vehicle_code=vehicle_code)