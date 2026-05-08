"use client";
import { motion } from "framer-motion";
import { LeaderboardEntry } from "@/lib/types";
import { CLASS_META } from "@/lib/types";

interface Props {
  entries: LeaderboardEntry[];
}

const MEDAL = ["🥇", "🥈", "🥉"];

function RankRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const classMeta = CLASS_META[entry.character_class as keyof typeof CLASS_META];
  const medal = entry.rank <= 3 ? MEDAL[entry.rank - 1] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`
        flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors
        ${entry.is_me
          ? "bg-accent-purple/15 border border-accent-purple/30"
          : "hover:bg-white/[0.03]"}
      `}
    >
      <span className="w-5 text-center text-xs font-mono text-gray-500 flex-shrink-0">
        {medal ?? `#${entry.rank}`}
      </span>
      <span className="text-sm flex-shrink-0">{classMeta?.emoji ?? "✨"}</span>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium truncate block ${entry.is_me ? "text-accent-purple_light" : "text-gray-300"}`}>
          {entry.name}{entry.is_me && <span className="text-[10px] font-mono text-gray-500 ml-1">(tú)</span>}
        </span>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-xs font-mono text-gray-400">{entry.weekly_xp}</span>
        <span className="text-[10px] font-mono text-gray-600"> XP</span>
      </div>
    </motion.div>
  );
}

export function LeaderboardCard({ entries }: Props) {
  if (entries.length === 0) return null;

  const myEntry = entries.find(e => e.is_me);
  const top5 = entries.slice(0, 5);
  // Include user's row if not in top 5
  const showUserSeparate = myEntry && myEntry.rank > 5;
  const displayRows = showUserSeparate
    ? [...top5, { ...myEntry, _separator: true } as any]
    : top5;

  return (
    <div className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🏆</span>
          <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Ranking semanal</span>
        </div>
        {myEntry && (
          <span className="text-[10px] font-mono bg-accent-purple/10 text-accent-purple_light px-2 py-0.5 rounded-full">
            #{myEntry.rank} de {entries.length}
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        {displayRows.map((entry: any, i: number) => (
          <div key={`${entry.rank}-${entry.is_me}`}>
            {entry._separator && (
              <div className="flex items-center gap-2 my-1 px-3">
                <div className="flex-1 h-px bg-[#2d2d4a]" />
                <span className="text-[9px] font-mono text-gray-700">·  ·  ·</span>
                <div className="flex-1 h-px bg-[#2d2d4a]" />
              </div>
            )}
            <RankRow entry={entry} index={i} />
          </div>
        ))}
      </div>

      <p className="text-[10px] font-mono text-gray-700 text-center mt-3">
        Se reinicia cada lunes · {entries.length} jugadores esta semana
      </p>
    </div>
  );
}
