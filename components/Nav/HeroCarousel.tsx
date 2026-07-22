"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./Nav.module.css";

type Slide = {
  href: string;
  video?: string;      // mp4 source
  videoWebm?: string;  // optional webm source (played in preference where supported)
  img?: string;        // used when there is no video
  tagGood?: string;    // green pill
  tagBad?: string;     // red pill
  tags?: string[];     // outline pills
  titleAccent: string; // yellow lead
  titleRest?: string;  // white remainder
  btn: string;
};

// Featured hero slides. Slide 1 is the original Argos clip; slides 2 and 3 add
// the Anubis and Hound of the Baskervilles essays.
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
    titleRest: " The Grave-Robber We Made a God",
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

export default function HeroCarousel({ active, onNavigate }: { active: boolean; onNavigate: () => void }) {
  const [index, setIndex] = useState(0);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const hoverRef = useRef(false);

  const go = (n: number) => setIndex(((n % SLIDES.length) + SLIDES.length) % SLIDES.length);

  // Play only the active slide's video; pause the rest.
  useEffect(() => {
    vids.current.forEach((v, i) => {
      if (!v) return;
      if (i === index) {
        try { v.currentTime = 0; } catch {}
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [index]);

  // Auto-advance every 7s; pause while the pointer is over the carousel.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      if (!hoverRef.current) setIndex((i) => (i + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(id);
  }, [active]);

  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; }}
    >
      <div className={styles.carTrack} style={{ transform: `translateX(-${index * 100}%)` }}>
        {SLIDES.map((s, i) => (
          <Link key={s.href} href={s.href} className={`${styles.heroSlot} ${styles.carSlide}`} onClick={onNavigate}>
            {s.video ? (
              <video
                ref={(el) => { vids.current[i] = el; }}
                className={styles.heroVideo}
                muted
                playsInline
                loop
                preload="auto"
                aria-hidden
              >
                {s.videoWebm ? <source src={s.videoWebm} type="video/webm" /> : null}
                <source src={s.video} type="video/mp4" />
              </video>
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

      <button type="button" className={`${styles.carArrow} ${styles.carPrev}`} onClick={(e) => { stop(e); go(index - 1); }} aria-label="Previous">‹</button>
      <button type="button" className={`${styles.carArrow} ${styles.carNext}`} onClick={(e) => { stop(e); go(index + 1); }} aria-label="Next">›</button>

      <div className={styles.carDots}>
        {SLIDES.map((s, i) => (
          <button
            key={s.href}
            type="button"
            className={`${styles.carDot} ${i === index ? styles.carDotActive : ""}`}
            onClick={(e) => { stop(e); go(i); }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
