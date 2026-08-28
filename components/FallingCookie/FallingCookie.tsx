"use client";
import { useState, useEffect, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_KEY } from "../../lib/consent";
import styles from "./FallingCookie.module.css";

// The COOKIES POLICY sticker, falling from off-screen above down past the viewport,
// as a decorative, pointer-only trigger. It runs on every page EXCEPT the pit at "/",
// where the pit's own cookie object does this natively. It is purely a motion
// trigger: clicking it opens the CookieDrop notice, which is the real control.
//
// aria-hidden (on the container) and tabIndex -1, so it never enters the tab order.
// Keyboard, screen-reader and reduced-motion users reach consent via the notice
// (auto-shown for reduced motion) and the Cookie settings link, never this. It
// re-drops every 5s while consent is unset and stops once a choice is made.
//
// Each drop takes two knocks: it falls, jolts sideways to a new lane, falls, jolts
// the opposite way, then falls off the bottom. The lanes, directions and spin are
// randomised per drop and passed as CSS vars, so no two falls look the same and it
// never walks off an edge. The keyframes live in the CSS module.
const LOOP_MS = 5000;
const START_DELAY_MS = 2000;

// One drop's randomised path: start lane A, knock to lane B, knock back toward C
// (opposite direction), plus a random total spin. Clamped so the sticker stays on
// screen. Runs client-side in a timer, so window is available.
function computeVars(): CSSProperties {
  const vw = window.innerWidth;
  const stickerW = Math.min(300, Math.max(187.5, vw * 0.275)); // must match the CSS width
  const margin = 16;
  const minX = margin;
  const maxX = Math.max(minX, vw - stickerW - margin);
  const clamp = (x: number) => Math.min(maxX, Math.max(minX, x));
  const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

  const xa = clamp(rand(minX, Math.min(maxX, vw * 0.42))); // left-to-middle start
  const dir1 = Math.random() < 0.5 ? -1 : 1;
  const xb = clamp(xa + dir1 * rand(0.08, 0.16) * vw);      // knock 1
  const xc = clamp(xb - dir1 * rand(0.08, 0.16) * vw);      // knock 2, opposite way
  const rtot = (Math.random() < 0.5 ? -1 : 1) * rand(2.2, 2.8) * 360;

  return {
    "--xa": `${Math.round(xa)}px`,
    "--xb": `${Math.round(xb)}px`,
    "--xc": `${Math.round(xc)}px`,
    "--rtot": `${Math.round(rtot)}deg`,
  } as CSSProperties;
}

export default function FallingCookie() {
  const pathname = usePathname();
  const [drop, setDrop] = useState<{ id: number; style: CSSProperties } | null>(null);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    // Skip on the pit page (the pit owns it) and for reduced motion (the notice is
    // shown directly instead of an object to chase). No synchronous setState here;
    // the first drop lands via the delay timer, so nothing shows until then.
    if (pathname === "/") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let decided = true;
    try { decided = !!localStorage.getItem(CONSENT_KEY); } catch { decided = true; }
    if (decided) return;

    let n = 0;
    const fire = () => { n += 1; setDrop({ id: n, style: computeVars() }); };
    const first = window.setTimeout(fire, START_DELAY_MS);
    const loop = window.setInterval(fire, LOOP_MS);
    const stop = () => {
      setStopped(true);
      window.clearTimeout(first);
      window.clearInterval(loop);
    };
    window.addEventListener("pc:consent", stop);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
      window.removeEventListener("pc:consent", stop);
    };
  }, [pathname]);

  if (stopped || !drop) return null;

  return (
    <div className={styles.field} aria-hidden="true">
      {/* key restarts the fall each drop; tabIndex -1 keeps it out of the tab order */}
      <button
        key={drop.id}
        type="button"
        tabIndex={-1}
        className={styles.cookie}
        style={drop.style}
        onClick={() => window.dispatchEvent(new Event("pc:open-cookies"))}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cookies-policy.svg" alt="" className={styles.img} />
      </button>
    </div>
  );
}
