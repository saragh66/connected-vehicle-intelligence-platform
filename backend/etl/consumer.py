import json
from kafka import KafkaConsumer

from backend.config.settings import get_settings

settings = get_settings()


def json_deserializer(data: bytes) -> dict:
    return json.loads(data.decode("utf-8"))


def create_consumer(group_id: str = "telemetry-consumer-group") -> KafkaConsumer:
    return KafkaConsumer(
        settings.KAFKA_TOPIC_TELEMETRY,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        value_deserializer=json_deserializer,
        auto_offset_reset="earliest",   # lit depuis le début du topic
        enable_auto_commit=True,
        group_id=group_id,
    )


def consume_messages(limit: int | None = None):
    """Lit les messages du topic et les affiche (test simple, sans écriture DB pour l'instant)."""
    consumer = create_consumer()
    print(f"👂 En écoute sur le topic '{settings.KAFKA_TOPIC_TELEMETRY}'...\n")

    count = 0
    for message in consumer:
        data = message.value
        print(f"[{count + 1}] {data['timestamp']} | vehicle={data['vehicle_code']} "
              f"| rpm={data.get('engine_rpm')} | speed={data.get('vehicle_speed')}")
        count += 1

        if limit and count >= limit:
            break

    consumer.close()
    print(f"\n✅ {count} messages consommés.")


if __name__ == "__main__":
    # Test rapide : lire seulement les 20 premiers messages
    consume_messages(limit=20)