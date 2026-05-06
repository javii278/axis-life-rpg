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

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-400 font-mono mb-1">
        <span>XP</span>
        <span>{xpInLevel} / {xpNeeded}</span>
      </div>
      <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-purple_light"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
