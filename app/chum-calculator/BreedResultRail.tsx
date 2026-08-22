"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { bust } from "../../data/imgVersion";
import { breedCard } from "../../data/breeds";
import styles from "./BreedResultRail.module.css";
import shared from "../name-generator/knockout-shared.module.css";
import BreedIconRail from "./BreedIconRail";
import BreedInfoPanel from "./BreedInfoPanel";

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
  const isTouchDevice = () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  function handleBackClick(e: { preventDefault: () => void }) {
    if (isTouchDevice() && !flipped) {
      e.preventDefault();
      setFlipped(true);
    }
    // On desktop hover handles it; click goes straight through to link
  }

  function handleFlipBack(e: { preventDefault: () => void; stopPropagation: () => void }) {
    e.preventDefault();
    e.stopPropagation();
    setFlipped(false);
  }

  return (
    <div
      className={`${styles.flipOuter} ${flipped ? styles.flipped : ""}`}
      onMouseLeave={() => setFlipped(false)}
    >
      <div className={styles.flipInner}>

        {/* FRONT -- exact Jul 14 breedCard */}
        <Link href={`/chums/${breed.slug}`} className={styles.front}>
          <img
            src={bust(cardImg || breed.image)}
            alt={breed.name}
            className={styles.cardImg}
            loading="lazy"
            draggable={false}
          />
          <div
            className={styles.cardScore}
            style={{ background: colour.bg, color: colour.text }}
          >
            {label}
          </div>
        </Link>

        {/* BACK -- yellow panel */}
        <Link
          href={href}
          className={styles.back}
          onClick={handleBackClick}
          tabIndex={flipped ? 0 : -1}
        >
          <button
            className={styles.flipBackBtn}
            onClick={handleFlipBack}
            aria-label="Flip back"
            tabIndex={flipped ? 0 : -1}
          >
            ←
          </button>
          <p className={styles.backBreedName}>Name your chum now</p>
          <span className={styles.backArrow}>→</span>
        </Link>

      </div>
    </div>
  );
}

type Props = {
  breeds: ScoredBreed[];
  bestSlug: string | null;
  // Slugs mid-elimination in the knockout: these cards play the shared fall-away
  // animation. Optional, so the calculator's final reveal is unaffected. (Job B stage 5.)
  fallingSlugs?: string[];
  // Per-slug fitReason sentence, shown as an always-visible caption under each card
  // so phone users see it (it used to be hover-only). Optional. (Job B stage 6.)
  reasons?: Record<string, string>;
  // When set, each card grows an 8-icon rail (left on desktop, a strip below on
  // mobile) and one shared simplified info panel opens below the row. Opt-in so
  // only the knockout result screen carries the rails; the calculator's own reveal
  // and the mid-knockout rail pass nothing and are unaffected. (Job B stage 6.)
  iconRails?: boolean;
};

// The caption sits under a card already titled with the breed name, so drop the
// leading "Breed name:" prefix fitReason writes and open with a capital. fitReason
// itself is left unchanged: the hover tooltip still shows the full sentence, name and
// all. (Job B stage 6, 22 Aug 2026.)
function captionText(name: string, reason: string): string {
  const s = reason.startsWith(name) ? reason.slice(name.length).replace(/^[:\s]+/, "") : reason;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function BreedResultRail({ breeds, bestSlug, fallingSlugs, reasons, iconRails }: Props) {
  const falling = new Set(fallingSlugs ?? []);
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  // One panel open at a time across all cards: opening another replaces it, clicking
  // the open icon closes it. (Job B stage 6, decided 22 Aug 2026.)
  const [openPanel, setOpenPanel] = useState<{ slug: string; metric: string } | null>(null);
  const togglePanel = (slug: string, metric: string) =>
    setOpenPanel((cur) => (cur && cur.slug === slug && cur.metric === metric ? null : { slug, metric }));

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // trackpad pinch (ctrl+wheel): let the browser zoom
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

  useEffect(() => {
    const el = railRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!el || !track || !thumb) return;
    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) { track.style.opacity = "0"; return; }
      track.style.opacity = "1";
      thumb.style.width = `${(el.clientWidth / el.scrollWidth) * 100}%`;
      thumb.style.left = `${(el.scrollLeft / el.scrollWidth) * 100}%`;
    };
    let dragging = false; let startX = 0; let startScroll = 0;
    const onDown = (e: PointerEvent) => { dragging = true; startX = e.clientX; startScroll = el.scrollLeft; thumb.setPointerCapture(e.pointerId); e.preventDefault(); };
    const onMove = (e: PointerEvent) => { if (!dragging) return; el.scrollLeft = Math.max(0, Math.min(startScroll + ((e.clientX - startX) / (track.clientWidth || 1)) * el.scrollWidth, el.scrollWidth - el.clientWidth)); };
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
        {breeds.map((b) => {
          const isFalling = falling.has(b.slug);
          const card = (
            <>
              {/* Caption sits ABOVE the card image on both result screens. Moved up
                  from below on 22 Aug 2026 (was below since the stage 6 caption work). */}
              {reasons?.[b.slug] && <p className={styles.reason}>{captionText(b.name, reasons[b.slug])}</p>}
              <FlipCard breed={b} isBest={b.slug === bestSlug} />
            </>
          );
          if (!iconRails) {
            return (
              <div key={b.slug} className={isFalling ? `${styles.item} ${shared.falling}` : styles.item} role="listitem">
                {card}
              </div>
            );
          }
          const cls = isFalling
            ? `${styles.item} ${styles.itemRailed} ${shared.falling}`
            : `${styles.item} ${styles.itemRailed}`;
          return (
            <div key={b.slug} className={cls} role="listitem">
              <div className={styles.railSlot}>
                <BreedIconRail
                  slug={b.slug}
                  name={b.name}
                  activeMetric={openPanel?.slug === b.slug ? openPanel.metric : null}
                  onToggle={(m) => togglePanel(b.slug, m)}
                />
              </div>
              {/* Panel sits inside the tapped card's column, directly under the card,
                  at card width. One open at a time across all cards. (Job B stage 6.) */}
              <div className={styles.cardSlot}>
                {card}
                {openPanel?.slug === b.slug && (
                  <BreedInfoPanel slug={b.slug} name={b.name} metric={openPanel.metric} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div ref={trackRef} className={styles.scrollbar} aria-hidden="true">
        <div ref={thumbRef} className={styles.scrollThumb} />
      </div>
    </div>
  );
}
