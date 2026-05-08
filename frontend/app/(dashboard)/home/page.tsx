"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Character, Habit, FocusSession, Quest } from "@/lib/types";
import { api } from "@/lib/api";
import { CharacterCard } from "@/components/character/CharacterCard";
import { CharacterSprite } from "@/components/character/CharacterSprite";
import { LevelUpModal } from "@/components/character/LevelUpModal";
import { HabitCard } from "@/components/habits/HabitCard";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { QuestCard } from "@/components/quests/QuestCard";
import { CreateHabitModal } from "@/components/habits/CreateHabitModal";
import { Plus, ScrollText, Sparkles } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";
import { LoginBonusModal } from "@/components/ui/LoginBonusModal";
import { LeaderboardCard } from "@/components/ui/LeaderboardCard";
import { EventBanner } from "@/components/ui/EventBanner";
import { ClassSelectionModal } from "@/components/character/ClassSelectionModal";
import { DailyCheckin, LeaderboardEntry, SeasonalEvent } from "@/lib/types";

const LEVEL_KEY = "axis_last_level";
const ONBOARDING_KEY = "axis_onboarded";
const CHECKIN_KEY = "axis_checkin_date";

// Barra de progreso diario — gancho psicológico principal
function DailyProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;
  const hour = new Date().getHours();
  const isLate = hour >= 21;

  type MotivationKey = "done" | "danger" | "start" | "early" | "mid" | "close";
  const key: MotivationKey = allDone
    ? "done"
    : isLate && pct < 50
    ? "danger"
    : pct === 0
    ? "start"
    : pct < 50
    ? "early"
    : pct < 90
    ? "mid"
    : "close";

  const MESSAGES: Record<MotivationKey, { text: string; emoji: string; color: string }> = {
    done:   { text: "¡Todo completado! Eres imparable.",         emoji: "🔥", color: "#10b981" },
    danger: { text: "¡Racha en peligro! Completa antes de medianoche.", emoji: "⚠️", color: "#ef4444" },
    start:  { text: "Comienza tu día — cada hábito suma XP.",    emoji: "⚡", color: "#7c3aed" },
    early:  { text: "Buen comienzo. Mantén el impulso.",         emoji: "💪", color: "#7c3aed" },
    mid:    { text: "A mitad de camino. ¡No pares ahora!",       emoji: "🎯", color: "#06b6d4" },
    close:  { text: "¡Casi! Un último esfuerzo.",                emoji: "🏆", color: "#f59e0b" },
  };

  const { text, emoji, color } = MESSAGES[key];
  const barGradient = allDone
    ? "linear-gradient(90deg, #059669, #10b981)"
    : isLate && pct < 50
    ? "linear-gradient(90deg, #dc2626, #ef4444)"
    : "linear-gradient(90deg, #5b21b6, #7c3aed, #a78bfa)";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">{emoji}</span>
          <span className="text-xs font-mono text-gray-300 truncate">{text}</span>
        </div>
        <div className="flex-shrink-0 ml-3">
          <span className="text-sm font-display font-bold" style={{ color }}>
            {done}
          </span>
          <span className="text-xs font-mono text-gray-600">/{total}</span>
        </div>
      </div>

      <div className="w-full h-3 bg-[#0d0d18] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: barGradient }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.4, ease: [0.34, 1.1, 0.64, 1] }}
        />
      </div>

      <div className="flex justify-between text-[10px] font-mono mt-1.5">
        <span className="text-gray-600 uppercase tracking-widest">Progreso hoy</span>
        <span style={{ color }}>{pct}%</span>
      </div>
    </motion.div>
  );
}

