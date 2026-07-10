from sentence_transformers import SentenceTransformer
from functools import lru_cache

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache
def get_embedding_model() -> SentenceTransformer:
    """Charge le modèle d'embedding une seule fois (singleton), comme pour le modèle ML."""
    return SentenceTransformer(EMBEDDING_MODEL_NAME)


def embed_text(text: str) -> list[float]:
    """Génère un vecteur d'embedding pour un texte donné."""
    model = get_embedding_model()
    return model.encode(text).tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Génère des embeddings pour une liste de textes (plus efficace en batch)."""
    model = get_embedding_model()
    return model.encode(texts).tolist()