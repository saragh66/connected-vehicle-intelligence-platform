def build_diagnostic_prompt(
    question: str,
    context_chunks: list[dict],
    vehicle_data: dict | None = None,
) -> str:
    docs_context = "\n\n".join(
        f"[Source: {c['source']}]\n{c['text']}" for c in context_chunks
    )

    vehicle_context = ""
    if vehicle_data:
        vehicle_context = f"""
Current vehicle data:
- Vehicle: {vehicle_data.get('vehicle_code', 'N/A')}
- AI Health Score: {vehicle_data.get('health_score', 'N/A')}/100
- Anomalies detected: {vehicle_data.get('anomaly_count', 'N/A')}
- Anomaly rate: {vehicle_data.get('anomaly_rate', 'N/A')}%
"""

    prompt = f"""You are an automotive diagnostics assistant helping a fleet manager understand vehicle telemetry data.

Use the following technical documentation to answer the question accurately. If the documentation doesn't fully answer the question, say so honestly rather than inventing information.

Technical documentation:
{docs_context}
{vehicle_context}

Question: {question}

Provide a clear, concise answer in 2-4 sentences, referencing the vehicle data when relevant. Answer:"""

    return prompt