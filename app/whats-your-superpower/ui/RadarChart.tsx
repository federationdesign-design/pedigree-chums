// Five-axis unnumbered radar chart for What's Your Superpower.
//
// Display rules (spec section 9, all locked): one fixed scale derived from
// configuration, no visible numbers or level names, no within-player
// scaling, axis labels in fixed power order, set-based emphasis that never
// alters plotted values, positions, scale or polygon geometry.

import { POWERS, type Power } from "../lib/engine";
import styles from "./SuperpowerGame.module.css";

interface RadarChartProps {
  plot: Record<Power, number>;
  displayMin: number;
  displayMax: number;
  primaryEmphasisSet: Power[];
  secondaryEmphasisSet: Power[];
}

const CX = 180;
const CY = 168;
const R = 118;
const LABEL_R = R + 26;

function point(axisIndex: number, radius: number): [number, number] {
  const angle = (Math.PI / 180) * (-90 + axisIndex * 72);
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
}

function ringPoints(radius: number): string {
  return POWERS.map((_, i) => point(i, radius).map((n) => n.toFixed(2)).join(",")).join(" ");
}

export default function RadarChart({
  plot,
  displayMin,
  displayMax,
  primaryEmphasisSet,
  secondaryEmphasisSet,
}: RadarChartProps) {
  const toRadius = (v: number) => (v / displayMax) * R;
  const vertices = POWERS.map((p, i) => point(i, toRadius(plot[p])));
  const shape = vertices.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const rings = [1, 2, 3, 4].map((step) =>
    ringPoints((R * (displayMin + ((displayMax - displayMin) * step) / 4)) / displayMax)
  );

  const emphasised = primaryEmphasisSet.join(" and ");
  const ariaLabel =
    secondaryEmphasisSet.length > 0
      ? `Radar chart of your power mix for this round, with ${emphasised} emphasised and ${secondaryEmphasisSet[0]} close in support. The written result below says the same thing.`
      : `Radar chart of your power mix for this round, with ${emphasised} emphasised. The written result below says the same thing.`;

  return (
    <svg
      className={styles.chart}
      viewBox="0 0 360 330"
      role="img"
      aria-label={ariaLabel}
    >
      {rings.map((pts) => (
        <polygon key={pts} className={styles.chartRing} points={pts} />
      ))}
      {POWERS.map((p, i) => {
        const [x, y] = point(i, R);
        const spokeClass = primaryEmphasisSet.includes(p)
          ? `${styles.chartSpoke} ${styles.chartSpokePrimary}`
          : secondaryEmphasisSet.includes(p)
            ? `${styles.chartSpoke} ${styles.chartSpokeSecondary}`
            : styles.chartSpoke;
        return <line key={p} className={spokeClass} x1={CX} y1={CY} x2={x} y2={y} />;
      })}
      <polygon className={styles.chartShape} points={shape} />
      {POWERS.map((p, i) => {
        const [x, y] = vertices[i];
        if (primaryEmphasisSet.includes(p)) {
          return <circle key={p} className={styles.chartMarkerPrimary} cx={x} cy={y} r={7} />;
        }
        if (secondaryEmphasisSet.includes(p)) {
          return <circle key={p} className={styles.chartMarkerSecondary} cx={x} cy={y} r={5.5} />;
        }
        return <circle key={p} className={styles.chartMarker} cx={x} cy={y} r={3.5} />;
      })}
      {POWERS.map((p, i) => {
        const [x, y] = point(i, LABEL_R);
        const labelClass = primaryEmphasisSet.includes(p)
          ? `${styles.chartLabel} ${styles.chartLabelPrimary}`
          : secondaryEmphasisSet.includes(p)
            ? `${styles.chartLabel} ${styles.chartLabelSecondary}`
            : styles.chartLabel;
        return (
          <text
            key={p}
            className={labelClass}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {p}
          </text>
        );
      })}
    </svg>
  );
}
