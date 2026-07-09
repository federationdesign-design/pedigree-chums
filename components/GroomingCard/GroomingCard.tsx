"use client";

import type { GroomingNeeds } from "../../data/groomingNeeds";
import styles from "./GroomingCard.module.css";

interface Props {
  data: GroomingNeeds;
}

const SHEDDING_LABELS: Record<number, string> = {
  1: "Minimal",
  2: "Light",
  3: "Moderate",
  4: "Heavy",
  5: "Very heavy",
};

export default function GroomingCard({ data }: Props) {
  const {
    timePerWeek,
    monthlyProfessionalCost,
    professionalFrequency,
    homeGroomingTools,
    sheddingLevel,
    coatType,
    notes,
  } = data;

  const hoursPerWeek = timePerWeek >= 60
    ? `${Math.floor(timePerWeek / 60)}h ${timePerWeek % 60 > 0 ? `${timePerWeek % 60}m` : ""}`.trim()
    : `${timePerWeek}m`;

  return (
    <>
      <p className={styles.heading}>Grooming</p>

      {/* Coat type pill */}
      <div className={styles.coatPill}>{coatType}</div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statBlock}>
          <span className={styles.statValue}>{hoursPerWeek}</span>
          <span className={styles.statLabel}>Home grooming per week</span>
        </div>
        <div className={styles.statBlock}>
          {monthlyProfessionalCost > 0 ? (
            <>
              <span className={styles.statValue}>£{monthlyProfessionalCost}<span className={styles.statUnit}>/mo</span></span>
              <span className={styles.statLabel}>Professional grooming</span>
              {professionalFrequency && (
                <span className={styles.statSub}>{professionalFrequency}</span>
              )}
            </>
          ) : (
            <>
              <span className={styles.statValue}>£0</span>
              <span className={styles.statLabel}>Professional grooming</span>
              <span className={styles.statSub}>Not typically needed</span>
            </>
          )}
        </div>
      </div>

      {/* Shedding level */}
      <div className={styles.sheddingRow}>
        <span className={styles.sheddingLabel}>Shedding</span>
        <div className={styles.sheddingBars}>
          {[1, 2, 3, 4, 5].map((d) => (
            <div
              key={d}
              className={`${styles.sheddingBar} ${d <= sheddingLevel ? styles.sheddingBarFilled : ""}`}
            />
          ))}
        </div>
        <span className={styles.sheddingText}>{SHEDDING_LABELS[sheddingLevel]}</span>
      </div>

      {/* Tools needed */}
      <div className={styles.toolsSection}>
        <span className={styles.toolsTitle}>Tools you will need</span>
        <div className={styles.toolsList}>
          {homeGroomingTools.map((tool) => (
            <span key={tool} className={styles.toolPill}>{tool}</span>
          ))}
        </div>
      </div>

      {/* Notes */}
      <p className={styles.notes}>{notes}</p>

      <p className={styles.disclaimer}>
        Typical breed guidelines. Costs vary by location and coat condition.
      </p>
    </>
  );
}
