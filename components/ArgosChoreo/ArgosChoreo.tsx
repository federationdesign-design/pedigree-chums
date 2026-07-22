"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./ArgosChoreo.module.css";

/*
  Scroll-choreography scenes for the Argos article (mobile).
  Each scene is a tall container with a sticky 100svh stage; scroll progress
  through the container drives the staged sequence, then the stage releases
  naturally. No scroll hijacking anywhere -- the page always scrolls freely.
*/

function useSceneProgress() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = false;
    const update = () => {
      raf = false;
      const el = sceneRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      if (travel <= 0) return setP(1);
      setP(Math.min(1, Math.max(0, -r.top / travel)));
    };
    const onScroll = () => {
      if (!raf) {
        raf = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return { sceneRef, p };
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* ── Quote build ─────────────────────────────────────────────────────────
   Pinned content on top; below it the quote assembles as the reader
   scrolls: yellow square grows into the line, the mark pops the moment the
   line completes, then the text de-blurs from zero alpha to solid. */
export function QuoteBuild({ pinned, quote }: { pinned: React.ReactNode; quote: string }) {
  const { sceneRef, p } = useSceneProgress();
  const line = clamp01(p / 0.35);
  const mark = p >= 0.36;
  const text = clamp01((p - 0.45) / 0.5);
  return (
    <div ref={sceneRef} className={styles.quoteScene}>
      <div className={styles.stage}>
        <div className={styles.pinned}>{pinned}</div>
        <div className={styles.quoteArea}>
          <div className={styles.quoteLineTrack}>
            <div className={styles.quoteLine} style={{ height: `${Math.max(3, line * 100)}%` }} />
          </div>
          <div className={styles.quoteBody}>
            <span
              className={styles.quoteMark}
              style={{ opacity: mark ? 1 : 0, transform: mark ? "scale(1)" : "scale(0.4)" }}
            >
              {"\u201c"}
            </span>
            <p
              className={styles.quoteText}
              style={{ opacity: text, filter: `blur(${(1 - text) * 14}px)` }}
            >
              {quote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Statue carousel + staged bullets ────────────────────────────────────
   The carousel pins; if the reader has not swiped it themselves, it
   auto-pans across once; the four bullets then fade in one by one as the
   scroll continues. */
export function StatueBulletsChoreo({
  slides,
  bullets,
}: {
  slides: { src: string; alt: string; caption: string }[];
  bullets: string[];
}) {
  const { sceneRef, p } = useSceneProgress();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const swiped = useRef(false);
  const autoRun = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onTouch = () => {
      swiped.current = true;
    };
    track.addEventListener("touchstart", onTouch, { passive: true });
    return () => track.removeEventListener("touchstart", onTouch);
  }, []);

  useEffect(() => {
    if (p > 0.015 && !swiped.current && !autoRun.current && trackRef.current) {
      autoRun.current = true;
      trackRef.current.scrollTo({ left: trackRef.current.scrollWidth, behavior: "smooth" });
    }
  }, [p]);

  return (
    <div ref={sceneRef} className={styles.bulletScene}>
      <div className={styles.stage}>
        <div ref={trackRef} className={styles.statueTrack}>
          {slides.map((sl, i) => (
            <figure key={sl.src} className={styles.statueSlide}>
              <div className={styles.statueImgBox}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sl.src} alt={sl.alt} loading="lazy" />
                <span className={styles.statueCount}>{i + 1} / {slides.length}</span>
              </div>
              <figcaption className={styles.statueCaption}>{sl.caption}</figcaption>
            </figure>
          ))}
        </div>
        <ul className={styles.choreoBullets}>
          {bullets.map((b, i) => {
            const start = 0.28 + i * 0.16;
            const o = clamp01((p - start) / 0.12);
            return (
              <li key={b} style={{ opacity: o, transform: `translateY(${(1 - o) * 14}px)` }}>
                {b}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ── Homer crossfade card ────────────────────────────────────────────────
   The card pins; Homer's history fades away and Major Works replaces it as
   the reader scrolls. */
export function HomerCrossfade({
  header,
  history,
  works,
}: {
  header: React.ReactNode;
  history: React.ReactNode;
  works: React.ReactNode;
}) {
  const { sceneRef, p } = useSceneProgress();
  const o2 = clamp01((p - 0.3) / 0.35);
  return (
    <div ref={sceneRef} className={styles.homerScene}>
      <div className={styles.homerStage}>
        {header}
        <div className={styles.homerLayers}>
          <div className={styles.homerLayer} style={{ opacity: 1 - o2 }}>{history}</div>
          <div className={`${styles.homerLayer} ${styles.homerLayerTop}`} style={{ opacity: o2 }}>{works}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Gated video ─────────────────────────────────────────────────────────
   Wraps the smell-of-home figure. On mobile the video pins at the top of
   the viewport until it finishes playing (autoplaying at 50% visibility as
   before); once ended -- or if it already ended on a previous pass -- the
   pin travel collapses and it scrolls past normally. */
export function GatedVideo({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const video = wrap.querySelector("video");
    if (!video) return;
    if (video.ended) {
      setEnded(true);
      return;
    }
    const onEnded = () => setEnded(true);
    video.addEventListener("ended", onEnded);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && !video.ended) video.play().catch(() => {});
        });
      },
      { threshold: 0.5 }
    );
    io.observe(video);
    return () => {
      video.removeEventListener("ended", onEnded);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={ended ? styles.videoGateDone : styles.videoGate}>
      <div className={styles.videoStage}>{children}</div>
    </div>
  );
}
