"use client";
import { useEffect, useState, useCallback } from "react";
import { FocusSession } from "@/lib/types";
import { api } from "@/lib/api";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { Clock, Star } from "lucide-react";

export default function FocusPage() {
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [history, setHistory] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [active, sessions] = await Promise.all([
      api.focus.active(),
      api.focus.list(10),
    ]);
    setActiveSession(active as FocusSession | null);
    setHistory(sessions as FocusSession[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalMinutesToday = history
    .filter(s => s.ended_at && new Date(s.started_at).toDateString() === new Date().toDateString())
    .reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Sesiones de Foco</h1>
        <p className="text-gray-500 text-sm mt-1">
          {totalMinutesToday > 0 ? `${totalMinutesToday} minutos hoy` : "Ninguna sesión hoy todavía"}
        </p>
      </div>

      <FocusTimer activeSession={activeSession} onUpdate={fetchData} />

      {/* Historial */}
      {history.filter(s => s.ended_at).length > 0 && (
        <div>
          <h2 className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-3">Historial</h2>
          <div className="space-y-2">
            {history.filter(s => s.ended_at).map(session => (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 bg-bg-card border border-[#2d2d4a] rounded-xl"
              >
                <Clock size={16} className="text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{session.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(session.started_at).toLocaleDateString("es-ES", {
                      day: "numeric", month: "short",
                    })}
                  </p>
                </div>
                <div className="text-sm font-mono text-gray-400 flex-shrink-0">
                  {session.duration_minutes}m
                </div>
                {session.quality && (
                  <div className="flex items-center gap-0.5 text-accent-gold flex-shrink-0">
                    {Array.from({ length: session.quality }).map((_, i) => (
                      <Star key={i} size={10} fill="currentColor" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
