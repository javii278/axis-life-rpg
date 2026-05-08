"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Character, CLASS_META, CharacterClass } from "@/lib/types";
import { api } from "@/lib/api";
import { useState } from "react";
import { CharacterSprite } from "./CharacterSprite";

const CLASS_STAT_REQS: Record<CharacterClass, [string, string]> = {
  Architect: ["FOC", "SAB"],
  Warrior:   ["VIT", "DIS"],
  Scholar:   ["CRE", "SAB"],
  Monk:      ["VOL", "FOC"],
  Explorer:  ["VIT", "CRE"],
  Guardian:  ["DIS", "VOL"],
  Novice:    ["VIT", "FOC"],
};

const CLASS_COLORS: Record<string, string> = {
  Architect: "#06b6d4", Warrior: "#ef4444", Scholar: "#a78bfa",
  Monk: "#10b981", Explorer: "#f97316", Guardian: "#f59e0b", Novice: "#7c3aed",
};

function getTopClasses(character: Character): CharacterClass[] {
  const statValues: Record<string, number> = {
    VIT: character.vit, FOC: character.foc, SAB: character.sab,
    DIS: character.dis, CRE: character.cre, VOL: character.vol,
  };

  const classes = (Object.entries(CLASS_STAT_REQS) as [CharacterClass, [string, string]][])
    .filter(([cls]) => cls !== "Novice")
    .map(([cls, [s1, s2]]) => ({ cls, score: statValues[s1] + statValues[s2] }))
    .sort((a, b) => b.score - a.score);

  return classes.slice(0, 3).map(c => c.cls);
}

interface Props {
  open: boolean;
  character: Character;
  onChosen: (updated: Character) => void;
  onDismiss: () => void;
}

export function ClassSelectionModal({ open, character, onChosen, onDismiss }: Props) {
  const [selected, setSelected] = useState<CharacterClass | null>(null);
  const [loading, setLoading] = useState(false);
  const topClasses = getTopClasses(character);

  async function confirmChoice() {
    if (!selected || loading) return;
    setLoading(true);
    try {
      const updated = await api.character.chooseClass(selected) as Character;
      onChosen(updated);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onDismiss} />

          <motion.div
            className="relative z-10 w-full max-w-md bg-[#0d0d18] border border-accent-purple/30 rounded-2xl p-6"
            initial={{ scale: 0.85, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <div className="text-center mb-5">
              <div className="text-xs font-mono text-accent-gold uppercase tracking-widest mb-1">✦ Nivel 10 ✦</div>
              <h2 className="font-display font-bold text-white text-xl">Elige tu Clase</h2>
              <p className="text-gray-500 text-xs mt-1">
                Tu camino queda sellado. Podrás cambiar de clase cuando alcances nuevos hitos.
              </p>
            </div>

            <div className="space-y-2.5 mb-5">
              {topClasses.map((cls) => {
                const meta = CLASS_META[cls];
                const color = CLASS_COLORS[cls];
                const [s1, s2] = CLASS_STAT_REQS[cls];
                const isSelected = selected === cls;

                return (
                  <motion.button
                    key={cls}
                    onClick={() => setSelected(cls)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl border text-left transition-all"
                    style={{
                      borderColor: isSelected ? color : "#2d2d4a",
                      backgroundColor: isSelected ? `${color}12` : "#14141f",
                      boxShadow: isSelected ? `0 0 16px ${color}30` : "none",
                    }}
                  >
                    <div className="flex-shrink-0">
                      <CharacterSprite characterClass={cls} level={character.level} size={52} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base">{meta.emoji}</span>
                        <span className="font-display font-bold text-sm text-white">{cls}</span>
                        {isSelected && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${color}30`, color }}>
                            SELECCIONADO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{meta.description}</p>
                      <div className="flex gap-1">
                        {[s1, s2].map(s => (
                          <span key={s} className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}20`, color }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onDismiss}
                className="flex-1 py-2.5 rounded-xl border border-[#2d2d4a] text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                Decidir después
              </button>
              <button
                onClick={confirmChoice}
                disabled={!selected || loading}
                className="flex-1 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold text-sm transition-colors disabled:opacity-40"
              >
                {loading ? "Sellando..." : "Confirmar clase"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
