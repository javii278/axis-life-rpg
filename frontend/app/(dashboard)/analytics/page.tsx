"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { STAT_META, StatType } from "@/lib/types";

interface Summary {
  totals: { habits_completed: number; focus_hours: number; quests_done: number; level: number; total_xp: number };
  this_week: { habits_completed: number; focus_minutes: number };
  best_streak: number;
  current_streaks: { habit: string; streak: number; stat: string }[];
  completion_by_weekday: { day: string; rate: number; done: number; possible: number }[];
  habit_consistency: { id: number; name: string; stat: string; streak: number; completions_30d: number; rate_30d: number }[];
  focus_sessions_count: number;
  avg_focus_quality: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.summary()
      .then(d => setData(d as Summary))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 font-mono text-sm animate-pulse pt-20 text-center">Calculando estadísticas...</div>;
  if (!data) return null;

  const maxRate = Math.max(...data.completion_by_weekday.map(d => d.rate), 1);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display text-white">Analytics</h1>
        <p className="text-white/40 mt-1">Tu progreso en números reales</p>
      </div>

      {/* ── Totales ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Hábitos completados", value: data.totals.habits_completed, icon: "✅", color: "text-accent-green" },
          { label: "Horas de foco",       value: `${data.totals.focus_hours}h`, icon: "🧠", color: "text-accent-cyan" },
          { label: "Quests completadas",  value: data.totals.quests_done, icon: "⚔️", color: "text-accent-purple_light" },
          { label: "XP total",            value: data.totals.total_xp.toLocaleString(), icon: "✨", color: "text-accent-gold" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-bg-card border border-white/10 rounded-2xl p-4">
            <span className="text-2xl">{icon}</span>
            <p className={`text-2xl font-bold font-mono mt-2 ${color}`}>{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Esta semana vs racha ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-white/10 rounded-2xl p-5 space-y-3">
          <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest">Esta semana</h2>
          <div className="flex gap-6">
            <div>
              <p className="text-3xl font-bold font-mono text-white">{data.this_week.habits_completed}</p>
              <p className="text-xs text-white/40">hábitos</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-accent-cyan">{Math.round(data.this_week.focus_minutes / 60 * 10) / 10}h</p>
              <p className="text-xs text-white/40">foco</p>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-white/10 rounded-2xl p-5 space-y-3">
          <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest">Rachas activas</h2>
          {data.current_streaks.length === 0 ? (
            <p className="text-sm text-white/30">Sin rachas aún — ¡completa un hábito!</p>
          ) : (
            <div className="space-y-2">
              {data.current_streaks.slice(0, 3).map(({ habit, streak, stat }) => {
                const meta = STAT_META[stat as StatType];
                return (
                  <div key={habit} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-mono font-bold" style={{ color: meta?.color }}>
                        {stat}
                      </span>
                      <span className="text-sm text-white truncate">{habit}</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-accent-gold flex-shrink-0">🔥 {streak}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Completion por día de semana ─────────────────────────────────────── */}
      <div className="bg-bg-card border border-white/10 rounded-2xl p-5">
        <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-6">Consistencia por día (últimos 30 días)</h2>
        <div className="flex items-end gap-2 h-36">
          {data.completion_by_weekday.map(({ day, rate, done, possible }) => {
            const height = possible === 0 ? 0 : Math.max((rate / maxRate) * 100, 2);
            const isGood = rate >= 70;
            const isMid  = rate >= 40 && rate < 70;
            const color  = isGood ? "#10b981" : isMid ? "#f59e0b" : "#ef4444";
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-white/50">{rate}%</span>
                <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{ height: `${height}%`, backgroundColor: color, opacity: possible === 0 ? 0.2 : 0.8 }}
                  />
                </div>
                <span className="text-xs font-mono text-white/60">{day}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-white/25 mt-3">Verde ≥70% · Amarillo ≥40% · Rojo &lt;40%</p>
      </div>

      {/* ── Tabla de hábitos ─────────────────────────────────────────────────── */}
      <div className="bg-bg-card border border-white/10 rounded-2xl p-5">
        <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4">Consistencia por hábito (30 días)</h2>
        {data.habit_consistency.length === 0 ? (
          <p className="text-sm text-white/30 py-4">Aún no hay hábitos registrados.</p>
        ) : (
          <div className="space-y-3">
            {data.habit_consistency.map(({ id, name, stat, streak, completions_30d, rate_30d }) => {
              const meta = STAT_META[stat as StatType];
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold w-8 flex-shrink-0" style={{ color: meta?.color }}>{stat}</span>
                  <span className="text-sm text-white flex-1 truncate">{name}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {streak > 0 && <span className="text-xs font-mono text-accent-gold">🔥{streak}</span>}
                    <div className="w-20 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${rate_30d}%`,
                          backgroundColor: rate_30d >= 70 ? "#10b981" : rate_30d >= 40 ? "#f59e0b" : "#ef4444",
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white/50 w-8 text-right">{rate_30d}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Foco ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-bg-card border border-white/10 rounded-2xl p-5">
          <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3">Sesiones de foco</h2>
          <p className="text-4xl font-bold font-mono text-accent-cyan">{data.focus_sessions_count}</p>
          <p className="text-xs text-white/40 mt-1">sesiones completadas</p>
        </div>
        <div className="bg-bg-card border border-white/10 rounded-2xl p-5">
          <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3">Calidad media</h2>
          <p className="text-4xl font-bold font-mono text-accent-gold">{data.avg_focus_quality}<span className="text-xl text-white/30">/5</span></p>
          <p className="text-xs text-white/40 mt-1">calidad promedio</p>
        </div>
      </div>
    </div>
  );
}
