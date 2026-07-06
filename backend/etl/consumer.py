import json
from kafka import KafkaConsumer

from backend.config.settings import get_settings
from backend.database.connection import SessionLocal
from backend.database.repositories.vehicle_repository import VehicleRepository
from backend.database.repositories.telemetry_repository import TelemetryRepository
from backend.etl.cleaner import clean_record
from backend.etl.validator import is_valid_record
from backend.etl.transformer import transform_record

settings = get_settings()

BATCH_SIZE = 500  # nombre de lignes à accumuler avant d'insérer en base


def json_deserializer(data: bytes) -> dict:
    return json.loads(data.decode("utf-8"))


def create_consumer(group_id: str = "telemetry-etl-group") -> KafkaConsumer:
    return KafkaConsumer(
        settings.KAFKA_TOPIC_TELEMETRY,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        value_deserializer=json_deserializer,
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        group_id=group_id,
    )


def run_etl(limit: int | None = None):
    """Consomme les messages Kafka, les nettoie/valide/transforme, et les insère en base."""
    consumer = create_consumer()
    db = SessionLocal()

    vehicle_repo = VehicleRepository(db)
    telemetry_repo = TelemetryRepository(db)

    # Cache des vehicle_id déjà résolus, pour éviter une requête DB à chaque message
    vehicle_cache: dict[str, int] = {}

    batch: list[dict] = []
    batch_vehicle_id: int | None = None

    total_processed = 0
    total_inserted = 0
    total_rejected = 0

    print(f"🚀 ETL démarré sur le topic '{settings.KAFKA_TOPIC_TELEMETRY}'\n")

    try:
        for message in consumer:
            raw_record = message.value
            cleaned = clean_record(raw_record)

            valid, reason = is_valid_record(cleaned)
            if not valid:
                total_rejected += 1
                total_processed += 1
                continue

            vehicle_code = cleaned["vehicle_code"]
            if vehicle_code not in vehicle_cache:
                vehicle = vehicle_repo.get_or_create(vehicle_code)
                vehicle_cache[vehicle_code] = vehicle.id
            vehicle_id = vehicle_cache[vehicle_code]

            transformed = transform_record(cleaned)

            # Sécurité : un batch ne mélange qu'un seul vehicle_id à la fois
            if batch_vehicle_id is not None and batch_vehicle_id != vehicle_id:
                inserted = telemetry_repo.bulk_insert(batch, batch_vehicle_id)
                total_inserted += inserted
                batch = []

            batch.append(transformed)
            batch_vehicle_id = vehicle_id
            total_processed += 1

            if len(batch) >= BATCH_SIZE:
                inserted = telemetry_repo.bulk_insert(batch, batch_vehicle_id)
                total_inserted += inserted
                batch = []
                print(f"   ... {total_inserted} lignes insérées ({total_rejected} rejetées)")

            if limit and total_processed >= limit:
                break

        # Insérer le reste du batch
        if batch:
            inserted = telemetry_repo.bulk_insert(batch, batch_vehicle_id)
            total_inserted += inserted

    finally:
        consumer.close()
        db.close()

    print(f"\n✅ ETL terminé.")
    print(f"   Total traité: {total_processed}")
    print(f"   Total inséré: {total_inserted}")
    print(f"   Total rejeté: {total_rejected}")


if __name__ == "__main__":
    # Test rapide : traite seulement les 2000 premiers messages
    run_etl(limit=2000)