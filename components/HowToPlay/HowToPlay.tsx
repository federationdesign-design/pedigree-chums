"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./HowToPlay.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onScore?: (pts: number) => void;
  activeStep?: number | null;
  cardPos?: { x: number; y: number; w: number; h: number; angle: number; image: string } | null;
};

const STEPS = [
  "Deal 3\u20136 cards per player",
  "Go for a walk, visit a park, or explore your town or city",
  "Spot real dogs and match with your cards",
  "Try and spot all your chums",
  "The player with the most pedigree chums wins",
];

const STEP_IMAGES = ["/step1.png", "/step2.png", "/step3.png", "/step4.png", "/step5.png"]; // pit card assets -- used in overview scroll
const INSTRUCTION_IMAGES = ["/instruction1.jpg", "/instruction2.jpg", "/instruction3.jpg", "/instruction4.jpg", "/instruction5.jpg"]; // full landscape instruction pages for lightbox

export default function HowToPlay({ open, onClose, activeStep = null }: Props) {
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
        if (e.key === "ArrowRight" || e.key === "ArrowDown") setStep((s: number | null) => Math.min((s ?? 0) + 1, INSTRUCTION_IMAGES.length - 1));
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

  // Lightbox close: fire the step-viewed event so PackPit can poof the matching card
  const closeLightbox = () => {
    if (step !== null) {
      window.dispatchEvent(new CustomEvent("pc:howtoplay-step-viewed", { detail: { stepIdx: step } }));
    }
    onClose();
  };

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
      /* close cleanly on any error */
    }
    onClose();
  };

  // --- Step lightbox (opened from a pit card) ---
  const stepView = step !== null ? (
    <div className={styles.lightboxOverlay} onClick={closeLightbox}>
      <div className={styles.lightboxStage} onClick={(e: React.MouseEvent) => e.stopPropagation()}>

        <button type="button" className={styles.lightboxClose} onClick={closeLightbox} aria-label="Close">
          &times;
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={INSTRUCTION_IMAGES[step]}
          alt={`How to play, step ${step + 1}`}
          className={styles.lightboxImg}
        />

        {step > 0 && (
          <button
            type="button"
            className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
            onClick={() => setStep((s: number | null) => Math.max((s ?? 0) - 1, 0))}
            aria-label="Previous step"
          >
            &#8592;
          </button>
        )}

        {step < INSTRUCTION_IMAGES.length - 1 && (
          <button
            type="button"
            className={`${styles.lightboxNav} ${styles.lightboxNext}`}
            onClick={() => setStep((s: number | null) => Math.min((s ?? 0) + 1, INSTRUCTION_IMAGES.length - 1))}
            aria-label="Next step"
          >
            &#8594;
          </button>
        )}

        <div className={styles.lightboxDots}>
          {INSTRUCTION_IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.lightboxDot} ${i === step ? styles.lightboxDotActive : ""}`}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  ) : null;

  // --- Full overview (opened from the howtoplay panel object) ---
  const overviewView = step === null ? (
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
  ) : null;

  return createPortal(stepView ?? overviewView, document.body);
}
