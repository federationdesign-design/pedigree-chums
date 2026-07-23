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
export default function ReadingProgress({ articleSelector = "article" }: { articleSelector?: string }) {
  const [pct, setPct] = useState(0);
  const [notches, setNotches] = useState<number[]>([]);
  const [walking, setWalking] = useState(false);
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef(false);

  useEffect(() => {
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
  }, [articleSelector]);

  const done = pct >= 99.5;

  // Walk-cycle: frame 1 (standing) at rest; 2 -> 3 -> 4 -> 2... while
  // actively scrolling. A fixed-interval timer drives the cycle so its
  // speed is consistent regardless of scroll speed; it only runs while
  // `walking` is true.
  const [frame, setFrame] = useState(1);
  useEffect(() => {
    if (!walking) {
      setFrame(1);
      return;
    }
    setFrame((f) => (f === 1 ? 2 : f));
    const id = setInterval(() => {
      setFrame((f) => (f >= 4 ? 2 : f + 1));
    }, 140);
    return () => clearInterval(id);
  }, [walking]);

  return (
    <div className={styles.wrap} id="rp-wrap" aria-hidden="true">
      <div className={styles.track}>
        {notches.map((n) => (
          <span key={n} className={styles.notch} style={{ left: `${n}%` }} />
        ))}
        <div className={styles.fill} id="rp-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* The dog. Source SVGs face left -- flipped via CSS (scaleX(-1) in
          .dog) to face right, matching travel direction. Fill is a real
          CSS custom property (--dog-fill in the module CSS), so colour is
          exact -- swap it there to try white vs yellow vs anything else. */}
      <div
        id="rp-dog"
        data-walking={walking ? "1" : "0"}
        data-done={done ? "1" : "0"}
        className={`${styles.dog} ${done ? styles.dogDone : ""}`}
        style={{ left: `${pct}%` }}
      >
        <svg viewBox={DOG_WALK_VIEWBOX} className={styles.dogImg}>
          <path d={DOG_WALK_PATHS[frame]} className={styles.dogFill} />
        </svg>
      </div>
    </div>
  );
}
