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

  // Pause pit while overview is open
  useEffect(() => {
    if (open && step === null) window.dispatchEvent(new Event("pc:overlay-opened"));
    if (!open) window.dispatchEvent(new Event("pc:overlay-closed"));
  }, [open, step]);

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
      const STEP_SRCS = [
        "/step1-redue.jpg", "/step2-redue.jpg", "/step3-redue.jpg",
        "/step4-redue.jpg", "/step5-redue.jpg", "/step6-redue.jpg",
      ];
      const pieces: { src: string; x: number; y: number; w: number; h: number; kind?: string }[] = [];
      const root = stageElRef.current;
      if (root) {
        // Read actual DOM positions of step images so cards drop from where they appear
        const imgs = root.querySelectorAll("[data-htp-step]");
        imgs.forEach((el: Element, i) => {
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return;
          pieces.push({ src: STEP_SRCS[i] || "", x: r.left, y: r.top, w: r.width, h: r.height, kind: "stepcard" });
          // Number SVG drops from same spot (no blue circle)
          pieces.push({ src: `/${i + 1}object.svg`, x: r.left - 10, y: r.top - 10, w: 36, h: 36, kind: "number" });
        });
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
    window.dispatchEvent(new Event("pc:overlay-closed"));
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
            <div key={src} className={styles.stepCard} data-htp-step={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`How to play, step ${i + 1}`} className={styles.stepImg} />
              <div className={styles.stepCaption}>{"DEAL 3–6 CHUMS EACH,HEAD OUTSIDE,SPOT REAL DOGS,MATCH TO YOUR CHUM,FIND MORE CHUMS,MOST CHUMS WINS".split(",")[i]}</div>
            </div>
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