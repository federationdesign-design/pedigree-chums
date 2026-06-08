"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./HowToPlay.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

const STEPS = [
  "Deal 3–6 cards per player",
  "Go for a walk, visit a park, or explore your town or city",
  "Spot real dogs and match with your cards",
  "Try and spot all your chums",
  "The player with the most pedigree chums wins",
];

// Controlled "How it works" popup. The trigger (the feature card) lives in
// CardRail and drives this via the open/onClose props. The comic strip is
// pinned full-width along the bottom of the viewport, with the text panel above.
export default function HowToPlay({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const modal = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panelArea}>
        <div className={styles.stage} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>

          <h3 className={styles.title}>
            How <span className={styles.accent}>it works</span>
            <span className={styles.tri} aria-hidden="true">&#9661;</span>
          </h3>

          <ol className={styles.steps}>
            {STEPS.map((step) => (
              <li key={step} className={styles.step}>
                <span className={styles.num} aria-hidden="true" />
                <span className={styles.text}>{step}</span>
              </li>
            ))}
          </ol>

          <span className={styles.logo} aria-hidden="true" />
        </div>
      </div>

      <div className={styles.bottomStrip} onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/how-to-play-comic-strip.png"
          alt="How to play, step by step"
          className={styles.stripImg}
        />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
