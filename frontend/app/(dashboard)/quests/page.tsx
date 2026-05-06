"use client";
import { useEffect, useState, useCallback } from "react";
import { Quest } from "@/lib/types";
import { api } from "@/lib/api";
import { QuestCard } from "@/components/quests/QuestCard";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Wand2 } from "lucide-react";

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [done, setDone] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState("");

  const fetchQuests = useCallback(async () => {
    const [active, completed] = await Promise.all([
      api.quests.list(false),
      api.quests.list(true),
    ]);
    setQuests(active as Quest[]);
    setDone(completed as Quest[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchQuests(); }, [fetchQuests]);

  async function generateFromGoals() {
    setGenerating(true);
    try {
      const res = await api.quests.generateFromGoals() as { created: number; message: string };
      setLastResult(res.message);
      await fetchQuests();
    } finally { setGenerating(false); }
  }

  const mainQuests   = quests.filter(q => q.quest_type === "main");
  const weeklyQuests = quests.filter(q => q.quest_type === "weekly");
  const dailyQuests  = quests.filter(q => q.quest_type === "daily");

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Misiones</h1>
          <p className="text-gray-500 text-sm mt-1">
            {quests.length} activa{quests.length !== 1 ? "s" : ""} · {done.length} completada{done.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={generateFromGoals}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent-purple/40
                     text-accent-purple_light text-sm font-mono hover:bg-accent-purple/10 transition-colors disabled:opacity-50"
        >
          <Wand2 size={14} />
          {generating ? "Generando..." : "Desde metas"}
        </button>
      </div>

      {lastResult && (
        <div className="text-xs font-mono text-accent-green bg-accent-green/10 border border-accent-green/20 rounded-lg px-3 py-2">
          ✓ {lastResult}
        </div>
      )}

      {loading ? (
        <div className="text-gray-600 font-mono text-sm animate-pulse">Cargando...</div>
      ) : quests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-5xl mb-4">⚔️</div>
          <p className="text-gray-500 text-sm mb-2">No hay misiones activas.</p>
          <p className="text-gray-600 text-xs">
            Genera misiones desde tus metas o créalas manualmente.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {mainQuests.length > 0 && (
            <QuestSection title="Misiones Principales" quests={mainQuests} onUpdate={fetchQuests} />
          )}
          {weeklyQuests.length > 0 && (
            <QuestSection title="Misiones Semanales" quests={weeklyQuests} onUpdate={fetchQuests} />
          )}
          {dailyQuests.length > 0 && (
            <QuestSection title="Misiones Diarias" quests={dailyQuests} onUpdate={fetchQuests} />
          )}
        </div>
      )}

      {/* Completadas */}
      {done.length > 0 && (
        <details className="group">
          <summary className="text-xs font-mono text-gray-500 cursor-pointer hover:text-gray-300 uppercase tracking-widest list-none">
            ▸ Completadas ({done.length})
          </summary>
          <div className="mt-3 space-y-2 opacity-50">
            {done.slice(0, 5).map(q => (
              <div key={q.id} className="flex items-center gap-3 px-4 py-2 bg-bg-card border border-[#1e1e2e] rounded-lg">
                <span className="text-accent-green text-xs">✓</span>
                <span className="text-sm text-gray-500 line-through truncate">{q.title}</span>
                <span className="text-xs font-mono text-gray-600 ml-auto">+{q.xp_reward} XP</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function QuestSection({ title, quests, onUpdate }: { title: string; quests: Quest[]; onUpdate: () => void }) {
  return (
    <div>
      <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">{title}</h2>
      <AnimatePresence>
        <div className="space-y-2">
          {quests.map(q => <QuestCard key={q.id} quest={q} onUpdate={onUpdate} />)}
        </div>
      </AnimatePresence>
    </div>
  );
}
