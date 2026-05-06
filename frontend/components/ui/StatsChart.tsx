"use client";
import { StatSnapshot, StatType, STAT_META } from "@/lib/types";
import { useState } from "react";

const STATS: StatType[] = ["VIT", "FOC", "SAB", "DIS", "CRE", "VOL"];
const W = 600;
const H = 180;
const PAD = { top: 10, right: 10, bottom: 24, left: 28 };

interface Props {
  data: StatSnapshot[];
}

export function StatsChart({ data }: Props) {
  const [active, setActive] = useState<StatType | null>(null);

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-600 text-sm font-mono">
        Aún no hay suficientes datos para mostrar el historial.
      </div>
    );
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  function xPos(i: number) {
    return PAD.left + (i / (data.length - 1)) * innerW;
  }
  function yPos(val: number) {
    return PAD.top + innerH - (val / 100) * innerH;
  }

  function buildPath(stat: StatType) {
    const key = stat.toLowerCase() as keyof StatSnapshot;
    return data
      .map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(d[key] as number).toFixed(1)}`)
      .join(" ");
  }

  // Labels del eje X (primer y último día)
  const firstDate = new Date(data[0].date).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const lastDate  = new Date(data[data.length - 1].date).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return (
    <div className="w-full">
      {/* Toggle de stats */}
      <div className="flex gap-2 flex-wrap mb-3">
        {STATS.map(s => {
          const meta = STAT_META[s];
          const isActive = active === null || active === s;
          return (
            <button
              key={s}
              onClick={() => setActive(active === s ? null : s)}
              className="px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-all"
              style={{
                color: isActive ? meta.color : "#4b5563",
                borderColor: isActive ? meta.color : "#2d2d4a",
                backgroundColor: isActive ? `${meta.color}15` : "transparent",
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line
              x1={PAD.left} x2={W - PAD.right}
              y1={yPos(v)} y2={yPos(v)}
              stroke="#1e1e2e" strokeWidth="1"
            />
            <text x={PAD.left - 4} y={yPos(v) + 4} textAnchor="end" fill="#4b5563" fontSize="9" fontFamily="monospace">
              {v}
            </text>
          </g>
        ))}

        {/* Lines */}
        {STATS.map(s => {
          const meta = STAT_META[s];
          const visible = active === null || active === s;
          return (
            <path
              key={s}
              d={buildPath(s)}
              fill="none"
              stroke={meta.color}
              strokeWidth={active === s ? 2.5 : 1.5}
              opacity={visible ? 1 : 0.08}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ transition: "opacity 0.2s" }}
            />
          );
        })}

        {/* X axis labels */}
        <text x={PAD.left} y={H - 4} fill="#4b5563" fontSize="9" fontFamily="monospace">{firstDate}</text>
        <text x={W - PAD.right} y={H - 4} fill="#4b5563" fontSize="9" fontFamily="monospace" textAnchor="end">{lastDate}</text>
      </svg>
    </div>
  );
}
