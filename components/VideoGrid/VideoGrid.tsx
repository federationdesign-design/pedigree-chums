"use client";
import { useEffect, useRef, useState } from "react";
import VideoLightbox, { type LightboxVideo } from "../VideoLightbox/VideoLightbox";
import styles from "./VideoGrid.module.css";

// Same breed-card videos as the "Meet the Pack" rail: a card named
// cardN-<vimeoId>.jpg carries a Vimeo id in its filename, and its landscape
// pre-load image is the poster. (Logic mirrors CardRail.)
const PRELOAD_OVERRIDES: Record<string, string> = {
  card14: "/card14-pre-laod.jpg",
  card36: "/card36-pre-loader.jpg",
  card44: "/card44-pre-laoder.jpg",
};
function vimeoIdFromSrc(src: string): string {
  const m = src.match(/-(\d+)\.[a-z0-9]+$/i);
  return m ? m[1] : "";
}
function preloadFromSrc(src: string): string {
  const base = src.replace(/^\//, "").replace(/\.[a-z0-9]+$/i, "").replace(/-\d+$/, "");
  return PRELOAD_OVERRIDES[base] ?? `/${base}-pre-load.jpg`;
}

// Explicit display order:
// Chihuahua, Cockapoo, French Bulldog, Border Collie, Weimaraner, Corgi.
const ORDER = [
  "/card11-1199268788.jpg", // Chihuahua
  "/card44-1199502279.jpg", // Cockapoo
  "/card14-1199399283.jpg", // French Bulldog
  "/card21-1199411114.jpg", // Border Collie
  "/card28-1199378147.jpg", // Weimaraner
  "/card8-1199364230.jpg", // Corgi
];
const VIDEOS: LightboxVideo[] = ORDER.map((src) => ({
  poster: preloadFromSrc(src),
  vimeoId: vimeoIdFromSrc(src),
}));

export default function VideoGrid() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Horizontal-scroll rail (mobile). Reuses CardRail's approach: vertical /
  // trackpad wheel drives the rail sideways, and only once it reaches the end
  // does the page carry on scrolling down. On desktop the grid isn't
  // scrollable, so every bit of this is inert. Yellow thumb mirrors progress.
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const el = railRef.current;
    if (!wrap || !el) return;

    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return; // not scrollable (desktop grid) -> let the page scroll
      if (delta > 0) {
        if (el.scrollLeft >= max) return; // fully scrolled -> page continues down
        e.preventDefault();
        el.scrollLeft = Math.min(el.scrollLeft + delta, max);
      } else {
        if (el.scrollLeft <= 0) return; // at the start -> page scrolls up
        e.preventDefault();
        el.scrollLeft = Math.max(el.scrollLeft + delta, 0);
      }
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!el || !track || !thumb) return;

    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) {
        track.style.opacity = "0";
        return;
      }
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
      dragging = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      thumb.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const trackW = track.clientWidth || 1;
      const max = el.scrollWidth - el.clientWidth;
      const next = startScroll + ((e.clientX - startX) / trackW) * el.scrollWidth;
      el.scrollLeft = Math.max(0, Math.min(next, max));
    };
    const onUp = () => {
      dragging = false;
    };

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
    <section className={styles.grid} aria-label="Pedigree Chums in action">
      <div ref={wrapRef} className={styles.wrap}>
        <div ref={railRef} className={styles.inner}>
          {VIDEOS.map((v, i) => (
            <button
              type="button"
              key={v.vimeoId}
              className={styles.cell}
              onClick={() => setOpenIndex(i)}
              aria-label="Play video"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.poster} alt="" className={styles.poster} loading="lazy" />
              <span className={styles.play} aria-hidden />
            </button>
          ))}
        </div>
      </div>

      <div ref={trackRef} className={styles.scrollbar} aria-hidden="true">
        <div ref={thumbRef} className={styles.thumb} />
      </div>

      <VideoLightbox
        videos={VIDEOS}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndex={setOpenIndex}
      />
    </section>
  );
}
