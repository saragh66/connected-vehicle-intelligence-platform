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