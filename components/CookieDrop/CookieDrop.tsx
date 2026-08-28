"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CONSENT_KEY } from "../../lib/consent";
import styles from "./CookieDrop.module.css";

// Best-effort removal of the analytics and marketing cookies on withdrawal, so a
// withdrawal is real and visible in devtools rather than lingering until expiry.
// Covers Google Analytics (_ga, _ga_*, _gid, _gat) and Meta (_fbp, _fbc), across
// the host and its registrable domain.
function clearTrackingCookies() {
  try {
    const host = window.location.hostname;
    const base = host.split(".").slice(-2).join(".");
    const domains = ["", host, "." + host, "." + base];
    const expiry = "Thu, 01 Jan 1970 00:00:00 GMT";
    const kill = (name: string) => {
      for (const d of domains) {
        document.cookie = `${name}=; expires=${expiry}; path=/` + (d ? `; domain=${d}` : "");
      }
    };
    for (const c of document.cookie.split(";")) {
      const name = c.split("=")[0].trim();
      if (/^_ga/.test(name) || name === "_gid" || name === "_gat" || name === "_fbp" || name === "_fbc") kill(name);
    }
  } catch { /* ignore */ }
}

// Site-wide cookie consent. Drops in from under the fixed Nav on every page while
// CONSENT_KEY is unset, carrying its own Accept and Reject controls and the
// marketing disclosure. It also re-opens in "manage" mode from the Cookie settings
// link in the Footer and Nav menu (pc:manage-cookies), so consent can be changed or
// withdrawn as easily as it was given.
//
// This is the primary, accessible consent control: the pit's cookie object is a
// canvas physics body, unreachable by keyboard or screen reader, so it is withheld
// while consent is pending (see PackPit) and this owns consent.
//
// Single bridge: a choice writes CONSENT_KEY, then fires pc:cookies-accepted /
// pc:cookies-rejected (so the pit clears any state) and pc:consent (so Analytics and
// the Meta Pixel react live). Withdrawing from an active session cannot un-init gtag
// or fbq in place, so it clears their cookies and reloads; Analytics's ga-disable
// guard keeps GA off across the reload. Non-modal: focus moves in, it is announced,
// the page stays readable. First run has no close or Escape dismiss (Accept or
// Reject only); manage mode adds a Close, because a valid choice already exists.
export default function CookieDrop() {
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const persist = (accept: boolean) => {
      let prev: string | null = null;
      try { prev = localStorage.getItem(CONSENT_KEY); } catch { /* private mode */ }
      try { localStorage.setItem(CONSENT_KEY, accept ? "accepted" : "declined"); } catch { /* private mode */ }
      window.dispatchEvent(new CustomEvent("pc:consent", { detail: accept ? "accepted" : "declined" }));
      if (!accept && prev === "accepted") {
        // Real withdrawal from an active session: clear the tracker cookies and
        // reload so gtag and fbq do not persist for the rest of the session.
        clearTrackingCookies();
        window.location.reload();
        return;
      }
      setVisible(false);
      setManage(false);
    };
    const onAcc = () => persist(true);
    const onRej = () => persist(false);
    const onManage = () => {
      let cur: string | null = null;
      try { cur = localStorage.getItem(CONSENT_KEY); } catch { /* private mode */ }
      setCurrent(cur);
      setManage(true);
      setVisible(true);
    };
    window.addEventListener("pc:cookies-accepted", onAcc);
    window.addEventListener("pc:cookies-rejected", onRej);
    window.addEventListener("pc:manage-cookies", onManage);

    let decided = true;
    try { decided = !!localStorage.getItem(CONSENT_KEY); } catch { decided = true; }
    // Show after first paint so the initial render is consent-free (no hydration mismatch).
    const raf = decided ? 0 : requestAnimationFrame(() => setVisible(true));

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pc:cookies-accepted", onAcc);
      window.removeEventListener("pc:cookies-rejected", onRej);
      window.removeEventListener("pc:manage-cookies", onManage);
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
  const close = () => { setVisible(false); setManage(false); };

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
        {manage && current && (
          <p className={styles.current}>
            You currently {current === "accepted" ? "accept" : "reject"} non-essential cookies.
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.accept}`} onClick={() => choose(true)}>Accept</button>
          <button type="button" className={`${styles.btn} ${styles.reject}`} onClick={() => choose(false)}>Reject</button>
          {manage && (
            <button type="button" className={styles.closeBtn} onClick={close}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}
