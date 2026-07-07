import json
import time
from kafka import KafkaProducer

from backend.config.settings import get_settings
from backend.ingestion.parser import parse_file
from backend.ingestion.reader import list_csv_files, RAW_DATA_DIR

settings = get_settings()


def json_serializer(data: dict) -> bytes:
    return json.dumps(data, default=str).encode("utf-8")


def create_producer() -> KafkaProducer:
    return KafkaProducer(
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=json_serializer,
        linger_ms=20,
        batch_size=32768,
    )


def stream_file(producer: KafkaProducer, file_path, delay: float = 0.0) -> int:
    """Envoie toutes les lignes d'un fichier CSV vers Kafka, une par une."""
    df = parse_file(file_path)
    records = df.to_dict(orient="records")
    count = 0
    total = len(records)

    for message in records:
        producer.send(settings.KAFKA_TOPIC_TELEMETRY, value=message)
        count += 1

        if count % 5000 == 0:
            print(f"   ... {count}/{total} envoyés")

        if delay > 0:
            time.sleep(delay)

    producer.flush()
    return count


def stream_all_files(delay: float = 0.0, limit_files: int | None = None):
    """Parcourt tous les fichiers CSV et les envoie dans Kafka."""
    producer = create_producer()
    files = list_csv_files(RAW_DATA_DIR)

    if limit_files:
        files = files[:limit_files]

    print(f"🚀 Streaming {len(files)} fichiers vers le topic '{settings.KAFKA_TOPIC_TELEMETRY}'\n")

    total_sent = 0
    for i, file_path in enumerate(files, start=1):
        print(f"[{i}/{len(files)}] Streaming {file_path.name}...")
        try:
            sent = stream_file(producer, file_path, delay=delay)
            total_sent += sent
            print(f"   ✅ {sent} messages envoyés")
        except Exception as e:
            print(f"   ❌ Erreur: {e}")

    producer.close()
    print(f"\n✅ Terminé. Total: {total_sent} messages envoyés dans Kafka.")


if __name__ == "__main__":
    # Pipeline complet : tous les 81 fichiers, sans délai (rapide)
    stream_all_files(delay=0, limit_files=None)