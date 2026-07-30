"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Manrope } from "next/font/google";
import styles from "./Nav.module.css";

// Big chunky arrow glyphs use Manrope.
const manrope = Manrope({ subsets: ["latin"], weight: ["800"] });

type Slide = {
  href: string;
  video?: string;      // mp4 source
  img?: string;        // used when there is no video
  tagGood?: string;    // green pill
  tagBad?: string;     // red pill
  tags?: string[];     // outline pills
  titleAccent: string; // yellow lead
  titleRest?: string;  // white remainder
  btn: string;
};

// Featured hero slides. Slide 1 is the Argos clip; slides 2 and 3 add the Anubis
// and Hound of the Baskervilles essays. Manual navigation only (arrows).
const SLIDES: Slide[] = [
  {
    href: "/good-dog-bad-dog/argos",
    video: "/menuflash-argos-opt.mp4",
    tagGood: "Good dog",
    tags: ["Homer", "The Odyssey"],
    titleAccent: "Argos:",
    titleRest: " The Dog Who Knew His Master",
    btn: "About this dog",
  },
  {
    href: "/good-dog-bad-dog/anubis",
    video: "/history/Anubis-hero-vid.mp4",
    tagBad: "Bad dog",
    tags: ["Egypt", "Myth"],
    titleAccent: "Anubis:",
    titleRest: " The Scavenger Made Into a God",
    btn: "About this dog",
  },
  {
    href: "/good-dog-bad-dog/hound-of-the-baskervilles",
    img: "/hound-of-the-baskervilles.jpg",
    tagBad: "Bad dog",
    tags: ["Conan Doyle", "Dartmoor"],
    titleAccent: "The Hound",
    titleRest: " of the Baskervilles",
    btn: "About this dog",
  },
];

export default function HeroCarousel({ onNavigate }: { onNavigate: () => void }) {
  const [index, setIndex] = useState(0);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const rafRef = useRef(0);
  const dirRef = useRef(1); // +1 forward, -1 backward
  const lastRef = useRef(0);
  const holdRef = useRef(0); // hold at a bound until this timestamp

  const go = (n: number) => setIndex(((n % SLIDES.length) + SLIDES.length) % SLIDES.length);

  // Ping-pong the active slide's clip: play forward, then backward, bouncing on
  // a loop. HTML5 video can't play in reverse, so we drive currentTime each
  // frame. Every other slide is paused; image slides (no <video>) sit still.
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    dirRef.current = 1;
    lastRef.current = 0;
    holdRef.current = 0;
    vids.current.forEach((v, i) => {
      if (!v) return;
      v.pause();
      if (i === index) { try { v.currentTime = 0; } catch {} }
    });

    const EPS = 0.04; // stay just inside the ends so a frame is always painted
    const HOLD_MS = 500; // half-second pause at each end before it turns around
    const tick = (ts: number) => {
      const v = vids.current[index];
      if (v) {
        const d = v.duration;
        if (isFinite(d) && d > 0 && lastRef.current && ts >= holdRef.current) {
          const dt = Math.min(0.05, (ts - lastRef.current) / 1000);
          let t = v.currentTime + dirRef.current * dt;
          if (t >= d - EPS) { t = d - EPS; dirRef.current = -1; holdRef.current = ts + HOLD_MS; }
          else if (t <= EPS) { t = EPS; dirRef.current = 1; holdRef.current = ts + HOLD_MS; }
          try { v.currentTime = t; } catch {}
        }
      }
      lastRef.current = ts;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [index]);

  // Hover reverses the current direction; leaving reverses it back.
  function handleEnter(i: number) {
    if (i === index) dirRef.current = -dirRef.current;
  }
  function handleLeave(i: number) {
    if (i === index) dirRef.current = -dirRef.current;
  }

  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <div className={styles.carousel}>
      <div className={styles.carTrack} style={{ transform: `translateX(-${index * 100}%)` }}>
        {SLIDES.map((s, i) => (
          <Link
            key={s.href}
            href={s.href}
            className={`${styles.heroSlot} ${styles.carSlide}`}
            onClick={onNavigate}
            onMouseEnter={() => handleEnter(i)}
            onMouseLeave={() => handleLeave(i)}
          >
            {s.video ? (
              <video
                ref={(el) => { vids.current[i] = el; }}
                className={styles.heroVideo}
                src={s.video}
                muted
                playsInline
                preload="auto"
                aria-hidden
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.img} alt="" className={styles.heroVideo} />
            )}
            <div className={styles.heroContent}>
              <div className={styles.heroTags}>
                {s.tagGood && <span className={styles.heroTagGood}>{s.tagGood}</span>}
                {s.tagBad && <span className={styles.heroTagBad}>{s.tagBad}</span>}
                {s.tags?.map((t) => (
                  <span key={t} className={styles.heroTagOutline}>{t}</span>
                ))}
              </div>
              <div className={styles.heroBottom}>
                <p className={styles.heroTitle}>
                  <span className={styles.heroTitleAccent}>{s.titleAccent}</span>{s.titleRest ?? ""}
                </p>
                <span className={styles.heroBtn}>{s.btn}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <button
        type="button"
        className={`${styles.carArrow} ${styles.carPrev} ${manrope.className}`}
        onClick={(e) => { stop(e); go(index - 1); }}
        aria-label="Previous"
      >{"<"}</button>
      <button
        type="button"
        className={`${styles.carArrow} ${styles.carNext} ${manrope.className}`}
        onClick={(e) => { stop(e); go(index + 1); }}
        aria-label="Next"
      >{">"}</button>
    </div>
  );
}
