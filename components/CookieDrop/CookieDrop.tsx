"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CONSENT_KEY } from "../../lib/consent";
import styles from "./CookieDrop.module.css";

// Site-wide cookie consent. Drops in from under the fixed Nav on every page while
// CONSENT_KEY is unset, carrying its own Accept and Reject controls and the
// marketing disclosure. This is the primary, accessible consent control: the pit's
// cookie object is a canvas physics body, unreachable by keyboard or screen reader,
// so it is withheld while consent is pending (see PackPit) and this owns consent.
//
// Single bridge: a choice writes CONSENT_KEY, then fires pc:cookies-accepted /
// pc:cookies-rejected (so the pit clears any state) and pc:consent (so Analytics
// and the Meta Pixel react live, no reload). It also listens for those events, so a
// choice made anywhere dismisses it and stays persisted. Non-modal: focus moves in,
// it is announced, the page stays readable. No close and no Escape dismiss: Accept
// or Reject only.
export default function CookieDrop() {
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const persist = (accept: boolean) => {
      try { localStorage.setItem(CONSENT_KEY, accept ? "accepted" : "declined"); } catch { /* private mode */ }
      window.dispatchEvent(new CustomEvent("pc:consent", { detail: accept ? "accepted" : "declined" }));
      setVisible(false);
    };
    const onAcc = () => persist(true);
    const onRej = () => persist(false);
    window.addEventListener("pc:cookies-accepted", onAcc);
    window.addEventListener("pc:cookies-rejected", onRej);

    let decided = true;
    try { decided = !!localStorage.getItem(CONSENT_KEY); } catch { decided = true; }
    // Show after first paint so the initial render is consent-free (no hydration mismatch).
    const raf = decided ? 0 : requestAnimationFrame(() => setVisible(true));

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pc:cookies-accepted", onAcc);
      window.removeEventListener("pc:cookies-rejected", onRej);
    };
  }, []);

  // Move focus into the banner when it appears (non-modal, no trap).
  useEffect(() => {
    if (visible) cardRef.current?.focus();
  }, [visible]);

  if (!visible) return null;

  // Fire the shared events; the listener above persists, syncs trackers and hides.
  const choose = (accept: boolean) => {
    window.dispatchEvent(new Event(accept ? "pc:cookies-accepted" : "pc:cookies-rejected"));
  };

  return (
    <div className={styles.drop}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookiedrop-title"
        aria-describedby="cookiedrop-body"
        tabIndex={-1}
        ref={cardRef}
      >
        <h2 id="cookiedrop-title" className={styles.title}>Cookies on Pedigree Chums</h2>
        <p id="cookiedrop-body" className={styles.body}>
          We use cookies to make the site work and to show our product video. If you
          accept, we also use Google Analytics to see how the site is used, and the
          Meta Pixel, which shares some of your activity with Meta (Facebook and
          Instagram) so we can measure our advertising and show you relevant ads.
          Nothing beyond the essentials loads unless you accept. See our{" "}
          <Link href="/cookies" className={styles.link}>Cookie Policy</Link>{" "}
          for the full detail.
        </p>
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.accept}`} onClick={() => choose(true)}>Accept</button>
          <button type="button" className={`${styles.btn} ${styles.reject}`} onClick={() => choose(false)}>Reject</button>
        </div>
      </div>
    </div>
  );
}
