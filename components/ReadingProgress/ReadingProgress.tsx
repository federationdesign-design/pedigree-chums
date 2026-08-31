"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./ReadingProgress.module.css";
import { DOG_WALK_PATHS, DOG_WALK_VIEWBOX } from "./dogWalkPaths";

/*
  Reading progress for article pages.
  A tall yellow bar fills with scroll; solid navy notches mark each h2
  scene; a real SVG dog (four exported frames: 1 standing, 2-3-4 the walk
  cycle) walks the bar, flipped to face right via CSS. Frames are inlined
  as <path> data with a real `fill`, not a raster image behind a CSS
  filter -- colour is exact, not approximated. Legs cycle only while the
  reader is actively scrolling; frame 1 (standing) shows at rest.
  Pointer-events are disabled throughout -- purely decorative chrome.
*/
export default function ReadingProgress({
  articleSelector = "article",
  progress,
  active,
}: {
  articleSelector?: string;
  /* Controlled mode: when a number is given, the bar is driven by this
     percentage (e.g. a carousel position) instead of window scroll, and the
     scroll listener, h2 notches and footer dock are all skipped. `active` drives
     the walk cycle in that mode. Omit both for the default scroll behaviour. */
  progress?: number;
  active?: boolean;
}) {
  const controlled = typeof progress === "number";
  const [pct, setPct] = useState(0);
  const [notches, setNotches] = useState<number[]>([]);
  const [walking, setWalking] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef(false);

  useEffect(() => {
    if (controlled) return; // driven by the `progress` prop, not scroll
    const measureNotches = () => {
      const article = document.querySelector(articleSelector);
      if (!article) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const positions: number[] = [];
      article.querySelectorAll("h2").forEach((h) => {
        const top = h.getBoundingClientRect().top + window.scrollY;
        const p = (top / max) * 100;
        if (p > 2 && p < 98) positions.push(p);
      });
      setNotches(positions);
    };

    const update = () => {
      raf.current = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);

      /* Dock to the footer. The bar is a fixed overlay pinned to the bottom of
         the viewport, so once the footer rises past that line the bar would
         simply sit on top of it. Offsetting by the overlap parks the bar on
         the footer's yellow top border -- the same yellow the fill uses -- so
         the progress reads as completing into the footer rather than floating
         over it. Above the footer the offset is 0 and nothing changes. */
      const wrap = wrapRef.current;
      const footer = document.querySelector("footer");
      if (wrap && footer) {
        const overlap = window.innerHeight - footer.getBoundingClientRect().top;
        wrap.style.transform = overlap > 0 ? `translateY(${-overlap}px)` : "";
      }
    };

    const onScroll = () => {
      if (!raf.current) {
        raf.current = true;
        requestAnimationFrame(update);
      }
      setWalking(true);
      if (walkTimer.current) clearTimeout(walkTimer.current);
      walkTimer.current = setTimeout(() => setWalking(false), 160);
    };

    update();
    // images shift layout as they load; re-measure notches after settle
    measureNotches();
    const settle = setTimeout(measureNotches, 1500);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measureNotches);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measureNotches);
      clearTimeout(settle);
      if (walkTimer.current) clearTimeout(walkTimer.current);
    };
  }, [articleSelector, controlled]);

  const displayPct = controlled ? Math.min(100, Math.max(0, progress as number)) : pct;
  const walkingState = controlled ? !!active : walking;
  const done = displayPct >= 99.5;

  // Walk-cycle: frame 1 (standing) at rest; 2 -> 3 -> 4 -> 2... while
  // actively scrolling. A fixed-interval timer drives the cycle so its
  // speed is consistent regardless of scroll speed; it only runs while
  // `walking` is true.
  const [frame, setFrame] = useState(1);
  useEffect(() => {
    if (!walkingState) {
      setFrame(1);
      return;
    }
    setFrame((f) => (f === 1 ? 2 : f));
    const id = setInterval(() => {
      setFrame((f) => (f >= 4 ? 2 : f + 1));
    }, 140);
    return () => clearInterval(id);
  }, [walkingState]);

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrap}${controlled ? ` ${styles.controlled}` : ""}`}
      id="rp-wrap"
      aria-hidden="true"
    >
      <div className={styles.track}>
        {notches.map((n) => (
          <span key={n} className={styles.notch} style={{ left: `${n}%` }} />
        ))}
        <div className={styles.fill} id="rp-fill" style={{ width: `${displayPct}%` }} />
      </div>

      {/* The dog. Source SVGs face left -- flipped via CSS (scaleX(-1) in
          .dog) to face right, matching travel direction. Fill is a real
          CSS custom property (--dog-fill in the module CSS), so colour is
          exact -- swap it there to try white vs yellow vs anything else. */}
      <div
        id="rp-dog"
        data-walking={walkingState ? "1" : "0"}
        data-done={done ? "1" : "0"}
        className={`${styles.dog} ${done ? styles.dogDone : ""}`}
        style={{ left: `${displayPct}%` }}
      >
        <svg viewBox={DOG_WALK_VIEWBOX} className={styles.dogImg}>
          <path d={DOG_WALK_PATHS[frame]} className={styles.dogFill} />
        </svg>
      </div>
    </div>
  );
}
