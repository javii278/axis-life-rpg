"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  xpBonus: number;
  onDismiss: () => void;
}

function Particle({ delay }: { delay: number }) {
  const colors = ["#10b981", "#34d399", "#f59e0b", "#fbbf24", "#a78bfa", "#7c3aed"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const x = (Math.random() - 0.5) * 300;
  const y = -(Math.random() * 300 + 100);
  const size = Math.random() * 6 + 4;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, backgroundColor: color, left: "50%", top: "40%" }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0 }}
      transition={{ duration: 1.2 + Math.random() * 0.6, delay, ease: "easeOut" }}
    />
  );
}

export function PerfectDayModal({ open, xpBonus, onDismiss }: Props) {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      setParticles(Array.from({ length: 30 }, (_, i) => i));
      const t = setTimeout(onDismiss, 4000);
      return () => clearTimeout(t);
    }
  }, [open, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Particles */}
          {particles.map(i => <Particle key={i} delay={i * 0.03} />)}

          <motion.div
            className="relative pointer-events-auto w-full max-w-xs bg-[#0d0d18] border border-green-800/50 rounded-2xl p-6 shadow-2xl text-center"
            style={{ boxShadow: "0 0 60px #10b98140" }}
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
          >
            <motion.div
              className="text-5xl mb-3"
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              🌟
            </motion.div>

            <motion.h2
              className="font-display font-bold text-xl mb-1"
              style={{ background: "linear-gradient(90deg, #10b981, #34d399, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              ¡DÍA PERFECTO!
            </motion.h2>

            <motion.p
              className="text-gray-400 text-xs font-mono mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Completaste todos los hábitos del día
            </motion.p>

            <motion.div
              className="bg-green-900/20 border border-green-800/40 rounded-xl py-3 px-4 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            >
              <div className="text-3xl font-display font-bold text-green-400">+{xpBonus} XP</div>
              <div className="text-[10px] font-mono text-green-700 mt-0.5">Bonus por día perfecto</div>
            </motion.div>

            <motion.button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(90deg, #059669, #10b981)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ¡Imparable! 🔥
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
