"use client";
import { useEffect, useState, useCallback } from "react";
import { Character, Habit, STAT_META, StatType } from "@/lib/types";
import { api } from "@/lib/api";
import { StatBar } from "@/components/ui/StatBar";
import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp, Flame, Target, Sparkles } from "lucide-react";

const STATS: StatType[] = ["VIT", "FOC", "SAB", "DIS", "CRE", "VOL"];

interface WeekSummary {
  this_week: { habits_completed: number; focus_minutes: number };
  best_streak: number;
  current_streaks: { habit: string; streak: number; stat: string }[];
}

export default function ReviewPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  const [coachInsight, setCoachInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [char, hab, summary] = await Promise.all([
        api.character.get(),
        api.habits.list(),
        api.analytics.summary(),
      ]);
      setCharacter(char as Character);
      setHabits(hab as Habit[]);
      setWeekSummary(summary as WeekSummary);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function getCoachInsight() {
    setInsightLoading(true);
    try {
      const res = await api.coach.weeklyInsight() as { insight: string };
      setCoachInsight(res.insight);
    } catch {
      setCoachInsight("⚠️ No se pudo conectar con el Consejero. Verifica que ANTHROPIC_API_KEY esté configurado.");
    } finally {
      setInsightLoading(false);
    }
  }

  if (loading) return <div className="text-gray-500 font-mono text-sm animate-pulse">Cargando...</div>;
  if (!character) return <div className="text-gray-500 text-sm">Crea tu personaje primero.</div>;

  const topStreak = habits.reduce((best, h) => h.streak > best.streak ? h : best, habits[0]);
  const weakestStat = STATS.reduce((w, s) => {
    const val = character[s.toLowerCase() as keyof Character] as number;
    const wVal = character[w.toLowerCase() as keyof Character] as number;
    return val < wVal ? s : w;
  }, STATS[0]);
  const strongestStat = STATS.reduce((b, s) => {
    const val = character[s.toLowerCase() as keyof Character] as number;
    const bVal = character[b.toLowerCase() as keyof Character] as number;
    return val > bVal ? s : b;
  }, STATS[0]);

  const weekLabel = getWeekLabel();
  const focusHours = weekSummary ? Math.round(weekSummary.this_week.focus_minutes / 60 * 10) / 10 : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-1">{weekLabel}</p>
        <h1 className="text-2xl font-display font-bold text-white">Review Semanal</h1>
      </div>

      {/* ── Números de la semana ─────────────────────────────────────────────── */}
      {weekSummary && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: "Hábitos", value: weekSummary.this_week.habits_completed, color: "text-accent-green", icon: "✅" },
            { label: "Foco", value: `${focusHours}h`, color: "text-accent-cyan", icon: "🧠" },
            { label: "Mejor racha", value: `${weekSummary.best_streak}d`, color: "text-accent-gold", icon: "🔥" },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-bg-card border border-[#2d2d4a] rounded-xl p-4 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Resumen de stats ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-6"
      >
        <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">Estado del Personaje</h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="text-3xl font-display font-bold text-accent-gold">{character.level}</div>
          <div>
            <div className="text-white font-semibold">{character.name}</div>
            <div className="text-accent-purple_light text-sm font-mono">{character.character_class}</div>
          </div>
        </div>
        <div className="space-y-3">
          {STATS.map(s => (
            <StatBar key={s} stat={s} value={character[s.toLowerCase() as keyof Character] as number} />
          ))}
        </div>
      </motion.div>

      {/* ── Insights automáticos ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">Insights de la semana</h2>

        <InsightCard
          icon={<TrendingUp size={18} className="text-accent-green" />}
          color="green"
          title="Punto fuerte"
          body={`Tu stat más alto es ${STAT_META[strongestStat].label} (${(character[strongestStat.toLowerCase() as keyof Character] as number).toFixed(0)}/100). Sigue con los hábitos que lo alimentan.`}
        />

        {topStreak && topStreak.streak > 0 && (
          <InsightCard
            icon={<Flame size={18} className="text-accent-gold" />}
            color="gold"
            title={`Racha activa: ${topStreak.streak} días`}
            body={`"${topStreak.name}" es tu hábito más consistente. Protege esa racha.`}
          />
        )}

        <InsightCard
          icon={<Target size={18} className="text-red-400" />}
          color="red"
          title="Área a reforzar"
          body={`${STAT_META[weakestStat].label} es tu stat más bajo (${(character[weakestStat.toLowerCase() as keyof Character] as number).toFixed(0)}/100). ${STAT_META[weakestStat].description}.`}
        />

        <InsightCard
          icon={<CheckCircle2 size={18} className="text-accent-purple_light" />}
          color="purple"
          title="Hábitos activos"
          body={`Tienes ${habits.length} hábito${habits.length !== 1 ? "s" : ""} activo${habits.length !== 1 ? "s" : ""}. Cada hábito que completes hoy refuerza tus stats de forma inmediata.`}
        />
      </div>

      {/* ── Análisis del Consejero Arcano ────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">Consejero Arcano</h2>
        {!coachInsight ? (
          <button
            onClick={getCoachInsight}
            disabled={insightLoading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-accent-purple/30
                       bg-accent-purple/5 hover:bg-accent-purple/10 text-accent-purple_light font-semibold text-sm
                       transition-colors disabled:opacity-60"
          >
            <Sparkles size={16} />
            {insightLoading ? "El Consejero analiza tu semana..." : "Pedir análisis al Consejero"}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card border border-accent-purple/20 rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🔮</span>
              <span className="text-xs font-mono text-accent-purple_light uppercase tracking-widest">Análisis semanal</span>
            </div>
            <div className="text-sm text-gray-300 leading-relaxed space-y-2">
              {coachInsight.split("\n").map((line, i) => (
                <p key={i}>
                  {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>
                      : part
                  )}
                </p>
              ))}
            </div>
            <button
              onClick={() => setCoachInsight(null)}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors mt-1"
            >
              Pedir nuevo análisis
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Nota de intención para la semana ────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">Intención para esta semana</h2>
        <textarea
          rows={4}
          placeholder="¿Qué es lo más importante que quieres lograr esta semana? ¿Qué hábito vas a proteger a toda costa?"
          className="w-full bg-bg-card border border-[#2d2d4a] rounded-xl px-4 py-3 text-sm text-white
                     placeholder:text-gray-600 focus:outline-none focus:border-accent-purple resize-none"
        />
        <p className="text-xs text-gray-600 mt-2">Esta nota es solo para ti — no se guarda en ningún servidor.</p>
      </div>
    </div>
  );
}

function InsightCard({ icon, color, title, body }: {
  icon: React.ReactNode; color: string; title: string; body: string;
}) {
  const borderColors: Record<string, string> = {
    green: "#10b98130", gold: "#f59e0b30", red: "#ef444430", purple: "#7c3aed30",
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      className="flex gap-4 p-4 bg-bg-card border rounded-xl"
      style={{ borderColor: borderColors[color] || "#2d2d4a" }}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className="text-sm font-semibold text-white mb-0.5">{title}</div>
        <div className="text-sm text-gray-400">{body}</div>
      </div>
    </motion.div>
  );
}

function getWeekLabel() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  return `${fmt(start)} — ${fmt(end)}`;
}
