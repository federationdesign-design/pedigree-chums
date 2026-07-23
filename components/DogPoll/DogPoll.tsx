"use client";

import * as React from "react";
import { useState } from "react";
import styles from "./DogPoll.module.css";

export type PollOption = {
  label: string;
  pct: number;
  resultLabel?: string;
  color?: "green" | "red";
};

/*
  Article poll. Tap an answer and the (canned) results reveal instantly with
  animated bars. Results are editorial, not tallied -- keep the joke visible
  via the footnote.
*/
export default function DogPoll({
  title = "What do you think?",
  titleFont = "display",
  question,
  options,
  footnote,
  onAnswer,
  buttonsProgress = 1,
  shake = 0,
}: {
  title?: string;
  titleFont?: "display" | "body";
  question: string;
  options: PollOption[];
  footnote?: string;
  /* Optional choreography hooks -- used only when this poll is embedded in
     a pinned scroll scene (ArgosChoreo). Standalone usage ignores them. */
  onAnswer?: () => void;
  buttonsProgress?: number;
  shake?: number;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const handlePick = (i: number) => {
    setPicked(i);
    onAnswer?.();
  };

  return (
    <div className={styles.wrap}>
      <p className={titleFont === "body" ? styles.kickerBody : styles.kicker}>{title}</p>
      <p className={styles.question}>{question}</p>

      {picked === null ? (
        <div className={styles.options}>
          {options.map((opt, i) => (
            <button
              key={opt.label}
              type="button"
              className={opt.color === "red" ? styles.optionRed : styles.option}
              onClick={() => handlePick(i)}
              style={{
                opacity: buttonsProgress,
                transform: `translateY(${(1 - buttonsProgress) * 14}px) scale(${0.9 + buttonsProgress * 0.1})`,
                animation: shake ? `dogPollShake${i % 2} ${Math.max(0.5 - shake * 0.035, 0.14)}s ease-in-out ${i * 0.08}s ${Math.min(2 + shake, 6)}` : undefined,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.results}>
          {options.map((opt, i) => (
            <div key={opt.label} className={styles.resultRow}>
              <div className={styles.resultHead}>
                <span className={i === picked ? styles.resultLabelPicked : styles.resultLabel}>
                  {opt.resultLabel || opt.label}
                  {i === picked ? " - you" : ""}
                </span>
                <span className={styles.resultPct}>{opt.pct}%</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={opt.color === "red" ? styles.barFillRed : styles.barFillLead}
                  style={{ width: `${opt.pct}%` }}
                />
              </div>
            </div>
          ))}
          {footnote && <p className={styles.footnote}>{footnote}</p>}
        </div>
      )}
    </div>
  );
}
