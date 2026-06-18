"use client";
import { useState } from "react";
import styles from "./OfferCta.module.css";
import { startCheckout } from "./startCheckout";

// CTA copy + buttons in the pitch panel. Two choices, side by side:
//  - "Pre-order now" goes straight to Stripe Checkout (pay the pre-release price)
//  - "Get discount code" opens the email popup (owned by OfferLauncher) via the
//    shared "pc:open-offer" window event, for visitors who would rather not pay
//    before they know the arrival date.
export default function OfferCta() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const preorder = async () => {
    setError("");
    setLoading(true);
    try {
      await startCheckout();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout.");
      setLoading(false);
    }
  };

  return (
    <>
      <p className={styles.ctaTitle}>
        The only way to get your hands on the chums is via the{" "}
        <span className={styles.ctaTitleAccent}>pre-release offer</span>.
      </p>
      <div className={styles.ctaRow} id="preorder">
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={preorder}
          disabled={loading}
        >
          {loading ? "Taking you to checkout..." : "Pre-order now £6.99"}
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          onClick={() => window.dispatchEvent(new CustomEvent("pc:open-offer"))}
        >
          Get discount code
        </button>
      </div>
      {error && <p className={styles.ctaError}>{error}</p>}
    </>
  );
}
