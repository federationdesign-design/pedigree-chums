"use client";
import { useState, useEffect, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_KEY } from "../../lib/consent";
import styles from "./FallingCookie.module.css";

// The COOKIES POLICY sticker. It falls in once (2s after load), straight down, and
// LANDS at the bottom of the screen where it stays as a persistent target until a
// choice is made. It runs on every page EXCEPT the pit at "/" (the pit's own cookie
// object does this there) and is skipped for reduced motion (those users get the
// notice directly, plus the Cookie settings link). No loop: one landing, then it sits.
//
// While falling it is decorative (aria-hidden container, tabIndex -1). Once settled
// it becomes a real, keyboard-focusable, screen-reader-labelled button, so it is a
// third route to consent alongside the Cookie settings link and the notice. Clicking
// it (falling or settled) opens the CookieDrop notice.
const START_DELAY_MS = 2000;

type Phase = "hidden" | "falling" | "settled";

// REVERSED 31 Aug 2026: the descent used to be a randomised zig-zag. It started in a
// lane left of the resting spot and took two sideways knocks on the way down, driven
// by --kx0 and --kx1. Steve asked for the knock and the horizontal travel to go, so
// the fall is now straight down and only the spin is randomised. Do not re-add the
// x deviations; if a wander is ever wanted again, the old keyframe windows were at
// 24-31% and 57-64%.
// Spin is a whole number of turns so it lands upright and the static settled button
// does not jump.
function computeVars(): CSSProperties {
  const rtot = (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.5 ? 2 : 3) * 360;
  return { "--rtot": `${rtot}deg` } as CSSProperties;
}

export default function FallingCookie() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("hidden");
  const [vars, setVars] = useState<CSSProperties>({});

  useEffect(() => {
    // Skip on the pit page (the pit owns it) and for reduced motion (the notice is
    // shown directly). No synchronous setState here; the drop lands via the timer.
    if (pathname === "/") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let decided = true;
    try { decided = !!localStorage.getItem(CONSENT_KEY); } catch { decided = true; }
    if (decided) return;

    const t = window.setTimeout(() => { setVars(computeVars()); setPhase("falling"); }, START_DELAY_MS);
    const stop = () => { window.clearTimeout(t); setPhase("hidden"); };
    window.addEventListener("pc:consent", stop);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pc:consent", stop);
    };
  }, [pathname]);

  if (phase === "hidden") return null;

  const open = () => window.dispatchEvent(new Event("pc:open-cookies"));

  if (phase === "falling") {
    return (
      <div className={styles.field} aria-hidden="true">
        <button
          type="button"
          tabIndex={-1}
          className={styles.cookie}
          style={vars}
          onAnimationEnd={() => setPhase("settled")}
          onClick={open}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cookies-policy.svg" alt="" className={styles.img} />
        </button>
      </div>
    );
  }

  // Settled: a real, reachable control.
  return (
    <button
      type="button"
      className={styles.settled}
      aria-label="Cookie settings"
      onClick={open}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/cookies-policy.svg" alt="" className={styles.img} />
    </button>
  );
}
