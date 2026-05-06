"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronRight, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Goal, GOAL_LEVEL_META } from "@/lib/types";
import { api } from "@/lib/api";
import { CreateGoalModal } from "./CreateGoalModal";

interface Props {
  goals: Goal[];
  onUpdate: () => void;
}

export function GoalTree({ goals, onUpdate }: Props) {
  const [addingChildOf, setAddingChildOf] = useState<Goal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function openAddChild(goal: Goal) {
    setAddingChildOf(goal);
    setModalOpen(true);
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <p className="text-4xl mb-3">🎯</p>
        <p className="text-sm">No hay metas todavía.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {goals.map(goal => (
          <GoalNode key={goal.id} goal={goal} depth={0} onUpdate={onUpdate} onAddChild={openAddChild} />
        ))}
      </div>
      <CreateGoalModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setAddingChildOf(null); }}
        onCreated={onUpdate}
        parentGoal={addingChildOf}
      />
    </>
  );
}

function GoalNode({ goal, depth, onUpdate, onAddChild }: {
  goal: Goal; depth: number;
  onUpdate: () => void;
  onAddChild: (goal: Goal) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const meta = GOAL_LEVEL_META[goal.level];
  const hasChildren = goal.children.length > 0;

  async function toggleComplete() {
    await api.goals.update(goal.id, { is_completed: !goal.is_completed });
    onUpdate();
  }

  async function deleteGoal() {
    if (!confirm(`¿Eliminar "${goal.title}" y todas sus sub-metas?`)) return;
    await api.goals.delete(goal.id);
    onUpdate();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div
        className={`group flex items-center gap-2 p-3 rounded-xl border transition-colors ${
          goal.is_completed ? "opacity-50 border-[#1e1e2e]" : "border-[#2d2d4a] hover:border-[#3d3d5a]"
        } bg-bg-card`}
        style={{ marginLeft: depth * 20 }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-600 ${hasChildren ? "hover:text-gray-300" : "invisible"}`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Complete toggle */}
        <button onClick={toggleComplete} className="flex-shrink-0 transition-transform hover:scale-110">
          {goal.is_completed
            ? <CheckCircle2 size={18} style={{ color: meta.color }} />
            : <Circle size={18} className="text-gray-600 hover:text-gray-400" />
          }
        </button>

        {/* Level badge */}
        <span
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
        >
          {meta.label}
        </span>

        {/* Title */}
        <span className={`flex-1 text-sm min-w-0 truncate ${goal.is_completed ? "line-through text-gray-500" : "text-white"}`}>
          {goal.title}
        </span>

        {/* Due date */}
        {goal.due_date && (
          <span className="text-xs text-gray-500 font-mono flex-shrink-0">
            {new Date(goal.due_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {goal.level < 3 && (
            <button onClick={() => onAddChild(goal)} className="p-1 text-gray-600 hover:text-accent-purple_light transition-colors">
              <Plus size={13} />
            </button>
          )}
          <button onClick={deleteGoal} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 space-y-1"
          >
            {goal.children.map(child => (
              <GoalNode key={child.id} goal={child} depth={depth + 1} onUpdate={onUpdate} onAddChild={onAddChild} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
