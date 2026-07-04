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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollFraction, setScrollFraction] = useState(0);
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
        <div className={styles.inner}>
        <h3 className={styles.title}>
          How <span className={styles.accent}>it works</span>
        </h3>
        </div>
        <p className={styles.swipeHint} role="slider" aria-label="Scroll through how to play steps"
          style={{ opacity: scrollFraction > 0.92 ? 0 : 1, transition: "opacity 0.4s", cursor: "ew-resize", userSelect: "none" }}
          onPointerDown={(e) => {
            const el = scrollRef.current; if (!el) return;
            const startX = e.clientX, startL = el.scrollLeft;
            try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
            const onMove = (ev: PointerEvent) => { el.scrollLeft = startL - (ev.clientX - startX); };
            const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
          }}
        >
          {scrollFraction > 0.85 ? "You're all caught up!" : scrollFraction > 0.05 ? `Step ${Math.min(6, Math.round(scrollFraction * 5) + 1)} of 6` : "Swipe to view"}
          {scrollFraction <= 0.85 && <span className={styles.swipeArrow}>&rarr;</span>}
        </p>
        <div
          className={styles.stepScroll}
          ref={scrollRef}
          data-htp-scroll="1"
          onScroll={(e) => { const el = e.currentTarget; setScrollFraction(el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth)); }}
          onPointerDown={(e) => {
            const el = scrollRef.current; if (!el) return;
            const startX = e.clientX, startL = el.scrollLeft;
            const onMove = (ev: PointerEvent) => { el.scrollLeft = startL - (ev.clientX - startX); };
            const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
          }}
        >
          {STEP_IMAGES.map((src, i) => (
            <div key={src} className={styles.stepCard} data-htp-step={i} onClick={(e) => { e.stopPropagation(); dropPiecesThenClose(); }}>
              <div className={styles.stepBadge}>{i + 1}</div>
              {(i < 3 || i === 5) ? (
                <video
                  data-step={i}
                  src={`/step${i + 1}-video-animation.mp4`}
                  autoPlay={i === 0} muted playsInline preload="auto"
                  ref={(el) => {
                    if (!el) return;
                    if (i === 0) {
                      // video 2 starts 2s after video 1 starts
                      el.addEventListener("play", () => {
                        window.setTimeout(() => {
                          const v2 = el.closest("[data-htp-scroll]")?.querySelector("[data-step=\"1\"]") as HTMLVideoElement | null;
                          if (v2) v2.play().catch(() => {});
                        }, 2000);
                      }, { once: true });
                    }
                  }}
                  onEnded={(e) => {
                    const v = e.currentTarget;
                    v.pause(); v.currentTime = Math.max(0, v.duration - 0.05);
                    if (i === 0) {
                      // video 3 starts when video 1 finishes
                      const scroll = v.closest("[data-htp-scroll]");
                      const v3 = scroll?.querySelector("[data-step=\"2\"]") as HTMLVideoElement | null;
                      if (v3) v3.play().catch(() => {});
                    }
                  }}
                  className={styles.stepImg}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={src} alt={`How to play, step ${i + 1}`} className={styles.stepImg} />
              )}
              <div className={styles.stepCaption}>{"DEAL 3–6 CHUMS EACH,HEAD OUTSIDE,SPOT REAL DOGS,MATCH TO YOUR CHUM,FIND MORE CHUMS,MOST CHUMS WINS".split(",")[i]}</div>
            </div>
          ))}
        </div>
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