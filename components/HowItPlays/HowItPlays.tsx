"use client";
import { useEffect, useRef, useState } from "react";
import BentoBoard from "../Nav/BentoBoard";
import AccessibleMenu from "../Nav/AccessibleMenu";
import { getScheme, getHideImages, CONTRAST_EVENT } from "../../lib/contrastScheme";
import styles from "./HowItPlays.module.css";

type Step = { n: number; caption: string; img: string; video: string | null };

const STEPS: Step[] = [
  { n: 1, caption: "DEAL 3-6 CHUMS EACH", img: "/step1-redue.jpg", video: "/step1-video-animation.mp4" },
  { n: 2, caption: "HEAD OUTSIDE",         img: "/step2-redue.jpg", video: "/step2-video-animation.mp4" },
  { n: 3, caption: "SPOT REAL DOGS",       img: "/step3-redue.jpg", video: "/step3-video-animation.mp4" },
  { n: 4, caption: "MATCH TO YOUR CHUM",   img: "/instruction-step4.jpg", video: null },
  { n: 5, caption: "MOST CHUMS WINS",       img: "/step6-redue.jpg", video: "/step6-video-animation.mp4" },
];

export default function HowItPlays() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // In a contrast scheme (or with images hidden) the page Bento swaps to the same
  // outlined-box text menu the hamburger uses, so there are no images/video to
  // fight the monochrome sweep. Same condition and same component as Nav; the
  // boxes carry their own outlines (and pick up the #pc-site scheme stroke), so no
  // separate stroke work is needed. Starts false so SSR matches the default board.
  const [accessibleMode, setAccessibleMode] = useState(false);
  useEffect(() => {
    const read = () => setAccessibleMode(getScheme() !== null || getHideImages());
    read();
    window.addEventListener(CONTRAST_EVENT, read);
    return () => window.removeEventListener(CONTRAST_EVENT, read);
  }, []);

  // Owner review: the videos no longer loop independently. They play ONCE, in
  // order, and each one starts the next when it has a second left, so the
  // sequence reads as one run rather than several loops out of step.
  //
  // The on-screen gate is unchanged and deliberate: nothing plays until it is
  // actually visible. The chain only advances to a video that is on screen; if
  // the next one is not, it starts when it scrolls into view instead.
  useEffect(() => {
    const vids = videoRefs.current.filter(Boolean) as HTMLVideoElement[];
    if (!vids.length) return;

    const visible = new Set<HTMLVideoElement>();
    const played = new Set<HTMLVideoElement>();
    const HANDOVER = 1; // seconds before the end that the next one starts

    const start = (v: HTMLVideoElement) => {
      if (played.has(v) || !visible.has(v)) return;
      played.add(v);
      v.currentTime = 0;
      v.play().catch(() => {});
    };

    const onTime = (e: Event) => {
      const v = e.target as HTMLVideoElement;
      if (!v.duration || Number.isNaN(v.duration)) return;
      if (v.duration - v.currentTime > HANDOVER) return;
      const next = vids[vids.indexOf(v) + 1];
      if (next) start(next);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) {
            visible.add(v);
            // The first video begins the chain; a later one only starts here
            // if the chain already reached it while it was off screen.
            if (played.has(v) && !v.ended) {
              // Started earlier, then paused when it scrolled away. Resume
              // rather than restart, so it still reaches its final frame.
              v.play().catch(() => {});
            } else if (v === vids[0] || played.has(vids[vids.indexOf(v) - 1])) {
              start(v);
            }
          } else {
            visible.delete(v);
            if (!v.ended) v.pause();
          }
        });
      },
      { threshold: 0.35 }
    );

    // A finished video holds its last frame, which is the frame that matters --
    // the beginning only sets the scene.
    const onEnded = (e: Event) => {
      const v = e.target as HTMLVideoElement;
      // Owner review: the last frame of some clips is blank, so the card ended
      // white. Land a third of a second early, which is comfortably past the
      // action and clear of the empty tail.
      if (v.duration) v.currentTime = Math.max(0, v.duration - 0.35);
    };

    vids.forEach((v) => {
      v.loop = false;
      v.addEventListener('ended', onEnded);
      v.addEventListener('timeupdate', onTime);
      io.observe(v);
    });
    return () => {
      io.disconnect();
      vids.forEach((v) => {
        v.removeEventListener('timeupdate', onTime);
        v.removeEventListener('ended', onEnded);
      });
    };
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
      if (e.ctrlKey) return; // trackpad pinch (ctrl+wheel): let the browser zoom
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      // 1px tolerance: scrollWidth/clientWidth are fractional, so scrollLeft can
      // top out a fraction short of `max` and never satisfy a strict `>= max`.
      // Without the slack the rail keeps swallowing wheel events at the far end
      // and the page never scrolls on down past the fully-extended row.
      const EDGE = 1;
      if (delta > 0) {
        if (el.scrollLeft >= max - EDGE) return; // all cards passed -> page continues
        e.preventDefault();
        el.scrollLeft = Math.min(el.scrollLeft + delta, max);
      } else {
        if (el.scrollLeft <= EDGE) return; // back at the start -> page scrolls up
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
          How it <span className={styles.headingYellow}>works</span>
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

      {/* Bento sits directly beneath the cards, tight (no reserved gap). In a
          scheme it becomes the outlined-box text menu, the same swap the Nav uses. */}
      <div className={styles.bento}>
        {accessibleMode ? <AccessibleMenu /> : <BentoBoard />}
      </div>
    </div>
  );
}
