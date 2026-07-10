from sqlalchemy import create_engine, text
from pathlib import Path
from datetime import datetime

from backend.config.settings import get_settings

settings = get_settings()
engine = create_engine(settings.DATABASE_URL)

OUTPUT_PATH = Path("data/manuals/fleet_insights.md")


def get_fleet_overview_stats() -> dict:
    """Statistiques globales de la flotte."""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                COUNT(DISTINCT v.id) as total_vehicles,
                COUNT(t.id) as total_measurements,
                AVG(t.anomaly_score) as avg_anomaly_score,
                SUM(CASE WHEN t.is_anomaly THEN 1 ELSE 0 END) as total_anomalies
            FROM vehicles v
            LEFT JOIN telemetry t ON t.vehicle_id = v.id
            WHERE t.anomaly_score IS NOT NULL
        """)).first()

        return {
            "total_vehicles": result.total_vehicles,
            "total_measurements": result.total_measurements,
            "avg_anomaly_score": round(result.avg_anomaly_score, 4) if result.avg_anomaly_score else None,
            "total_anomalies": result.total_anomalies,
            "global_anomaly_rate": round(result.total_anomalies / result.total_measurements * 100, 2) if result.total_measurements else 0,
        }


def get_health_distribution() -> dict:
    """Distribution des véhicules par tranche de santé (Optimal/Monitor/Critical)."""
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT
                v.id,
                COUNT(t.id) as total,
                SUM(CASE WHEN t.is_anomaly THEN 1 ELSE 0 END) as anomalies
            FROM vehicles v
            LEFT JOIN telemetry t ON t.vehicle_id = v.id
            WHERE t.anomaly_score IS NOT NULL
            GROUP BY v.id
        """)).fetchall()

        optimal, monitor, critical = 0, 0, 0
        for row in rows:
            rate = (row.anomalies / row.total * 100) if row.total else 0
            health = max(0, min(100, 100 - rate * 3))
            if health >= 80:
                optimal += 1
            elif health >= 50:
                monitor += 1
            else:
                critical += 1

        return {"optimal": optimal, "monitor": monitor, "critical": critical, "total": len(rows)}


def get_anomaly_patterns() -> dict:
    """Identifie les patterns de capteurs les plus fréquents dans les anomalies détectées."""
    with engine.connect() as conn:
        # Anomalies avec RPM élevé et vitesse nulle (pattern "stationary rev")
        stationary_rev = conn.execute(text("""
            SELECT COUNT(*) FROM telemetry
            WHERE is_anomaly = true AND engine_rpm > 1000 AND vehicle_speed = 0
        """)).scalar()

        # Anomalies avec température de coolant basse (pattern "cold start")
        cold_start = conn.execute(text("""
            SELECT COUNT(*) FROM telemetry
            WHERE is_anomaly = true AND engine_coolant_temp < 50
        """)).scalar()

        # Anomalies avec température élevée (pattern "overheating risk")
        overheating = conn.execute(text("""
            SELECT COUNT(*) FROM telemetry
            WHERE is_anomaly = true AND engine_coolant_temp > 95
        """)).scalar()

        # Anomalies avec RPM très élevé (pattern "high rpm")
        high_rpm = conn.execute(text("""
            SELECT COUNT(*) FROM telemetry
            WHERE is_anomaly = true AND engine_rpm > 2800
        """)).scalar()

        total_anomalies = conn.execute(text("""
            SELECT COUNT(*) FROM telemetry WHERE is_anomaly = true
        """)).scalar()

        return {
            "stationary_rev": stationary_rev,
            "stationary_rev_pct": round(stationary_rev / total_anomalies * 100, 1) if total_anomalies else 0,
            "cold_start": cold_start,
            "cold_start_pct": round(cold_start / total_anomalies * 100, 1) if total_anomalies else 0,
            "overheating": overheating,
            "overheating_pct": round(overheating / total_anomalies * 100, 1) if total_anomalies else 0,
            "high_rpm": high_rpm,
            "high_rpm_pct": round(high_rpm / total_anomalies * 100, 1) if total_anomalies else 0,
            "total_anomalies": total_anomalies,
        }


