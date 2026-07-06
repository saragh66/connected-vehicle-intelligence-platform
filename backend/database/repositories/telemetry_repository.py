from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

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

    def get_by_vehicle_paginated(
        self,
        vehicle_id: int,
        page: int = 1,
        page_size: int = 100,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple[list[Telemetry], int]:
        """Retourne les mesures d'un véhicule, paginées, avec filtre optionnel de date."""
        query = self.db.query(Telemetry).filter(Telemetry.vehicle_id == vehicle_id)

        if start_date:
            query = query.filter(Telemetry.timestamp >= start_date)
        if end_date:
            query = query.filter(Telemetry.timestamp <= end_date)

        total = query.count()

        results = (
            query.order_by(Telemetry.timestamp.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return results, total

    def count_by_vehicle(self, vehicle_id: int) -> int:
        return self.db.query(Telemetry).filter(Telemetry.vehicle_id == vehicle_id).count()

    def get_stats_by_vehicle(self, vehicle_id: int) -> dict | None:
        """Calcule des statistiques agrégées (moyenne, max) pour un véhicule."""
        result = (
            self.db.query(
                func.count(Telemetry.id).label("total_records"),
                func.avg(Telemetry.vehicle_speed).label("avg_speed"),
                func.max(Telemetry.vehicle_speed).label("max_speed"),
                func.avg(Telemetry.engine_rpm).label("avg_rpm"),
                func.max(Telemetry.engine_rpm).label("max_rpm"),
                func.avg(Telemetry.engine_coolant_temp).label("avg_coolant_temp"),
                func.max(Telemetry.engine_coolant_temp).label("max_coolant_temp"),
            )
            .filter(Telemetry.vehicle_id == vehicle_id)
            .first()
        )

        if not result or result.total_records == 0:
            return None

        return {
            "total_records": result.total_records,
            "avg_speed": round(result.avg_speed, 2) if result.avg_speed else None,
            "max_speed": result.max_speed,
            "avg_rpm": round(result.avg_rpm, 2) if result.avg_rpm else None,
            "max_rpm": result.max_rpm,
            "avg_coolant_temp": round(result.avg_coolant_temp, 2) if result.avg_coolant_temp else None,
            "max_coolant_temp": result.max_coolant_temp,
        }