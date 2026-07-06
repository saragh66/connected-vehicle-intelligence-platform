from datetime import datetime


REQUIRED_FIELDS = ["timestamp", "vehicle_code"]

# Plages plausibles pour détecter des valeurs aberrantes (sécurité basique)
VALID_RANGES = {
    "engine_rpm": (0, 8000),
    "vehicle_speed": (0, 300),
    "engine_coolant_temp": (-40, 150),
    "throttle_position": (0, 100),
}


def is_valid_record(record: dict) -> tuple[bool, str | None]:
    """Vérifie qu'un message respecte les règles métier de base.
    Retourne (True, None) si valide, (False, raison) sinon."""

    for field in REQUIRED_FIELDS:
        if record.get(field) is None:
            return False, f"missing required field: {field}"

    # Vérifie que le timestamp est parseable
    if isinstance(record["timestamp"], str):
        try:
            datetime.fromisoformat(record["timestamp"])
        except ValueError:
            return False, "invalid timestamp format"

    # Vérifie les plages de valeurs si présentes (ignore les None)
    for field, (min_val, max_val) in VALID_RANGES.items():
        value = record.get(field)
        if value is not None and not (min_val <= value <= max_val):
            return False, f"{field} out of range: {value}"

    return True, None