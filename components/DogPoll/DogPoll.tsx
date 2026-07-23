"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
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
  locked = false,
  shakeSignal = 0,
  shakeAttempts = 0,
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
  locked?: boolean;
  shakeSignal?: number;
  shakeAttempts?: number;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const handlePick = (i: number) => {
    setPicked(i);
    onAnswer?.();
  };

  /* Web Animations API, not a CSS class/string toggle: guarantees a fresh,
     visible shake every single attempt regardless of React re-render timing.
     Each button gets its own amplitude/duration/delay so the two never move
     in lockstep -- explicitly requested. */
  useEffect(() => {
    if (shakeSignal === 0) return;
    btnRefs.current.forEach((el, i) => {
      if (!el) return;
      const amp = 4 + Math.min(shakeAttempts, 8) * 1.8 + i * 1.3;
      const dur = Math.max(420 - shakeAttempts * 24, 160);
      const dir = i === 0 ? 1 : -1;
      el.animate(
        [
          { transform: "translateX(0) rotate(0deg)" },
          { transform: `translateX(${-amp * dir}px) rotate(${-3 * dir}deg)` },
          { transform: `translateX(${amp * dir}px) rotate(${3 * dir}deg)` },
          { transform: `translateX(${-amp * 0.7 * dir}px) rotate(${-2 * dir}deg)` },
          { transform: `translateX(${amp * 0.4 * dir}px) rotate(${1 * dir}deg)` },
          { transform: "translateX(0) rotate(0deg)" },
        ],
        { duration: dur, delay: i * 60, easing: "ease-in-out" }
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shakeSignal]);

  return (
    <div className={styles.wrap}>
      <p className={titleFont === "body" ? styles.kickerBody : styles.kicker}>{title}</p>
      <p className={styles.question}>{question}</p>

      {picked === null ? (
        <div className={styles.options}>
          {options.map((opt, i) => (
            <button
              key={opt.label}
              ref={(el) => { btnRefs.current[i] = el; }}
              type="button"
              className={`${opt.color === "red" ? styles.optionRed : styles.option} ${locked ? styles.optionLocked : ""}`}
              onClick={() => handlePick(i)}
              style={{
                opacity: buttonsProgress,
                transform: `translateY(${(1 - buttonsProgress) * 14}px) scale(${0.9 + buttonsProgress * 0.1})`,
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
