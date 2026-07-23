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
export function QuoteBuild({
  pinned,
  quote,
  blockClass,
  markClass,
}: {
  pinned: React.ReactNode;
  quote: string;
  blockClass: string;
  markClass: string;
}) {
  const { sceneRef, p } = useSceneProgress();
  const line = clamp01(p / 0.3);
  const mark = p >= 0.31;
  const text = clamp01((p - 0.38) / 0.32);
  /* p 0.7 -> 1.0 is a dwell zone: the finished quote holds the screen. The
     blockquote uses the article's own pullquote classes so the final state is
     pixel-identical to the static version; its yellow border is made
     transparent and our growing bar sits exactly in its place. */
  return (
    <div ref={sceneRef} className={styles.quoteScene}>
      <div className={styles.stage}>
        <div className={styles.pinned}>{pinned}</div>
        <div className={styles.quoteHolder}>
          <div className={styles.quoteLineTrack}>
            <div className={styles.quoteLine} style={{ height: `${Math.max(3, line * 100)}%` }} />
          </div>
          <blockquote className={blockClass} style={{ borderLeftColor: "transparent", margin: "24px 0" }}>
            <span className={markClass} style={{ opacity: mark ? 1 : 0, transition: "opacity 0.2s ease" }}>{"\u201c"}</span>
            <span style={{ opacity: text, filter: `blur(${(1 - text) * 14}px)`, willChange: "opacity, filter" }}>{quote}</span>
          </blockquote>
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
            const start = 0.3 + i * 0.15;
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
  title,
  header,
  history,
  works,
}: {
  title: React.ReactNode;
  header: React.ReactNode;
  history: React.ReactNode;
  works: React.ReactNode;
}) {
  const { sceneRef, p } = useSceneProgress();
  const o2 = clamp01((p - 0.3) / 0.35);
  return (
    <div ref={sceneRef} className={styles.homerScene}>
      {title}
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

  /* Pure CSS sticky-in-tall-container pin, same pattern as every other
     choreographed scene: release happens naturally when the scroll spacer
     is exhausted, so there is no JS-driven snap and no dependency on
     whether the video has finished playing. Autoplay is the only JS job. */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const video = wrap.querySelector("video");
    if (!video) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && !video.ended) video.play().catch(() => {});
        });
      },
      { threshold: 0.5 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={styles.videoGate}>
      <div className={styles.videoStage}>{children}</div>
    </div>
  );
}
