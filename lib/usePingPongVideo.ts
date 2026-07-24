"use client";
import { useEffect, type RefObject } from "react";

/**
 * Drives a <video> as a continuous "ping-pong": it plays forward, and at the
 * end plays backward, bouncing between the two on a loop. HTML5 video can't
 * play in reverse natively, so we drive `currentTime` every animation frame in
 * whichever direction is current.
 *
 * Interaction: while the pointer is over the video's container the direction is
 * reversed; moving the pointer away reverses it back, so it resumes the way it
 * was heading.
 *
 * The video should NOT have `autoPlay`/`loop` — this hook owns playback. It
 * pauses when off-screen (battery) and freezes on the first frame when the user
 * prefers reduced motion.
 */
export function usePingPongVideo(
  ref: RefObject<HTMLVideoElement | null>,
  enabled = true
) {
  useEffect(() => {
    const v = ref.current;
    if (!v || !enabled) return;

    const target: HTMLElement = v.parentElement ?? v;
    const EPS = 0.04; // stay just inside the ends so a frame is always painted

    let dir = 1; // current motion direction (+1 forward, -1 backward)
    let raf = 0;
    let last = 0;
    let hold = 0; // hold at a bound until this timestamp (buffer between legs)
    let running = false;

    const HOLD_MS = 500; // half-second pause at each end before it turns around

    v.muted = true; // required for any autoplay-adjacent behaviour
    try { v.pause(); } catch {}

    const tick = (ts: number) => {
      const d = v.duration;
      if (isFinite(d) && d > 0 && last && ts >= hold) {
        const dt = Math.min(0.05, (ts - last) / 1000); // clamp tab-switch gaps
        let t = v.currentTime + dir * dt;
        if (t >= d - EPS) { t = d - EPS; dir = -1; hold = ts + HOLD_MS; }
        else if (t <= EPS) { t = EPS; dir = 1; hold = ts + HOLD_MS; }
        try { v.currentTime = t; } catch {}
      }
      last = ts;
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // Hover reverses; leaving reverses back.
    const onEnter = () => { dir = -dir; };
    const onLeave = () => { dir = -dir; };
    target.addEventListener("pointerenter", onEnter);
    target.addEventListener("pointerleave", onLeave);

    // Pause when off-screen.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? start() : stop()));
      },
      { threshold: 0.1 }
    );
    io.observe(v);

    // Respect reduced-motion: freeze on the first frame.
    const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const applyMotionPref = () => {
      if (rm?.matches) { stop(); try { v.currentTime = 0; } catch {} }
      else start();
    };
    applyMotionPref();
    rm?.addEventListener?.("change", applyMotionPref);

    return () => {
      stop();
      target.removeEventListener("pointerenter", onEnter);
      target.removeEventListener("pointerleave", onLeave);
      io.disconnect();
      rm?.removeEventListener?.("change", applyMotionPref);
    };
  }, [ref, enabled]);
}
