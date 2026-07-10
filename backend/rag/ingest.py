from pathlib import Path
from backend.rag.vector_store import get_collection

MANUALS_DIR = Path("data/manuals")
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    current_chunk = ""

    for para in paragraphs:
        if len(current_chunk) + len(para) <= chunk_size:
            current_chunk += ("\n\n" if current_chunk else "") + para
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = para

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def ingest_documents():
    collection = get_collection()

    md_files = list(MANUALS_DIR.glob("*.md"))
    print(f"Found {len(md_files)} documents to ingest")

    all_chunks = []
    all_ids = []
    all_metadatas = []

    for file_path in md_files:
        text = file_path.read_text(encoding="utf-8")
        chunks = chunk_text(text)

        for i, chunk in enumerate(chunks):
            chunk_id = f"{file_path.stem}_{i}"
            all_chunks.append(chunk)
            all_ids.append(chunk_id)
            all_metadatas.append({"source": file_path.name, "chunk_index": i})

        print(f"  {file_path.name}: {len(chunks)} chunks")

    collection.upsert(
        documents=all_chunks,
        ids=all_ids,
        metadatas=all_metadatas,
    )

    print(f"\n✅ Ingested {len(all_chunks)} chunks into ChromaDB")


if __name__ == "__main__":
    ingest_documents()