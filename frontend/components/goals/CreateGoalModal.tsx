"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Goal, GOAL_LEVEL_META } from "@/lib/types";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  parentGoal?: Goal | null;
  defaultLevel?: number;
}

export function CreateGoalModal({ open, onClose, onCreated, parentGoal, defaultLevel = 0 }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState(parentGoal ? parentGoal.level + 1 : defaultLevel);
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true); setError("");
    try {
      await api.goals.create({
        title, description: description || undefined,
        level, parent_id: parentGoal?.id,
        due_date: dueDate || undefined,
      });
      setTitle(""); setDescription(""); setDueDate("");
      onCreated(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                       w-full max-w-md bg-bg-secondary border border-[#2d2d4a] rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-display font-semibold text-white">Nueva Meta</h2>
                {parentGoal && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Dentro de: <span className="text-gray-300">{parentGoal.title}</span>
                  </p>
                )}
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-gray-400 mb-2 block">NIVEL</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map(l => {
                    const meta = GOAL_LEVEL_META[l];
                    const disabled = parentGoal !== undefined && parentGoal !== null && l <= parentGoal.level;
                    return (
                      <button key={l} type="button" disabled={disabled}
                        onClick={() => setLevel(l)}
                        className={`p-2 rounded-lg border text-xs font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                          level === l ? "border-current" : "border-[#2d2d4a] text-gray-500"
                        }`}
                        style={level === l ? { color: meta.color, borderColor: meta.color, backgroundColor: `${meta.color}15` } : {}}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-gray-400 mb-1 block">TÍTULO</label>
                <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
                  placeholder="ej: Leer 12 libros este año"
                  className="w-full bg-bg-card border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-white
                             placeholder:text-gray-600 focus:outline-none focus:border-accent-purple" />
              </div>

              <div>
                <label className="text-xs font-mono text-gray-400 mb-1 block">DESCRIPCIÓN (opcional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  className="w-full bg-bg-card border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-white
                             placeholder:text-gray-600 focus:outline-none focus:border-accent-purple resize-none" />
              </div>

              <div>
                <label className="text-xs font-mono text-gray-400 mb-1 block">FECHA LÍMITE (opcional)</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-bg-card border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-white
                             focus:outline-none focus:border-accent-purple [color-scheme:dark]" />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button type="submit" disabled={loading || !title.trim()}
                className="w-full py-2.5 rounded-lg bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50
                           text-white font-display font-semibold text-sm transition-colors">
                {loading ? "Creando..." : "Crear Meta"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
