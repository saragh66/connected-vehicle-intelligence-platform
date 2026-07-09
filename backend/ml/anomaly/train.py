import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy import create_engine
from pathlib import Path

from backend.config.settings import get_settings

pd.set_option("display.max_columns", None)
pd.set_option("display.width", 250)
pd.set_option("display.max_colwidth", None)

settings = get_settings()
engine = create_engine(settings.DATABASE_URL)

MODEL_DIR = Path("backend/ml/anomaly/artifacts")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

FEATURES = [
    "engine_coolant_temp",
    "engine_rpm",
    "vehicle_speed",
    "intake_manifold_pressure",
    "throttle_position",
]


def load_training_data(limit: int = 800_000) -> pd.DataFrame:
    query = f"""
        SELECT {", ".join(FEATURES)}
        FROM telemetry
        WHERE engine_rpm IS NOT NULL
          AND vehicle_speed IS NOT NULL
          AND engine_coolant_temp IS NOT NULL
          AND intake_manifold_pressure IS NOT NULL
          AND throttle_position IS NOT NULL
        LIMIT {limit}
    """
    return pd.read_sql(query, engine)


def train():
    print("Loading training data...")
    df = load_training_data()
    print(f"Loaded {len(df)} rows")

    model = IsolationForest(
        n_estimators=200,
        contamination=0.02,
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )

    print("Training Isolation Forest...")
    model.fit(df[FEATURES])

    model_path = MODEL_DIR / "isolation_forest_v1.joblib"
    joblib.dump(model, model_path)
    print(f"✅ Model saved to {model_path}")

    scores = model.decision_function(df[FEATURES])
    predictions = model.predict(df[FEATURES])

    n_anomalies = (predictions == -1).sum()
    print(f"\nDetected {n_anomalies} anomalies out of {len(df)} ({n_anomalies/len(df)*100:.2f}%)")

    df["anomaly_score"] = scores
    df["is_anomaly"] = predictions == -1
    print("\n--- TOP 10 MOST ANOMALOUS ROWS ---")
    top10 = df.nsmallest(10, "anomaly_score")
    for idx, row in top10.iterrows():
        print(f"\nRow {idx}:")
        for col in FEATURES:
            print(f"  {col}: {row[col]}")
        print(f"  anomaly_score: {row['anomaly_score']:.4f}")


if __name__ == "__main__":
    train()