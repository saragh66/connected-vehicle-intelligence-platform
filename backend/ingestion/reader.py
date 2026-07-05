import os
import re
import pandas as pd
from pathlib import Path

RAW_DATA_DIR = Path("data/raw")

# Exemple de nom de fichier : 2017-07-05_Seat_Leon_RT_S_Stau.csv
FILENAME_PATTERN = re.compile(
    r"(?P<date>\d{4}-\d{2}-\d{2})_(?P<make>\w+)_(?P<model>\w+)_(?P<route>[A-Za-z0-9]+_[A-Za-z0-9]+)_(?P<condition>\w+)\.csv"
)


def parse_filename(filename: str) -> dict:
    """Extrait les métadonnées d'un nom de fichier (date, modèle, trajet, condition)."""
    match = FILENAME_PATTERN.match(filename)
    if not match:
        return {
            "date": None,
            "make": None,
            "model": None,
            "route": None,
            "condition": None,
            "raw_filename": filename,
        }
    data = match.groupdict()
    data["raw_filename"] = filename
    return data


def list_csv_files(directory: Path = RAW_DATA_DIR) -> list[Path]:
    """Retourne la liste triée de tous les fichiers CSV du dossier."""
    return sorted(directory.glob("*.csv"))


def explore_dataset(directory: Path = RAW_DATA_DIR) -> None:
    """Parcourt tous les CSV et affiche un résumé exploratoire."""
    files = list_csv_files(directory)
    print(f"📂 {len(files)} fichiers trouvés dans {directory}\n")

    total_rows = 0

    for file_path in files:
        metadata = parse_filename(file_path.name)
        df = pd.read_csv(file_path)

        total_rows += len(df)

        print(f"— {file_path.name}")
        print(f"   Date: {metadata['date']} | Modèle: {metadata.get('make')} {metadata.get('model')} "
              f"| Trajet: {metadata.get('route')} | Condition: {metadata.get('condition')}")
        print(f"   Lignes: {len(df)} | Colonnes: {len(df.columns)}")

        missing = df.isnull().sum().sum()
        if missing > 0:
            print(f"   ⚠️  Valeurs manquantes: {missing}")
        print()

    print(f"✅ Total: {len(files)} trajets, {total_rows} mesures cumulées")


if __name__ == "__main__":
    explore_dataset()