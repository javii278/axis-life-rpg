"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Flame, Trash2 } from "lucide-react";
import { Habit, STAT_META } from "@/lib/types";
import { api } from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

interface Props {
  habit: Habit;
  onUpdate: () => void;
}

export function HabitCard({ habit, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const meta = STAT_META[habit.stat_target];
  const today = new Date().toISOString().split("T")[0];
  const { showAchievement, showToast } = useToast();

  async function toggleComplete() {
    setLoading(true);
    try {
      if (habit.completed_today) {
        await api.habits.undoComplete(habit.id, today);
      } else {
        const result = await api.habits.complete(habit.id, { log_date: today }) as any;
        showToast({ type: "success", title: `+${result.xp_gained} XP`, message: result.streak > 1 ? `🔥 Racha: ${result.streak} días` : undefined, icon: "✅", duration: 2500 });
        result.new_achievements?.forEach((a: { name: string; icon: string; rarity: string }) => showAchievement(a));
      }
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function deleteHabit() {
    if (!confirm(`¿Eliminar "${habit.name}"?`)) return;
    await api.habits.delete(habit.id);
    onUpdate();
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`
        flex items-center gap-4 p-4 rounded-xl border transition-colors group
        ${habit.completed_today
          ? "bg-bg-card border-[#2d2d4a] opacity-70"
          : "bg-bg-card border-[#2d2d4a] hover:border-[#4a4a6a]"
        }
      `}
    >
      {/* Checkbox */}
      <button
        onClick={toggleComplete}
        disabled={loading}
        className="flex-shrink-0 transition-transform hover:scale-110 disabled:opacity-50"
      >
        {habit.completed_today ? (
          <CheckCircle2 size={24} style={{ color: meta.color }} />
        ) : (
          <Circle size={24} className="text-gray-600 hover:text-gray-400" />
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${habit.completed_today ? "line-through text-gray-500" : "text-white"}`}
          >
            {habit.name}
          </span>
          <span
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
          >
            {habit.stat_target}
          </span>
        </div>
        {habit.description && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{habit.description}</p>
        )}
      </div>

      {/* Streak */}
      {habit.streak > 0 && (
        <div className="flex items-center gap-1 text-accent-gold">
          <Flame size={14} />
          <span className="text-xs font-mono font-bold">{habit.streak}</span>
        </div>
      )}

      {/* XP badge */}
      <span className="text-xs font-mono text-gray-500">+{habit.xp_reward}xp</span>

      {/* Delete */}
      <button
        onClick={deleteHabit}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}
