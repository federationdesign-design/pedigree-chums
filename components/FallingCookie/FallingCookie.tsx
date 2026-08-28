"use client";
import { useState, useEffect } from "react";
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
// re-drops every ~17s while consent is unset and stops once a choice is made, so a
// missed catch is not the end.
const LOOP_MS = 17000;
const START_DELAY_MS = 2000;

export default function FallingCookie() {
  const pathname = usePathname();
  const [drops, setDrops] = useState(0); // increments to restart the fall animation
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

    const first = window.setTimeout(() => setDrops((d) => d + 1), START_DELAY_MS);
    const loop = window.setInterval(() => setDrops((d) => d + 1), LOOP_MS);
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

  if (stopped || drops === 0) return null;

  return (
    <div className={styles.field} aria-hidden="true">
      {/* key restarts the fall each loop; tabIndex -1 keeps it out of the tab order */}
      <button
        key={drops}
        type="button"
        tabIndex={-1}
        className={styles.cookie}
        onClick={() => window.dispatchEvent(new Event("pc:open-cookies"))}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cookies-policy.svg" alt="" className={styles.img} />
      </button>
    </div>
  );
}
