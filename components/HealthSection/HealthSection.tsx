"use client";

import { useState } from "react";
import type { BreedHealthProfile, HealthCondition } from "../../data/healthConditions";
import styles from "./HealthSection.module.css";

interface Props {
  profile: BreedHealthProfile;
}

const SEVERITY_COLOURS = ["#22c55e", "#84cc16", "#ffd23e", "#fb923c", "#ef4444"];
const SEVERITY_LABELS  = ["Minor", "Mild", "Moderate", "Serious", "Severe"];

const LIKELIHOOD_LABELS: Record<HealthCondition["likelihood"], string> = {
  "rare":        "Rare",
  "occasional":  "Occasional",
  "common":      "Common",
  "very-common": "Very common",
};

const LIKELIHOOD_COLOURS: Record<HealthCondition["likelihood"], string> = {
  "rare":        "rgba(92,196,238,0.2)",
  "occasional":  "rgba(255,210,62,0.2)",
  "common":      "rgba(251,146,60,0.2)",
  "very-common": "rgba(239,68,68,0.2)",
};

const LIKELIHOOD_TEXT: Record<HealthCondition["likelihood"], string> = {
  "rare":        "#5cc4ee",
  "occasional":  "#ffd23e",
  "common":      "#fb923c",
  "very-common": "#ef4444",
};

const ONSET_LABELS: Record<HealthCondition["onsetStage"], string> = {
  "puppy":  "Puppy",
  "adult":  "Adult",
  "senior": "Senior",
  "any":    "Any age",
};

export default function HealthSection({ profile }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  // Sort by severity descending, then likelihood
  const likelihoodOrder = { "very-common": 0, "common": 1, "occasional": 2, "rare": 3 };
  const sorted = [...profile.conditions].sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity;
    return likelihoodOrder[a.likelihood] - likelihoodOrder[b.likelihood];
  });

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Known health conditions</h2>
      <p className={styles.note}>{profile.generalNote}</p>

      {/* Column headers */}
      <div className={styles.tableHead}>
        <span className={styles.colCondition}>Condition</span>
        <span className={styles.colSeverity}>Severity</span>
        <span className={styles.colLikelihood}>Likelihood</span>
        <span className={styles.colToggle} />
      </div>

      {/* Accordion rows */}
      <div className={styles.rows}>
        {sorted.map((c, i) => {
          const isOpen = openIndex === i;
          const colour = SEVERITY_COLOURS[c.severity - 1];
          return (
            <div key={c.name} className={`${styles.row} ${isOpen ? styles.rowOpen : ""}`}>
              <button
                className={styles.rowHeader}
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
              >
                <span className={styles.colCondition}>
                  {c.name}
                </span>
                <span className={styles.colSeverity}>
                  <span className={styles.severityDots}>
                    {[1,2,3,4,5].map((d) => (
                      <span key={d} className={styles.dot} style={{ background: d <= c.severity ? colour : "rgba(255,255,255,0.15)" }} />
                    ))}
                  </span>
                </span>
                <span className={styles.colLikelihood}>
                  <span className={styles.severityDots}>
                    {[1,2,3,4].map((d) => {
                      const filled = d <= { "rare": 1, "occasional": 2, "common": 3, "very-common": 4 }[c.likelihood];
                      return <span key={d} className={styles.dot} style={{ background: filled ? LIKELIHOOD_TEXT[c.likelihood] : "rgba(255,255,255,0.15)" }} />;
                    })}
                  </span>
                </span>
                <span className={styles.colToggle}>
                  <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>↓</span>
                </span>
              </button>
              {isOpen && (
                <div className={styles.rowBody}>
                  <p className={styles.description}>{c.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className={styles.disclaimer}>
        This is a general guide based on published breed health surveys and veterinary literature. Not all dogs will develop these conditions. Always obtain health-tested parents from a responsible breeder and maintain regular vet check-ups.
      </p>
    </div>
  );
}
