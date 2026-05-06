"use client";
import { useEffect, useState } from "react";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { useToast } from "@/components/ui/ToastProvider";

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

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const { showToast } = useToast();

  useEffect(() => {
    fetch(`${API}/api/achievements/`)
      .then((r) => r.json())
      .then(setAchievements)
      .finally(() => setLoading(false));
  }, []);

  const handleCheck = async () => {
    const res = await fetch(`${API}/api/achievements/check`, { method: "POST" });
    const data = await res.json();
    if (data.newly_unlocked?.length > 0) {
      data.newly_unlocked.forEach((a: { name: string; icon: string; rarity: string }) => {
        showToast({ type: "achievement", title: "¡Logro Desbloqueado!", message: a.name, icon: a.icon, rarity: a.rarity, duration: 6000 });
      });
      // Recargar lista
      fetch(`${API}/api/achievements/`).then((r) => r.json()).then(setAchievements);
    } else {
      showToast({ type: "info", title: "Sin logros nuevos", icon: "🔍" });
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
    <div className="min-h-screen bg-bg-primary p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-white">Logros</h1>
        <p className="text-white/40 mt-1">Hitos desbloqueados en tu viaje</p>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="bg-bg-card rounded-xl px-5 py-3 border border-white/10 flex gap-2 items-center">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xs text-white/40">Desbloqueados</p>
            <p className="text-xl font-bold text-white">{unlockedCount} / {achievements.length}</p>
          </div>
        </div>
        <div className="bg-bg-card rounded-xl px-5 py-3 border border-white/10 flex gap-2 items-center">
          <span className="text-2xl">✨</span>
          <div>
            <p className="text-xs text-white/40">XP de logros</p>
            <p className="text-xl font-bold text-accent-gold">+{totalXp}</p>
          </div>
        </div>
        <div className="ml-auto">
          <button
            onClick={handleCheck}
            className="bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm"
          >
            Comprobar logros
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "unlocked", "locked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-accent-purple text-white"
                : "bg-bg-card text-white/50 hover:text-white"
            }`}
          >
            {f === "all" ? "Todos" : f === "unlocked" ? "Desbloqueados" : "Bloqueados"}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-white/30 text-center py-20">Cargando logros...</div>
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
