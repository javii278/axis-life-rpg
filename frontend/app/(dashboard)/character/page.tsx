"use client";
import { useEffect, useState, useCallback } from "react";
import { Character, StatSnapshot, STAT_META, StatType, CLASS_META } from "@/lib/types";
import { api } from "@/lib/api";
import { StatBar } from "@/components/ui/StatBar";
import { XpBar } from "@/components/ui/XpBar";
import { StatsChart } from "@/components/ui/StatsChart";
import { CharacterSprite } from "@/components/character/CharacterSprite";
import { motion } from "framer-motion";

const STATS: StatType[] = ["VIT", "FOC", "SAB", "DIS", "CRE", "VOL"];

export default function CharacterPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [history, setHistory] = useState<StatSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [char, hist] = await Promise.all([
        api.character.get(),
        api.character.history(30),
      ]);
      setCharacter(char as Character);
      setHistory(hist as StatSnapshot[]);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="text-gray-500 font-mono text-sm animate-pulse">Cargando...</div>;
  if (!character) return <div className="text-gray-500 text-sm">No hay personaje. Crea uno desde el Dashboard.</div>;

  const classMeta = CLASS_META[character.character_class];

  // Determinar los 2 stats más altos
  const sortedStats = STATS
    .map(s => ({ stat: s, val: character[s.toLowerCase() as keyof Character] as number }))
    .sort((a, b) => b.val - a.val);
  const topTwo = new Set([sortedStats[0].stat, sortedStats[1].stat]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header del personaje */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-bg-card border border-[#2d2d4a] rounded-2xl p-8 overflow-hidden"
      >
        {/* Glow de fondo */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ background: "radial-gradient(ellipse at 20% 50%, #7c3aed, transparent 60%)" }} />

        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Sprite */}
          <div className="w-28 flex-shrink-0 flex items-center justify-center">
            <CharacterSprite characterClass={character.character_class} level={character.level} size={112} auraColor={character.equipped_aura} skinKey={character.equipped_skin} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-end gap-3 mb-1">
              <h1 className="text-3xl font-display font-bold text-white">{character.name}</h1>
              <span className="text-accent-gold font-mono font-bold text-xl mb-0.5">Lv.{character.level}</span>
            </div>
            <p className="text-accent-purple_light font-mono text-sm mb-0.5">{character.character_class}</p>
            <p className="text-gray-500 text-sm">{classMeta.description}</p>
            <div className="mt-3 max-w-xs">
              <XpBar currentXp={character.total_xp} xpToNext={character.xp_to_next_level} level={character.level} />
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-4xl font-display font-bold text-accent-gold">{character.level}</div>
            <div className="text-xs text-gray-400 font-mono">NIVEL</div>
            <div className="text-sm text-gray-500 font-mono mt-1">{character.total_xp.toLocaleString()} XP</div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div>
        <h2 className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-4">Atributos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STATS.map(stat => {
            const meta = STAT_META[stat];
            const val = character[stat.toLowerCase() as keyof Character] as number;
            const isTop = topTwo.has(stat);
            return (
              <motion.div
                key={stat}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: STATS.indexOf(stat) * 0.05 }}
                className={`p-4 rounded-xl border ${isTop ? "border-opacity-60" : "border-[#2d2d4a]"} bg-bg-card`}
                style={isTop ? { borderColor: `${meta.color}60` } : {}}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm" style={{ color: meta.color }}>{stat}</span>
                      {isTop && <span className="text-[10px] bg-accent-gold/20 text-accent-gold font-mono px-1.5 py-0.5 rounded">TOP</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{meta.label}</div>
                  </div>
                  <div className="text-2xl font-display font-bold" style={{ color: meta.color }}>
                    {val.toFixed(0)}
                  </div>
                </div>
                <StatBar stat={stat} value={val} showLabel={false} size="md" />
                <div className="text-xs text-gray-600 mt-2">{meta.description}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Historial de stats */}
      <div>
        <h2 className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-4">Evolución (30 días)</h2>
        <div className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-6">
          <StatsChart data={history} />
        </div>
      </div>
    </div>
  );
}
