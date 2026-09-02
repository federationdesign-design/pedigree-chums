"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CONSENT_KEY } from "../../lib/consent";
import styles from "./CookieBar.module.css";

/* THE PROBLEM THIS FIXES, and it is the whole reason the Meta Pixel looked dead.

   CookieDrop never presents itself. It opens on a trigger: the falling cookies
   sticker if you tap it, the pit's cookie object on "/" if you tap it, or the
   settings link if you find it. Only a reduced-motion visitor got it opened for
   them. So an ordinary visitor never saw the notice, never consented, and the
   pixel, which is gated on consent, never loaded. Most of the site's traffic was
   firing nothing at all. Swapping the pixel ID would not have changed that by a
   single event.

   This bar presents itself. Fixed to the top, on every page, until a choice
   exists.

   BOTH BUTTONS CARRY THE SAME WEIGHT, and that is not a style preference. Under
   PECR, rejecting has to be as easy as accepting. A bar that nudges towards
   Accept is a bigger liability than a pixel that does not fire.

   IT DOES NOT BLOCK THE PAGE. No overlay, no focus trap, no forced choice. The
   site stays readable and usable while the bar sits there. Consent that is
   coerced is not consent, and a wall would fail the same rules the buttons do.

   IT OWNS NO STATE OF ITS OWN. Accept and Reject dispatch the same
   pc:cookies-accepted / pc:cookies-rejected events the pit objects already
   dispatch, and CookieDrop's own listener does the writing, the cookie clearing
   and the reload on withdrawal. One consent bridge, not two. */
export default function CookieBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        // Any stored value is a decision, accepted or declined. Only the absence
        // of one means the visitor has not been asked yet.
        setShow(!localStorage.getItem(CONSENT_KEY));
      } catch {
        // Private mode: storage throws, so a choice could never be remembered
        // and the bar would return on every page. Stay quiet instead.
        setShow(false);
      }
    };
    // rAF for the same reason MetaPixel uses one: keeps the first paint free of
    // anything that depends on localStorage, so there is no hydration mismatch.
    const raf = requestAnimationFrame(read);
    // Fires when a choice is made anywhere, including the pit's own objects and
    // the settings link, so the bar clears itself without a reload.
    window.addEventListener("pc:consent", read);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pc:consent", read);
    };
  }, []);

  if (!show) return null;

  const choose = (accept: boolean) => {
    window.dispatchEvent(new Event(accept ? "pc:cookies-accepted" : "pc:cookies-rejected"));
  };

  return (
    <div className={styles.bar} role="region" aria-label="Cookie choices">
      <p className={styles.text}>
        We use cookies to make the site work. If you accept, we also use Google
        Analytics and the Meta Pixel to measure our advertising. Nothing beyond
        the essentials loads unless you accept.{" "}
        <Link href="/cookies" className={styles.link}>Cookie Policy</Link>
      </p>
      <div className={styles.actions}>
        <button type="button" className={`${styles.btn} ${styles.accept}`} onClick={() => choose(true)}>
          Accept
        </button>
        <button type="button" className={`${styles.btn} ${styles.reject}`} onClick={() => choose(false)}>
          Reject
        </button>
      </div>
    </div>
  );
}
