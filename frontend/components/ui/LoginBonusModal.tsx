"use client";
import { motion, AnimatePresence } from "framer-motion";
import { DailyCheckin } from "@/lib/types";
import { X } from "lucide-react";

const DAYS: { xp: number; label: string; special?: string }[] = [
  { xp: 20,  label: "Día 1" },
  { xp: 30,  label: "Día 2" },
  { xp: 40,  label: "Día 3" },
  { xp: 50,  label: "Día 4" },
  { xp: 60,  label: "Día 5", special: "⭐" },
  { xp: 70,  label: "Día 6" },
  { xp: 100, label: "Día 7", special: "🛡️" },
];

interface Props {
  open: boolean;
  checkin: DailyCheckin;
  onDismiss: () => void;
}

export function LoginBonusModal({ open, checkin, onDismiss }: Props) {
  const { day_in_cycle, xp_gained, login_streak, shield_granted } = checkin;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onDismiss}
          />

          <motion.div
            className="relative z-10 w-full max-w-sm bg-[#0d0d18] border border-[#2d2d4a] rounded-2xl p-6 shadow-2xl"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="text-center mb-5">
              <motion.div
                className="text-3xl mb-2"
                animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                🎁
              </motion.div>
              <h2 className="font-display font-bold text-white text-lg">Bonus de acceso</h2>
              <p className="text-gray-500 text-xs font-mono mt-0.5">
                Racha de {login_streak} {login_streak === 1 ? "día" : "días"} consecutivos
              </p>
            </div>

            {/* 7-day grid */}
            <div className="grid grid-cols-7 gap-1.5 mb-5">
              {DAYS.map((day, i) => {
                const dayNum = i + 1;
                const isPast = dayNum < day_in_cycle;
                const isToday = dayNum === day_in_cycle;
                const isFuture = dayNum > day_in_cycle;

                return (
                  <motion.div
                    key={dayNum}
                    initial={isToday ? { scale: 0.7 } : {}}
                    animate={isToday ? { scale: 1 } : {}}
                    transition={{ delay: 0.3 + i * 0.05, type: "spring" }}
                    className={`
                      flex flex-col items-center gap-0.5 rounded-xl p-1.5 border text-center
                      ${isPast ? "border-green-800 bg-green-900/20" : ""}
                      ${isToday ? "border-accent-purple bg-accent-purple/15 ring-1 ring-accent-purple/40" : ""}
                      ${isFuture ? "border-[#1e1e30] bg-[#0a0a14] opacity-50" : ""}
                    `}
                  >
                    <span className="text-[8px] font-mono text-gray-500">{day.label}</span>
                    <span className="text-base leading-none">{isPast ? "✓" : day.special ?? "⚡"}</span>
                    <span className={`text-[9px] font-mono font-bold ${isToday ? "text-accent-purple_light" : isPast ? "text-green-500" : "text-gray-600"}`}>
                      +{day.xp}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Reward earned */}
            <motion.div
              className="bg-accent-purple/10 border border-accent-purple/20 rounded-xl p-4 text-center mb-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="text-3xl font-display font-bold text-accent-purple_light mb-0.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
              >
                +{xp_gained} XP
              </motion.div>
              {shield_granted && (
                <p className="text-cyan-400 text-xs font-mono mt-1">🛡️ +1 Escudo de racha obtenido</p>
              )}
            </motion.div>

            <button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold text-sm transition-colors"
            >
              ¡A por el día!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
