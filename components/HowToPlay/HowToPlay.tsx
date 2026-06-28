"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./HowToPlay.module.css";
import StepMap from "./StepMap";
import STEP_DATA from "./steps";

type Props = {
  open: boolean;
  onClose: () => void;
  onScore?: (pts: number) => void;
  activeStep?: number | null;
  cardPos?: { x: number; y: number; w: number; h: number; angle: number; image: string } | null;
};

const STEPS = [
  "Deal 3–6 cards per player",
  "Go for a walk, visit a park, or explore your town or city",
  "Spot real dogs and match with your cards",
  "Try and spot all your chums",
  "The player with the most pedigree chums wins",
];

const STEP_IMAGES = [
  "/step1-redue.jpg", "/step2-redue.jpg", "/step3-redue.jpg",
  "/step4-redue.jpg", "/step5-redue.jpg", "/step6-redue.jpg",
];

export default function HowToPlay({ open, onClose, onScore, activeStep = null, cardPos = null }: Props) {
  const stageElRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [step, setStep] = useState<number | null>(activeStep ?? null);
  useEffect(() => { setStep(activeStep ?? null); }, [activeStep, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onCloseRef.current(); return; }
      if (step !== null) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") setStep((s: number | null) => Math.min((s ?? 0) + 1, STEP_DATA.length - 1));
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

  const dropPiecesThenClose = () => {
    try {
      const vw = window.innerWidth;
      const STEP_SRCS = [
        "/step1-redue.jpg", "/step2-redue.jpg", "/step3-redue.jpg",
        "/step4-redue.jpg", "/step5-redue.jpg", "/step6-redue.jpg",
      ];
      const cardW = Math.round(Math.min(vw * 0.16, 140));
      const cardH = Math.round(cardW * 1.35);
      const pieces: { src: string; x: number; y: number; w: number; h: number; kind?: string }[] = [];
      STEP_SRCS.forEach((src, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = vw * 0.08 + col * (cardW + vw * 0.05) + (Math.random() * 20 - 10);
        const y = -cardH * 1.5 - row * (cardH + 20) - Math.random() * 40;
        pieces.push({ src, x, y, w: cardW, h: cardH, kind: "stepcard" });
        pieces.push({ src: "/blue-circle.svg", x: x - 8, y: y - 8, w: 30, h: 30, kind: "circle" });
        pieces.push({ src: `/${i + 1}object.svg`, x: x - 8, y: y - 8, w: 30, h: 30, kind: "number" });
      });
      const root = stageElRef.current;
      if (root) {
        const push = (el: Element | null, s: string) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return;
          pieces.push({ src: s, x: r.left, y: r.top, w: r.width, h: r.height });
        };
        push(root.querySelector("[data-htp='logo']"), "/dogbingo.svg");
        root.querySelectorAll("[data-htp='deco']").forEach((el: Element) => push(el, "/yellow-triangle.svg"));
      }
      if (pieces.length) window.dispatchEvent(new CustomEvent("pc:howtoplay-drop", { detail: { pieces } }));
    } catch {}
    onClose();
  };

  if (step !== null && STEP_DATA[step]) {
    return createPortal(
      <StepMap
        step={STEP_DATA[step]}
        onClose={() => {
          window.dispatchEvent(new CustomEvent("pc:howtoplay-step-viewed", { detail: { stepIdx: step } }));
          onClose();
        }}
        onScore={onScore}
        onPrev={() => setStep((s) => Math.max((s ?? 0) - 1, 0))}
        onNext={() => setStep((s) => Math.min((s ?? 0) + 1, STEP_DATA.length - 1))}
        hasPrev={step > 0}
        hasNext={step < STEP_DATA.length - 1}
        cardPos={cardPos}
      />,
      document.body
    );
  }

  const overviewView = (
    <div className={styles.overlay} onClick={dropPiecesThenClose}>
      <div className={styles.stage} ref={stageElRef} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={dropPiecesThenClose} aria-label="Close">
          &times;
        </button>
        <h3 className={styles.title}>
          How <span className={styles.accent}>it works</span>
        </h3>
        <div className={styles.stepScroll}>
          {STEP_IMAGES.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={`How to play, step ${i + 1}`} className={styles.stepImg} />
          ))}
        </div>
        <p className={styles.swipeHint} aria-hidden="true">
          Swipe to view <span className={styles.swipeArrow}>&rarr;</span>
        </p>
        <ol className={styles.steps}>
          {STEPS.map((s) => (
            <li key={s} className={styles.step}>
              <span className={styles.num} data-htp="num" aria-hidden="true" />
              <span className={styles.text}>{s}</span>
            </li>
          ))}
        </ol>
        <span className={styles.logo} data-htp="logo" aria-hidden="true" />
        <span className={`${styles.deco} ${styles.decoA}`} data-htp="deco" aria-hidden="true" />
        <span className={`${styles.deco} ${styles.decoB}`} data-htp="deco" aria-hidden="true" />
      </div>
    </div>
  );

  return createPortal(overviewView, document.body);
}