"use client";
import { useRef, useState } from "react";
import styles from "./HowToPlay.module.css";

const STEP_IMAGES = [
  "/step1-redue.jpg", "/step2-redue.jpg", "/step3-redue.jpg",
  "/step4-redue.jpg", "/step5-redue.jpg", "/step6-redue.jpg",
];

const CAPTIONS = "DEAL THE CARDS,HEAD OUTSIDE,SPOT REAL DOGS,MATCH TO YOUR CHUM,FIND MORE CHUMS,MOST CHUMS WINS".split(",");

export default function HowToPlayStrip() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollFraction, setScrollFraction] = useState(0);

  return (
    <div style={{ position: "relative" }}>
      <p className={styles.swipeHint}
        style={{ cursor: "ew-resize", userSelect: "none" }}
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
          <div key={src} className={styles.stepCard}>
            <div className={styles.stepBadge}>{i + 1}</div>
            {(i < 3 || i === 5) ? (
              <video
                data-step={i}
                src={i === 2 ? "/step3-video-animationv3.mp4" : `/step${i + 1}-video-animation.mp4`}
                autoPlay={i === 0} muted playsInline preload="auto"
                ref={(el) => {
                  if (!el) return;
                  if (i === 0) {
                    el.addEventListener("play", () => {
                      window.setTimeout(() => {
                        const v2 = el.closest("[data-htp-scroll]")?.querySelector("[data-step=\"1\"]") as HTMLVideoElement | null;
                        if (v2) v2.play().catch(() => {});
                      }, 2000);
                    }, { once: true });
                  }
                  if (i === 2) {
                    el.addEventListener("play", () => {
                      window.setTimeout(() => {
                        const v6 = el.closest("[data-htp-scroll]")?.querySelector("[data-step=\"5\"]") as HTMLVideoElement | null;
                        if (v6) v6.play().catch(() => {});
                      }, 4000);
                    }, { once: true });
                  }
                }}
                onEnded={(e) => {
                  const v = e.currentTarget;
                  v.pause(); v.currentTime = Math.max(0, v.duration - 0.05);
                  if (i === 0) {
                    const scroll = v.closest("[data-htp-scroll]");
                    const v3 = scroll?.querySelector("[data-step=\"2\"]") as HTMLVideoElement | null;
                    if (v3) v3.play().catch(() => {});
                  }
                }}
                className={styles.stepImg}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={`How to play, step ${i + 1}`} className={styles.stepImg} />
            )}
            <div className={styles.stepCaption}>{CAPTIONS[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
