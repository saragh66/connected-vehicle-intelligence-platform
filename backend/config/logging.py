import logging
import sys
from backend.config.settings import get_settings

def configure_logging() -> None:
    settings = get_settings()

    logging.basicConfig(
        level=settings.LOG_LEVEL,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    # On réduit le bruit des librairies tierces
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)