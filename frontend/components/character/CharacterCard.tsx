"use client";
import { motion } from "framer-motion";
import { Character, CLASS_META, STAT_META, StatType } from "@/lib/types";
import { StatBar } from "@/components/ui/StatBar";
import { XpBar } from "@/components/ui/XpBar";

const STATS: StatType[] = ["VIT", "FOC", "SAB", "DIS", "CRE", "VOL"];

interface Props {
  character: Character;
}

export function CharacterCard({ character }: Props) {
  const classMeta = CLASS_META[character.character_class];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-bg-card border border-[#2d2d4a] rounded-2xl p-6 scanline overflow-hidden"
    >
      {/* Glow de fondo según clase */}
      <div
        className="absolute inset-0 opacity-5 rounded-2xl pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top left, #7c3aed 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{classMeta.emoji}</span>
            <h2 className="text-xl font-display font-bold text-white">{character.name}</h2>
          </div>
          <p className="text-sm text-accent-purple_light font-mono">{character.character_class}</p>
          <p className="text-xs text-gray-500 mt-0.5">{classMeta.description}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-display font-bold text-accent-gold">{character.level}</div>
          <div className="text-xs text-gray-400 font-mono">NIVEL</div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="mb-6">
        <XpBar currentXp={character.total_xp} xpToNext={character.xp_to_next_level} level={character.level} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {STATS.map((stat) => (
          <StatBar
            key={stat}
            stat={stat}
            value={character[stat.toLowerCase() as keyof Character] as number}
          />
        ))}
      </div>
    </motion.div>
  );
}
