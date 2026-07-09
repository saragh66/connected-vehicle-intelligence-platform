import pandas as pd
from sqlalchemy import create_engine
from backend.config.settings import get_settings

pd.set_option("display.max_columns", None)
pd.set_option("display.width", 200)

settings = get_settings()
engine = create_engine(settings.DATABASE_URL)

def explore():
    query = """
        SELECT engine_coolant_temp, engine_rpm, vehicle_speed,
               intake_manifold_pressure, throttle_position
        FROM telemetry
        WHERE engine_rpm IS NOT NULL AND vehicle_speed IS NOT NULL
        LIMIT 500000
    """
    df = pd.read_sql(query, engine)

    print("Shape:", df.shape)
    print("\n--- DESCRIBE ---")
    print(df.describe())

    print("\n--- MISSING VALUES ---")
    print(df.isnull().sum())

    print("\n--- CORRELATION MATRIX ---")
    print(df.corr())

    print("\n--- PERCENTILES (1%, 5%, 95%, 99%) — pour seuils d'anomalie ---")
    print(df.quantile([0.01, 0.05, 0.95, 0.99]))

if __name__ == "__main__":
    explore()