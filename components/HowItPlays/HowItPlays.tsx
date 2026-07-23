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
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
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

  // Sticky pin: freeze the section and translate the card row horizontally with
  // vertical scroll (left-aligned, several cards visible), then release.
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

    let distance = 0;
    let raf = 0;

    const update = () => {
      if (distance <= 0) {
        rail.style.transform = "none";
        if (track) track.style.opacity = "0";
        return;
      }
      const rect = section.getBoundingClientRect();
      const scrolled = Math.min(Math.max(-rect.top, 0), distance);
      rail.style.transform = `translate3d(${-scrolled}px, 0, 0)`;
      if (track && thumb) {
        track.style.opacity = "1";
        const maxLeft = Math.max(0, track.clientWidth - thumb.offsetWidth);
        thumb.style.left = `${(scrolled / distance) * maxLeft}px`;
      }
    };

    const layout = () => {
      distance = Math.max(0, rail.offsetWidth - stage.clientWidth);
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (distance > 0) {
        pin.style.height = `${vh}px`;
        section.style.height = `${vh + distance}px`;
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
          <div className={styles.spacer} aria-hidden="true" />

          <h2 className={styles.heading}>
            How it <span className={styles.headingYellow}>plays</span>
          </h2>

          {/* Progress bar sits above the cards so they hug the bento below. */}
          <div ref={trackRef} className={styles.scrollbar} aria-hidden="true">
            <div ref={thumbRef} className={styles.thumb} />
          </div>

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
      </section>

      {/* Bento sits directly beneath, so it rises in as the sequence releases. */}
      <div className={styles.bento}>
        <BentoBoard />
      </div>
    </div>
  );
}
