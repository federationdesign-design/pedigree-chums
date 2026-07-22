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
  question,
  options,
  footnote,
}: {
  title?: string;
  question: string;
  options: PollOption[];
  footnote?: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className={styles.wrap}>
      <p className={styles.kicker}>{title}</p>
      <p className={styles.question}>{question}</p>

      {picked === null ? (
        <div className={styles.options}>
          {options.map((opt, i) => (
            <button
              key={opt.label}
              type="button"
              className={opt.color === "red" ? styles.optionRed : styles.option}
              onClick={() => setPicked(i)}
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
