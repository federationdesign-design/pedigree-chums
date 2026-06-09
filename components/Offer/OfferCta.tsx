"use client";
import { useState } from "react";
import OfferModal from "./OfferModal";
import styles from "./OfferCta.module.css";

// Single CTA in the pitch panel that opens the email popup. The id lets the
// hero announcement scroll down to this row.
export default function OfferCta() {
  const [open, setOpen] = useState(false);
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
          onClick={() => setOpen(true)}
        >
          Get discount code
        </button>
      </div>
      {open && <OfferModal onClose={() => setOpen(false)} />}
    </>
  );
}
