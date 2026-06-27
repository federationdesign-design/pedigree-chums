"use client";
import React from "react";
import styles from "./StepCard.module.css";

export type StepRow = {
  icon: string;
  title: string;
  body: string;
};

export type StepData = {
  number: number;
  illustration: string;
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
  onStepSelect: (i: number) => void;
};

export default function StepCard({ step, onClose, onPrev, onNext, totalSteps, onStepSelect }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>

      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
        &times;
      </button>

      <div className={styles.panel} onClick={(e: React.MouseEvent) => e.stopPropagation()}>

        {/* Illustration -- left column */}
        <div className={styles.illustration}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={step.illustration} alt={`Step ${step.number} illustration`} className={styles.illustrationImg} />
          <div className={styles.illustrationCaption}>{step.caption}</div>
        </div>

        {/* Content -- right column */}
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.badge}>{step.number}</div>
            <div className={styles.headingGroup}>
              <p className={styles.overline}>HOW TO PLAY...</p>
              <h2 className={styles.heading}>{step.heading}</h2>
            </div>
          </div>

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

          <div className={styles.navRow}>
            <button type="button" className={styles.nav} onClick={onPrev} disabled={!onPrev} aria-label="Previous step">
              &#8592;
            </button>
            <div className={styles.dots}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`${styles.dot} ${i === step.number - 1 ? styles.dotActive : ""}`}
                  onClick={() => onStepSelect(i)}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
            <button type="button" className={styles.nav} onClick={onNext} disabled={!onNext} aria-label="Next step">
              &#8594;
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