// Anillo SVG de progreso diario
function DailyRing({ pct, done, total }: { pct: number; done: number; total: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const allDone = done > 0 && done === total;

  return (
    <div className="relative flex items-center justify-center w-24 h-24 flex-shrink-0">
      <svg width="96" height="96" className="-rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#1a1a2e" strokeWidth="7" />
        <motion.circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={allDone ? "#10b981" : pct > 60 ? "#7c3aed" : pct > 30 ? "#06b6d4" : "#3d3d5c"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: [0.34, 1.1, 0.64, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-display font-bold ${allDone ? "text-green-400" : "text-white"}`}>
          {allDone ? "✓" : `${pct}%`}
        </span>
        <span className="text-[10px] text-gray-500 font-mono">{done}/{total}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeEvent, setActiveEvent] = useState<SeasonalEvent | null>(null);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const { scheduleStreakDanger } = useNotifications();

  const fetchAll = useCallback(async () => {
    try {
      const [char, hab, session, activeQuests] = await Promise.all([
        api.character.get(),
        api.habits.list(),
        api.focus.active(),
        api.quests.list(false),
      ]);

      const c = char as Character;
      const storedLevel = parseInt(localStorage.getItem(LEVEL_KEY) ?? "0", 10);
      if (storedLevel > 0 && c.level > storedLevel) setLevelUpOpen(true);
      localStorage.setItem(LEVEL_KEY, String(c.level));

      const habitsData = hab as Habit[];
      setCharacter(c);
      setHabits(habitsData);
      setActiveSession(session as FocusSession | null);
      setQuests((activeQuests as Quest[]).slice(0, 3));
      scheduleStreakDanger(habitsData);
    } catch (e: any) {
      if (e.message?.includes("404") || e.message?.includes("not found")) {
        router.replace("/onboarding");
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [router, scheduleStreakDanger]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Daily checkin — solo se llama si no se hizo hoy (evita side-effects repetidos)
  useEffect(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem(CHECKIN_KEY) === today) return;
    api.auth.dailyCheckin().then((data: any) => {
      if (!data.already_claimed) {
        localStorage.setItem(CHECKIN_KEY, today);
        setCheckin(data as DailyCheckin);
        setCheckinOpen(true);
      }
    }).catch(() => {});
  }, []);

  // Leaderboard lazy — no bloquea la carga inicial
  useEffect(() => {
    api.leaderboard.weekly().then((data: any) => setLeaderboard(data as LeaderboardEntry[])).catch(() => {});
  }, []);

  // Evento semanal activo
  useEffect(() => {
    api.events.active().then((data: any) => setActiveEvent(data as SeasonalEvent)).catch(() => {});
  }, []);

  // Árbol de clases: muestra modal si nivel >= 10 y clase no bloqueada
  useEffect(() => {
    if (character && character.level >= 10 && !character.class_locked) {
      const dismissed = localStorage.getItem(`axis_class_dismissed_lv${character.level}`);
      if (!dismissed) setClassModalOpen(true);
    }
  }, [character?.level, character?.class_locked]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-8 h-8 rounded-full border-2 border-accent-purple border-t-transparent animate-spin" />
          <span className="text-gray-500 font-mono text-xs">Iniciando Axis...</span>
        </motion.div>
      </div>
    );
  }

  const todayHabits = habits.filter(h => !h.completed_today);
  const doneHabits  = habits.filter(h => h.completed_today);
  const completionRate = habits.length > 0 ? Math.round((doneHabits.length / habits.length) * 100) : 0;
  const allDone = habits.length > 0 && todayHabits.length === 0;

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              {getGreeting()},{" "}
              <span className="gradient-text">{character?.name}</span>
            </h1>
            <p className="text-gray-500 text-sm mt-0.5 capitalize">
              {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <NotificationBell />
        </motion.div>

        {/* ── Banner móvil: ring + personaje ────────────────────── */}
        {character && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex lg:hidden items-center gap-4 bg-bg-card border border-[#2d2d4a] rounded-2xl p-4 relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 0% 50%, #7c3aed, transparent 70%)" }} />
            <CharacterSprite characterClass={character.character_class} level={character.level} size={52} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-display font-bold text-white text-sm truncate">{character.name}</span>
                <span className="text-[10px] font-mono text-accent-purple_light bg-accent-purple/10 px-1.5 py-0.5 rounded-md flex-shrink-0">
                  Lv.{character.level}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono mb-2">{character.character_class}</p>
              <div className="w-full h-1.5 bg-[#0d0d18] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
            <DailyRing pct={completionRate} done={doneHabits.length} total={habits.length} />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Columna izquierda desktop ──────────────────────── */}
          <div className="hidden lg:flex flex-col gap-4 lg:col-span-1">
            {character && (
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-5 flex flex-col items-center gap-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-8 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 50% 0%, #7c3aed40, transparent 70%)" }} />
                <div className="float">
                  <CharacterSprite characterClass={character.character_class} level={character.level} size={140} />
                </div>
                <div className="text-center">
                  <div className="text-white font-display font-bold text-lg">{character.name}</div>
                  <div className="text-accent-purple_light text-xs font-mono mt-0.5">
                    {character.character_class} · Lv.{character.level}
                  </div>
                </div>
              </motion.div>
            )}

            {character && (
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
                <CharacterCard character={character} />
              </motion.div>
            )}

            {/* Anillo de progreso diario desktop */}
            {habits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-4 flex items-center gap-4"
              >
                <DailyRing pct={completionRate} done={doneHabits.length} total={habits.length} />
                <div className="flex-1">
                  <div className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Progreso hoy</div>
                  {allDone ? (
                    <p className="text-green-400 text-sm font-semibold">¡Todo completado! 🎉</p>
                  ) : (
                    <p className="text-gray-300 text-sm">
                      <span className="text-white font-bold">{todayHabits.length}</span> hábitos restantes
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Leaderboard semanal — desktop sidebar */}
            {leaderboard.length > 0 && (
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <LeaderboardCard entries={leaderboard} />
              </motion.div>
            )}
          </div>

          {/* ── Columna principal ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Barra de progreso diario — gancho de retención principal */}
            {habits.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
                <DailyProgressBar done={doneHabits.length} total={habits.length} />
              </motion.div>
            )}

            {/* Evento semanal */}
            {activeEvent && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
                <EventBanner event={activeEvent} onClaimed={fetchAll} />
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <FocusTimer activeSession={activeSession} onUpdate={fetchAll} />
            </motion.div>

            {/* Hábitos pendientes */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                  Hábitos Pendientes
                  {todayHabits.length > 0 && (
                    <span className="ml-2 text-accent-purple_light">{todayHabits.length}</span>
                  )}
                </h2>
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-1 text-xs text-accent-purple_light hover:text-white transition-colors font-mono"
                >
                  <Plus size={13} /> Nuevo
                </button>
              </div>
              <AnimatePresence mode="popLayout">
                <div className="space-y-2">
                  {todayHabits.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      {habits.length === 0 ? (
                        <div className="space-y-2">
                          <p className="text-gray-500 text-sm">Sin hábitos todavía</p>
                          <button
                            onClick={() => setModalOpen(true)}
                            className="text-xs text-accent-purple_light hover:text-white transition-colors font-mono flex items-center gap-1 mx-auto"
                          >
                            <Sparkles size={12} /> Crear mi primer hábito
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-2xl">🎉</div>
                          <p className="text-green-400 font-semibold text-sm">¡Todo completado por hoy!</p>
                          <p className="text-gray-600 text-xs">Vuelve mañana para continuar tu racha</p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    todayHabits.map(h => <HabitCard key={h.id} habit={h} onUpdate={fetchAll} shields={character?.streak_shields ?? 0} />)
                  )}
                </div>
              </AnimatePresence>
            </motion.div>

            {/* Misiones activas */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">Misiones Activas</h2>
                <Link href="/quests" className="flex items-center gap-1 text-xs text-accent-purple_light hover:text-white transition-colors font-mono">
                  <ScrollText size={12} /> Ver todas
                </Link>
              </div>
              {quests.length > 0 ? (
                <div className="space-y-2">
                  {quests.map(q => <QuestCard key={q.id} quest={q} onUpdate={fetchAll} />)}
                </div>
              ) : (
                <Link href="/quests" className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-[#2d2d4a] hover:border-accent-purple/40 transition-colors group">
                  <span className="text-xl">🗺️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-xs group-hover:text-gray-300 transition-colors">Sin misiones activas</p>
                    <p className="text-accent-purple_light text-xs font-mono mt-0.5">Generar desde metas →</p>
                  </div>
                </Link>
              )}
            </motion.div>

            {/* Hábitos completados */}
            {doneHabits.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <h2 className="text-xs font-mono text-gray-600 uppercase tracking-widest mb-2">
                  Completados · {doneHabits.length}
                </h2>
                <div className="space-y-1.5">
                  {doneHabits.map(h => <HabitCard key={h.id} habit={h} onUpdate={fetchAll} />)}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <CreateHabitModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={fetchAll} />

      {character && (
        <LevelUpModal
          open={levelUpOpen}
          level={character.level}
          characterClass={character.character_class}
          characterName={character.name}
          onDismiss={() => setLevelUpOpen(false)}
        />
      )}

      {checkin && (
        <LoginBonusModal
          open={checkinOpen}
          checkin={checkin}
          onDismiss={() => setCheckinOpen(false)}
        />
      )}

      {character && (
        <ClassSelectionModal
          open={classModalOpen}
          character={character}
          onChosen={(updated) => {
            setCharacter(updated);
            setClassModalOpen(false);
          }}
          onDismiss={() => {
            localStorage.setItem(`axis_class_dismissed_lv${character.level}`, "1");
            setClassModalOpen(false);
          }}
        />
      )}
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}
