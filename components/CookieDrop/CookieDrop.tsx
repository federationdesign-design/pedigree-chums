"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CONSENT_KEY } from "../../lib/consent";
import styles from "./CookieDrop.module.css";

// Best-effort removal of the analytics and marketing cookies on withdrawal, so a
// withdrawal is real and visible in devtools rather than lingering until expiry.
// Covers Google Analytics (_ga, _ga_*, _gid, _gat) and Meta (_fbp, _fbc).
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

// The cookie consent notice, and the single consent bridge. It does not present
// itself: it opens when a trigger fires, so the branded surfaces own first contact.
//   - Falling COOKIES POLICY sticker (non-pit pages)  -> pc:open-cookies
//   - The pit's own cookie object (only on "/")        -> pc:open-cookies
//   - Cookie settings link (Footer and Nav)            -> pc:manage-cookies
//   - Reduced-motion / AT users, first run             -> auto-opens directly
//
// On "/" the pit squeezes out its own Accept and Reject objects, so the notice is
// text only there and points at them. Everywhere else it shows its own Accept and
// Reject buttons, which tumble in (a CSS impression of the pit, but real accessible
// buttons). A choice writes CONSENT_KEY, fires pc:cookies-accepted/rejected (so the
// pit clears) and pc:consent (so Analytics and the Meta Pixel react live).
// Withdrawing from an accepted state clears the tracker cookies and reloads, since
// gtag and fbq cannot be un-initialised in place. Non-modal, focus moves in, page
// stays readable. First run has no close or Escape (Accept or Reject only); manage
// mode adds a Close, because a valid choice already exists.
export default function CookieDrop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [withButtons, setWithButtons] = useState(true);
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
    const onOpen = () => {
      // Pit cookie tap on "/" gives Accept/Reject as pit objects, so text only there.
      setManage(false);
      setWithButtons(window.location.pathname !== "/");
      setVisible(true);
    };
    const onManage = () => {
      let cur: string | null = null;
      try { cur = localStorage.getItem(CONSENT_KEY); } catch { /* private mode */ }
      setCurrent(cur);
      setManage(true);
      setWithButtons(true);
      setVisible(true);
    };
    window.addEventListener("pc:cookies-accepted", onAcc);
    window.addEventListener("pc:cookies-rejected", onRej);
    window.addEventListener("pc:open-cookies", onOpen);
    window.addEventListener("pc:manage-cookies", onManage);

    // Reduced-motion and AT users cannot chase a falling object, so first run opens
    // the notice directly, with buttons, on any page.
    let decided = true;
    try { decided = !!localStorage.getItem(CONSENT_KEY); } catch { decided = true; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    if (!decided && reduced) {
      raf = requestAnimationFrame(() => { setWithButtons(true); setVisible(true); });
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pc:cookies-accepted", onAcc);
      window.removeEventListener("pc:cookies-rejected", onRej);
      window.removeEventListener("pc:open-cookies", onOpen);
      window.removeEventListener("pc:manage-cookies", onManage);
    };
  }, []);

  // Move focus into the notice when it appears (non-modal, no trap).
  useEffect(() => {
    if (visible) cardRef.current?.focus();
  }, [visible]);

  if (!visible) return null;

  const choose = (accept: boolean) => {
    window.dispatchEvent(new Event(accept ? "pc:cookies-accepted" : "pc:cookies-rejected"));
  };
  const close = () => { setVisible(false); setManage(false); };
  const onPit = pathname === "/" && !withButtons;

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
        {onPit ? (
          <p className={styles.hint}>Tap the green Accept or red Reject below.</p>
        ) : (
          <div className={styles.actions}>
            <button type="button" className={`${styles.btn} ${styles.accept}`} onClick={() => choose(true)}>Accept</button>
            <button type="button" className={`${styles.btn} ${styles.reject}`} onClick={() => choose(false)}>Reject</button>
            {manage && (
              <button type="button" className={styles.closeBtn} onClick={close}>Close</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
