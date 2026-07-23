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

// Timeline tuning — each value is a fraction of the viewport height of page
// scroll spent on that phase. Video holds scrub the clip 0 -> end; image holds
// just dwell; slides move the rail from one centred card to the next.
const HOLD_VIDEO = 0.62;
const HOLD_IMAGE = 0.26;
const SLIDE = 0.34;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export default function HowItPlays() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const stage = stageRef.current;
    const rail = railRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!section || !pin || !stage || !rail) return;

    // overflow-x: hidden on <html>/<body> breaks position: sticky; clip does
    // not. The build downlevels CSS clip -> hidden, so set it at runtime.
    const root = document.documentElement;
    const body = document.body;
    const prevRootOX = root.style.overflowX;
    const prevBodyOX = body.style.overflowX;
    if (typeof CSS !== "undefined" && CSS.supports?.("overflow-x", "clip")) {
      root.style.overflowX = "clip";
      body.style.overflowX = "clip";
    }

    type Seg =
      | { type: "hold"; index: number; hasVideo: boolean; len: number }
      | { type: "slide"; from: number; to: number; len: number };

    let centres: number[] = []; // rail translateX that centres each card
    let segs: Seg[] = [];
    let timeline = 0;
    let raf = 0;

    const activeVideo = { i: -1 };

    const pauseAllVideos = () => {
      videoRefs.current.forEach((v) => v && !v.paused && v.pause());
    };

    const scrubVideo = (i: number, p: number) => {
      const v = videoRefs.current[i];
      if (!v) return;
      if (activeVideo.i !== i) {
        pauseAllVideos();
        activeVideo.i = i;
      }
      const dur = v.duration;
      if (!isFinite(dur) || dur <= 0) return;
      // keep just shy of the very end so the last frame stays painted
      const t = Math.min(dur * 0.999, p * dur);
      if (Math.abs(v.currentTime - t) > 0.01) {
        try { v.currentTime = t; } catch {}
      }
    };

    const update = () => {
      if (timeline <= 0 || centres.length === 0) {
        rail.style.transform = "none";
        if (track) track.style.opacity = "0";
        return;
      }
      const rect = section.getBoundingClientRect();
      const scrolled = Math.min(Math.max(-rect.top, 0), timeline);

      let acc = 0;
      let tx = centres[0];
      for (let s = 0; s < segs.length; s++) {
        const seg = segs[s];
        const isLast = s === segs.length - 1;
        if (scrolled <= acc + seg.len || isLast) {
          const local = clamp01((scrolled - acc) / seg.len);
          if (seg.type === "slide") {
            pauseAllVideos();
            activeVideo.i = -1;
            tx = centres[seg.from] + (centres[seg.to] - centres[seg.from]) * easeInOut(local);
          } else {
            tx = centres[seg.index];
            if (seg.hasVideo) scrubVideo(seg.index, local);
            else { pauseAllVideos(); activeVideo.i = -1; }
          }
          break;
        }
        acc += seg.len;
      }
      rail.style.transform = `translate3d(${tx}px, 0, 0)`;

      if (track && thumb) {
        track.style.opacity = "1";
        const maxLeft = Math.max(0, track.clientWidth - thumb.offsetWidth);
        thumb.style.left = `${(scrolled / timeline) * maxLeft}px`;
      }
    };

    const layout = () => {
      const cards = rail.querySelectorAll<HTMLElement>("[data-card]");
      const stageW = stage.clientWidth;
      centres = Array.from(cards).map(
        (c) => stageW / 2 - (c.offsetLeft + c.offsetWidth / 2)
      );

      const vh = window.innerHeight || document.documentElement.clientHeight;
      segs = [];
      STEPS.forEach((step, i) => {
        segs.push({
          type: "hold",
          index: i,
          hasVideo: !!step.video,
          len: (step.video ? HOLD_VIDEO : HOLD_IMAGE) * vh,
        });
        if (i < STEPS.length - 1) segs.push({ type: "slide", from: i, to: i + 1, len: SLIDE * vh });
      });
      timeline = segs.reduce((a, s) => a + s.len, 0);

      if (timeline > 0 && centres.length > 0) {
        pin.style.height = `${vh}px`;
        section.style.height = `${vh + timeline}px`;
      } else {
        pin.style.height = "";
        section.style.height = "";
      }
      update();
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); });
    };

    layout();
    requestAnimationFrame(() => requestAnimationFrame(layout));
    if (document.fonts?.ready) document.fonts.ready.then(layout).catch(() => {});

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layout);
    const ro = new ResizeObserver(layout);
    ro.observe(rail);
    ro.observe(section);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", layout);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      root.style.overflowX = prevRootOX;
      body.style.overflowX = prevBodyOX;
    };
  }, []);

  return (
    <div className={styles.root}>
      <section ref={sectionRef} className={styles.section}>
        <div ref={pinRef} className={styles.pin}>
          <h2 className={styles.heading}>
            How it <span className={styles.headingYellow}>plays</span>
          </h2>

          <div ref={stageRef} className={styles.stage}>
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

          <div ref={trackRef} className={styles.scrollbar} aria-hidden="true">
            <div ref={thumbRef} className={styles.thumb} />
          </div>
        </div>
      </section>

      {/* Bento sits directly beneath the pinned section, so it rises in with
          minimal gap the moment the horizontal sequence releases. */}
      <div className={styles.bento}>
        <BentoBoard />
      </div>
    </div>
  );
}
