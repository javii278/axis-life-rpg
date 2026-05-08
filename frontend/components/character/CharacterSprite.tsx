"use client";
import { motion } from "framer-motion";
import { CharacterClass } from "@/lib/types";

// Each "pixel" = S SVG units. Character = 14 wide × 22 tall
const S = 4;
const VB = "-8 -10 72 108"; // viewBox con padding para extras (staff, escudo, etc.)

interface Pal {
  primary: string; dark: string; helmet: string;
  skin: string;    boot: string;  eye: string;
}

const PALETTES: Record<CharacterClass, Pal> = {
  Warrior:   { primary:"#ef4444", dark:"#7f1d1d", helmet:"#f59e0b", skin:"#fbbf8a", boot:"#431407", eye:"#1e1b4b" },
  Architect: { primary:"#7c3aed", dark:"#3b0764", helmet:"#1e1b4b", skin:"#fbbf8a", boot:"#1e1b4b", eye:"#a78bfa" },
  Scholar:   { primary:"#06b6d4", dark:"#164e63", helmet:"#7c3aed", skin:"#fbbf8a", boot:"#164e63", eye:"#a78bfa" },
  Monk:      { primary:"#f97316", dark:"#c2410c", helmet:"#fbbf8a", skin:"#fbbf8a", boot:"#78350f", eye:"#1e1b4b" },
  Explorer:  { primary:"#10b981", dark:"#065f46", helmet:"#92400e", skin:"#fbbf8a", boot:"#78350f", eye:"#1e1b4b" },
  Guardian:  { primary:"#f59e0b", dark:"#78350f", helmet:"#d1d5db", skin:"#fbbf8a", boot:"#1f2937", eye:"#1e1b4b" },
  Novice:    { primary:"#6b7280", dark:"#374151", helmet:"#9ca3af", skin:"#fbbf8a", boot:"#1f2937", eye:"#1e1b4b" },
};

const CLASS_GLOW: Record<CharacterClass, string> = {
  Warrior:"#ef4444", Architect:"#7c3aed", Scholar:"#06b6d4",
  Monk:"#f97316",    Explorer:"#10b981",  Guardian:"#f59e0b", Novice:"#6b7280",
};

function r(x: number, y: number, w: number, h: number, fill: string, k?: string) {
  return <rect key={k ?? `${x}${y}${w}${h}`} x={x*S} y={y*S} width={w*S} height={h*S} fill={fill} shapeRendering="crispEdges" />;
}

function BaseBody({ pal }: { pal: Pal }) {
  return <>
    {r(3, 2, 6, 4, pal.skin,    "face")}
    {r(4, 3, 1, 1, pal.eye,     "el")}
    {r(7, 3, 1, 1, pal.eye,     "er")}
    {r(5, 1, 2, 1, pal.skin,    "nose")}
    {r(5, 6, 2, 1, pal.skin,    "neck")}
    {r(1, 7, 2, 4, pal.primary, "al")}
    {r(9, 7, 2, 4, pal.primary, "ar")}
    {r(3, 7, 6, 4, pal.primary, "torso")}
    {r(3,11, 6, 1, pal.dark,    "belt")}
    {r(4,12, 4, 1, pal.primary, "hip")}
    {r(3,13, 2, 4, pal.dark,    "ll")}
    {r(7,13, 2, 4, pal.dark,    "rl")}
    {r(2,17, 3, 2, pal.boot,    "lb")}
    {r(7,17, 3, 2, pal.boot,    "rb")}
  </>;
}

