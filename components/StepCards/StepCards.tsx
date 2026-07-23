"use client";
import { useEffect, useRef } from "react";
import styles from "./StepCards.module.css";

const STEPS = [
  { n: 1, caption: "DEAL 3-6 CHUMS EACH",  img: "/step1-redue.jpg", video: "/step1-video-animation.mp4" },
  { n: 2, caption: "HEAD OUTSIDE",          img: "/step2-redue.jpg", video: "/step2-video-animation.mp4" },
  { n: 3, caption: "SPOT REAL DOGS",        img: "/step3-redue.jpg", video: "/step3-video-animation.mp4" },
  { n: 4, caption: "MATCH TO YOUR CHUM",    img: "/step4-redue.jpg", video: null },
  { n: 5, caption: "FIND MORE CHUMS",       img: "/step5-redue.jpg", video: null },
  { n: 6, caption: "MOST CHUMS WINS",       img: "/step6-redue.jpg", video: null },
];

export default function StepCards() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Autoplay the step videos while they're on screen.
  useEffect(() => {
    const videos = videoRefs.current.filter(Boolean) as HTMLVideoElement[];
    if (!videos.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    videos.forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, []);

  // Desktop: convert a vertical wheel into horizontal scroll, holding the page
  // until EVERY card has passed, then release. (Matches the video rail above.)
  useEffect(() => {
    const wrap = wrapRef.current;
    const el = railRef.current;
    if (!wrap || !el) return;

    const driveRail = (delta: number, preventDefault: () => void) => {
      if (delta === 0) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return; // not scrollable (fits) -> let the page move
      if (delta > 0) {
        if (el.scrollLeft >= max) return; // all cards passed -> page continues
        preventDefault();
        el.scrollLeft = Math.min(el.scrollLeft + delta, max);
      } else {
        if (el.scrollLeft <= 0) return; // back at the start -> page scrolls up
        preventDefault();
        el.scrollLeft = Math.max(el.scrollLeft + delta, 0);
      }
    };

    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      driveRail(delta, () => e.preventDefault());
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, []);

  // Touch: no wheel events, so drive the rail from the page-scroll position via
  // a rAF lerp (eases in with inertia). Engages as the row rises through the
  // screen and runs through ALL cards before releasing. (Matches the video rail.)
  useEffect(() => {
    const wrap = wrapRef.current;
    const el = railRef.current;
    if (!wrap || !el) return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const EASE = 0.08;
    let target = 0;
    let current = 0;
    let released = false;
    let raf = 0;

    const measure = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return 0;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const centre = rect.top + rect.height / 2;
      const start = vh * 0.85; // begins as the row nears the lower half
      const end = vh * 0.15; //   finishes as it nears the top
      const p = (start - centre) / (start - end);
      const clamped = Math.max(0, Math.min(1, p));
      if (clamped >= 1) released = true; // all cards passed -> hand control back
      return clamped * max; // drive through every card
    };

    const tick = () => {
      target = measure();
      current += (target - current) * EASE;
      if (Math.abs(target - current) < 0.5) current = target;
      el.scrollLeft = current;
      if (current === target) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (released) return;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Yellow draggable scrollbar thumb synced to the rail's scroll position.
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
      thumb.style.width = `${(el.clientWidth / el.scrollWidth) * 100}%`;
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
    <section className={styles.section}>
      <div ref={wrapRef} className={styles.wrap}>
        <div ref={railRef} className={styles.row}>
          {STEPS.map((s, i) => (
            <div key={s.n} data-card className={styles.card}>
              <div className={styles.badge}>{s.n}</div>
              <div className={styles.media}>
                {s.video ? (
                  <video
                    ref={(el) => { videoRefs.current[i] = el; }}
                    src={s.video}
                    muted
                    playsInline
                    loop={false}
                    onEnded={(e) => {
                      const v = e.currentTarget;
                      v.pause();
                      v.currentTime = Math.max(0, v.duration - 0.05);
                    }}
                    className={styles.img}
                    poster={s.img}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.img} alt={`Step ${s.n}`} className={styles.img} />
                )}
              </div>
              <div className={styles.caption}>{s.caption}</div>
            </div>
          ))}
        </div>
      </div>

      <div ref={trackRef} className={styles.scrollbar} aria-hidden="true">
        <div ref={thumbRef} className={styles.thumb} />
      </div>
    </section>
  );
}
