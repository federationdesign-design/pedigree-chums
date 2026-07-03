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

  useEffect(() => {
    const videos = videoRefs.current.filter(Boolean) as HTMLVideoElement[];
    if (!videos.length) return;

    const midpoint = window.innerHeight / 2;

    const check = () => {
      videos.forEach((v) => {
        const rect = v.getBoundingClientRect();
        const cardMid = rect.top + rect.height / 2;
        if (cardMid < midpoint && cardMid > 0) {
          if (v.paused) v.play().catch(() => {});
        } else {
          if (!v.paused) { v.pause(); }
        }
      });
    };

    window.addEventListener("scroll", check, { passive: true });
    check(); // run once on mount
    return () => window.removeEventListener("scroll", check);
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.row}>
        {STEPS.map((s, i) => (
          <div key={s.n} className={styles.card}>
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
    </section>
  );
}
