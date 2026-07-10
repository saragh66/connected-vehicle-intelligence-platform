import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path

CHROMA_DIR = Path("backend/rag/chroma_db")
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

COLLECTION_NAME = "vehicle_diagnostics"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"


def get_chroma_client():
    return chromadb.PersistentClient(path=str(CHROMA_DIR))


def get_collection():
    client = get_chroma_client()
    embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBEDDING_MODEL
    )
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"},
    )