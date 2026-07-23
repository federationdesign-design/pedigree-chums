"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./ArgosChoreo.module.css";
import DogPoll, { PollOption } from "../DogPoll/DogPoll";

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
/* ── Quote build + poll, staged in one pinned scene ──────────────────────
   The quote assembles as usual; once it is fully built, the poll card fades
   in beneath it and its two buttons pop in a beat after that. Once the
   scene has fully played out, forward scroll is blocked until the reader
   answers -- attempting to scroll shakes the two buttons, each with its own
   independent timing, escalating with each attempt. Answering releases the
   scene immediately. */
export function QuotePollScene({
  quote,
  blockClass,
  markClass,
  question,
  options,
  footnote,
}: {
  quote: string;
  blockClass: string;
  markClass: string;
  question: string;
  options: PollOption[];
  footnote?: string;
}) {
  const { sceneRef, p } = useSceneProgress();
  const line = clamp01(p / 0.24);
  const mark = p >= 0.25;
  const text = clamp01((p - 0.3) / 0.28);
  const pollCard = clamp01((p - 0.5) / 0.2);
  const btns = clamp01((p - 0.68) / 0.12);
  const fullyStaged = p >= 0.82;

  const [answered, setAnswered] = useState(false);
  const [shake, setShake] = useState(0);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const isPinnedAndDue = () => {
      const r = scene.getBoundingClientRect();
      return fullyStaged && !answered && r.top <= 140 && r.bottom > window.innerHeight + 40;
    };

    const trigger = () => {
      setShake((n) => Math.min(n + 1, 10));
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setShake(0), 1400);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0 && isPinnedAndDue()) {
        e.preventDefault();
        trigger();
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY;
      if (dy > 6 && isPinnedAndDue()) {
        e.preventDefault();
        trigger();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
    };
  }, [fullyStaged, answered]);

  return (
    <div ref={sceneRef} className={styles.quotePollScene}>
      <div className={styles.stage}>
        <div className={styles.quoteHolder}>
          <div className={styles.quoteLineTrack}>
            <div className={styles.quoteLine} style={{ height: `${Math.max(3, line * 100)}%` }} />
          </div>
          <blockquote className={blockClass} style={{ borderLeftColor: "transparent", margin: "24px 0 16px" }}>
            <span className={markClass} style={{ opacity: mark ? 1 : 0, transition: "opacity 0.2s ease" }}>{"\u201c"}</span>
            <span style={{ opacity: text, filter: `blur(${(1 - text) * 14}px)`, willChange: "opacity, filter" }}>{quote}</span>
          </blockquote>
        </div>
        <div
          className={styles.pollWrap}
          style={{ opacity: pollCard, transform: `translateY(${(1 - pollCard) * 16}px)` }}
        >
          <DogPoll
            title="What do you think?"
            titleFont="body"
            question={question}
            options={options}
            footnote={footnote}
            onAnswer={() => setAnswered(true)}
            buttonsProgress={btns}
            shake={shake}
          />
        </div>
      </div>
    </div>
  );
}

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
  const [unlocked, setUnlocked] = useState(false);

  /* Pin releases once playback passes 60%, or immediately if the video was
     already past that point on a previous visit. Pin and spacer are removed
     together (both gated by the same `unlocked` flag) so there is never a
     mismatch between how much scroll room is reserved and whether anything
     is actually pinned -- that mismatch was the earlier "gap" bug. */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const video = wrap.querySelector("video");
    if (!video) return;

    const checkProgress = () => {
      if (video.duration && video.currentTime / video.duration >= 0.6) {
        setUnlocked(true);
      }
    };
    if (video.duration && video.currentTime / video.duration >= 0.6) setUnlocked(true);
    video.addEventListener("timeupdate", checkProgress);

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
      video.removeEventListener("timeupdate", checkProgress);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={unlocked ? styles.videoGateUnlocked : styles.videoGate}>
      <div className={styles.videoStage}>{children}</div>
    </div>
  );
}
