import json
from backend.rag.retriever import retrieve_relevant_chunks
from backend.rag.prompts import build_diagnostic_prompt
from backend.llm.ollama_client import generate_response, stream_response


def ask_diagnostic_question(
    question: str,
    vehicle_data: dict | None = None,
    conversation_history: list[dict] | None = None,
) -> dict:
    chunks = retrieve_relevant_chunks(question, top_k=3)
    prompt = build_diagnostic_prompt(question, chunks, vehicle_data, conversation_history)
    answer = generate_response(prompt)
    sources = list(set(c["source"] for c in chunks))
    return {
        "question": question,
        "answer": answer,
        "sources": sources,
    }


def stream_diagnostic_answer(
    question: str,
    vehicle_data: dict | None = None,
    conversation_history: list[dict] | None = None,
):
    chunks = retrieve_relevant_chunks(question, top_k=3)
    prompt = build_diagnostic_prompt(question, chunks, vehicle_data, conversation_history)
    sources = list(set(c["source"] for c in chunks))

    yield json.dumps({"type": "meta", "sources": sources}) + "\n"
    for token in stream_response(prompt):
        yield json.dumps({"type": "token", "text": token}) + "\n"