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
  "Deal 3–6 chums each",
  "Go for a walk or explore your town",
  "Look out for real dogs",
  "Match to your chum",
  "Find more chums",
  "Most chums wins",
];

const OVERVIEW_STEPS = [
  "Deal 3–6 chums each",
  "Go for a walk or explore your town",
  "Look out for real dogs",
  "Match to your chum",
  "Find more chums",
  "Most chums wins",
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
        // Cards scrolled out of view have width=0 -- use a fallback position above the pit
        const vw = window.innerWidth;
        cardRefs.current.forEach((el, i) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          const num = i + 1;
          const stepSrc = num === 1 ? `/step1-redue.jpg` : num === 2 ? `/step2-redue.jpg` : num === 3 ? `/step3-redue.jpg` : num === 4 ? `/step4-redue.jpg` : num === 5 ? `/step5-redue.jpg` : `/step6-redue.jpg`;
          // If off-screen (scrolled), use a staggered position above the pit
          const x = r.width > 2 ? r.left : vw * 0.1 + (i % 3) * (vw * 0.28 + 8);
          const y = r.width > 2 ? r.top : -200 - Math.floor(i / 3) * 220;
          const w = r.width > 2 ? r.width : Math.round(vw * 0.28);
          const h = r.width > 2 ? r.height : Math.round(w * 1.35);
          pieces.push({ src: stepSrc, x, y, w, h, kind: "stepcard" });
        });

        // Drop each blue circle separately -- same fallback for off-screen
        circleRefs.current.forEach((el, i) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          const cardEl = cardRefs.current[i];
          const cr = cardEl ? cardEl.getBoundingClientRect() : r;
          const x = r.width > 2 ? r.left : vw * 0.1 + (i % 3) * (vw * 0.28 + 8) - 14;
          const y = r.width > 2 ? r.top : -200 - Math.floor(i / 3) * 220 - 14;
          const w = r.width > 2 ? r.width : 48;
          const h = r.width > 2 ? r.height : 48;
          pieces.push({
            src: "/blue-circle.svg",
            x, y, w, h,
            kind: "circle",
          });
          // Yellow number drops from same position as circle
          pieces.push({
            src: `/${i + 1}object.svg`,
            x, y, w, h,
            kind: "number",
          });
        });

        // Logo and deco only -- circles and numbers already dispatched above as separate bodies
        const push = (el: Element | null, src: string) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return;
          pieces.push({ src, x: r.left, y: r.top, w: r.width, h: r.height });
        };
        push(root.querySelector("[data-htp='logo']"), "/dogbingo.svg");
        root.querySelectorAll("[data-htp='deco']").forEach((el: Element) => push(el, "/yellow-triangle.svg"));
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
  // Position the panel so it expands from the HTP card's location in the pit
  const stageStyle: React.CSSProperties = (() => {
    if (!cardPos) return {};
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const panelW = Math.min(vw * 0.94, 1180);
    const panelH = Math.min(vh * 0.9, 900);
    // Anchor to card position, clamp so panel stays on screen
    let left = cardPos.x - panelW * 0.15; // slight offset left so card is near top-left of panel
    let top = cardPos.y - panelH * 0.1;
    left = Math.max(12, Math.min(vw - panelW - 12, left));
    top = Math.max(12, Math.min(vh - panelH - 12, top));
    // transform-origin relative to the panel so animation expands from card point
    const ox = cardPos.x - left;
    const oy = cardPos.y - top;
    return {
      position: "fixed" as const,
      left,
      top,
      width: panelW,
      transformOrigin: `${ox}px ${oy}px`,
    };
  })();

  return createPortal(
    <div className={styles.overlay} onClick={dropPiecesThenClose}>
      <div className={styles.stage} ref={stageElRef} style={stageStyle} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={dropPiecesThenClose} aria-label="Close">
          &times;
        </button>

        <h3 className={styles.title}>
          How <span className={styles.accent}>it works</span>
        </h3>

        {/* New CSS-built step cards -- replace old image strip */}
        <div className={styles.cardRow}>
          {[1, 2, 3, 4, 5, 6].map((n, i) => (
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
                src={n === 1 ? `/step1-redue.jpg` : n === 2 ? `/step2-redue.jpg` : n === 3 ? `/step3-redue.jpg` : n === 4 ? `/step4-redue.jpg` : n === 5 ? `/step5-redue.jpg` : `/step6-redue.jpg`}
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
