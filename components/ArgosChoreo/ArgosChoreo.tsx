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
  // poll starts fading in the moment the yellow line finishes extending
  // (p=0.24), overlapping with the mark/text build rather than waiting
  const pollCard = clamp01((p - 0.24) / 0.3);
  const btns = clamp01((p - 0.6) / 0.15);
  /* Lock engages the moment the buttons are fully visible -- not later --
     so there is never a window where the reader is blocked before they can
     even see something to click. */
  const fullyStaged = btns >= 0.98;

  const [answered, setAnswered] = useState(false);
  const [shakeSignal, setShakeSignal] = useState(0);
  const attemptsRef = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef({ fullyStaged, answered });
  stateRef.current = { fullyStaged, answered };

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const isPinnedNow = () => {
      const r = scene.getBoundingClientRect();
      // "pinned" = the scene still has room below the viewport, i.e. we are
      // still inside its scroll travel, not past it yet.
      return r.top <= 160 && r.bottom > window.innerHeight;
    };

    const trigger = () => {
      attemptsRef.current = Math.min(attemptsRef.current + 1, 10);
      setShakeSignal((n) => n + 1);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        attemptsRef.current = 0;
      }, 2500);
    };

    const guard = (e: Event, blocked: boolean) => {
      if (blocked && stateRef.current.fullyStaged && !stateRef.current.answered && isPinnedNow()) {
        e.preventDefault();
        trigger();
        return true;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => guard(e, e.deltaY > 0);
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => guard(e, touchY - e.touches[0].clientY > 5);

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

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
            locked={fullyStaged && !answered}
            shakeSignal={shakeSignal}
            shakeAttempts={attemptsRef.current}
          />
          {fullyStaged && !answered && <p className={styles.pollHint}>Pick one to keep reading &darr;</p>}
        </div>
      </div>
    </div>
  );
}

export function StatueBulletsChoreo({
  slides,
  bullets,
  quote,
  blockClass,
  markClass,
}: {
  slides: { src: string; alt: string; caption: string }[];
  bullets?: string[];
  /* When provided, an animated quote shares this SAME pinned scene and
     scroll progress, so its build begins as soon as the gallery itself
     starts moving -- not after a separate later scene is reached. */
  quote?: string;
  blockClass?: string;
  markClass?: string;
}) {
  const { sceneRef, p } = useSceneProgress();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onTouch = () => {
      swiped.current = true;
    };
    track.addEventListener("touchstart", onTouch, { passive: true });
    return () => track.removeEventListener("touchstart", onTouch);
  }, []);

  /* The gallery pans continuously with vertical scroll progress (across
     the first 55% of the scene) rather than firing a single autoplay
     animation -- this lets each bullet be tied directly to a specific
     image becoming current, per image N+1 arriving -> bullet N appears.
     A manual swipe hands control to the browser for the rest of the scene. */
  const galleryP = clamp01(p / 0.55);
  useEffect(() => {
    const track = trackRef.current;
    if (!track || swiped.current) return;
    track.scrollLeft = galleryP * (track.scrollWidth - track.clientWidth);
  }, [galleryP]);

  const n = slides.length;

  // quote build progress, starting almost immediately (p ~ 0)
  const qLine = clamp01(p / 0.5);
  const qMark = p >= 0.5;
  const qText = clamp01((p - 0.55) / 0.35);

  return (
    <div ref={sceneRef} className={bullets ? styles.bulletScene : quote ? styles.bulletSceneNoBullets : styles.bulletSceneNoBullets}>
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
        {bullets && (
          <ul className={styles.choreoBullets}>
            {bullets.map((b, i) => {
              const isFirst = i === 0;
              const isLast = i === bullets.length - 1;
              let o: number;
              if (isFirst) {
                // first bullet is already visible on arrival -- only the
                // others are scroll-triggered
                o = 1;
              } else if (isLast) {
                // final bullet: reveals after the gallery finishes, as the
                // reader resumes ordinary scrolling
                o = clamp01((p - 0.65) / 0.15);
              } else {
                // bullet i reveals when image (i+2) becomes current, i.e.
                // gallery progress crosses (i+1)/(n-1)
                const threshold = (i + 1) / (n - 1);
                o = clamp01((galleryP - threshold + 0.06) / 0.1);
              }
              return (
                <li
                  key={b}
                  className={isLast ? styles.choreoBulletLast : undefined}
                  style={{ opacity: o, transform: `translateY(${(1 - o) * 14}px)` }}
                >
                  {b}
                </li>
              );
            })}
          </ul>
        )}
        {quote && (
          <div className={styles.quoteHolder} style={{ marginTop: 22 }}>
            <div className={styles.quoteLineTrack}>
              <div className={styles.quoteLine} style={{ height: `${Math.max(3, qLine * 100)}%` }} />
            </div>
            <blockquote className={blockClass} style={{ borderLeftColor: "transparent", margin: "0" }}>
              <span className={markClass} style={{ opacity: qMark ? 1 : 0, transition: "opacity 0.2s ease" }}>{"\u201c"}</span>
              <span style={{ opacity: qText, filter: `blur(${(1 - qText) * 14}px)`, willChange: "opacity, filter" }}>{quote}</span>
            </blockquote>
          </div>
        )}
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

  /* Pin releases once playback passes 40%, or immediately if the video was
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
      const dur = video.duration;
      if (dur && isFinite(dur) && video.currentTime / dur >= 0.4) {
        setUnlocked(true);
      }
    };
    // Belt-and-suspenders: timeupdate should fire reliably during playback,
    // but a poll interval guarantees the unlock even if an event is missed
    // (e.g. duration not yet known when playback starts on some devices).
    const poll = setInterval(checkProgress, 400);
    video.addEventListener("timeupdate", checkProgress);
    video.addEventListener("loadedmetadata", checkProgress);
    checkProgress();

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
      clearInterval(poll);
      video.removeEventListener("timeupdate", checkProgress);
      video.removeEventListener("loadedmetadata", checkProgress);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={unlocked ? styles.videoGateUnlocked : styles.videoGate}>
      <div className={styles.videoStage}>{children}</div>
    </div>
  );
}
