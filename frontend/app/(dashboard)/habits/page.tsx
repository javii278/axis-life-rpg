"use client";
import { useEffect, useState, useCallback } from "react";
import { Habit, STAT_META, StatType } from "@/lib/types";
import { api } from "@/lib/api";
import { HabitCard } from "@/components/habits/HabitCard";
import { CreateHabitModal } from "@/components/habits/CreateHabitModal";
import { Plus } from "lucide-react";
import { AdBanner } from "@/components/ui/AdBanner";

const STATS = ["ALL", ...Object.keys(STAT_META)] as const;

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [filter, setFilter] = useState<"ALL" | StatType>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchHabits = useCallback(async () => {
    const data = await api.habits.list();
    setHabits(data as Habit[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const filtered = filter === "ALL" ? habits : habits.filter(h => h.stat_target === filter);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Hábitos</h1>
          <p className="text-gray-500 text-sm mt-1">{habits.length} hábitos activos</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/80
                     text-white text-sm font-display font-semibold transition-colors"
        >
          <Plus size={16} /> Nuevo hábito
        </button>
      </div>

      {/* Filtros por stat */}
      <div className="flex gap-2 flex-wrap">
        {STATS.map(s => {
          const active = filter === s;
          const meta = s !== "ALL" ? STAT_META[s as StatType] : null;
          return (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all ${
                active ? "border-current" : "border-[#2d2d4a] text-gray-500 hover:border-[#4a4a6a]"
              }`}
              style={active && meta ? { color: meta.color, borderColor: meta.color, backgroundColor: `${meta.color}15` } : {}}
            >
              {s === "ALL" ? "Todos" : s}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-gray-600 text-sm font-mono animate-pulse">Cargando...</div>
      ) : filtered.length === 0 ? (
        filter !== "ALL" ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-sm">No hay hábitos de <span className="text-white font-mono">{filter}</span>.</p>
            <button onClick={() => setModalOpen(true)} className="mt-3 text-accent-purple_light text-sm hover:underline">
              Crear uno
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-3xl">
              ⚔️
            </div>
            <div>
              <p className="text-white font-display font-semibold mb-1">Tu aventura no ha comenzado</p>
              <p className="text-gray-500 text-sm max-w-xs">
                Los hábitos alimentan tus stats. Sin hábitos, tu personaje no evoluciona.
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-purple hover:bg-accent-purple/80
                         text-white text-sm font-display font-semibold transition-colors"
            >
              <Plus size={15} /> Crear mi primer hábito
            </button>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {filtered.map(h => <HabitCard key={h.id} habit={h} onUpdate={fetchHabits} />)}
        </div>
      )}

      {filtered.length >= 3 && (
        <AdBanner
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HABITS ?? ""}
          className="rounded-xl mt-2"
        />
      )}

      <CreateHabitModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={fetchHabits} />
    </div>
  );
}
