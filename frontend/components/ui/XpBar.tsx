"use client";
import { motion } from "framer-motion";

interface Props {
  currentXp: number;
  xpToNext: number;
  level: number;
}

export function XpBar({ currentXp, xpToNext, level }: Props) {
  const xpForCurrent = 100 * (level * level);
  const xpInLevel = currentXp - xpForCurrent;
  const xpNeeded = xpToNext - xpForCurrent;
  const pct = Math.min((xpInLevel / xpNeeded) * 100, 100);
  const nearLevelUp = pct >= 80;

  return (
    <div className="w-full">
      <div className="flex justify-between text-[11px] text-gray-500 font-mono mb-1.5">
        <span className="text-accent-purple_light font-semibold">XP</span>
        <span>
          <span className="text-gray-300 font-semibold">{xpInLevel.toLocaleString()}</span>
          <span className="text-gray-600"> / {xpNeeded.toLocaleString()}</span>
        </span>
      </div>
      <div className="w-full h-2.5 bg-[#0d0d18] rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          style={{
            background: nearLevelUp
              ? "linear-gradient(90deg, #7c3aed, #f59e0b)"
              : "linear-gradient(90deg, #5b21b6, #7c3aed, #a78bfa)",
            boxShadow: nearLevelUp
              ? "0 0 12px rgba(245,158,11,0.6)"
              : "0 0 6px rgba(124,58,237,0.4)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.34, 1.1, 0.64, 1] }}
        >
          <div className="absolute inset-0 shimmer-bar"
            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)" }}
          />
        </motion.div>

        {/* Tick marks cada 25% */}
        {[25, 50, 75].map(p => (
          <div
            key={p}
            className="absolute top-0 bottom-0 w-px bg-[#0d0d18] opacity-60"
            style={{ left: `${p}%` }}
          />
        ))}
      </div>

      {nearLevelUp && (
        <motion.p
          className="text-[10px] text-accent-gold font-mono mt-1 text-right"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          ¡Casi nivel {level + 1}!
        </motion.p>
      )}
    </div>
  );
}
