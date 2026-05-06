"use client";
import { motion } from "framer-motion";
import { STAT_META, StatType } from "@/lib/types";

interface Props {
  stat: StatType;
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatBar({ stat, value, showLabel = true, size = "md" }: Props) {
  const meta = STAT_META[stat];
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-mono font-semibold" style={{ color: meta.color }}>
            {stat}
          </span>
          <span className="text-xs text-gray-400 font-mono">{clampedValue.toFixed(0)}</span>
        </div>
      )}
      <div className={`w-full ${height} bg-bg-card rounded-full overflow-hidden`}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: meta.color }}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
