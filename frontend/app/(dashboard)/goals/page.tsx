"use client";
import { useEffect, useState, useCallback } from "react";
import { Goal } from "@/lib/types";
import { api } from "@/lib/api";
import { GoalTree } from "@/components/goals/GoalTree";
import { CreateGoalModal } from "@/components/goals/CreateGoalModal";
import { Plus } from "lucide-react";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchGoals = useCallback(async () => {
    const data = await api.goals.list();
    setGoals(data as Goal[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const totalGoals = countGoals(goals);
  const completedGoals = countGoals(goals, true);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Árbol de Metas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {completedGoals} / {totalGoals} completadas
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/80
                     text-white text-sm font-display font-semibold transition-colors"
        >
          <Plus size={16} /> Nueva meta
        </button>
      </div>

      {/* Leyenda de niveles */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Vida", color: "#7c3aed" },
          { label: "Trimestral", color: "#06b6d4" },
          { label: "Semanal", color: "#10b981" },
          { label: "Diaria", color: "#f59e0b" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-600 font-mono text-sm animate-pulse">Cargando...</div>
      ) : (
        <GoalTree goals={goals} onUpdate={fetchGoals} />
      )}

      <CreateGoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchGoals}
        defaultLevel={0}
      />
    </div>
  );
}

function countGoals(goals: Goal[], onlyCompleted = false): number {
  let count = 0;
  function walk(list: Goal[]) {
    for (const g of list) {
      if (!onlyCompleted || g.is_completed) count++;
      if (g.children.length > 0) walk(g.children);
    }
  }
  walk(goals);
  return count;
}
