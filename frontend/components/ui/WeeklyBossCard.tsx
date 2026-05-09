"use client";
import { motion, AnimatePresence } from "framer-motion";
import { WeeklyBoss } from "@/lib/types";
import { api } from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { Sword } from "lucide-react";

interface Props {
  boss: WeeklyBoss;
  onClaimed: () => void;
}

const HP_PHASES = [
  { threshold: 0.75, color: "#ef4444", label: "Furioso" },
  { threshold: 0.50, color: "#f97316", label: "Dañado" },
  { threshold: 0.25, color: "#f59e0b", label: "Crítico" },
  { threshold: 0,    color: "#10b981", label: "Derrotado" },
];

function getBossPhase(hpPct: number) {
  return HP_PHASES.find(p => hpPct > p.threshold) ?? HP_PHASES[HP_PHASES.length - 1];
}

const BOSS_EMOJIS = ["🐉", "👹", "🦹", "💀", "🔱"];
function getBossEmoji(week: string) {
  const hash = week.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return BOSS_EMOJIS[hash % BOSS_EMOJIS.length];
}

export function WeeklyBossCard({ boss, onClaimed }: Props) {
  const [claiming, setClaiming] = useState(false);
  const { showToast } = useToast();
  const hpPct = boss.boss_max_hp > 0 ? boss.boss_hp / boss.boss_max_hp : 0;
  const damagePct = 1 - hpPct;
  const phase = getBossPhase(hpPct);
  const bossEmoji = getBossEmoji(boss.boss_week);

  async function claimReward() {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await api.character.claimBossReward() as any;
      showToast({
        type: "achievement",
        title: `¡Jefe derrotado! +${res.xp_gained} XP`,
        message: res.shield_granted ? "🛡️ +1 Escudo de racha obtenido" : undefined,
        duration: 5000,
      });
      onClaimed();
    } catch (e: any) {
      showToast({ type: "warning", title: "Error", message: e.message, duration: 2500 });
    } finally {
      setClaiming(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-4 relative overflow-hidden"
    >
      {/* Fondo animado */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${phase.color}, transparent 70%)` }}
      />

      <div className="flex items-center gap-2 mb-3">
        <Sword size={13} className="text-gray-500" />
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Jefe Semanal</span>
        <span className="ml-auto text-[10px] font-mono text-gray-600">
          {boss.days_left === 0 ? "Último día" : `${boss.days_left}d restantes`}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {/* Boss emoji con animación shake cuando está furioso */}
        <motion.div
          className="text-3xl flex-shrink-0"
          animate={boss.defeated ? { rotate: [0, -10, 10, 0], scale: [1, 0.8, 0.8, 0.8] } : hpPct > 0.75 ? {} : { x: [0, -1, 1, -1, 1, 0] }}
          transition={boss.defeated ? { duration: 0.5 } : { repeat: Infinity, duration: 3, repeatDelay: 2 }}
        >
          {boss.defeated ? "💀" : bossEmoji}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${boss.defeated ? "text-green-400" : "text-white"}`}>
              {boss.defeated ? "¡Derrotado!" : phase.label}
            </span>
            <span className="text-[10px] font-mono" style={{ color: phase.color }}>
              {boss.boss_hp}/{boss.boss_max_hp} HP
            </span>
          </div>

          {/* HP Bar */}
          <div className="w-full h-2.5 bg-[#0d0d18] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: boss.defeated ? "#10b981" : phase.color }}
              animate={{ width: `${hpPct * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          {/* Progreso de daño */}
          <div className="flex justify-between text-[9px] font-mono mt-1">
            <span className="text-gray-600">
              {Math.round(damagePct * 100)}% daño infligido
            </span>
            <span className="text-gray-600">
              Completa hábitos para atacar
            </span>
          </div>
        </div>
      </div>

      {/* Claim button */}
      <AnimatePresence>
        {boss.defeated && !boss.boss_reward_claimed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={claimReward}
            disabled={claiming}
            className="w-full py-2 rounded-xl text-xs font-semibold font-mono transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #059669, #10b981)", color: "white" }}
          >
            {claiming ? "Reclamando..." : "⚔️ Reclamar recompensa · +200 XP + 🛡️"}
          </motion.button>
        )}
        {boss.boss_reward_claimed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-[10px] font-mono text-green-600 py-1"
          >
            ✓ Recompensa reclamada esta semana
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
