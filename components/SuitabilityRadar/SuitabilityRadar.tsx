"use client";

import type { SuitabilityScore } from "../../data/suitabilityScores";
import styles from "./SuitabilityRadar.module.css";

interface Props {
  score: SuitabilityScore;
  breedName: string;
}

const AXES = [
  { key: "children",   label: "Children" },
  { key: "otherDogs",  label: "Other dogs" },
  { key: "cats",       label: "Cats" },
  { key: "smallHome",  label: "Small home" },
  { key: "firstTimer", label: "First-time owner" },
  { key: "timeAlone",  label: "Time alone" },
] as const;

const N = AXES.length;
const MAX = 5;
const CX = 160;
const CY = 160;
const R = 110; // outer ring radius

function angleOf(i: number): number {
  // Start at top (-90 deg), go clockwise
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

export default function SuitabilityRadar({ score, breedName }: Props) {
  const values = AXES.map((a) => score[a.key] as number);

  // Grid rings at 1,2,3,4,5
  const rings = [1, 2, 3, 4, 5];

  return (
    <div className={styles.wrap}>
      <p className={styles.heading}>Suitability</p>
      <svg
        viewBox={`0 0 ${CX * 2} ${CY * 2}`}
        width={CX * 2}
        height={CY * 2}
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

        {/* Axis labels */}
        {AXES.map((axis, i) => {
          const angle = angleOf(i);
          const labelR = R + 22;
          const [x, y] = point(angle, labelR);
          const anchor =
            Math.abs(Math.cos(angle)) < 0.15
              ? "middle"
              : Math.cos(angle) > 0
              ? "start"
              : "end";
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
            <span className={styles.scoreLabel}>{axis.label}</span>
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
