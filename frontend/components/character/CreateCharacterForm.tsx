"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface Props {
  onCreated: () => void;
}

export function CreateCharacterForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.character.create(name.trim());
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <div className="text-6xl mb-6">✨</div>
      <h1 className="text-3xl font-display font-bold text-white mb-2">Bienvenido a Axis</h1>
      <p className="text-gray-400 mb-8 max-w-sm">
        Tu viaje comienza aquí. Dale un nombre a tu personaje — será el reflejo de tu vida real.
      </p>

      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre del personaje..."
          className="w-full bg-bg-card border border-[#2d2d4a] rounded-xl px-4 py-3 text-white
                     text-center text-lg font-display placeholder:text-gray-600
                     focus:outline-none focus:border-accent-purple"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-3 rounded-xl bg-accent-purple hover:bg-accent-purple/80
                     disabled:opacity-50 text-white font-display font-bold text-lg transition-colors"
        >
          {loading ? "Creando..." : "Comenzar el viaje →"}
        </button>
      </form>
    </motion.div>
  );
}
