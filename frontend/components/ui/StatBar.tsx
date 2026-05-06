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
  const isHigh = clampedValue >= 70;
  const isMid  = clampedValue >= 40;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-mono font-bold" style={{ color: meta.color }}>
            {stat}
          </span>
          <motion.span
            className="text-xs text-gray-300 font-mono font-semibold tabular-nums"
            key={clampedValue}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {clampedValue.toFixed(0)}
          </motion.span>
        </div>
      )}
      <div className={`w-full ${height} bg-[#0d0d18] rounded-full overflow-hidden relative`}>
        <motion.div
          className="h-full rounded-full relative"
          style={{
            background: `linear-gradient(90deg, ${meta.color}99, ${meta.color})`,
            boxShadow: isHigh ? `0 0 8px ${meta.color}80` : isMid ? `0 0 4px ${meta.color}40` : "none",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 1, ease: [0.34, 1.1, 0.64, 1] }}
        >
          {/* Shimmer */}
          {isHigh && (
            <div
              className="absolute inset-0 rounded-full shimmer-bar"
              style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)" }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
