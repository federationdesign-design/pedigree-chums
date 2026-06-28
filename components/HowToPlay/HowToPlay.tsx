"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./HowToPlay.module.css";
import StepCard from "./StepCard";
import STEPS from "./steps";

type Props = {
  open: boolean;
  onClose: () => void;
  activeStep?: number | null;
  cardPos?: { x: number; y: number; w: number; h: number; angle: number; image: string } | null;
};

const CAPTIONS = [
  "Deal a few cards evenly among the players",
  "The game starts right away",
  "Look for a real life dog",
  "See if they match your cards",
  "Find the most to win",
];

const OVERVIEW_STEPS = [
  "Deal 3\u20136 cards per player",
  "Go for a walk, visit a park, or explore your town or city",
  "Spot real dogs and match with your cards",
  "Try and spot all your chums",
  "The player with the most pedigree chums wins",
];

// Card dimensions -- physics body will use these exact values
const CARD_W = 200;  // px in the overlay (scales with CSS)
const CARD_ASPECT = 1.35; // height / width ratio
const CARD_H = Math.round(CARD_W * CARD_ASPECT);
const FOOTER_H = 44; // caption footer height

export default function HowToPlay({ open, onClose, activeStep = null, cardPos = null }: Props) {
  const stageElRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [step, setStep] = useState<number | null>(activeStep ?? null);
  useEffect(() => { setStep(activeStep ?? null); }, [activeStep, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onCloseRef.current(); return; }
      if (step !== null) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") setStep((s: number | null) => Math.min((s ?? 0) + 1, STEPS.length - 1));
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") setStep((s: number | null) => Math.max((s ?? 0) - 1, 0));
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, step]);

  if (!open || typeof document === "undefined") return null;

  const closeStepCard = () => {
    if (step !== null) {
      window.dispatchEvent(new CustomEvent("pc:howtoplay-step-viewed", { detail: { stepIdx: step } }));
    }
    onClose();
  };

  const dropPiecesThenClose = () => {
    try {
      const pieces: { src: string; x: number; y: number; w: number; h: number; kind?: string }[] = [];
      const root = stageElRef.current;

      if (root) {
        // Drop each step card using its actual rendered bounds
        cardRefs.current.forEach((el, i) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return;
          pieces.push({
            src: `/raw-step${i + 1}.jpg`,
            x: r.left, y: r.top,
            w: r.width, h: r.height,
            kind: "stepcard",
          });
        });

        // Drop each blue circle separately
        circleRefs.current.forEach((el, i) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return;
          pieces.push({
            src: "/blue-circle.svg",
            x: r.left, y: r.top,
            w: r.width, h: r.height,
            kind: "circle",
          });
        });

        // Logo and deco
        const push = (el: Element | null, src: string) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return;
          pieces.push({ src, x: r.left, y: r.top, w: r.width, h: r.height });
        };
        push(root.querySelector("[data-htp='logo']"), "/dogbingo.svg");
        root.querySelectorAll("[data-htp='deco']").forEach((el: Element) => push(el, "/yellow-triangle.svg"));
        // Yellow numbers -- now rendered on the circle, drop separately
        root.querySelectorAll("[data-htp='num']").forEach((el: Element, i: number) => push(el, `/${i + 1}object.svg`));
      }

      if (pieces.length) window.dispatchEvent(new CustomEvent("pc:howtoplay-drop", { detail: { pieces } }));
    } catch {
      /* close cleanly */
    }
    onClose();
  };

  // --- Step card view ---
  if (step !== null) {
    return createPortal(
      <StepCard
        step={STEPS[step]}
        onClose={closeStepCard}
        cardPos={cardPos}
      />,
      document.body
    );
  }

  // --- Full overview ---
  return createPortal(
    <div className={styles.overlay} onClick={dropPiecesThenClose}>
      <div className={styles.stage} ref={stageElRef} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={dropPiecesThenClose} aria-label="Close">
          &times;
        </button>

        <h3 className={styles.title}>
          How <span className={styles.accent}>it works</span>
        </h3>

        {/* New CSS-built step cards -- replace old image strip */}
        <div className={styles.cardRow}>
          {[1, 2, 3, 4, 5].map((n, i) => (
            <div
              key={n}
              className={styles.stepCard}
              ref={(el) => { cardRefs.current[i] = el; }}
            >
              {/* Blue circle + yellow number -- separate physics body */}
              <div
                className={styles.stepCircle}
                ref={(el) => { circleRefs.current[i] = el; }}
                data-htp="num"
                aria-hidden="true"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/${n}object.svg`}
                  alt=""
                  aria-hidden="true"
                  className={styles.stepNum}
                />
              </div>
              {/* Card illustration */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/raw-step${n}.jpg`}
                alt={`Step ${n}`}
                className={styles.stepIllo}
              />
              {/* Footer caption */}
              <div className={styles.stepFooter}>
                {CAPTIONS[i]}
              </div>
            </div>
          ))}
        </div>

        <p className={styles.swipeHint} aria-hidden="true">
          Swipe to view <span className={styles.swipeArrow}>&rarr;</span>
        </p>

        <ol className={styles.steps}>
          {OVERVIEW_STEPS.map((s) => (
            <li key={s} className={styles.step}>
              <span className={styles.num} aria-hidden="true" />
              <span className={styles.text}>{s}</span>
            </li>
          ))}
        </ol>

        <span className={styles.logo} data-htp="logo" aria-hidden="true" />
        <span className={`${styles.deco} ${styles.decoA}`} data-htp="deco" aria-hidden="true" />
        <span className={`${styles.deco} ${styles.decoB}`} data-htp="deco" aria-hidden="true" />
      </div>
    </div>,
    document.body
  );
}
