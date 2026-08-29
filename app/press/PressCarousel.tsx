"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

/* Press pack: the carousel shell only. No content yet. The slides below are
   PLACEHOLDERS, one per entry in the mobile split (docs/press/PLAN.md), so the
   pacing of clicking through the pack on a phone can be felt before any content
   lands. Each label is the slide's planned role, not final copy.

   Mechanics are the proven scroll-snap + goTo pattern (borrowed from the
   superpower rail's React model, not its dark theme), plus the three controls
   that are net-new to this pack: a previous/next pair, keyboard arrows, and a
   position indicator. Horizontal swipe comes free from native scroll-snap. */

const SLIDES: string[] = [
  "Cover",
  "Story in 30s (1 of 2)",
  "Story in 30s (2 of 2)",
  "Press release (1 of 2)",
  "Press release (2 of 2)",
  "Imaginary",
  "Real",
  "Tangible",
  "Missing card: the normal card",
  "Missing card: Pug leaving",
  "Missing card: the blank card",
  "54 became 53",
  "We can't launch like that",
  "Find Pug: the steps",
  "Find Pug: dates and prize",
  "One-of-one: the figurine",
  "One-of-one: only one exists",
  "Britain is the board",
  "Take them outside",
  "The traffic-jam example",
  "A little deeper (1 of 2)",
  "A little deeper (2 of 2)",
  "Assets: the thumbnails",
  "Assets: contact and handles",
];

export default function PressCarousel() {
  const railRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = SLIDES.length;

  const goTo = useCallback(
    (target: number) => {
      const rail = railRef.current;
      if (!rail) return;
      const clamped = Math.max(0, Math.min(count - 1, target));
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      rail.scrollTo({
        left: clamped * rail.clientWidth,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [count],
  );

  // The settled slide is read back from scroll position, so a swipe, a button
  // and a keypress all feed the same counter (same idea as the superpower rail).
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const i = Math.round(rail.scrollLeft / rail.clientWidth);
        setIndex((prev) => (prev === i ? prev : i));
      });
    };
    rail.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Keyboard: left/right step, home/end jump. Ignored while typing in a field
  // and when a modifier is held, so browser shortcuts are untouched.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(count - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, goTo]);

  const atStart = index <= 0;
  const atEnd = index >= count - 1;
  const progress = ((index + 1) / count) * 100;

  return (
    <section
      className={styles.pack}
      aria-roledescription="carousel"
      aria-label="Pedigree Chums press pack"
    >
      <div className={styles.rail} ref={railRef}>
        {SLIDES.map((label, i) => (
          <article
            key={label}
            className={styles.slide}
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${count}`}
            aria-hidden={i !== index}
          >
            <div className={styles.placeholder}>
              <p className={styles.kicker}>Placeholder</p>
              <p className={styles.slideNum}>{i + 1}</p>
              <p className={styles.slideRole}>{label}</p>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        className={`${styles.arrow} ${styles.prev}`}
        onClick={() => goTo(index - 1)}
        disabled={atStart}
        aria-label="Previous slide"
      >
        <span aria-hidden="true">{"‹"}</span>
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.next}`}
        onClick={() => goTo(index + 1)}
        disabled={atEnd}
        aria-label="Next slide"
      >
        <span aria-hidden="true">{"›"}</span>
      </button>

      <div className={styles.indicator}>
        <p className={styles.counter} aria-live="polite">
          {index + 1} / {count}
        </p>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={count}
          aria-valuenow={index + 1}
          aria-label="Slide position"
        >
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
}
