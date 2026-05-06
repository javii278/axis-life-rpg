"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Bot } from "lucide-react";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "coach";
  text: string;
  ts: number;
}

const GREETINGS = [
  "¿Qué deseas saber, viajero?",
  "Los astros revelan tus patrones. ¿Quieres verlos?",
  "Tu progreso llama mi atención. Habla.",
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "coach", text: GREETINGS[Math.floor(Math.random() * GREETINGS.length)], ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg, ts: Date.now() }]);
    setLoading(true);

    try {
      const res = await api.coach.chat(msg) as { response: string };
      setMessages(prev => [...prev, { role: "coach", text: res.response, ts: Date.now() }]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: "coach",
        text: "⚠️ Error al conectar con el Consejero. Verifica que ANTHROPIC_API_KEY esté configurado.",
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function getWeeklyInsight() {
    setInsightLoading(true);
    try {
      const res = await api.coach.weeklyInsight() as { insight: string };
      setMessages(prev => [...prev, { role: "coach", text: res.insight, ts: Date.now() }]);
    } finally { setInsightLoading(false); }
  }

  const quickActions = [
    "¿Cómo está mi progreso esta semana?",
    "¿Qué hábito debo reforzar?",
    "Dame consejos para mejorar mi foco",
  ];

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Consejero Arcano</h1>
          <p className="text-gray-500 text-sm mt-0.5">Powered by Claude · Conoce tus stats en tiempo real</p>
        </div>
        <button
          onClick={getWeeklyInsight}
          disabled={insightLoading || loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-accent-purple/40
                     text-accent-purple_light text-xs font-mono hover:bg-accent-purple/10 transition-colors disabled:opacity-50"
        >
          <Sparkles size={12} />
          {insightLoading ? "Analizando..." : "Análisis semanal"}
        </button>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.ts}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm ${
                msg.role === "coach"
                  ? "bg-accent-purple/20 border border-accent-purple/30"
                  : "bg-bg-card border border-[#2d2d4a]"
              }`}>
                {msg.role === "coach" ? "🔮" : "⚔️"}
              </div>

              {/* Bubble */}
              <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "coach"
                  ? "bg-bg-card border border-[#2d2d4a] text-gray-200 rounded-tl-sm"
                  : "bg-accent-purple/20 border border-accent-purple/30 text-white rounded-tr-sm"
              }`}>
                {msg.text.split("\n").map((line, j) => (
                  <span key={j}>
                    {line.split(/(\*\*.*?\*\*)/g).map((part, k) =>
                      part.startsWith("**") && part.endsWith("**")
                        ? <strong key={k} className="text-white font-semibold">{part.slice(2, -2)}</strong>
                        : part
                    )}
                    {j < msg.text.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-sm">🔮</div>
            <div className="px-4 py-3 bg-bg-card border border-[#2d2d4a] rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 bg-accent-purple_light rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 2 && (
        <div className="flex gap-2 flex-wrap mb-3 flex-shrink-0">
          {quickActions.map(action => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              className="text-xs px-3 py-1.5 rounded-full border border-[#2d2d4a] text-gray-400
                         hover:border-accent-purple/40 hover:text-accent-purple_light transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Habla con el Consejero..."
          disabled={loading}
          className="flex-1 bg-bg-card border border-[#2d2d4a] rounded-xl px-4 py-3 text-sm text-white
                     placeholder:text-gray-600 focus:outline-none focus:border-accent-purple
                     disabled:opacity-50 transition-colors"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-xl bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50
                     flex items-center justify-center transition-colors"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}
