"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Character, Habit, FocusSession, Quest } from "@/lib/types";
import { api } from "@/lib/api";
import { CharacterCard } from "@/components/character/CharacterCard";
import { CharacterSprite } from "@/components/character/CharacterSprite";
import { LevelUpModal } from "@/components/character/LevelUpModal";
import { HabitCard } from "@/components/habits/HabitCard";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { QuestCard } from "@/components/quests/QuestCard";
import { CreateHabitModal } from "@/components/habits/CreateHabitModal";
import { Plus, ScrollText } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/ui/NotificationBell";

const LEVEL_KEY = "axis_last_level";
const ONBOARDING_KEY = "axis_onboarded";

export default function Dashboard() {
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const prevLevelRef = useRef<number | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [char, hab, session, activeQuests] = await Promise.all([
        api.character.get(),
        api.habits.list(),
        api.focus.active(),
        api.quests.list(false),
      ]);

      const c = char as Character;

      // Detección de level up
      const storedLevel = parseInt(localStorage.getItem(LEVEL_KEY) ?? "0", 10);
      if (storedLevel > 0 && c.level > storedLevel) {
        setLevelUpOpen(true);
      }
      localStorage.setItem(LEVEL_KEY, String(c.level));

      setCharacter(c);
      setHabits(hab as Habit[]);
      setActiveSession(session as FocusSession | null);
      setQuests((activeQuests as Quest[]).slice(0, 3));
    } catch (e: any) {
      if (e.message?.includes("404") || e.message?.includes("not found")) {
        // Sin personaje → onboarding si es la primera vez, o redirect directo
        if (!localStorage.getItem(ONBOARDING_KEY)) {
          router.replace("/onboarding");
        } else {
          router.replace("/onboarding");
        }
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 font-mono text-sm animate-pulse">Iniciando Axis...</div>
      </div>
    );
  }

  const todayHabits = habits.filter(h => !h.completed_today);
  const doneHabits  = habits.filter(h => h.completed_today);
  const completionRate = habits.length > 0
    ? Math.round((doneHabits.length / habits.length) * 100)
    : 0;

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              {getGreeting()}, {character?.name}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <NotificationBell />
        </div>

        {/* ── Barra de personaje compacta (solo móvil) ──────────── */}
        {character && (
          <div className="flex lg:hidden items-center gap-3 bg-bg-card border border-[#2d2d4a] rounded-2xl p-3">
            <CharacterSprite characterClass={character.character_class} level={character.level} size={52} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-white text-sm truncate">{character.name}</span>
                <span className="text-[10px] font-mono text-accent-purple_light flex-shrink-0">Lv.{character.level}</span>
              </div>
              <p className="text-[10px] text-gray-500 font-mono">{character.character_class}</p>
              <div className="w-full h-1.5 bg-bg-secondary rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-purple to-accent-gold rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-mono font-bold text-white flex-shrink-0">{completionRate}%</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: sprite + stats (solo desktop) */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
            {character && (
              <div className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-4 flex flex-col items-center gap-3">
                <CharacterSprite characterClass={character.character_class} level={character.level} size={140} />
                <div className="text-center">
                  <div className="text-white font-display font-bold">{character.name}</div>
                  <div className="text-accent-purple_light text-xs font-mono">{character.character_class} · Lv.{character.level}</div>
                </div>
              </div>
            )}
            {character && <CharacterCard character={character} />}
            <div className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Hoy</span>
                <span className="text-sm font-mono font-bold text-white">{completionRate}%</span>
              </div>
              <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent-purple to-accent-gold rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">{doneHabits.length} de {habits.length} hábitos completados</p>
            </div>
          </div>

          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            <FocusTimer activeSession={activeSession} onUpdate={fetchAll} />

            {/* Hábitos pendientes */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-mono text-gray-400 uppercase tracking-widest">Hábitos Pendientes</h2>
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-1 text-xs text-accent-purple_light hover:text-white transition-colors font-mono"
                >
                  <Plus size={14} /> Nuevo
                </button>
              </div>
              <div className="space-y-2">
                {todayHabits.length === 0 ? (
                  <div className="text-center py-6 text-gray-600 text-sm">
                    {habits.length === 0 ? "Crea tu primer hábito →" : "¡Todo completado por hoy! 🎉"}
                  </div>
                ) : (
                  todayHabits.map(h => <HabitCard key={h.id} habit={h} onUpdate={fetchAll} />)
                )}
              </div>
            </div>

            {/* Misiones activas */}
            {quests.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-mono text-gray-400 uppercase tracking-widest">Misiones Activas</h2>
                  <Link href="/quests" className="flex items-center gap-1 text-xs text-accent-purple_light hover:text-white transition-colors font-mono">
                    <ScrollText size={12} /> Ver todas
                  </Link>
                </div>
                <div className="space-y-2">
                  {quests.map(q => <QuestCard key={q.id} quest={q} onUpdate={fetchAll} />)}
                </div>
              </div>
            )}

            {/* Hábitos completados */}
            {doneHabits.length > 0 && (
              <div>
                <h2 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-3">Completados</h2>
                <div className="space-y-2">
                  {doneHabits.map(h => <HabitCard key={h.id} habit={h} onUpdate={fetchAll} />)}
                </div>
              </div>
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
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}
