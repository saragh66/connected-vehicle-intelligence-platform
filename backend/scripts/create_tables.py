from backend.database.connection import Base, engine

# Import des modèles pour que SQLAlchemy les enregistre dans Base.metadata
from backend.database.models.vehicle import Vehicle
from backend.database.models.telemetry import Telemetry
from backend.database.models.alert import Alert


def create_tables():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully.")


if __name__ == "__main__":
    create_tables()