"use client";
import { StatType, STAT_META } from "@/lib/types";

const STATS: StatType[] = ["VIT", "FOC", "SAB", "DIS", "CRE", "VOL"];
const CX = 110, CY = 110, R = 78;

function polar(angleIdx: number, value: number) {
  const rad = (angleIdx * 60 * Math.PI) / 180;
  const r = (value / 100) * R;
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
}

function vertex(angleIdx: number, r = R) {
  const rad = (angleIdx * 60 * Math.PI) / 180;
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
}

type StatValues = { vit: number; foc: number; sab: number; dis: number; cre: number; vol: number };

export function StatRadarChart({ character }: { character: StatValues }) {
  const values: Record<StatType, number> = {
    VIT: character.vit,
    FOC: character.foc,
    SAB: character.sab,
    DIS: character.dis,
    CRE: character.cre,
    VOL: character.vol,
  };

  const statPolygon = STATS.map((stat, i) => {
    const p = polar(i, Math.max(values[stat], 2));
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");

  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="w-full">
      <svg viewBox="0 0 220 220" className="w-full max-w-[220px] mx-auto">
        {/* Grid hexagons */}
        {gridLevels.map(level => {
          const pts = STATS.map((_, i) => {
            const p = vertex(i, (level / 100) * R);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(" ");
          return (
            <polygon key={level} points={pts} fill="none"
              stroke={level === 100 ? "#2d2d4a" : "#181828"} strokeWidth="1" />
          );
        })}

        {/* Axis lines */}
        {STATS.map((_, i) => {
          const end = vertex(i);
          return (
            <line key={i}
              x1={CX} y1={CY}
              x2={end.x.toFixed(1)} y2={end.y.toFixed(1)}
              stroke="#2d2d4a" strokeWidth="1"
            />
          );
        })}

        {/* Stat fill polygon */}
        <polygon
          points={statPolygon}
          fill="rgba(124, 58, 237, 0.12)"
          stroke="#7c3aed"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Colored dots at each stat vertex */}
        {STATS.map((stat, i) => {
          const p = polar(i, Math.max(values[stat], 2));
          return (
            <circle key={stat}
              cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
              r="3.5" fill={STAT_META[stat].color}
            />
          );
        })}

        {/* Axis stat labels */}
        {STATS.map((stat, i) => {
          const lp = vertex(i, R + 18);
          const val = Math.round(values[stat]);
          return (
            <g key={stat}>
              <text
                x={lp.x.toFixed(1)} y={(lp.y - 5).toFixed(1)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fontFamily="monospace" fontWeight="bold"
                fill={STAT_META[stat].color}
              >
                {stat}
              </text>
              <text
                x={lp.x.toFixed(1)} y={(lp.y + 6).toFixed(1)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="8" fontFamily="monospace"
                fill={STAT_META[stat].color} opacity="0.6"
              >
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
