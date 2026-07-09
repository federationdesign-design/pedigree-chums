"use client";

import type { TrainingDifficulty } from "../../data/trainingDifficulty";
import styles from "./TrainingCard.module.css";

interface Props {
  data: TrainingDifficulty;
}

const SCORE_COLOURS = ["#22c55e", "#4ade80", "#ffd23e", "#fb923c", "#ef4444"];
const SCORE_BG      = ["rgba(34,197,94,0.15)", "rgba(74,222,128,0.15)", "rgba(255,210,62,0.15)", "rgba(251,146,60,0.15)", "rgba(239,68,68,0.15)"];

// Arc gauge: draws a semicircle gauge from left to right
// Full arc = 180deg. Score 1-5 fills a proportional segment.
const GAUGE_R = 80;
const GAUGE_CX = 110;
const GAUGE_CY = 100;

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export default function TrainingCard({ data }: Props) {
  const { score, label, traits, goodFor, watchOut } = data;
  const colour = SCORE_COLOURS[score - 1];
  const bgColour = SCORE_BG[score - 1];

  // Gauge: start at 180deg (left), end proportional to score
  const fillDeg = (score / 5) * 180;
  const startDeg = 180;
  const endDeg = 180 + fillDeg;

  return (
    <div className={styles.inner}>
      <p className={styles.heading}>Training</p>

      {/* Arc gauge */}
      <div className={styles.gaugeWrap}>
        <svg viewBox="0 0 220 110" width={220} height={110} aria-label={`Training difficulty gauge: ${score} out of 5`}>
          {/* Track arc */}
          <path
            d={describeArc(GAUGE_CX, GAUGE_CY, GAUGE_R, 180, 360)}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={14}
            strokeLinecap="round"
          />
          {/* Fill arc */}
          <path
            d={describeArc(GAUGE_CX, GAUGE_CY, GAUGE_R, startDeg, endDeg)}
            fill="none"
            stroke={colour}
            strokeWidth={14}
            strokeLinecap="round"
          />
          {/* Score number */}
          <text
            x={GAUGE_CX}
            y={GAUGE_CY - 8}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: "var(--font-display,'Luckiest Guy',cursive)", fontSize: 32, fill: colour, letterSpacing: "0.04em" }}
          >
            {score}
          </text>
          <text
            x={GAUGE_CX}
            y={GAUGE_CY + 18}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: "var(--font-body,'Montserrat',sans-serif)", fontSize: 9, fontWeight: 700, fill: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}
          >
            out of 5
          </text>
          {/* Scale markers */}
          {["Easy", "", "", "", "Hard"].map((t, i) => {
            const deg = 180 + (i / 4) * 180;
            const rad = (deg * Math.PI) / 180;
            const mx = GAUGE_CX + (GAUGE_R + 14) * Math.cos(rad);
            const my = GAUGE_CY + (GAUGE_R + 14) * Math.sin(rad);
            return t ? (
              <text key={i} x={mx} y={my} textAnchor={i === 0 ? "end" : "start"} dominantBaseline="central"
                style={{ fontFamily: "var(--font-body,'Montserrat',sans-serif)", fontSize: 8, fontWeight: 700, fill: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                {t}
              </text>
            ) : null;
          })}
        </svg>

        {/* Label pill */}
        <div className={styles.labelPill} style={{ background: bgColour, color: colour, borderColor: colour }}>
          {label}
        </div>
      </div>

      {/* Traits */}
      <ul className={styles.traitsList}>
        {traits.map((t) => (
          <li key={t} className={styles.trait}>
            <span className={styles.traitDot} style={{ background: colour }} />
            {t}
          </li>
        ))}
      </ul>

      {/* Good for / watch out */}
      <div className={styles.infoRow}>
        <div className={styles.infoBlock}>
          <span className={styles.infoTitle}>Excels at</span>
          <span className={styles.infoText}>{goodFor}</span>
        </div>
      </div>
      <div className={styles.infoRow}>
        <div className={styles.infoBlockWarn}>
          <span className={styles.infoTitle}>Watch out for</span>
          <span className={styles.infoText}>{watchOut}</span>
        </div>
      </div>

      <p className={styles.disclaimer}>
        Typical breed traits. Individual dogs vary with socialisation and consistency of training.
      </p>
    </div>
  );
}
