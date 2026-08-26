"use client";
import { useState } from "react";
import styles from "./OfferCta.module.css";
import { startCheckout } from "./startCheckout";

// CTA copy + button in the pitch panel. One choice: "Pre-order now" opens a
// confirm popup and then goes to Stripe Checkout (pay the pre-release price).
// The "Get discount code" button was removed (Batch 3): only Pre-order remains.
export default function OfferCta() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPop, setShowPop] = useState(false);

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
          onClick={() => setShowPop(true)}
        >
          Pre-order now £6.99
        </button>
      </div>
      {error && <p className={styles.ctaError}>{error}</p>}

      {showPop && (
        <div className={styles.popOverlay} onClick={() => setShowPop(false)}>
          <div className={styles.pop} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.popClose} onClick={() => setShowPop(false)} aria-label="Close">
              &times;
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.popCta}`}
              onClick={preorder}
              disabled={loading}
            >
              {loading ? "Taking you to checkout..." : "Visit checkout"}
            </button>
            {error && <p className={styles.ctaError}>{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
