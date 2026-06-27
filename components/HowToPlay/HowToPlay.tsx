"use client";
import { useEffect, useRef } from "react";
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

// Individual step images, shown on mobile as a user-scrollable horizontal row
// in place of the single wide comic strip.
const STEP_IMAGES = ["/step1.png", "/step2.png", "/step3.png", "/step4.png", "/step5.png"];

// Controlled "How it works" popup. The trigger (the feature card) lives in
// CardRail and drives this via open/onClose. The panel pops in with the same
// 3D effect as the video lightbox: the stage is a DIRECT child of the overlay,
// so the overlay's perspective reaches it (a nested wrapper would flatten it).
export default function HowToPlay({ open, onClose }: Props) {
  const stageElRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    // Freeze the page behind the popup so a swipe scrolls the cards, not the page.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  // On close, send each visible piece's on-screen rect to the pit so it can drop
  // them where they sit. The strip is one wide image on desktop, so we slice its
  // rect into 5 columns, one per step. Hidden pieces (rect of 0) are skipped.
  const dropPiecesThenClose = () => {
    try {
      const pieces: { src: string; x: number; y: number; w: number; h: number }[] = [];
      const push = (el: Element | null, src: string) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return; // not visible (e.g. display:none on this breakpoint)
        pieces.push({ src, x: r.left, y: r.top, w: r.width, h: r.height });
      };
      const root = stageElRef.current;
      if (root) {
        // strip -> 5 step columns
        // try single strip first, then individual step images
        const strip = root.querySelector("img[alt='How to play, step by step']") as HTMLElement | null;
        const stripR = strip?.getBoundingClientRect();
        if (strip && stripR && stripR.width > 2 && stripR.height > 2) {
          const colW = stripR.width / 5;
          for (let i = 0; i < 5; i++) pieces.push({ src: `/step${i + 1}.png`, x: stripR.left + i * colW, y: stripR.top, w: colW, h: stripR.height });
        } else {
          // individual step images - always try these as fallback
          root.querySelectorAll("img[alt^='How to play, step']").forEach((el, i) => {
            push(el, `/step${i + 1}.png`);
          });
        }
        // logo + two triangles
        push(root.querySelector("[data-htp='logo']"), "/dogbingo.svg");
        root.querySelectorAll("[data-htp='deco']").forEach((el) => push(el, "/yellow-triangle.svg"));
        // five numbers
        root.querySelectorAll("[data-htp='num']").forEach((el, i) => push(el, `/${i + 1}object.svg`));
      }
      if (pieces.length) window.dispatchEvent(new CustomEvent("pc:howtoplay-drop", { detail: { pieces } }));
    } catch {
      /* if capture fails for any reason, still close cleanly */
    }
    onClose();
  };

  const modal = (
    <div className={styles.overlay} onClick={dropPiecesThenClose}>
      <div className={styles.stage} ref={stageElRef} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          onClick={dropPiecesThenClose}
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

        <div className={styles.stepScroll}>
          {STEP_IMAGES.map((src, i) => {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={`How to play, step ${i + 1}`}
                className={styles.stepImg}
              />
            );
          })}
        </div>

        <p className={styles.swipeHint} aria-hidden="true">
          Swipe to view <span className={styles.swipeArrow}>&rarr;</span>
        </p>

        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step} className={styles.step}>
              <span className={styles.num} data-htp="num" aria-hidden="true" />
              <span className={styles.text}>{step}</span>
            </li>
          ))}
        </ol>

        <span className={styles.logo} data-htp="logo" aria-hidden="true" />
        <span className={`${styles.deco} ${styles.decoA}`} data-htp="deco" aria-hidden="true" />
        <span className={`${styles.deco} ${styles.decoB}`} data-htp="deco" aria-hidden="true" />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
