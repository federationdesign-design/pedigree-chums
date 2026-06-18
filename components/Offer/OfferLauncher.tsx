"use client";
import { useState, useEffect } from "react";
import OfferModal from "./OfferModal";
import styles from "./OfferLauncher.module.css";

// Global offer launcher, mounted once in the root layout so every page can open
// the email popup. It owns the modal's open state and listens for the shared
// "pc:open-offer" window event (dispatched by the nav menu, the hero
// announcement bar and the pitch-panel CTA), which is why the "Get discount
// code" menu item now works on pages that have no form of their own.
//
// It also renders the sticky card that slides in from the right once the
// visitor has scrolled past the first screen. On phones the card collapses to a
// slim tab on the right edge so it never covers the content.
export default function OfferLauncher() {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Open the popup from anywhere on the site.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("pc:open-offer", onOpen);
    return () => window.removeEventListener("pc:open-offer", onOpen);
  }, []);

  // Reveal the sticky card once the visitor has scrolled past ~60% of the first
  // screen. Deferred into a rAF so the first read is not done in the effect body
  // and so a page loaded already scrolled down shows the card straight away.
  useEffect(() => {
    const onScroll = () => {
      setRevealed(window.scrollY > window.innerHeight * 0.6);
    };
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const show = revealed && !dismissed && !open;
  const focusable = show ? 0 : -1;

  return (
    <>
      <aside
        className={`${styles.card} ${show ? styles.show : ""}`}
        aria-hidden={!show}
      >
        <button
          type="button"
          className={styles.dismiss}
          onClick={() => setDismissed(true)}
          aria-label="Hide the discount offer"
          tabIndex={focusable}
        >
          {"\u00D7"}
        </button>
        <p className={styles.kicker}>Pre-release offer</p>
        <p className={styles.headline}>
          Want a <span className={styles.accent}>discount?</span>
        </p>
        <button
          type="button"
          className={styles.cta}
          onClick={() => setOpen(true)}
          tabIndex={focusable}
        >
          <span className={styles.ctaFull}>Get your discount code</span>
          <span className={styles.ctaShort}>Discount code</span>
        </button>
      </aside>

      {open && <OfferModal onClose={() => setOpen(false)} />}
    </>
  );
}
