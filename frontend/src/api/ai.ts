import { apiClient } from "./client";
import type { AIAnswer, ConversationMessage } from "../types/vehicle";

export async function askAI(
  question: string,
  vehicleId?: number,
  conversationHistory: ConversationMessage[] = []
): Promise<AIAnswer> {
  const response = await apiClient.post<AIAnswer>("/ai/ask", {
    question,
    vehicle_id: vehicleId ?? null,
    conversation_history: conversationHistory,
  });
  return response.data;
}

export async function askAIStream(
  question: string,
  conversationHistory: ConversationMessage[],
  onToken: (text: string) => void,
  onSources: (sources: string[]) => void
): Promise<void> {
  const response = await fetch("/api/v1/ai/ask/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      vehicle_id: null,
      conversation_history: conversationHistory,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const parsed = JSON.parse(line);
    if (parsed.type === "meta") onSources(parsed.sources);
    if (parsed.type === "token") onToken(parsed.text);
  } catch {
    // ignore malformed line, keep reading
  }
}
  }
}