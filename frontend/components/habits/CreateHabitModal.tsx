"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { STAT_META, StatType } from "@/lib/types";
import { api } from "@/lib/api";

const STATS = Object.keys(STAT_META) as StatType[];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateHabitModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [statTarget, setStatTarget] = useState<StatType>("DIS");
  const [xpReward, setXpReward] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.habits.create({ name, description, stat_target: statTarget, xp_reward: xpReward });
      setName(""); setDescription(""); setStatTarget("DIS"); setXpReward(10);
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-bg-secondary border-t border-[#2d2d4a] rounded-t-3xl p-6 shadow-2xl
                       lg:inset-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2
                       lg:w-full lg:max-w-md lg:border lg:rounded-2xl lg:bottom-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-display font-semibold text-white">Nuevo Hábito</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-gray-400 mb-1 block">NOMBRE</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="ej: Leer 30 minutos"
                  className="w-full bg-bg-card border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm
                             text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-purple"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-gray-400 mb-1 block">DESCRIPCIÓN (opcional)</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="ej: No ficción o técnico"
                  className="w-full bg-bg-card border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm
                             text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-purple"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-gray-400 mb-2 block">STAT OBJETIVO</label>
                <div className="grid grid-cols-3 gap-2">
                  {STATS.map(stat => {
                    const meta = STAT_META[stat];
                    return (
                      <button
                        key={stat} type="button"
                        onClick={() => setStatTarget(stat)}
                        className={`p-2 rounded-lg border text-xs font-mono font-bold transition-all ${
                          statTarget === stat
                            ? "border-current"
                            : "border-[#2d2d4a] text-gray-500 hover:border-[#4a4a6a]"
                        }`}
                        style={statTarget === stat ? { color: meta.color, borderColor: meta.color, backgroundColor: `${meta.color}15` } : {}}
                      >
                        {stat}
                        <div className="text-[10px] font-normal opacity-70 mt-0.5">{meta.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-gray-400 mb-1 block">XP POR COMPLETAR: {xpReward}</label>
                <input
                  type="range" min={5} max={50} step={5}
                  value={xpReward} onChange={e => setXpReward(Number(e.target.value))}
                  className="w-full accent-accent-purple"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                type="submit" disabled={loading || !name.trim()}
                className="w-full py-2.5 rounded-lg bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50
                           text-white font-display font-semibold text-sm transition-colors"
              >
                {loading ? "Creando..." : "Crear Hábito"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
