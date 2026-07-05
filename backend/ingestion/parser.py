import re
import pandas as pd
from pathlib import Path
from datetime import datetime, date

from backend.ingestion.reader import RAW_DATA_DIR, parse_filename, list_csv_files


# Mapping "mot-clé dans le nom original" -> "nom de colonne normalisé"
# On utilise un matching par mot-clé (pas un nom exact) à cause du bug
# d'encodage "Â°C" présent dans certains fichiers du dataset KIT.
COLUMN_KEYWORDS = {
    "Time": "time_raw",
    "Engine Coolant Temperature": "engine_coolant_temp",
    "Intake Manifold Absolute Pressure": "intake_manifold_pressure",
    "Engine RPM": "engine_rpm",
    "Vehicle Speed Sensor": "vehicle_speed",
    "Intake Air Temperature": "intake_air_temp",
    "Air Flow Rate from Mass Flow Sensor": "air_flow_rate",
    "Absolute Throttle Position": "throttle_position",
    "Ambient Air Temperature": "ambient_air_temp",
    "Accelerator Pedal Position D": "accelerator_pedal_d",
    "Accelerator Pedal Position E": "accelerator_pedal_e",
}


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Renomme les colonnes du DataFrame vers des noms normalisés,
    peu importe les problèmes d'encodage (Â°C, etc.)."""
    new_columns = {}
    for col in df.columns:
        matched = False
        for keyword, normalized_name in COLUMN_KEYWORDS.items():
            if keyword in col:
                new_columns[col] = normalized_name
                matched = True
                break
        if not matched:
            # Sécurité : garde le nom d'origine si rien ne matche
            new_columns[col] = col
    return df.rename(columns=new_columns)


def build_timestamp(df: pd.DataFrame, trip_date: str) -> pd.DataFrame:
    """Combine la date du nom de fichier avec la colonne 'time_raw' (HH:MM:SS.mmm)
    pour créer un vrai timestamp datetime complet."""
    if trip_date is None:
        # Sécurité si le regex du nom de fichier n'a pas matché
        trip_date = "1970-01-01"

    def parse_time(row_time: str) -> datetime:
        try:
            time_part = datetime.strptime(row_time.strip(), "%H:%M:%S.%f").time()
        except (ValueError, AttributeError):
            return pd.NaT
        base_date = datetime.strptime(trip_date, "%Y-%m-%d").date()
        return datetime.combine(base_date, time_part)

    df["timestamp"] = df["time_raw"].apply(parse_time)
    df = df.drop(columns=["time_raw"])
    return df


def parse_file(file_path: Path) -> pd.DataFrame:
    """Lit un fichier CSV brut et retourne un DataFrame normalisé,
    prêt pour l'ETL / Kafka / PostgreSQL."""
    metadata = parse_filename(file_path.name)

    df = pd.read_csv(file_path)
    df = normalize_columns(df)
    df = build_timestamp(df, metadata["date"])

    # Ajout des métadonnées du trajet sur chaque ligne
    df["vehicle_code"] = f"{metadata.get('make')}_{metadata.get('model')}".strip("_")
    df["trip_condition"] = metadata.get("condition")
    df["trip_route"] = metadata.get("route")
    df["source_file"] = file_path.name

    # Réordonner les colonnes : métadonnées d'abord, mesures ensuite
    meta_cols = ["timestamp", "vehicle_code", "trip_condition", "trip_route", "source_file"]
    sensor_cols = [c for c in df.columns if c not in meta_cols]
    df = df[meta_cols + sensor_cols]

    return df


def parse_all_files(directory: Path = RAW_DATA_DIR) -> pd.DataFrame:
    """Parse tous les fichiers CSV du dossier et retourne un seul DataFrame combiné."""
    files = list_csv_files(directory)
    all_dfs = []

    for i, file_path in enumerate(files, start=1):
        print(f"[{i}/{len(files)}] Parsing {file_path.name}...")
        try:
            df = parse_file(file_path)
            all_dfs.append(df)
        except Exception as e:
            print(f"   ❌ Erreur sur {file_path.name}: {e}")

    combined = pd.concat(all_dfs, ignore_index=True)
    print(f"\n✅ {len(all_dfs)} fichiers parsés avec succès")
    print(f"✅ Total combiné: {len(combined)} lignes")
    return combined


if __name__ == "__main__":
    # Test sur un seul fichier d'abord
    test_file = RAW_DATA_DIR / "2017-07-05_Seat_Leon_RT_S_Stau.csv"
    df_test = parse_file(test_file)

    print("— Colonnes normalisées —")
    print(df_test.columns.tolist())
    print()

    print("— Aperçu (5 premières lignes) —")
    print(df_test.head())
    print()

    print("— Types —")
    print(df_test.dtypes)