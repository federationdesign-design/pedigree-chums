"use client";

import type { SuitabilityScore } from "../../data/suitabilityScores";
import styles from "./SuitabilityRadar.module.css";

interface Props {
  score: SuitabilityScore;
  breedName: string;
  /* TIGHT, the chum page only, 21 September 2026 (owner: close up the space between the
     title and the diagram, and between the diagram and the scores below). The chart is
     drawn in a 320 square with about 29 units of nothing above the top label and below
     the bottom one; tight crops that away and closes the gaps either side of it. Every
     other page that shows this card keeps it as it was. */
  tight?: boolean;
}

const AXES = [
  { key: "children",   label: "Children",       line2: null },
  { key: "otherDogs",  label: "Other",          line2: "dogs" },
  { key: "cats",       label: "Cats",           line2: null },
  { key: "smallHome",  label: "Small home",     line2: null },
  { key: "firstTimer", label: "1st-time",       line2: "owner" },
  { key: "timeAlone",  label: "Time",           line2: "alone" },
] as const;

const N = AXES.length;
const MAX = 5;
const CX = 160;
const CY = 160;
const R = 100;
// The empty band above the top label and below the bottom one, cut in tight mode.
// The top and bottom labels sit at CY -/+ (R + 26) = 34 and 286, 5 units tall either
// side, so 25 leaves them a 4-unit margin.
const TIGHT_TRIM = 25;

function angleOf(i: number): number {
  return (Math.PI * 2 * i) / N - Math.PI / 2;
}

function point(angle: number, radius: number): [number, number] {
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
}

function polygonPoints(values: number[]): string {
  return values
    .map((v, i) => {
      const r = (v / MAX) * R;
      const [x, y] = point(angleOf(i), r);
      return `${x},${y}`;
    })
    .join(" ");
}

export default function SuitabilityRadar({ score, breedName, tight = false }: Props) {
  const values = AXES.map((a) => score[a.key] as number);
  const rings = [1, 2, 3, 4, 5];

  return (
    <div className={`${styles.wrap}${tight ? " " + styles.wrapTight : ""}`}>
      <p className={styles.heading}>Suitability</p>
      <svg
        viewBox={tight ? `0 ${TIGHT_TRIM} ${CX * 2} ${CY * 2 - TIGHT_TRIM * 2}` : `0 0 ${CX * 2} ${CY * 2}`}
        width={CX * 2}
        height={tight ? CY * 2 - TIGHT_TRIM * 2 : CY * 2}
        aria-label={`Suitability radar chart for ${breedName}`}
        className={styles.svg}
      >
        {/* Grid rings */}
        {rings.map((ring) => {
          const ringR = (ring / MAX) * R;
          const pts = Array.from({ length: N }, (_, i) => {
            const [x, y] = point(angleOf(i), ringR);
            return `${x},${y}`;
          }).join(" ");
          return (
            <polygon
              key={ring}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={ring === MAX ? 1 : 0.5}
            />
          );
        })}

        {/* Axis spokes */}
        {AXES.map((_, i) => {
          const [x, y] = point(angleOf(i), R);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Filled data polygon */}
        <polygon
          points={polygonPoints(values)}
          fill="rgba(255,210,62,0.25)"
          stroke="var(--yellow, #ffd23e)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data point dots */}
        {values.map((v, i) => {
          const r = (v / MAX) * R;
          const [x, y] = point(angleOf(i), r);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4}
              fill="var(--yellow, #ffd23e)"
              stroke="var(--navy, #0a3a57)"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Axis labels -- two-line where needed */}
        {AXES.map((axis, i) => {
          const angle = angleOf(i);
          const labelR = R + 26;
          const [x, y] = point(angle, labelR);
          const anchor =
            Math.abs(Math.cos(angle)) < 0.15
              ? "middle"
              : Math.cos(angle) > 0
              ? "start"
              : "end";
          if (axis.line2) {
            return (
              <text
                key={axis.key}
                x={x}
                y={y}
                textAnchor={anchor}
                dominantBaseline="central"
                className={styles.label}
              >
                <tspan x={x} dy="-0.6em">{axis.label}</tspan>
                <tspan x={x} dy="1.2em">{axis.line2}</tspan>
              </text>
            );
          }
          return (
            <text
              key={axis.key}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="central"
              className={styles.label}
            >
              {axis.label}
            </text>
          );
        })}
      </svg>

      {/* Score row beneath chart */}
      <div className={styles.scoreRow}>
        {AXES.map((axis) => (
          <div key={axis.key} className={styles.scoreItem}>
            <span className={styles.scoreLabel}>
              {axis.line2 ? `${axis.label} ${axis.line2}` : axis.label}
            </span>
            <div className={styles.dots}>
              {[1, 2, 3, 4, 5].map((d) => (
                <span
                  key={d}
                  className={d <= (score[axis.key] as number) ? styles.dotFilled : styles.dotEmpty}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className={styles.disclaimer}>
        Scores reflect typical breed traits. Individual dogs vary with upbringing and environment.
      </p>
    </div>
  );
}