def get_condition_breakdown() -> list[dict]:
    """Taux d'anomalie par condition de trajet (Normal/Stau/Frei) - dérivé du vehicle_code."""
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT
                v.vehicle_code,
                COUNT(t.id) as total,
                SUM(CASE WHEN t.is_anomaly THEN 1 ELSE 0 END) as anomalies
            FROM vehicles v
            LEFT JOIN telemetry t ON t.vehicle_id = v.id
            WHERE t.anomaly_score IS NOT NULL
            GROUP BY v.vehicle_code
        """)).fetchall()

        conditions = {"Stau": {"total": 0, "anomalies": 0}, "Normal": {"total": 0, "anomalies": 0}, "Frei": {"total": 0, "anomalies": 0}}

        for row in rows:
            for condition in conditions:
                if condition in row.vehicle_code:
                    conditions[condition]["total"] += row.total
                    conditions[condition]["anomalies"] += row.anomalies
                    break

        results = []
        for condition, data in conditions.items():
            if data["total"] > 0:
                rate = round(data["anomalies"] / data["total"] * 100, 2)
                results.append({"condition": condition, "total": data["total"], "anomalies": data["anomalies"], "rate": rate})

        return results


def generate_insights_document():
    """Génère un document Markdown résumant les insights réels du dataset."""
    print("Computing fleet statistics...")

    overview = get_fleet_overview_stats()
    health_dist = get_health_distribution()
    patterns = get_anomaly_patterns()
    conditions = get_condition_breakdown()

    doc = f"""# Fleet Analytics Insights

*Auto-generated from live telemetry data on {datetime.now().strftime('%Y-%m-%d')}*

## Fleet Overview

The platform currently monitors {overview['total_vehicles']} vehicles with a combined
{overview['total_measurements']:,} telemetry measurements processed through the
Isolation Forest anomaly detection model. The global anomaly rate across the entire
fleet is {overview['global_anomaly_rate']}%, with an average anomaly score of
{overview['avg_anomaly_score']}.

## Fleet Health Distribution

Out of {health_dist['total']} vehicles analyzed:
- {health_dist['optimal']} vehicles ({round(health_dist['optimal']/health_dist['total']*100, 1)}%) are classified as Optimal (health score >= 80)
- {health_dist['monitor']} vehicles ({round(health_dist['monitor']/health_dist['total']*100, 1)}%) are classified as Monitor (health score 50-79)
- {health_dist['critical']} vehicles ({round(health_dist['critical']/health_dist['total']*100, 1)}%) are classified as Critical (health score < 50)

## Common Anomaly Patterns

Analysis of {patterns['total_anomalies']:,} detected anomalies reveals the following patterns:

- **Stationary high-RPM events**: {patterns['stationary_rev']:,} anomalies ({patterns['stationary_rev_pct']}% of all anomalies) show elevated engine RPM (above 1000) combined with zero vehicle speed, consistent with idling, gear engagement, or transmission-related irregularities.

- **Cold start conditions**: {patterns['cold_start']:,} anomalies ({patterns['cold_start_pct']}% of all anomalies) occur during cold start phases with coolant temperature below 50°C. These are generally benign and represent the statistically rare but normal engine warm-up period.

- **Overheating risk indicators**: {patterns['overheating']:,} anomalies ({patterns['overheating_pct']}% of all anomalies) show coolant temperature above 95°C, which should be monitored closely as sustained readings in this range increase mechanical wear risk.

- **High RPM events**: {patterns['high_rpm']:,} anomalies ({patterns['high_rpm_pct']}% of all anomalies) involve engine RPM above 2800, which may indicate aggressive driving or downshift events.

## Anomaly Rate by Traffic Condition

The dataset includes trips labeled by traffic condition (derived from the original
KIT OBD-II dataset trip metadata):

"""

    for c in conditions:
        doc += f"- **{c['condition']}** condition trips: {c['total']:,} measurements, {c['anomalies']:,} anomalies detected ({c['rate']}% anomaly rate)\n"

    doc += """
## Interpretation Notes

Traffic congestion (Stau) conditions typically show different anomaly signatures
than free-flowing (Frei) conditions due to frequent stop-start driving patterns,
which naturally produce more stationary-idle and low-speed readings. When
interpreting a specific vehicle's anomaly rate, it is useful to consider whether
its trips were predominantly recorded under congested, normal, or free-flow
conditions, as this affects the baseline expected anomaly frequency.
"""

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(doc, encoding="utf-8")
    print(f"✅ Insights document generated: {OUTPUT_PATH}")
    print(f"\nPreview:\n{doc[:500]}...")


if __name__ == "__main__":
    generate_insights_document()