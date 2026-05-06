export type StatType = "VIT" | "FOC" | "SAB" | "DIS" | "CRE" | "VOL";

export type CharacterClass =
  | "Architect"
  | "Warrior"
  | "Scholar"
  | "Monk"
  | "Explorer"
  | "Guardian"
  | "Novice";

export interface Character {
  id: number;
  name: string;
  level: number;
  total_xp: number;
  xp_to_next_level: number;
  character_class: CharacterClass;
  vit: number;
  foc: number;
  sab: number;
  dis: number;
  cre: number;
  vol: number;
}

export interface Habit {
  id: number;
  name: string;
  description: string | null;
  stat_target: StatType;
  frequency: "daily" | "weekly";
  xp_reward: number;
  is_active: boolean;
  streak: number;
  completed_today: boolean;
}

export interface FocusSession {
  id: number;
  title: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  quality: number | null;
  notes: string | null;
  is_active: boolean;
}

export const STAT_META: Record<StatType, { label: string; color: string; description: string }> = {
  VIT: { label: "Vitalidad", color: "#ef4444", description: "Sueño, ejercicio, nutrición" },
  FOC: { label: "Foco",      color: "#06b6d4", description: "Deep work, meditación" },
  SAB: { label: "Sabiduría", color: "#a78bfa", description: "Lectura, aprendizaje" },
  DIS: { label: "Disciplina",color: "#f59e0b", description: "Consistencia, streaks" },
  CRE: { label: "Creatividad",color: "#10b981",description: "Proyectos, ideas" },
  VOL: { label: "Voluntad",  color: "#f97316", description: "Resistir, hacer lo difícil" },
};

export interface Goal {
  id: number;
  title: string;
  description: string | null;
  level: number;
  level_label: string;
  parent_id: number | null;
  is_completed: boolean;
  due_date: string | null;
  children: Goal[];
}

export interface Quest {
  id: number;
  title: string;
  description: string | null;
  quest_type: "main" | "weekly" | "daily";
  xp_reward: number;
  is_completed: boolean;
  due_date: string | null;
  related_goal_title: string | null;
}

export interface StatSnapshot {
  date: string;
  level: number;
  vit: number;
  foc: number;
  sab: number;
  dis: number;
  cre: number;
  vol: number;
}

export const GOAL_LEVEL_META: Record<number, { label: string; color: string }> = {
  0: { label: "Vida",        color: "#7c3aed" },
  1: { label: "Trimestral",  color: "#06b6d4" },
  2: { label: "Semanal",     color: "#10b981" },
  3: { label: "Diaria",      color: "#f59e0b" },
};

export const CLASS_META: Record<CharacterClass, { description: string; emoji: string }> = {
  Architect: { description: "Domina el pensamiento y la construcción", emoji: "🏛️" },
  Warrior:   { description: "Cuerpo y disciplina sin igual", emoji: "⚔️" },
  Scholar:   { description: "Mente creativa y hambrienta de saber", emoji: "📚" },
  Monk:      { description: "Voluntad de hierro y foco absoluto", emoji: "🧘" },
  Explorer:  { description: "Vitalidad y creatividad sin límites", emoji: "🗺️" },
  Guardian:  { description: "La disciplina protege la voluntad", emoji: "🛡️" },
  Novice:    { description: "El viaje apenas comienza", emoji: "✨" },
};
