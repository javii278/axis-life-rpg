"use client";
import { motion } from "framer-motion";
import { Character, CLASS_META, STAT_META, StatType } from "@/lib/types";
import { StatBar } from "@/components/ui/StatBar";
import { XpBar } from "@/components/ui/XpBar";

const STATS: StatType[] = ["VIT", "FOC", "SAB", "DIS", "CRE", "VOL"];

const CLASS_COLORS: Record<string, string> = {
  Architect: "#06b6d4", Warrior: "#ef4444", Scholar: "#a78bfa",
  Monk: "#10b981", Explorer: "#f97316", Guardian: "#f59e0b", Novice: "#7c3aed",
};

function getStatTitle(c: Character): string | null {
  const s = { VIT: c.vit, FOC: c.foc, SAB: c.sab, DIS: c.dis, CRE: c.cre, VOL: c.vol };
  const high = (Object.entries(s) as [string, number][]).filter(([, v]) => v >= 70).map(([k]) => k).sort();
  if (high.length >= 4) return "El Polímata";
  if (high.length === 2) {
    const key = high.join("+");
    const combos: Record<string, string> = {
      "FOC+SAB": "Maestro de la Mente", "VIT+DIS": "El Guerrero Eterno",
      "CRE+SAB": "El Visionario",       "FOC+VOL": "El Monje Absoluto",
      "DIS+VOL": "La Roca Inquebrantable", "VIT+CRE": "El Explorador Libre",
      "DIS+SAB": "El Estratega",        "FOC+CRE": "El Innovador",
    };
    return combos[key] ?? null;
  }
  if (high.length === 1) {
    const solo: Record<string, string> = {
      VIT: "Cuerpo de Hierro", FOC: "Monje Digital",    SAB: "El Erudito",
      DIS: "Voluntad de Acero", CRE: "El Creador",       VOL: "El Inquebrantable",
    };
    return solo[high[0]] ?? null;
  }
  return null;
}

interface Props {
  character: Character;
}

export function CharacterCard({ character }: Props) {
  const classMeta = CLASS_META[character.character_class];
  const classColor = CLASS_COLORS[character.character_class] ?? "#7c3aed";
  const title = getStatTitle(character);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-bg-card border rounded-2xl p-5 scanline overflow-hidden"
      style={{ borderColor: `${classColor}30` }}
    >
      {/* Glow dinámico por clase */}
      <div
        className="absolute inset-0 opacity-[0.06] rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${classColor}, transparent 65%)` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl">{classMeta.emoji}</span>
            <h2 className="text-base font-display font-bold text-white">{character.name}</h2>
          </div>
          <p className="text-xs font-mono font-semibold" style={{ color: classColor }}>
            {character.character_class}
          </p>
          {title && (
            <p className="text-[10px] font-mono mt-0.5" style={{ color: `${classColor}cc` }}>
              ✦ {title}
            </p>
          )}
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{classMeta.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-display font-bold" style={{ color: classColor }}>{character.level}</div>
          <div className="text-[10px] text-gray-500 font-mono">NIVEL</div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="mb-4">
        <XpBar currentXp={character.total_xp} xpToNext={character.xp_to_next_level} level={character.level} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
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
