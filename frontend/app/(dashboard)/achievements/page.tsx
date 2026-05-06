"use client";
import { useEffect, useState, useCallback } from "react";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { useToast } from "@/components/ui/ToastProvider";
import { api } from "@/lib/api";

interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: "bronze" | "silver" | "gold";
  xp_bonus: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const { showToast, showAchievement } = useToast();

  const loadAchievements = useCallback(async () => {
    try {
      const data = await api.achievements.list() as Achievement[];
      setAchievements(Array.isArray(data) ? data : []);
    } catch {
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAchievements(); }, [loadAchievements]);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const data = await api.achievements.check() as any;
      if (data.newly_unlocked?.length > 0) {
        data.newly_unlocked.forEach((a: { name: string; icon: string; rarity: string }) =>
          showAchievement(a)
        );
        await loadAchievements();
      } else {
        showToast({ type: "info", title: "Sin logros nuevos", icon: "🔍" });
      }
    } catch {
      showToast({ type: "warning", title: "Error al comprobar logros", icon: "⚠️" });
    } finally {
      setChecking(false);
    }
  };

  const filtered = achievements.filter((a) => {
    if (filter === "unlocked") return a.unlocked;
    if (filter === "locked") return !a.unlocked;
    return true;
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalXp = achievements.filter((a) => a.unlocked).reduce((s, a) => s + a.xp_bonus, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Logros</h1>
        <p className="text-gray-500 text-sm mt-1">Hitos desbloqueados en tu viaje</p>
      </div>

      {/* Stats + acción */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="bg-bg-card rounded-xl px-5 py-3 border border-[#2d2d4a] flex gap-3 items-center">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xs text-gray-500 font-mono">Desbloqueados</p>
            <p className="text-xl font-display font-bold text-white">{unlockedCount} / {achievements.length}</p>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl px-5 py-3 border border-[#2d2d4a] flex gap-3 items-center">
          <span className="text-2xl">✨</span>
          <div>
            <p className="text-xs text-gray-500 font-mono">XP de logros</p>
            <p className="text-xl font-display font-bold text-accent-gold">+{totalXp}</p>
          </div>
        </div>
        <button
          onClick={handleCheck}
          disabled={checking}
          className="ml-auto bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
        >
          {checking ? "Comprobando..." : "Comprobar logros"}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(["all", "unlocked", "locked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? "bg-accent-purple text-white" : "bg-bg-card text-gray-500 hover:text-white border border-[#2d2d4a]"
            }`}
          >
            {f === "all" ? "Todos" : f === "unlocked" ? "Desbloqueados" : "Bloqueados"}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-accent-purple border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-mono">Cargando logros...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600 text-sm">
          {filter === "unlocked" ? "Aún no has desbloqueado ningún logro" : "No hay logros en esta categoría"}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((a) => (
            <AchievementBadge
              key={a.key}
              name={a.name}
              description={a.description}
              icon={a.icon}
              rarity={a.rarity}
              unlocked={a.unlocked}
              unlocked_at={a.unlocked_at}
              xp_bonus={a.xp_bonus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
