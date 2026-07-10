from backend.rag.vector_store import get_collection


def retrieve_relevant_chunks(query: str, top_k: int = 3) -> list[dict]:
    collection = get_collection()

    results = collection.query(
        query_texts=[query],
        n_results=top_k,
    )

    chunks = []
    for i in range(len(results["documents"][0])):
        chunks.append({
            "text": results["documents"][0][i],
            "source": results["metadatas"][0][i]["source"],
            "distance": results["distances"][0][i],
        })

    return chunks