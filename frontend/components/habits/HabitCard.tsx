"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Flame, Trash2, Zap, Shield } from "lucide-react";
import { Habit, STAT_META, ChestReward } from "@/lib/types";
import { api } from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { ChestModal } from "@/components/ui/ChestModal";

interface Props {
  habit: Habit;
  onUpdate: () => void;
  shields?: number;
  onPerfectDay?: (xpBonus: number) => void;
}

export function HabitCard({ habit, onUpdate, shields = 0, onPerfectDay }: Props) {
  const [loading, setLoading] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);
  const [shieldLoading, setShieldLoading] = useState(false);
  const [chestReward, setChestReward] = useState<ChestReward | null>(null);
  const [chestStreak, setChestStreak] = useState(0);
  const meta = STAT_META[habit.stat_target];
  const today = new Date().toISOString().split("T")[0];
  const { showAchievement, showToast } = useToast();

  const showShield = !habit.completed_today && habit.streak >= 3 && shields > 0;

  async function useShield(e: React.MouseEvent) {
    e.stopPropagation();
    if (shieldLoading) return;
    setShieldLoading(true);
    try {
      const result = await api.habits.useShield(habit.id) as any;
      setOptimisticDone(true);
      showToast({
        type: "success",
        title: `🛡️ Escudo usado`,
        message: `Racha de ${result.streak} días protegida · ${result.shields_remaining} escudos restantes`,
        duration: 3000,
      });
      onUpdate();
    } catch (e: any) {
      showToast({ type: "success", title: "Sin escudos disponibles", message: e.message, duration: 2000 });
    } finally {
      setShieldLoading(false);
    }
  }

  // Derived: optimistic state overrides the prop until re-render syncs
  const done = optimisticDone ?? habit.completed_today;

  async function toggleComplete() {
    if (loading) return;
    setLoading(true);

    if (!habit.completed_today) {
      setOptimisticDone(true);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
      if ('vibrate' in navigator) navigator.vibrate([40, 30, 80]);
    } else {
      setOptimisticDone(false);
      if ('vibrate' in navigator) navigator.vibrate(20);
    }
    window.dispatchEvent(new CustomEvent('axis:refresh'));

    try {
      if (habit.completed_today) {
        await api.habits.undoComplete(habit.id, today);
      } else {
        const result = await api.habits.complete(habit.id, { log_date: today }) as any;
        const comboLabel = result.combo_count >= 2 ? ` · x${result.combo_multiplier} COMBO` : "";
        const streakLabel = result.streak > 1 ? `🔥 Racha de ${result.streak} días${comboLabel}` : comboLabel ? comboLabel.slice(3) : undefined;
        showToast({
          type: "success",
          title: `+${result.xp_gained} XP${result.combo_count >= 1 ? ` (x${result.combo_multiplier})` : ""}`,
          message: streakLabel,
          icon: result.combo_count >= 2 ? "⚡" : "✅",
          duration: 2500,
        });
        result.new_achievements?.forEach((a: { name: string; icon: string; rarity: string }) =>
          showAchievement(a)
        );
        if (result.chest_reward) {
          setChestStreak(result.streak);
          setChestReward(result.chest_reward);
        }
        if (result.perfect_day && onPerfectDay) {
          onPerfectDay(result.perfect_day_xp ?? 50);
        }
      }
      onUpdate();
    } catch (e) {
      setOptimisticDone(null);  // revert on error
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      whileTap={{ scale: 0.985 }}
      className={`
        relative flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 group overflow-hidden
        ${done
          ? "border-opacity-30 opacity-60"
          : "hover:shadow-lg cursor-pointer"
        }
      `}
      style={{
        backgroundColor: done ? `${meta.color}08` : "#14141f",
        borderColor: done ? `${meta.color}30` : justCompleted ? meta.color : "#2d2d4a",
        boxShadow: justCompleted ? `0 0 20px ${meta.color}50` : done ? "none" : undefined,
      }}
      onClick={!done ? toggleComplete : undefined}
    >
      {/* Flash de completado */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ backgroundColor: meta.color }}
            initial={{ opacity: 0.25 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Hover glow lateral */}
      {!done && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ backgroundColor: meta.color }}
        />
      )}

      {/* Checkbox */}
      <motion.button
        onClick={(e) => { e.stopPropagation(); toggleComplete(); }}
        disabled={loading}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        className="flex-shrink-0 disabled:opacity-50"
      >
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <CheckCircle2 size={22} style={{ color: meta.color }} />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ scale: 1 }} animate={{ scale: 1 }}>
              <Circle size={22} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium leading-tight ${done ? "line-through text-gray-500" : "text-white"}`}>
            {habit.name}
          </span>
          <span
            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
            style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
          >
            {habit.stat_target}
          </span>
        </div>
        {habit.description && (
          <p className="text-[11px] text-gray-500 truncate mt-0.5">{habit.description}</p>
        )}
      </div>

      {/* Streak */}
      <AnimatePresence>
        {habit.streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-0.5 flex-shrink-0"
          >
            <motion.div
              animate={habit.streak >= 7 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Flame
                size={13}
                className={habit.streak >= 7 ? "text-orange-400" : "text-accent-gold"}
                fill={habit.streak >= 14 ? "currentColor" : "none"}
              />
            </motion.div>
            <span className={`text-xs font-mono font-bold ${habit.streak >= 7 ? "text-orange-400" : "text-accent-gold"}`}>
              {habit.streak}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Zap size={10} className="text-gray-600" />
        <span className="text-[11px] font-mono text-gray-600">{habit.xp_reward}</span>
      </div>

      {/* Shield button — visible when streak >= 3 and shields available */}
      {showShield && (
        <motion.button
          onClick={useShield}
          disabled={shieldLoading}
          title={`Usar escudo de racha (${shields} disponibles)`}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
        >
          <Shield size={13} className="text-cyan-400" />
        </motion.button>
      )}

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); deleteHabit(); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 flex-shrink-0 p-1"
      >
        <Trash2 size={13} />
      </button>

      <ChestModal
        reward={chestReward}
        streak={chestStreak}
        onDismiss={() => { setChestReward(null); onUpdate(); }}
      />
    </motion.div>
  );
}
