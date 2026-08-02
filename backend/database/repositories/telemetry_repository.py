from sqlalchemy.orm import Session
from sqlalchemy import func, Integer, cast, text
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

    def get_top_anomaly_causes(self, vehicle_id: int, limit: int = 5) -> list[dict]:
        """For the most anomalous rows, identify which sensor deviated furthest
        from this vehicle's own baseline (z-score), as a proxy for root cause.
        Fetches a wider pool, then collapses consecutive readings with the same
        sensor and near-identical value into a single event (e.g. a sensor stuck
        at one value across several millisecond-apart samples)."""
        rows = self.db.execute(text("""
            WITH stats AS (
                SELECT
                    AVG(engine_coolant_temp) as avg_temp, STDDEV(engine_coolant_temp) as std_temp,
                    AVG(intake_manifold_pressure) as avg_pressure, STDDEV(intake_manifold_pressure) as std_pressure,
                    AVG(engine_rpm) as avg_rpm, STDDEV(engine_rpm) as std_rpm,
                    AVG(vehicle_speed) as avg_speed, STDDEV(vehicle_speed) as std_speed,
                    AVG(intake_air_temp) as avg_air_temp, STDDEV(intake_air_temp) as std_air_temp,
                    AVG(air_flow_rate) as avg_airflow, STDDEV(air_flow_rate) as std_airflow,
                    AVG(throttle_position) as avg_throttle, STDDEV(throttle_position) as std_throttle,
                    AVG(ambient_air_temp) as avg_ambient, STDDEV(ambient_air_temp) as std_ambient
                FROM telemetry WHERE vehicle_id = :vid
            )
            SELECT
                t.id, t.timestamp,
                t.engine_coolant_temp, t.intake_manifold_pressure, t.engine_rpm,
                t.vehicle_speed, t.intake_air_temp, t.air_flow_rate, t.throttle_position, t.ambient_air_temp,
                ABS(t.engine_coolant_temp - s.avg_temp) / NULLIF(s.std_temp, 0) as z_temp,
                ABS(t.intake_manifold_pressure - s.avg_pressure) / NULLIF(s.std_pressure, 0) as z_pressure,
                ABS(t.engine_rpm - s.avg_rpm) / NULLIF(s.std_rpm, 0) as z_rpm,
                ABS(t.vehicle_speed - s.avg_speed) / NULLIF(s.std_speed, 0) as z_speed,
                ABS(t.intake_air_temp - s.avg_air_temp) / NULLIF(s.std_air_temp, 0) as z_air_temp,
                ABS(t.air_flow_rate - s.avg_airflow) / NULLIF(s.std_airflow, 0) as z_airflow,
                ABS(t.throttle_position - s.avg_throttle) / NULLIF(s.std_throttle, 0) as z_throttle,
                ABS(t.ambient_air_temp - s.avg_ambient) / NULLIF(s.std_ambient, 0) as z_ambient
            FROM telemetry t, stats s
            WHERE t.vehicle_id = :vid AND t.is_anomaly = true
            ORDER BY t.anomaly_score ASC
            LIMIT :pool
        """), {"vid": vehicle_id, "pool": limit * 20}).fetchall()

        SENSOR_LABELS = {
            "engine_coolant_temp": "Coolant temperature",
            "intake_manifold_pressure": "Intake manifold pressure",
            "engine_rpm": "Engine RPM",
            "vehicle_speed": "Vehicle speed",
            "intake_air_temp": "Intake air temperature",
            "air_flow_rate": "Air flow rate",
            "throttle_position": "Throttle position",
            "ambient_air_temp": "Ambient air temperature",
        }

        seen: set[tuple[str, float | None]] = set()
        results = []
        for r in rows:
            z_scores = {
                "engine_coolant_temp": r.z_temp or 0,
                "intake_manifold_pressure": r.z_pressure or 0,
                "engine_rpm": r.z_rpm or 0,
                "vehicle_speed": r.z_speed or 0,
                "intake_air_temp": r.z_air_temp or 0,
                "air_flow_rate": r.z_airflow or 0,
                "throttle_position": r.z_throttle or 0,
                "ambient_air_temp": r.z_ambient or 0,
            }
            top_sensor = max(z_scores, key=z_scores.get)
            raw_value = getattr(r, top_sensor)
            rounded_value = round(raw_value, 1) if raw_value is not None else None

            dedup_key = (top_sensor, rounded_value)
            if dedup_key in seen:
                continue
            seen.add(dedup_key)

            results.append({
                "timestamp": r.timestamp,
                "sensor": top_sensor,
                "sensor_label": SENSOR_LABELS[top_sensor],
                "value": raw_value,
                "deviation": round(z_scores[top_sensor], 2),
            })

            if len(results) >= limit:
                break

        return results

    def get_fleet_top_anomaly_types(self, limit_per_vehicle: int = 1) -> dict[str, int]:
        """Fleet-wide count of UNIQUE vehicles whose top anomaly cause was each sensor."""
        vehicle_ids = [row[0] for row in self.db.execute(text("SELECT id FROM vehicles")).fetchall()]
        counts: dict[str, int] = {}
        for vid in vehicle_ids:
            causes = self.get_top_anomaly_causes(vid, limit=limit_per_vehicle)
            if not causes:
                continue
            top_sensor_label = causes[0]["sensor_label"]
            counts[top_sensor_label] = counts.get(top_sensor_label, 0) + 1
        return counts

    def get_health_trend(self, vehicle_id: int, days: int = 30) -> list[dict]:
        """Daily anomaly rate and record count for a vehicle over the last N days,
        computed live from raw telemetry timestamps — no separate snapshot table needed."""
        rows = self.db.execute(text("""
            SELECT
                DATE(timestamp) as day,
                COUNT(*) as total,
                SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) as anomalies
            FROM telemetry
            WHERE vehicle_id = :vid
            GROUP BY DATE(timestamp)
            ORDER BY day ASC
            LIMIT :days
        """), {"vid": vehicle_id, "days": days}).fetchall()

        results = []
        for r in rows:
            total = r.total or 0
            anomalies = r.anomalies or 0
            rate = (anomalies / total * 100) if total else 0
            health_score = max(0, min(100, 100 - (rate * 3)))
            results.append({
                "date": r.day.isoformat() if hasattr(r.day, "isoformat") else str(r.day),
                "total_records": total,
                "anomaly_count": anomalies,
                "anomaly_rate": round(rate, 2),
                "health_score": round(health_score, 1),
            })
        return results