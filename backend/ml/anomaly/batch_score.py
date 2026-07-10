import pandas as pd
from sqlalchemy import create_engine, text
from backend.config.settings import get_settings
from backend.ml.anomaly.inference import get_anomaly_detector, FEATURES

settings = get_settings()
engine = create_engine(settings.DATABASE_URL)

BATCH_SIZE = 50_000


def batch_score_all():
    detector = get_anomaly_detector()

    with engine.connect() as conn:
        total = conn.execute(text("SELECT COUNT(*) FROM telemetry")).scalar()
        print(f"Total rows to score: {total}")

    offset = 0
    total_scored = 0

    while True:
        query = f"""
            SELECT id, {", ".join(FEATURES)}
            FROM telemetry
            ORDER BY id
            LIMIT {BATCH_SIZE} OFFSET {offset}
        """
        df = pd.read_sql(query, engine)
        if df.empty:
            break

        scored = detector.score_batch(df)
        scored_valid = scored[scored["anomaly_score"].notna()]

        if len(scored_valid) > 0:
            update_data = [
                {
                    "id": int(row["id"]),
                    "score": float(row["anomaly_score"]),
                    "is_anomaly": bool(row["is_anomaly"]),
                    "version": detector.version,
                }
                for _, row in scored_valid.iterrows()
            ]

            with engine.begin() as conn:
                conn.execute(
                    text("""
                        UPDATE telemetry
                        SET anomaly_score = :score,
                            is_anomaly = :is_anomaly,
                            model_version = :version
                        WHERE id = :id
                    """),
                    update_data,
                )

        total_scored += len(df)
        offset += BATCH_SIZE
        print(f"   ... {total_scored}/{total} scored")

    print(f"\n✅ Batch scoring complete. {total_scored} rows processed.")


if __name__ == "__main__":
    batch_score_all()