from sqlalchemy.orm import Session
from backend.database.models.telemetry import Telemetry


class TelemetryRepository:
    def __init__(self, db: Session):
        self.db = db

    def bulk_insert(self, records: list[dict], vehicle_id: int) -> int:
        """Insère une liste de mesures en une seule transaction (rapide)."""
        telemetry_objects = [
            Telemetry(vehicle_id=vehicle_id, **record)
            for record in records
        ]
        self.db.bulk_save_objects(telemetry_objects)
        self.db.commit()
        return len(telemetry_objects)