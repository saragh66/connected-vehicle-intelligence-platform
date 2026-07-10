import logging
from backend.llm.ollama_client import generate_response

logger = logging.getLogger(__name__)


def run_inference(prompt: str, temperature: float = 0.3, max_retries: int = 2) -> str:
    """Exécute une inférence LLM avec gestion d'erreurs et retry basique.
    Sert de point d'entrée unique pour toute génération de texte dans l'app,
    au cas où on change de provider LLM plus tard (Ollama -> API externe, etc.)."""

    last_error = None
    for attempt in range(max_retries):
        try:
            return generate_response(prompt, temperature=temperature)
        except Exception as e:
            last_error = e
            logger.warning(f"LLM inference attempt {attempt + 1} failed: {e}")

    logger.error(f"LLM inference failed after {max_retries} attempts: {last_error}")
    raise RuntimeError(f"Failed to generate LLM response: {last_error}")


def summarize_anomaly(vehicle_code: str, anomaly_details: dict) -> str:
    """Cas d'usage spécifique : génère un résumé en langage naturel d'une anomalie détectée."""
    prompt = f"""Summarize this vehicle anomaly detection result in one clear sentence for a fleet manager, without technical jargon:

Vehicle: {vehicle_code}
Anomaly score: {anomaly_details.get('anomaly_score')}
Engine RPM: {anomaly_details.get('engine_rpm')}
Vehicle speed: {anomaly_details.get('vehicle_speed')}
Coolant temperature: {anomaly_details.get('engine_coolant_temp')}

One-sentence summary:"""

    return run_inference(prompt, temperature=0.2)