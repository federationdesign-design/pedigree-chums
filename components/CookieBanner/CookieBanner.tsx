"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./CookieBanner.module.css";

const KEY = "pc-cookie-consent";

// Bottom-of-screen consent notice. The choice is stored in the browser so the
// banner is not shown again. When analytics are added later, gate them on this
// stored value (only load when it is "accepted").
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // On the home page the cookie message is the pit's cookie-policy object, so the
    // banner stays hidden there. On any inner page it shows until a choice is stored.
    const isHome = pathname === "/";
    const raf = requestAnimationFrame(() => {
      try {
        if (!localStorage.getItem(KEY) && !isHome) setVisible(true);
      } catch {
        if (!isHome) setVisible(true);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  useEffect(() => {
    // Tapping the pit's cookie-policy object opens the full notice, on any page.
    const open = () => setVisible(true);
    window.addEventListener("pc:open-cookies", open);
    return () => window.removeEventListener("pc:open-cookies", open);
  }, []);

  const choose = (value: "accepted" | "declined") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // ignore storage failures (private mode etc.)
    }
    window.dispatchEvent(new CustomEvent("pc:consent", { detail: value }));
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
