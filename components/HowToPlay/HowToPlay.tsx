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

const STEP_IMAGES = ["/step1.png", "/step2.png", "/step3.png", "/step4.png", "/step5.png"];

const OVERVIEW_STEPS = [
  "Deal 3\u20136 cards per player",
  "Go for a walk, visit a park, or explore your town or city",
  "Spot real dogs and match with your cards",
  "Try and spot all your chums",
  "The player with the most pedigree chums wins",
];

export default function HowToPlay({ open, onClose, activeStep = null, cardPos = null }: Props) {
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

  // Close from step card -- fire poof event then close
  const closeStepCard = () => {
    if (step !== null) {
      window.dispatchEvent(new CustomEvent("pc:howtoplay-step-viewed", { detail: { stepIdx: step } }));
    }
    onClose();
  };

  // Close from overview -- drop pieces into pit
  const dropPiecesThenClose = () => {
    try {
      const pieces: { src: string; x: number; y: number; w: number; h: number }[] = [];
      const push = (el: Element | null, src: string) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        pieces.push({ src, x: r.left, y: r.top, w: r.width, h: r.height });
      };
      const root = stageElRef.current;
      if (root) {
        const strip = root.querySelector("img[alt='How to play, step by step']") as HTMLElement | null;
        if (strip) {
          const r = strip.getBoundingClientRect();
          if (r.width > 2 && r.height > 2) {
            const colW = r.width / 5;
            for (let i = 0; i < 5; i++) pieces.push({ src: `/step${i + 1}.png`, x: r.left + i * colW, y: r.top, w: colW, h: r.height });
          }
        }
        push(root.querySelector("[data-htp='logo']"), "/dogbingo.svg");
        root.querySelectorAll("[data-htp='deco']").forEach((el: Element) => push(el, "/yellow-triangle.svg"));
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

        <div className={styles.stripWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/how-to-play-comic-strip.png"
            alt="How to play, step by step"
            className={styles.strip}
          />
        </div>

        <div className={styles.stepScroll}>
          {STEP_IMAGES.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={`How to play, step ${i + 1}`}
              className={styles.stepImg}
            />
          ))}
        </div>

        <p className={styles.swipeHint} aria-hidden="true">
          Swipe to view <span className={styles.swipeArrow}>&rarr;</span>
        </p>

        <ol className={styles.steps}>
          {OVERVIEW_STEPS.map((s) => (
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
    </div>,
    document.body
  );
}
