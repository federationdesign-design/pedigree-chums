"use client";
import { useEffect, useRef } from "react";
import BentoBoard from "../Nav/BentoBoard";
import styles from "./HowItPlays.module.css";

type Step = { n: number; caption: string; img: string; video: string | null };

const STEPS: Step[] = [
  { n: 1, caption: "DEAL 3-6 CHUMS EACH", img: "/step1-redue.jpg", video: "/step1-video-animation.mp4" },
  { n: 2, caption: "HEAD OUTSIDE",         img: "/step2-redue.jpg", video: "/step2-video-animation.mp4" },
  { n: 3, caption: "SPOT REAL DOGS",       img: "/step3-redue.jpg", video: "/step3-video-animation.mp4" },
  { n: 4, caption: "MATCH TO YOUR CHUM",   img: "/step4-redue.jpg", video: null },
  { n: 5, caption: "FIND MORE CHUMS",      img: "/step5-redue.jpg", video: null },
  { n: 6, caption: "MOST CHUMS WINS",      img: "/step6-redue.jpg", video: null },
];

export default function HowItPlays() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Auto-play each step video while it is on screen (looping), pause off screen.
  useEffect(() => {
    const vids = videoRefs.current.filter(Boolean) as HTMLVideoElement[];
    if (!vids.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      },
      { threshold: 0.35 }
    );
    vids.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, []);

  // Desktop: convert a vertical wheel into horizontal scroll of the card rail,
  // holding the page until every card has passed, then release. Mobile scrolls
  // the rail natively (touch swipe). No pinned/reserved space, so the bento
  // below stays tight to the cards.
  useEffect(() => {
    const wrap = wrapRef.current;
    const el = railRef.current;
    if (!wrap || !el) return;

    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      if (delta > 0) {
        if (el.scrollLeft >= max) return; // all cards passed -> page continues
        e.preventDefault();
        el.scrollLeft = Math.min(el.scrollLeft + delta, max);
      } else {
        if (el.scrollLeft <= 0) return; // back at the start -> page scrolls up
        e.preventDefault();
        el.scrollLeft = Math.max(el.scrollLeft + delta, 0);
      }
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, []);

  // Yellow progress bar (above the cards): reflects scroll position and is
  // draggable to scrub the row.
  useEffect(() => {
    const el = railRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!el || !track || !thumb) return;

    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) { track.style.opacity = "0"; return; }
      track.style.opacity = "1";
      const w = Math.min(1, el.clientWidth / el.scrollWidth);
      thumb.style.width = `${w * 100}%`;
      thumb.style.left = `${(el.scrollLeft / el.scrollWidth) * 100}%`;
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
    <div className={styles.root}>
      <div className={styles.module}>
        <h2 className={styles.heading}>
          How it <span className={styles.headingYellow}>plays</span>
        </h2>

        {/* Progress bar sits above the cards. */}
        <div ref={trackRef} className={styles.scrollbar} aria-hidden="true">
          <div ref={thumbRef} className={styles.thumb} />
        </div>

        <div ref={wrapRef} className={styles.wrap}>
          <div ref={railRef} className={styles.rail}>
            {STEPS.map((s, i) => (
              <figure key={s.n} data-card className={styles.card}>
                <div className={styles.badge}>{s.n}</div>
                <div className={styles.media}>
                  {s.video ? (
                    <video
                      ref={(el) => { videoRefs.current[i] = el; }}
                      src={s.video}
                      poster={s.img}
                      muted
                      loop
                      playsInline
                      preload="auto"
                      className={styles.mediaInner}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.img} alt={`Step ${s.n}`} className={styles.mediaInner} />
                  )}
                </div>
                <figcaption className={styles.caption}>{s.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>

      {/* Bento sits directly beneath the cards, tight (no reserved gap). */}
      <div className={styles.bento}>
        <BentoBoard />
      </div>
    </div>
  );
}