function ClassOverlay({ cls, pal }: { cls: CharacterClass; pal: Pal }) {
  switch (cls) {
    case "Warrior": return <>
      {r(3, 0, 6, 3, pal.helmet, "h")}
      {r(4,-2, 1, 3, pal.helmet, "c1")}
      {r(6,-3, 2, 4, pal.helmet, "c2")}
      {r(9,-2, 1, 3, pal.helmet, "c3")}
      {r(11, 3, 1,10, "#d1d5db", "sw")}
      {r(10, 6, 3, 1, "#f59e0b", "swh")}
      {r(11, 3, 1, 1, "#9ca3af", "swt")}
    </>;
    case "Architect": return <>
      {r(2, 0, 8, 4, pal.helmet, "hood")}
      {r(3, 4, 6, 1, pal.helmet, "hood2")}
      {r(0, 2, 1,13, "#6b7280",  "staff")}
      {r(-2,-3, 4, 4, "#a78bfa", "orb")}
      {r(-1,-2, 2, 2, "#c4b5fd", "orbhi")}
    </>;
    case "Scholar": return <>
      {r(3, 0, 6, 2, pal.helmet, "hatbody")}
      {r(4,-3, 4, 3, pal.helmet, "hattop")}
      {r(2, 2, 8, 1, pal.helmet, "hatbrim")}
      {r(-2, 8, 2, 3, "#f3f4f6", "book")}
      {r(-2, 9, 2, 1, "#9ca3af", "bookline")}
      {r(-2,10, 1, 1, "#9ca3af", "bookdot")}
    </>;
    case "Monk": return <>
      {r(3, 0, 6, 2, pal.skin, "bald")}
      {r(4, 0, 4, 1, "#d97706", "bandana")}
    </>;
    case "Explorer": return <>
      {r(3,-2, 6, 3, pal.helmet, "hatbody")}
      {r(1, 1,10, 1, pal.helmet, "hatbrim")}
      {r(4, 1, 4, 1, "#78350f",  "hair")}
    </>;
    case "Guardian": return <>
      {r(3, 0, 6, 3, pal.helmet, "helm")}
      {r(4, 3, 4, 1, "#9ca3af",  "visor")}
      {r(-3, 7, 2, 7, "#e5e7eb", "shield")}
      {r(-3, 7, 2, 1, "#f59e0b", "shieldt")}
      {r(-2, 9, 1, 3, "#f59e0b", "shieldc")}
    </>;
    default: return <>
      {r(3, 0, 6, 2, pal.helmet, "hood")}
    </>;
  }
}

function GlowFilter({ id, color, level }: { id: string; color: string; level: number }) {
  const blur = Math.min(1.5 + level * 0.3, 6);
  return (
    <defs>
      <filter id={id} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceAlpha" stdDeviation={blur} result="blur" />
        <feFlood floodColor={color} floodOpacity="0.7" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

// Level tier thresholds and their visual indicator
const TIER_CONFIG = {
  legend: { min: 30, emoji: "👑", color: "#fbbf24", shadow: "0 0 8px #fbbf24aa" },
  veteran: { min: 20, emoji: "🏆", color: "#f59e0b", shadow: "0 0 6px #f59e0b88" },
  adept:   { min: 10, emoji: "✦",  color: "#a78bfa", shadow: "0 0 5px #a78bfa88" },
} as const;

function getLevelTier(level: number) {
  if (level >= TIER_CONFIG.legend.min) return TIER_CONFIG.legend;
  if (level >= TIER_CONFIG.veteran.min) return TIER_CONFIG.veteran;
  if (level >= TIER_CONFIG.adept.min)   return TIER_CONFIG.adept;
  return null;
}

interface Props {
  characterClass: CharacterClass;
  level: number;
  size?: number; // display height in px
}

export function CharacterSprite({ characterClass, level, size = 160 }: Props) {
  const pal = PALETTES[characterClass];
  const glowColor = CLASS_GLOW[characterClass];
  const filterId = `glow-${characterClass}`;
  const tier = getLevelTier(level);

  return (
    <motion.div
      style={{ height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      {tier && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: Math.round(size * 0.14),
            lineHeight: 1,
            filter: `drop-shadow(${tier.shadow})`,
            zIndex: 1,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          {tier.emoji}
        </div>
      )}
      <svg
        viewBox={VB}
        style={{ height: size, imageRendering: "pixelated" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <GlowFilter id={filterId} color={glowColor} level={level} />
        <g filter={`url(#${filterId})`}>
          <ClassOverlay cls={characterClass} pal={pal} />
          <BaseBody pal={pal} />
        </g>
      </svg>
    </motion.div>
  );
}
