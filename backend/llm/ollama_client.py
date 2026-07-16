import ollama
import json

MODEL_NAME = "llama3.2"


def generate_response(prompt: str, temperature: float = 0.3) -> str:
    response = ollama.generate(
        model=MODEL_NAME,
        prompt=prompt,
        options={"temperature": temperature},
    )
    return response["response"]


def stream_response(prompt: str, temperature: float = 0.3):
    """Yields text chunks as Ollama generates them."""
    stream = ollama.generate(
        model=MODEL_NAME,
        prompt=prompt,
        options={"temperature": temperature},
        stream=True,
    )
    for chunk in stream:
        if chunk.get("response"):
            yield chunk["response"]
        if chunk.get("done"):
            break