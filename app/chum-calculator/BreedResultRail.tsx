"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { bust } from "../../data/imgVersion";
import { breedCard } from "../../data/breeds";
import styles from "./BreedResultRail.module.css";

type ScoredBreed = {
  slug: string;
  name: string;
  image: string;
  score: number;
};

function fitLabel(score: number, isBest = false): string {
  if (isBest) return "Best fit";
  if (score >= 120) return "Perfect fit";
  if (score >= 100) return "Great fit";
  return "Good fit";
}

function fitColour(score: number, isBest = false): { bg: string; text: string } {
  if (isBest) return { bg: "#9333ea", text: "#ffffff" };
  if (score >= 120) return { bg: "#4ade80", text: "#0a3a57" };
  if (score >= 100) return { bg: "#ff7a3c", text: "#ffffff" };
  return { bg: "#ffb02e", text: "#0a3a57" };
}

function FlipCard({ breed, isBest }: { breed: ScoredBreed; isBest: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const cardImg = breedCard[breed.slug];
  const colour = fitColour(breed.score, isBest);
  const label = fitLabel(breed.score, isBest);
  const href = `/name-generator?breed=${encodeURIComponent(breed.name)}`;

  // On mobile: first tap flips, second tap follows link.
  // On desktop: hover handles the flip via CSS, tap follows link directly.
  function handleClick(e: { preventDefault: () => void }) {
    // If already flipped on mobile (touch), let the link fire naturally
    if (flipped) return;
    // Detect touch: if it's a genuine pointer click on a touch device, flip first
    if (window.matchMedia("(hover: none)").matches) {
      e.preventDefault();
      setFlipped(true);
    }
    // Desktop: hover already shows the back, click goes straight through
  }

  function handleFlipBack(e: { preventDefault: () => void; stopPropagation: () => void }) {
    e.preventDefault();
    e.stopPropagation();
    if (window.matchMedia("(hover: none)").matches) {
      setFlipped(false);
    }
  }

  return (
    <div
      className={`${styles.flipOuter} ${flipped ? styles.flipped : ""}`}
      onMouseLeave={() => setFlipped(false)}
    >
      <div className={styles.flipInner}>

        {/* ── FRONT ── */}
        <Link href={`/chums/${breed.slug}`} className={styles.flipFront}>
          <div className={styles.cardImgWrap}>
            <img
              src={bust(cardImg || breed.image)}
              alt={breed.name}
              className={styles.cardImg}
              loading="lazy"
              draggable={false}
            />
          </div>
          <div
            className={styles.fitLabel}
            style={{ background: colour.bg, color: colour.text }}
          >
            {label}
          </div>
        </Link>

        {/* ── BACK ── */}
        <Link
          href={href}
          className={styles.flipBack}
          onClick={handleClick}
          tabIndex={flipped ? 0 : -1}
        >
          {/* Flip-back button on mobile */}
          <button
            className={styles.flipBackBtn}
            onClick={handleFlipBack}
            aria-label="Flip back"
            tabIndex={flipped ? 0 : -1}
          >
            ←
          </button>
          <p className={styles.backBreedName}>{breed.name}</p>
          <p className={styles.backCta}>Want to name your chum next?</p>
          <span className={styles.backArrow}>→</span>
        </Link>

      </div>
    </div>
  );
}

type Props = {
  breeds: ScoredBreed[];
  bestSlug: string | null;
};

export default function BreedResultRail({ breeds, bestSlug }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Horizontal wheel scroll -- borrowed from CardRail
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      const max = el.scrollWidth - el.clientWidth;
      if (delta > 0 && el.scrollLeft >= max) return;
      if (delta < 0 && el.scrollLeft <= 0) return;
      e.preventDefault();
      el.scrollLeft = Math.max(0, Math.min(el.scrollLeft + delta, max));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Custom scrollbar -- borrowed from CardRail
  useEffect(() => {
    const el = railRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!el || !track || !thumb) return;

    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) { track.style.opacity = "0"; return; }
      track.style.opacity = "1";
      const widthPct = (el.clientWidth / el.scrollWidth) * 100;
      const leftPct = (el.scrollLeft / el.scrollWidth) * 100;
      thumb.style.width = `${widthPct}%`;
      thumb.style.left = `${leftPct}%`;
    };

    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true; startX = e.clientX; startScroll = el.scrollLeft;
      thumb.setPointerCapture(e.pointerId); e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const max = el.scrollWidth - el.clientWidth;
      el.scrollLeft = Math.max(0, Math.min(startScroll + ((e.clientX - startX) / (track.clientWidth || 1)) * el.scrollWidth, max));
    };
    const onUp = () => { dragging = false; };

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    thumb.addEventListener("pointerdown", onDown);
    thumb.addEventListener("pointermove", onMove);
    thumb.addEventListener("pointerup", onUp);
    thumb.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      thumb.removeEventListener("pointerdown", onDown);
      thumb.removeEventListener("pointermove", onMove);
      thumb.removeEventListener("pointerup", onUp);
      thumb.removeEventListener("pointercancel", onUp);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={styles.railWrap}>
      <div ref={railRef} className={styles.rail} role="list" aria-label="Matched breeds">
        {breeds.map((b) => (
          <div key={b.slug} className={styles.item} role="listitem">
            <FlipCard breed={b} isBest={b.slug === bestSlug} />
          </div>
        ))}
      </div>
      <div ref={trackRef} className={styles.scrollbar} aria-hidden="true">
        <div ref={thumbRef} className={styles.scrollThumb} />
      </div>
    </div>
  );
}
