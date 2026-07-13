def build_diagnostic_prompt(
    question: str,
    context_chunks: list[dict],
    vehicle_data: dict | None = None,
    conversation_history: list[dict] | None = None,
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

    history_context = ""
    if conversation_history:
        recent = conversation_history[-4:]
        history_lines = "\n".join(
            f"{'User' if h['role'] == 'user' else 'Assistant'}: {h['content']}" for h in recent
        )
        history_context = f"""
Previous conversation:
{history_lines}
"""

    prompt = f"""You are an automotive diagnostics assistant helping a fleet manager understand vehicle telemetry data and general vehicle diagnostics questions.

Use the following technical documentation to answer accurately. If the documentation doesn't fully answer the question, use your general automotive knowledge but say so honestly.
{history_context}
Technical documentation:
{docs_context}
{vehicle_context}

Question: {question}

Provide a clear, helpful answer in 2-5 sentences. Answer:"""

    return prompt