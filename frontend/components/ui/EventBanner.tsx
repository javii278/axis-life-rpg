"use client";
import { motion } from "framer-motion";
import { SeasonalEvent } from "@/lib/types";
import { api } from "@/lib/api";
import { useState } from "react";
import { useToast } from "./ToastProvider";

const CLAIM_KEY_PREFIX = "axis_event_claimed_";

interface Props {
  event: SeasonalEvent;
  onClaimed?: () => void;
}

export function EventBanner({ event, onClaimed }: Props) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(`${CLAIM_KEY_PREFIX}${event.iso_week}`) === "1"
      : false
  );
  const { showToast } = useToast();

  const pct = Math.min((event.current_progress / event.target_count) * 100, 100);
  const canClaim = event.completed && !claimed;

  async function claimReward() {
    if (claiming || claimed) return;
    setClaiming(true);
    try {
      const res = await api.events.claim() as any;
      localStorage.setItem(`${CLAIM_KEY_PREFIX}${event.iso_week}`, "1");
      setClaimed(true);
      showToast({
        type: "success",
        title: `+${res.xp_gained} XP`,
        message: `Evento "${res.event_name}" completado`,
        icon: event.emoji,
        duration: 3500,
      });
      onClaimed?.();
    } catch {
      showToast({ type: "success", title: "Error al reclamar", duration: 2000 });
    } finally {
      setClaiming(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-4 relative overflow-hidden"
      style={{ borderColor: `${event.color}40`, backgroundColor: `${event.color}08` }}
    >
      {/* Glow fondo */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, ${event.color}, transparent 65%)` }}
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{event.emoji}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: event.color }}>
                Evento semanal
              </span>
              {event.days_remaining <= 1 && !event.completed && (
                <span className="text-[9px] font-mono text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded">
                  ¡Último día!
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-white text-sm leading-tight">{event.name}</h3>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-display font-bold" style={{ color: event.color }}>
            +{event.xp_bonus}
          </div>
          <div className="text-[9px] font-mono text-gray-600">XP recompensa</div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-2.5">{event.description}</p>

      {/* Barra de progreso */}
      <div className="w-full h-2 bg-[#0d0d18] rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ background: event.completed ? "#10b981" : event.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-gray-500">
          {event.current_progress}/{event.target_count}
          {!event.completed && ` · ${event.days_remaining}d restantes`}
        </span>

        {canClaim ? (
          <motion.button
            onClick={claimReward}
            disabled={claiming}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="text-[11px] font-mono font-bold px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: `${event.color}25`, color: event.color, border: `1px solid ${event.color}40` }}
          >
            {claiming ? "..." : "Reclamar recompensa →"}
          </motion.button>
        ) : claimed ? (
          <span className="text-[10px] font-mono text-green-500">✓ Recompensa reclamada</span>
        ) : event.completed ? (
          <span className="text-[10px] font-mono text-green-400">✓ Completado</span>
        ) : null}
      </div>
    </motion.div>
  );
}
