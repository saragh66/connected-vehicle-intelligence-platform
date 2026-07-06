import math


def clean_value(value):
    """Convertit les NaN/None en None propre pour l'insertion PostgreSQL."""
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    return value


def clean_record(record: dict) -> dict:
    """Nettoie un message Kafka : NaN -> None, strip des strings."""
    cleaned = {}
    for key, value in record.items():
        if isinstance(value, str):
            cleaned[key] = value.strip()
        else:
            cleaned[key] = clean_value(value)
    return cleaned