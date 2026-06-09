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
// CardRail and drives this via open/onClose. The panel pops in with the same
// 3D effect as the video lightbox: the stage is a DIRECT child of the overlay,
// so the overlay's perspective reaches it (a nested wrapper would flatten it).
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
        </h3>

        <div className={styles.stripWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/how-to-play-comic-strip.png"
            alt="How to play, step by step"
            className={styles.strip}
          />
        </div>

        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step} className={styles.step}>
              <span className={styles.num} aria-hidden="true" />
              <span className={styles.text}>{step}</span>
            </li>
          ))}
        </ol>

        <span className={styles.logo} aria-hidden="true" />
        <span className={`${styles.deco} ${styles.decoA}`} aria-hidden="true" />
        <span className={`${styles.deco} ${styles.decoB}`} aria-hidden="true" />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
