"use client";

interface AchievementBadgeProps {
  name: string;
  description: string;
  icon: string;
  rarity: "bronze" | "silver" | "gold";
  unlocked: boolean;
  unlocked_at?: string | null;
  xp_bonus: number;
  size?: "sm" | "md" | "lg";
}

const RARITY_STYLES = {
  bronze: {
    border:  "border-amber-700/60",
    bg:      "bg-gradient-to-br from-amber-900/40 to-amber-800/20",
    glow:    "shadow-amber-700/30",
    badge:   "bg-amber-700 text-amber-100",
    label:   "Bronce",
  },
  silver: {
    border:  "border-slate-400/60",
    bg:      "bg-gradient-to-br from-slate-600/40 to-slate-500/20",
    glow:    "shadow-slate-400/30",
    badge:   "bg-slate-500 text-slate-100",
    label:   "Plata",
  },
  gold: {
    border:  "border-yellow-400/60",
    bg:      "bg-gradient-to-br from-yellow-700/40 to-yellow-600/20",
    glow:    "shadow-yellow-400/30",
    badge:   "bg-yellow-500 text-yellow-950",
    label:   "Oro",
  },
};

export function AchievementBadge({
  name, description, icon, rarity, unlocked, unlocked_at, xp_bonus, size = "md"
}: AchievementBadgeProps) {
  const styles = RARITY_STYLES[rarity];
  const iconSizes = { sm: "text-2xl", md: "text-4xl", lg: "text-5xl" };
  const containerSizes = {
    sm: "p-3 gap-2",
    md: "p-4 gap-3",
    lg: "p-5 gap-4",
  };

  return (
    <div
      className={`
        relative rounded-xl border ${styles.border} ${styles.bg}
        ${containerSizes[size]} flex flex-col items-center text-center
        transition-all duration-300
        ${unlocked ? `shadow-lg ${styles.glow}` : "opacity-40 grayscale"}
      `}
    >
      {/* Rarity badge */}
      <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${styles.badge}`}>
        {styles.label}
      </span>

      {/* Icon */}
      <span className={`${iconSizes[size]} ${unlocked ? "" : "grayscale"}`}>{icon}</span>

      {/* Name */}
      <p className={`font-bold text-white leading-tight ${size === "sm" ? "text-xs" : "text-sm"}`}>
        {name}
      </p>

      {/* Description */}
      <p className="text-xs text-white/50 leading-snug">{description}</p>

      {/* XP bonus */}
      <span className="text-xs text-accent-gold font-mono">+{xp_bonus} XP</span>

      {/* Unlock date */}
      {unlocked && unlocked_at && (
        <p className="text-[10px] text-white/30 mt-1">
          {new Date(unlocked_at).toLocaleDateString("es-ES")}
        </p>
      )}

      {/* Lock overlay */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
          <span className="text-2xl opacity-30">🔒</span>
        </div>
      )}
    </div>
  );
}
