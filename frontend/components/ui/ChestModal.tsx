"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ChestReward } from "@/lib/types";

interface Props {
  reward: ChestReward | null;
  streak: number;
  onDismiss: () => void;
}

const CONFIG = {
  xp:     { bg: "from-yellow-900/60 to-amber-900/40", border: "#f59e0b", glow: "rgba(245,158,11,0.5)", title: "¡Tesoro encontrado!", icon: "⚡" },
  shield: { bg: "from-cyan-900/60 to-blue-900/40",   border: "#06b6d4", glow: "rgba(6,182,212,0.5)",  title: "¡Escudo obtenido!", icon: "🛡️" },
  both:   { bg: "from-purple-900/60 to-pink-900/40", border: "#a78bfa", glow: "rgba(167,139,250,0.5)",title: "¡Recompensa doble!",  icon: "💎" },
};

export function ChestModal({ reward, streak, onDismiss }: Props) {
  if (!reward) return null;
  const cfg = CONFIG[reward.type];

  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          <motion.div
            className={`relative z-10 w-full max-w-xs rounded-2xl border p-6 text-center bg-gradient-to-b ${cfg.bg}`}
            style={{ borderColor: cfg.border, boxShadow: `0 0 40px ${cfg.glow}` }}
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Partículas */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: cfg.border, left: "50%", top: "40%" }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * 90,
                  y: Math.sin((i / 8) * Math.PI * 2) * 90,
                  opacity: 0,
                }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.05 }}
              />
            ))}

            {/* Cofre */}
            <motion.div
              className="text-5xl mb-3"
              animate={{ rotateY: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              🎁
            </motion.div>

            <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: cfg.border }}>
              Racha de {streak} días
            </p>
            <h2 className="font-display font-bold text-white text-lg mb-4">{cfg.title}</h2>

            {/* Recompensa */}
            <motion.div
              className="rounded-xl py-4 px-6 mb-5 space-y-2"
              style={{ backgroundColor: `${cfg.border}18`, border: `1px solid ${cfg.border}30` }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {(reward.type === "xp" || reward.type === "both") && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">⚡</span>
                  <span className="font-display font-bold text-2xl text-accent-gold">+{reward.amount} XP</span>
                </div>
              )}
              {(reward.type === "shield" || reward.type === "both") && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">🛡️</span>
                  <span className="font-display font-bold text-xl text-cyan-300">+1 Escudo de racha</span>
                </div>
              )}
            </motion.div>

            <button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-colors"
              style={{ backgroundColor: cfg.border }}
            >
              ¡Reclamar!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
