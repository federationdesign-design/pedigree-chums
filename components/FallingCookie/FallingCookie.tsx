"use client";
import { useState, useEffect, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_KEY } from "../../lib/consent";
import styles from "./FallingCookie.module.css";

// The COOKIES POLICY sticker. It falls in once (2s after load), takes two sideways
// knocks on the way down, and LANDS, settling in the bottom-right corner where it
// stays as a persistent target until a choice is made. It runs on every page EXCEPT
// the pit at "/" (the pit's own cookie object does this there) and is skipped for
// reduced motion (those users get the notice directly, plus the Cookie settings
// link). No loop: one landing, then it sits.
//
// While falling it is decorative (aria-hidden container, tabIndex -1). Once settled
// it becomes a real, keyboard-focusable, screen-reader-labelled button, so it is a
// third route to consent alongside the Cookie settings link and the notice. Clicking
// it (falling or settled) opens the CookieDrop notice.
const START_DELAY_MS = 2000;

type Phase = "hidden" | "falling" | "settled";

// One descent's randomised path, as deviations (px) left of the resting corner,
// resolving to the corner (0) at landing. Two knocks: start lane, knock, then knock
// into the corner. Clamped so it never crosses the left edge. Spin is a whole number
// of turns so it lands upright and the static settled button does not jump.
function computeVars(): CSSProperties {
  const vw = window.innerWidth;
  const stickerW = Math.min(300, Math.max(187.5, vw * 0.275));
  const maxLeft = Math.max(60, vw - stickerW - 22 - 16); // furthest left it may deviate
  const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
  const clampL = (x: number) => Math.min(0, Math.max(-maxLeft, x));

  const kx0 = clampL(-rand(0.4, 0.85) * maxLeft);           // start lane, left of corner
  const dir = Math.random() < 0.5 ? -1 : 1;                 // knock 1 direction
  const kx1 = clampL(kx0 + dir * rand(0.2, 0.4) * maxLeft); // knock 1; knock 2 lands at 0
  const rtot = (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.5 ? 2 : 3) * 360;

  return {
    "--kx0": `${Math.round(kx0)}px`,
    "--kx1": `${Math.round(kx1)}px`,
    "--rtot": `${rtot}deg`,
  } as CSSProperties;
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
