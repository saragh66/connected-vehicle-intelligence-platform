from datetime import datetime


def transform_record(record: dict) -> dict:
    """Transforme un message nettoyé en dictionnaire prêt pour le modèle Telemetry."""

    timestamp = record["timestamp"]
    if isinstance(timestamp, str):
        timestamp = datetime.fromisoformat(timestamp)

    return {
        "timestamp": timestamp,
        "engine_coolant_temp": record.get("engine_coolant_temp"),
        "intake_manifold_pressure": record.get("intake_manifold_pressure"),
        "engine_rpm": record.get("engine_rpm"),
        "vehicle_speed": record.get("vehicle_speed"),
        "intake_air_temp": record.get("intake_air_temp"),
        "air_flow_rate": record.get("air_flow_rate"),
        "throttle_position": record.get("throttle_position"),
        "ambient_air_temp": record.get("ambient_air_temp"),
        "accelerator_pedal_d": record.get("accelerator_pedal_d"),
        "accelerator_pedal_e": record.get("accelerator_pedal_e"),
    }