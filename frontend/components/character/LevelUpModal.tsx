"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CharacterClass, CLASS_META } from "@/lib/types";
import { CharacterSprite } from "./CharacterSprite";

interface Props {
  open: boolean;
  level: number;
  characterClass: CharacterClass;
  characterName: string;
  onDismiss: () => void;
}

export function LevelUpModal({ open, level, characterClass, characterName, onDismiss }: Props) {
  const meta = CLASS_META[characterClass];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.3) 0%, rgba(0,0,0,0.92) 70%)" }}
          onClick={onDismiss}
        >
          {/* Partículas de fondo */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-accent-gold"
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: (Math.cos((i / 12) * Math.PI * 2) * 160),
                y: (Math.sin((i / 12) * Math.PI * 2) * 160),
              }}
              transition={{ duration: 1.4, delay: i * 0.05, repeat: Infinity, repeatDelay: 0.8 }}
              style={{ left: "50%", top: "50%" }}
            />
          ))}

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-center px-8 py-10 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* LEVEL UP text */}
            <motion.div
              initial={{ letterSpacing: "0.3em", opacity: 0 }}
              animate={{ letterSpacing: "0.5em", opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-accent-gold font-mono font-bold text-sm uppercase tracking-widest mb-2"
            >
              ✦ Level Up ✦
            </motion.div>

            {/* Sprite */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="flex justify-center mb-4"
            >
              <CharacterSprite characterClass={characterClass} level={level} size={140} />
            </motion.div>

            {/* Level number */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
              className="text-8xl font-display font-bold text-white mb-1"
              style={{ textShadow: "0 0 40px rgba(245,158,11,0.8)" }}
            >
              {level}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-accent-purple_light font-mono text-lg mb-1">{characterName}</div>
              <div className="text-gray-400 text-sm mb-1">
                {meta.emoji} {characterClass}
              </div>
              <div className="text-gray-500 text-xs">{meta.description}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 text-xs text-gray-600 font-mono"
            >
              [ toca para continuar ]
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
