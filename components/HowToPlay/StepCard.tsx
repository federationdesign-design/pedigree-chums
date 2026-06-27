"use client";
import React from "react";
import styles from "./StepCard.module.css";

export type StepRow = {
  icon: string; // path to SVG in /public
  title: string;
  body: string;
};

export type StepData = {
  number: number;
  illustration: string; // path to image in /public
  caption: string;
  heading: string;
  rows: StepRow[];
};

type Props = {
  step: StepData;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  totalSteps: number;
};

export default function StepCard({ step, onClose, onPrev, onNext, totalSteps }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e: React.MouseEvent) => e.stopPropagation()}>

        {/* Close */}
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          &times;
        </button>

        {/* Left: illustration panel */}
        <div className={styles.left}>
          <div className={styles.stepBadge}>{step.number}</div>
          <div className={styles.illustration}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={step.illustration} alt={`Step ${step.number} illustration`} className={styles.illustrationImg} />
            <div className={styles.caption}>{step.caption}</div>
          </div>
        </div>

        {/* Right: content */}
        <div className={styles.right}>
          <p className={styles.overline}>HOW TO PLAY...</p>
          <h2 className={styles.heading}>{step.heading}</h2>

          <div className={styles.rows}>
            {step.rows.map((row, i) => (
              <div key={i} className={styles.row}>
                <div className={styles.iconWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.icon} alt="" className={styles.icon} aria-hidden="true" />
                </div>
                <div className={styles.rowText}>
                  <p className={styles.rowTitle}>{row.title}</p>
                  <p className={styles.rowBody}>{row.body}</p>
                </div>
                {i < step.rows.length - 1 && <div className={styles.divider} />}
              </div>
            ))}
          </div>
        </div>

        {/* Prev / Next */}
        {onPrev && (
          <button type="button" className={`${styles.nav} ${styles.navPrev}`} onClick={onPrev} aria-label="Previous step">
            &#8592;
          </button>
        )}
        {onNext && (
          <button type="button" className={`${styles.nav} ${styles.navNext}`} onClick={onNext} aria-label="Next step">
            &#8594;
          </button>
        )}

        {/* Dots */}
        <div className={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === step.number - 1 ? styles.dotActive : ""}`} />
          ))}
        </div>

      </div>
    </div>
  );
}
