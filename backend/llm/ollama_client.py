import ollama

MODEL_NAME = "llama3.2"


def generate_response(prompt: str, temperature: float = 0.3) -> str:
    response = ollama.generate(
        model=MODEL_NAME,
        prompt=prompt,
        options={"temperature": temperature},
    )
    return response["response"]