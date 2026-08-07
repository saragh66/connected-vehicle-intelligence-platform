import { apiClient } from "./client";
 
export async function sendTestEmail(email: string): Promise<{ sent: boolean; message: string }> {
  const response = await apiClient.post("/notifications/test-email", { email });
  return response.data;
}