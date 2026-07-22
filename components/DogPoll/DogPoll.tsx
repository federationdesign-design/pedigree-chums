"use client";

import * as React from "react";
import { useState } from "react";
import styles from "./DogPoll.module.css";

export type PollOption = {
  label: string;
  pct: number;
};

/*
  Article poll. Tap an answer and the (canned) results reveal instantly with
  animated bars. Results are editorial, not tallied -- keep the joke visible
  via the footnote.
*/
export default function DogPoll({
  question,
  options,
  footnote,
}: {
  question: string;
  options: PollOption[];
  footnote?: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className={styles.wrap}>
      <p className={styles.kicker}>Quick poll</p>
      <p className={styles.question}>{question}</p>

      {picked === null ? (
        <div className={styles.options}>
          {options.map((opt, i) => (
            <button key={opt.label} type="button" className={styles.option} onClick={() => setPicked(i)}>
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
                  {opt.label}
                  {i === picked ? " — you" : ""}
                </span>
                <span className={styles.resultPct}>{opt.pct}%</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={i === 0 ? styles.barFillLead : styles.barFill}
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
