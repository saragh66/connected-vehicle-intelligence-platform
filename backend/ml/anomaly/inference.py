import joblib
import pandas as pd
from pathlib import Path
from functools import lru_cache

MODEL_DIR = Path("backend/ml/anomaly/artifacts")
MODEL_VERSION = "isolation_forest_v1"

FEATURES = [
    "engine_coolant_temp",
    "engine_rpm",
    "vehicle_speed",
    "intake_manifold_pressure",
    "throttle_position",
]


class AnomalyDetector:
    """Wrapper autour du modèle Isolation Forest pour scoring en production."""

    def __init__(self, version: str = MODEL_VERSION):
        self.version = version
        self.model_path = MODEL_DIR / f"{version}.joblib"
        self.model = joblib.load(self.model_path)

    def score_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()
        result["anomaly_score"] = None
        result["is_anomaly"] = None

        valid_mask = df[FEATURES].notna().all(axis=1)
        if valid_mask.sum() == 0:
            return result

        valid_rows = df.loc[valid_mask, FEATURES]
        scores = self.model.decision_function(valid_rows)
        predictions = self.model.predict(valid_rows)

        result.loc[valid_mask, "anomaly_score"] = scores
        result.loc[valid_mask, "is_anomaly"] = predictions == -1

        return result

    def score_single(self, features: dict) -> tuple[float | None, bool | None]:
        if any(features.get(f) is None for f in FEATURES):
            return None, None

        row = pd.DataFrame([{f: features[f] for f in FEATURES}])
        score = float(self.model.decision_function(row)[0])
        is_anomaly = bool(self.model.predict(row)[0] == -1)
        return score, is_anomaly


@lru_cache
def get_anomaly_detector() -> AnomalyDetector:
    return AnomalyDetector()