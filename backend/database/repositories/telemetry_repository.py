from sqlalchemy.orm import Session
from sqlalchemy import func, Integer, cast
from datetime import datetime

from backend.database.models.telemetry import Telemetry


class TelemetryRepository:
    def __init__(self, db: Session):
        self.db = db

    def bulk_insert(self, records: list[dict], vehicle_id: int) -> int:
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

    def get_health_score(self, vehicle_id: int) -> dict | None:
        result = (
            self.db.query(
                func.count(Telemetry.id).label("total"),
                func.sum(cast(Telemetry.is_anomaly, Integer)).label("anomaly_count"),
                func.avg(Telemetry.anomaly_score).label("avg_anomaly_score"),
                func.min(Telemetry.anomaly_score).label("worst_anomaly_score"),
            )
            .filter(Telemetry.vehicle_id == vehicle_id, Telemetry.anomaly_score.isnot(None))
            .first()
        )

        if not result or not result.total:
            return None

        anomaly_count = result.anomaly_count or 0
        anomaly_rate = anomaly_count / result.total

        base_score = 100 - (anomaly_rate * 100 * 3)
        severity_penalty = abs(min(result.worst_anomaly_score or 0, 0)) * 50
        health_score = max(0, min(100, base_score - severity_penalty))

        return {
            "health_score": round(health_score, 1),
            "total_records": result.total,
            "anomaly_count": int(anomaly_count),
            "anomaly_rate": round(anomaly_rate * 100, 2),
            "avg_anomaly_score": round(result.avg_anomaly_score, 4) if result.avg_anomaly_score else None,
        }

    def get_anomalies_by_vehicle(self, vehicle_id: int, limit: int = 50) -> list[Telemetry]:
        return (
            self.db.query(Telemetry)
            .filter(Telemetry.vehicle_id == vehicle_id, Telemetry.is_anomaly == True)
            .order_by(Telemetry.anomaly_score.asc())
            .limit(limit)
            .all()
        )