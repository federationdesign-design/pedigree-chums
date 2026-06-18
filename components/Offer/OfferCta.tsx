"use client";
import styles from "./OfferCta.module.css";

// CTA copy + button in the pitch panel. The button dispatches the shared
// "pc:open-offer" window event; the popup itself is owned by OfferLauncher,
// mounted once in the root layout, so the modal lives in a single place
// site-wide (and there is never more than one open at a time).
export default function OfferCta() {
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
          onClick={() => window.dispatchEvent(new CustomEvent("pc:open-offer"))}
        >
          Get discount code
        </button>
      </div>
    </>
  );
}
