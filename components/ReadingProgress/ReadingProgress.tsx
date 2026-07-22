"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./ReadingProgress.module.css";

/*
  Reading progress for article pages.
  A slim yellow bar fills with scroll; faint notches mark each h2 scene; a
  small dog walks the bar toward a bone at the far end. Legs alternate only
  while the reader is actively scrolling; on reaching 100% the tail wags.
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

      {/* The bone, waiting at the end */}
      <svg className={styles.bone} viewBox="0 0 22 10" width="17" height="8">
        <path
          d="M4 2.2a2 2 0 0 1 2.8.3h8.4A2 2 0 1 1 18 5a2 2 0 1 1-2.8 2.5H6.8A2 2 0 1 1 4 5a2 2 0 0 1 0-2.8z"
          fill="#ffffff"
          stroke="#0a3a57"
          strokeWidth="0.8"
        />
      </svg>

      {/* The dog, walking toward it */}
      <div
        id="rp-dog"
        data-walking={walking ? "1" : "0"}
        data-done={done ? "1" : "0"}
        className={`${styles.dog} ${walking ? styles.dogWalking : ""} ${done ? styles.dogDone : ""}`}
        style={{ left: `${pct}%` }}
      >
        <svg viewBox="0 0 48 34" width="30" height="21">
          <g fill="#0a3a57" stroke="#ffffff" strokeWidth="1">
            {/* tail */}
            <path className={styles.tail} d="M3 12 Q0 6 4 4 Q6 8 8 11 Z" />
            {/* legs: two alternating pairs */}
            <g className={styles.legsA}>
              <rect x="12" y="22" width="4" height="10" rx="1.6" />
              <rect x="34" y="22" width="4" height="10" rx="1.6" />
            </g>
            <g className={styles.legsB}>
              <rect x="18" y="22" width="4" height="10" rx="1.6" />
              <rect x="28" y="22" width="4" height="10" rx="1.6" />
            </g>
            {/* body */}
            <path d="M6 13 Q7 9 14 9 L34 9 Q40 9 41 13 L41 20 Q41 25 34 25 L14 25 Q7 25 6 20 Z" />
            {/* head + ear + snout */}
            <path d="M36 6 Q37 2 42 2 L45 5 Q48 6 47 9 L46 13 Q45 16 40 15 L37 14 Q35 12 36 6 Z" />
            <path d="M37 3 Q36 0 33 1 Q33 5 35 7 Z" />
          </g>
          {/* eye */}
          <circle cx="42.6" cy="6.6" r="1.1" fill="#ffffff" />
        </svg>
      </div>
    </div>
  );
}
