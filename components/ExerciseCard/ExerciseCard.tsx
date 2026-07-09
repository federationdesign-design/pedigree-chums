"use client";

import type { ExerciseNeeds } from "../../data/exerciseNeeds";
import styles from "./ExerciseCard.module.css";

interface Props {
  data: ExerciseNeeds;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const INTENSITY_LABELS: Record<number, string> = {
  1: "Gentle",
  2: "Moderate",
  3: "Active",
  4: "High output",
};

const INTENSITY_ICONS: Record<number, string> = {
  1: "🚶",
  2: "🚶",
  3: "🏃",
  4: "⚡",
};

// Max bar height in px
const BAR_MAX = 100;
// Max possible minutes (used to scale bars)
const SCALE_MAX = 160;

function barHeight(minutes: number, multiplier: number): number {
  const actual = minutes * multiplier;
  return Math.min(BAR_MAX, (actual / SCALE_MAX) * BAR_MAX);
}

function formatMins(minutes: number, multiplier: number): string {
  const m = Math.round(minutes * multiplier);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }
  return `${m}m`;
}

export default function ExerciseCard({ data }: Props) {
  const { minutesPerDay, intensity, weekPattern, copesAlone, notes } = data;

  return (
    <>
      <p className={styles.heading}>Exercise needs</p>

      {/* Intensity + daily average row */}
      <div className={styles.statsRow}>
        <div className={styles.statBlock}>
          <span className={styles.statValue}>{minutesPerDay}<span className={styles.statUnit}>min/day</span></span>
          <span className={styles.statLabel}>Daily average</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statBlock}>
          <span className={styles.statValue}>{INTENSITY_ICONS[intensity]}</span>
          <span className={styles.statLabel}>{INTENSITY_LABELS[intensity]}</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statBlock}>
          <div className={styles.copeDots}>
            {[1, 2, 3, 4, 5].map((d) => (
              <span key={d} className={d <= copesAlone ? styles.dotFilled : styles.dotEmpty} />
            ))}
          </div>
          <span className={styles.statLabel}>Copes with rest days</span>
        </div>
      </div>

      {/* Day column chart */}
      <div className={styles.chartWrap}>
        {DAYS.map((day, i) => {
          const multiplier = weekPattern[i];
          const h = barHeight(minutesPerDay, multiplier);
          const mins = formatMins(minutesPerDay, multiplier);
          const isWeekend = i >= 5;
          return (
            <div key={day} className={styles.dayCol}>
              <span className={styles.dayMins}>{mins}</span>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.bar} ${isWeekend ? styles.barWeekend : ""}`}
                  style={{ height: `${h}px` }}
                />
              </div>
              <span className={`${styles.dayLabel} ${isWeekend ? styles.dayLabelWeekend : ""}`}>{day}</span>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <p className={styles.notes}>{notes}</p>

      <p className={styles.disclaimer}>
        Typical breed guidelines. Individual dogs vary by age, health and temperament.
      </p>
    </>
  );
}
