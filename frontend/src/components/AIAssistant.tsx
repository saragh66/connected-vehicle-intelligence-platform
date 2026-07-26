import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { askAI } from "../api/ai";
import type { AIAnswer } from "../types/vehicle";

interface AIAssistantProps {
  vehicleId?: number;
}

const SUGGESTED_QUESTIONS = [
  "Why might this vehicle have a low health score?",
  "What does a high anomaly rate mean?",
  "What causes engine overheating?",
];

export default function AIAssistant({ vehicleId }: AIAssistantProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (q?: string) => {
    const finalQuestion = q ?? question;
    if (!finalQuestion.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await askAI(finalQuestion, vehicleId);
      setResult(response);
      setQuestion("");
    } catch (err) {
      console.error(err);
      setError("Failed to get a response. The AI service may be starting up — try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e4e7eb",
        borderRadius: 14,
        padding: 20,
        marginBottom: 16,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, #0052ff, #7c3aed)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={15} color="#fff" />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700 }}>AI Diagnostic Assistant</span>
        <span style={{ fontSize: 10, color: "#6b7280", marginLeft: "auto" }}>
          RAG · Llama 3.2 · ChromaDB
        </span>
      </div>

      {!result && !loading && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleAsk(q)}
              style={{
                fontSize: 12,
                padding: "6px 12px",
                borderRadius: 20,
                border: "1px solid #e4e7eb",
                background: "#f9fafb",
                cursor: "pointer",
                color: "#374151",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Ask about this vehicle's diagnostics..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid #e4e7eb",
            borderRadius: 10,
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading || !question.trim()}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: loading ? "#9ca3af" : "#0052ff",
            color: "#fff",
            cursor: loading ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
        </button>
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
          <Loader2 size={14} className="spin" /> Analyzing telemetry and generating response...
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: "#dc2626", background: "#fef2f2", padding: 10, borderRadius: 8 }}>
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            background: "#f9fafb",
            borderRadius: 10,
            padding: 14,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>
            "{result.question}"
          </div>
          <div style={{ color: "#14171f", marginBottom: 10 }}>{result.answer}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {result.sources.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  background: "#e0e7ff",
                  color: "#3730a3",
                  borderRadius: 12,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}