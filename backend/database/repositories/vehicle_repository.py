from sqlalchemy import text
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

    def get_all_with_health(self) -> list[dict]:
        """Retourne tous les véhicules avec leur health score, en une seule requête SQL."""
        rows = self.db.execute(text("""
            SELECT
                v.id, v.vehicle_code, v.model, v.created_at,
                COUNT(t.id) as total_records,
                SUM(CASE WHEN t.is_anomaly THEN 1 ELSE 0 END) as anomaly_count,
                MIN(t.anomaly_score) as worst_anomaly_score
            FROM vehicles v
            LEFT JOIN telemetry t ON t.vehicle_id = v.id AND t.anomaly_score IS NOT NULL
            GROUP BY v.id, v.vehicle_code, v.model, v.created_at
            ORDER BY v.id
        """)).fetchall()

        results = []
        for r in rows:
            total = r.total_records or 0
            anomalies = r.anomaly_count or 0
            rate = (anomalies / total * 100) if total else 0
            base_score = 100 - (rate * 3)
            penalty = abs(min(r.worst_anomaly_score or 0, 0)) * 50
            health = max(0, min(100, base_score - penalty))

            results.append({
                "id": r.id,
                "vehicle_code": r.vehicle_code,
                "model": r.model,
                "total_records": total,
                "anomaly_count": anomalies,
                "anomaly_rate": round(rate, 2),
                "health_score": round(health, 1),
            })
        return results