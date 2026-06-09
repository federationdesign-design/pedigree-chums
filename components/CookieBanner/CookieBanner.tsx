"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./CookieBanner.module.css";

const KEY = "pc-cookie-consent";

// Bottom-of-screen consent notice. The choice is stored in the browser so the
// banner is not shown again. When analytics are added later, gate them on this
// stored value (only load when it is "accepted").
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Read + show inside a rAF callback so the state update is not made
    // synchronously in the effect body, and so the first paint (and SSR)
    // render the banner hidden, avoiding a hydration mismatch.
    const raf = requestAnimationFrame(() => {
      try {
        if (!localStorage.getItem(KEY)) setVisible(true);
      } catch {
        setVisible(true);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const choose = (value: "accepted" | "declined") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // ignore storage failures (private mode etc.)
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.bar} role="dialog" aria-label="Cookie notice">
      <p className={styles.text}>
        We use cookies to make the site work and to show our product video. See
        our{" "}
        <Link href="/cookies" className={styles.link}>
          Cookie Policy
        </Link>{" "}
        for the details.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.decline}`}
          onClick={() => choose("declined")}
        >
          Decline
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.accept}`}
          onClick={() => choose("accepted")}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
