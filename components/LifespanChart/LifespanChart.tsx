"use client";

import { useState, useMemo } from "react";
import { lifespanCurves, EXPLANATION, METHOD, SOURCES, type CurvePoint } from "../../data/lifespanCurves";
import styles from "./LifespanChart.module.css";

const W = 840;
const H = 480;
const PAD = { top: 44, right: 32, bottom: 60, left: 52 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const STAGES = ["Puppy", "Adolescent", "Adult", "Senior", "Aged"] as const;
const STAGE_FILL = "rgba(255,255,255,0.08)";
const STAGE_ALT  = "rgba(255,255,255,0.04)";

function toSvgX(age: number, maxAge: number) {
  return PAD.left + (age / maxAge) * PLOT_W;
}
function toSvgY(score: number) {
  return PAD.top + PLOT_H - (score / 100) * PLOT_H;
}

function pointsToPath(pts: CurvePoint[], maxAge: number): string {
  if (pts.length === 0) return "";
  const cmds = pts.map((p, i) =>
    `${i === 0 ? "M" : "L"}${toSvgX(p.age, maxAge).toFixed(2)},${toSvgY(p.score).toFixed(2)}`
  );
  return cmds.join(" ");
}

function stageRanges(pts: CurvePoint[]): { stage: string; startAge: number; endAge: number }[] {
  const ranges: { stage: string; startAge: number; endAge: number }[] = [];
  let cur = pts[0]?.stage;
  let start = pts[0]?.age ?? 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].stage !== cur) {
      ranges.push({ stage: cur, startAge: start, endAge: pts[i].age });
      cur = pts[i].stage;
      start = pts[i].age;
    }
  }
  if (cur) ranges.push({ stage: cur, startAge: start, endAge: pts[pts.length - 1].age });
  return ranges;
}

export default function LifespanChart({ breedName }: { breedName: string }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [hoverAge, setHoverAge] = useState<number | null>(null);

  const data = lifespanCurves[breedName];
  if (!data) return null;

  const maxAge = Math.ceil(data[data.length - 1].age) + 0.5;
  const path = useMemo(() => pointsToPath(data, maxAge), [data, maxAge]);
  const ranges = useMemo(() => stageRanges(data), [data]);

  // Age ticks
  const ageTicks: number[] = [];
  for (let a = 0; a <= maxAge; a++) ageTicks.push(a);

  // Score ticks
  const scoreTicks = [0, 25, 50, 75, 100];

  // Hover point
  const hoverPt = hoverAge !== null
    ? data.reduce((best, p) => Math.abs(p.age - hoverAge) < Math.abs(best.age - hoverAge) ? p : best, data[0])
    : null;

  return (
    <div className={styles.wrap}>
      <p className={styles.title} style={{ paddingLeft: PAD.left }}>Lifespan curve</p>

      <svg
        width={W}
        height={H}
        className={styles.svg}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left - PAD.left;
          const age = Math.max(0, Math.min(maxAge, (x / PLOT_W) * maxAge));
          setHoverAge(age);
        }}
        onMouseLeave={() => setHoverAge(null)}
      >
        {/* Stage background bands */}
        {ranges.map((r, i) => (
          <rect
            key={r.stage + i}
            x={toSvgX(r.startAge, maxAge)}
            y={PAD.top}
            width={toSvgX(r.endAge, maxAge) - toSvgX(r.startAge, maxAge)}
            height={PLOT_H}
            fill={
              r.stage === "Adolescent" ? "rgba(255,210,62,0.35)" :
              r.stage === "Adult" ? "rgba(34,197,94,0.25)" :
              r.stage === "Senior" ? "rgba(248,113,113,0.25)" :
              i % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"
            }
          />
        ))}

        {/* Stage labels - rotated when band is narrow */}
        {ranges.map((r, i) => {
          const midX = (toSvgX(r.startAge, maxAge) + toSvgX(r.endAge, maxAge)) / 2;
          const bandW = toSvgX(r.endAge, maxAge) - toSvgX(r.startAge, maxAge);
          if (bandW < 8) return null;
          const narrow = bandW < 50;
          return (
            <text
              key={`label-${i}`}
              x={midX}
              y={PAD.top - 6}
              textAnchor={narrow ? "start" : "middle"}
              transform={narrow ? `rotate(-45, ${midX}, ${PAD.top - 6})` : undefined}
              className={styles.stageLabel}
            >
              {r.stage}
            </text>
          );
        })}

        {/* Grid lines */}
        {scoreTicks.map((s) => (
          <line
            key={s}
            x1={PAD.left}
            x2={PAD.left + PLOT_W}
            y1={toSvgY(s)}
            y2={toSvgY(s)}
            className={styles.gridLine}
          />
        ))}

        {/* Y axis labels */}
        {scoreTicks.map((s) => (
          <text key={`y-${s}`} x={PAD.left - 6} y={toSvgY(s) + 4} textAnchor="end" className={styles.axisLabel}>
            {s}
          </text>
        ))}

        {/* X axis labels */}
        {ageTicks.filter((a) => a % 2 === 0).map((a) => (
          <text key={`x-${a}`} x={toSvgX(a, maxAge)} y={PAD.top + PLOT_H + 18} textAnchor="middle" className={styles.axisLabel}>
            {a}
          </text>
        ))}

        {/* X axis title */}
        <text x={PAD.left + PLOT_W / 2} y={H - 4} textAnchor="middle" className={styles.axisTitle}>Age (years)</text>

        {/* Curve */}
        <path d={path} className={styles.curve} />

        {/* Area under curve */}
        <path
          d={`${path} L${toSvgX(data[data.length - 1].age, maxAge)},${PAD.top + PLOT_H} L${toSvgX(0, maxAge)},${PAD.top + PLOT_H} Z`}
          className={styles.curveArea}
        />

        {/* Hover line and dot */}
        {hoverPt && (
          <>
            <line
              x1={toSvgX(hoverPt.age, maxAge)}
              x2={toSvgX(hoverPt.age, maxAge)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              className={styles.hoverLine}
            />
            <circle
              cx={toSvgX(hoverPt.age, maxAge)}
              cy={toSvgY(hoverPt.score)}
              r={5}
              className={styles.hoverDot}
            />
            <text
              x={Math.min(toSvgX(hoverPt.age, maxAge) + 8, PAD.left + PLOT_W - 60)}
              y={toSvgY(hoverPt.score) - 10}
              className={styles.hoverLabel}
            >
              {hoverPt.age.toFixed(1)}y · {hoverPt.score.toFixed(0)}
            </text>
          </>
        )}

        {/* Axes */}
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + PLOT_H} className={styles.axis} />
        <line x1={PAD.left} x2={PAD.left + PLOT_W} y1={PAD.top + PLOT_H} y2={PAD.top + PLOT_H} className={styles.axis} />
      </svg>

    </div>
  );
}
