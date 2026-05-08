"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Star } from "lucide-react";
import { FocusSession } from "@/lib/types";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";

interface Props {
  activeSession: FocusSession | null;
  onUpdate: () => void;
}

export function FocusTimer({ activeSession, onUpdate }: Props) {
  const [title, setTitle] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [quality, setQuality] = useState(0);
  const [notes, setNotes] = useState("");
  const [showEndForm, setShowEndForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { showToast, showAchievement } = useToast();

  // Tick cuando hay sesión activa
  useEffect(() => {
    if (activeSession && !activeSession.ended_at) {
      const start = new Date(activeSession.started_at).getTime();
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeSession]);

  async function startSession() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await api.focus.start({ title });
      setTitle("");
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  async function endSession() {
    if (!activeSession || quality === 0) return;
    setLoading(true);
    try {
      const result = await api.focus.end(activeSession.id, { quality, notes: notes || undefined }) as any;
      showToast({
        type: "success",
        title: "Sesión completada",
        message: result.xp_gained ? `+${result.xp_gained} XP · ${result.duration_minutes}min` : `${result.duration_minutes}min`,
        icon: "🧠",
        duration: 3000,
      });
      result.new_achievements?.forEach((a: { name: string; icon: string; rarity: string }) =>
        showAchievement(a)
      );
      setQuality(0); setNotes(""); setShowEndForm(false);
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (activeSession && !activeSession.ended_at) {
    return (
      <div className="bg-bg-card border border-accent-cyan/30 rounded-2xl p-6 pulse-active">
        <div className="text-xs font-mono text-accent-cyan mb-1 uppercase tracking-widest">Sesión Activa</div>
        <div className="text-lg font-display font-semibold text-white mb-4">{activeSession.title}</div>
        <div className="text-5xl font-mono font-bold text-accent-cyan text-center my-6">
          {formatTime(elapsed)}
        </div>

        <AnimatePresence mode="wait">
          {!showEndForm ? (
            <button
              onClick={() => setShowEndForm(true)}
              className="w-full py-3 rounded-xl bg-bg-secondary border border-accent-cyan/30
                         text-accent-cyan font-display font-semibold flex items-center justify-center gap-2
                         hover:bg-accent-cyan/10 transition-colors"
            >
              <Square size={16} /> Terminar sesión
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="space-y-4"
            >
              <div>
                <div className="text-xs font-mono text-gray-400 mb-2">¿CÓMO FUE EL FOCO?</div>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n} onClick={() => setQuality(n)}
                      className={`p-2 transition-transform hover:scale-110 ${quality >= n ? "text-accent-gold" : "text-gray-600"}`}
                    >
                      <Star size={24} fill={quality >= n ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Notas de la sesión (opcional)..."
                rows={2}
                className="w-full bg-bg-secondary border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm
                           text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-purple resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowEndForm(false)} className="flex-1 py-2 rounded-lg border border-[#2d2d4a] text-sm text-gray-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={endSession} disabled={quality === 0 || loading}
                  className="flex-1 py-2 rounded-lg bg-accent-cyan text-bg-primary font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-6">
      <div className="text-xs font-mono text-gray-400 mb-4 uppercase tracking-widest">Nueva Sesión de Foco</div>
      <div className="flex gap-2">
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && startSession()}
          placeholder="¿En qué vas a trabajar?"
          className="flex-1 bg-bg-secondary border border-[#2d2d4a] rounded-lg px-3 py-2.5 text-sm
                     text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-cyan"
        />
        <button
          onClick={startSession} disabled={loading || !title.trim()}
          className="px-4 py-2.5 rounded-lg bg-accent-cyan text-bg-primary font-bold
                     disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <Play size={14} fill="currentColor" />
          <span className="text-sm">Start</span>
        </button>
      </div>
    </div>
  );
}
