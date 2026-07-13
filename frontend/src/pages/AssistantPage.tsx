import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Bot, User } from "lucide-react";
import { askAI } from "../api/ai";
import type { ConversationMessage } from "../types/vehicle";

interface ChatMessage extends ConversationMessage {
  sources?: string[];
}

const QUICK_PROMPTS = [
  "What causes engine overheating?",
  "What is a normal RPM range while idling?",
  "How is the fleet health score calculated?",
  "What percentage of my fleet is critical?",
  "What does a high anomaly rate indicate?",
  "What's the difference between anomaly detection and predictive maintenance?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = { role: "user", content: question };
    const history = messages.map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await askAI(question, undefined, history);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, sources: result.sources },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. The AI service may still be starting up — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ padding: "20px 32px", borderBottom: "1px solid #e8eaef", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #0052ff, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={17} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#0f1117" }}>AI Diagnostic Assistant</h1>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
              RAG pipeline · Llama 3.2 (local) · ChromaDB · Live fleet data
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 32px", background: "#f7f8fa" }}>
        {messages.length === 0 && (
          <div style={{ maxWidth: 640, margin: "40px auto 0" }}>
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
              Ask me anything about your fleet's diagnostics, health scores, or general vehicle telemetry.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  style={{
                    textAlign: "left", fontSize: 13, padding: "12px 14px",
                    borderRadius: 10, border: "1px solid #e4e7eb", background: "#fff",
                    cursor: "pointer", color: "#374151",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: msg.role === "user" ? "#e0e7ff" : "linear-gradient(135deg, #0052ff, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {msg.role === "user" ? <User size={14} color="#3730a3" /> : <Bot size={14} color="#fff" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  background: msg.role === "user" ? "#e0e7ff" : "#fff",
                  border: msg.role === "user" ? "none" : "1px solid #e8eaef",
                  borderRadius: 12, padding: "12px 16px", fontSize: 13.5, lineHeight: 1.6,
                  color: "#14171f",
                }}>
                  {msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    {msg.sources.map((s) => (
                      <span key={s} style={{
                        fontSize: 10, padding: "3px 8px", background: "#e0e7ff",
                        color: "#3730a3", borderRadius: 12, fontFamily: "var(--font-mono)",
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "linear-gradient(135deg, #0052ff, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bot size={14} color="#fff" />
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
                <Loader2 size={14} className="spin" /> Thinking...
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 32px 24px", background: "#fff", borderTop: "1px solid #e8eaef" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 10 }}>
          <input
            type="text"
            placeholder="Ask a follow-up question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
            style={{
              flex: 1, padding: "13px 16px", border: "1px solid #e4e7eb",
              borderRadius: 12, fontSize: 14, outline: "none",
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{
              padding: "0 20px", borderRadius: 12, border: "none",
              background: loading || !input.trim() ? "#d1d5db" : "#0052ff",
              color: "#fff", cursor: loading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}