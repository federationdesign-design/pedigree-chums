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
  cardPos?: { x: number; y: number; w: number; h: number } | null;
};

export default function StepCard({ step, onClose, onPrev, onNext, totalSteps, onStepSelect, cardPos }: Props) {
  const panelStyle: React.CSSProperties = (() => {
    if (!cardPos || typeof window === "undefined") return {};
    const vw = window.innerWidth;
    const panelW = Math.min(520, vw * 0.44);
    const cardCentreX = cardPos.x;
    const margin = 32;
    // if card is in the right half, put panel on the left; otherwise right
    if (cardCentreX > vw / 2) {
      return { position: "fixed", right: vw - cardCentreX + cardPos.w / 2 + margin, left: "auto", top: "50%", transform: "translateY(-50%)", width: panelW };
    } else {
      return { position: "fixed", left: cardCentreX + cardPos.w / 2 + margin, right: "auto", top: "50%", transform: "translateY(-50%)", width: panelW };
    }
  })();

  return (
    <div className={styles.overlay} onClick={onClose}>

      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
        &times;
      </button>

      <div className={styles.panel} style={panelStyle} onClick={(e: React.MouseEvent) => e.stopPropagation()}>

        <div className={styles.header}>
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
  );
}
