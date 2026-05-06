"use client";
import { motion } from "framer-motion";
import { CheckCircle2, Sword, Shield, Star, Trash2 } from "lucide-react";
import { Quest } from "@/lib/types";
import { api } from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

const TYPE_META = {
  main:   { label: "Principal", color: "#7c3aed", icon: Sword },
  weekly: { label: "Semanal",   color: "#06b6d4", icon: Shield },
  daily:  { label: "Diaria",    color: "#f59e0b", icon: Star },
};

interface Props {
  quest: Quest;
  onUpdate: () => void;
}

export function QuestCard({ quest, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const meta = TYPE_META[quest.quest_type as keyof typeof TYPE_META] ?? TYPE_META.daily;
  const Icon = meta.icon;
  const { showToast, showAchievement } = useToast();

  async function complete() {
    setLoading(true);
    try {
      const result = await api.quests.complete(quest.id) as any;
      showToast({ type: "success", title: `Quest completada`, message: `+${result.xp_gained} XP`, icon: "⚔️", duration: 3000 });
      result.new_achievements?.forEach((a: { name: string; icon: string; rarity: string }) => showAchievement(a));
      onUpdate();
    } finally { setLoading(false); }
  }

  async function remove() {
    if (!confirm(`¿Abandonar la quest "${quest.quest_type}"?`)) return;
    await api.quests.delete(quest.id);
    onUpdate();
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group relative flex items-start gap-4 p-4 bg-bg-card border border-[#2d2d4a] rounded-xl hover:border-[#3d3d5a] transition-colors overflow-hidden"
    >
      {/* Borde izquierdo de color */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: meta.color }}
      />

      {/* Icono */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
        style={{ backgroundColor: `${meta.color}20` }}
      >
        <Icon size={18} style={{ color: meta.color }} />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-white truncate">{quest.title}</span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>
        {quest.description && (
          <p className="text-xs text-gray-500 mb-1 line-clamp-2">{quest.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-mono text-accent-gold">+{quest.xp_reward} XP</span>
          {quest.related_goal_title && (
            <span className="truncate">↳ {quest.related_goal_title}</span>
          )}
          {quest.due_date && (
            <span>{new Date(quest.due_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={complete}
          disabled={loading}
          className="p-2 rounded-lg bg-bg-secondary hover:bg-accent-purple/20 disabled:opacity-50 transition-colors"
          title="Completar quest"
        >
          <CheckCircle2 size={18} className="text-gray-500 hover:text-accent-purple_light" />
        </button>
        <button
          onClick={remove}
          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={14} className="text-gray-600 hover:text-red-400" />
        </button>
      </div>
    </motion.div>
  );
}
