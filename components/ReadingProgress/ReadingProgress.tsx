"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./ReadingProgress.module.css";

/*
  Reading progress for article pages.
  A tall yellow bar fills with scroll; solid navy notches mark each h2
  scene; the dog GIF walks the bar (flipped to face right, recoloured
  from its black silhouette via CSS filter). No bone at the end.
  Note: unlike the previous hand-built SVG, a GIF's own frames play
  continuously once loaded -- there is no "legs only move while scrolling"
  behaviour available for a raster animation, so the walk now loops on
  its own timing; only the trot bounce and the on-arrival wobble are still
  scroll-state-driven via CSS.
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

  return (
    <div className={styles.wrap} id="rp-wrap" aria-hidden="true">
      <div className={styles.track}>
        {notches.map((n) => (
          <span key={n} className={styles.notch} style={{ left: `${n}%` }} />
        ))}
        <div className={styles.fill} id="rp-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* The dog, walking. Source GIF faces left -- flipped via CSS
          (scaleX(-1) in .dog) to face right, matching travel direction.
          Recoloured from its black silhouette via CSS filter; swap
          styles.dogWhite for styles.dogYellow below to try the other. */}
      <div
        id="rp-dog"
        data-walking={walking ? "1" : "0"}
        data-done={done ? "1" : "0"}
        className={`${styles.dog} ${done ? styles.dogDone : ""}`}
        style={{ left: `${pct}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/scottywalking-animation.gif"
          alt=""
          className={`${styles.dogImg} ${styles.dogWhite}`}
        />
      </div>
    </div>
  );
}
