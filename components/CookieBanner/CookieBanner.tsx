"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./CookieBanner.module.css";

const KEY = "pc-cookie-consent";

// Game-intro style cookie notice: centred text that appears when the pit's
// cookie-policy object is tapped, and clears once its Accept button (an object
// squeezed out of the cookie) is clicked. No bottom banner anywhere.
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const open = () => setVisible(true); // tapping the pit cookie object reveals the notice
    const accepted = () => {
      try { localStorage.setItem(KEY, "accepted"); } catch { /* private mode etc. */ }
      window.dispatchEvent(new CustomEvent("pc:consent", { detail: "accepted" })); // analytics gates on this
      setVisible(false);
    };
    const rejected = () => {
      try { localStorage.setItem(KEY, "declined"); } catch { /* private mode etc. */ }
      window.dispatchEvent(new CustomEvent("pc:consent", { detail: "declined" })); // analytics stays off (gates on "accepted")
      setVisible(false);
    };
    window.addEventListener("pc:open-cookies", open);
    window.addEventListener("pc:cookies-accepted", accepted);
    window.addEventListener("pc:cookies-rejected", rejected);
    return () => {
      window.removeEventListener("pc:open-cookies", open);
      window.removeEventListener("pc:cookies-accepted", accepted);
      window.removeEventListener("pc:cookies-rejected", rejected);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.intro} role="dialog" aria-label="Cookie notice">
      <div className={styles.card}>
        <button
          type="button"
          className={styles.close}
          onClick={() => setVisible(false)}
          aria-label="Close cookie notice"
        >
          &times;
        </button>
        <p className={styles.introText}>
          We use cookies to make the site work and to show our product video. Tap the{" "}
          <strong style={{ color: "#22b422" }}>green tick</strong> in the pit to accept, or see our{" "}
          <Link href="/cookies" className={styles.introLink}>Cookie Policy</Link>{" "}
          for the details. You can also reject cookies using the red button in the pit.
        </p>
      </div>
    </div>
  );
}
