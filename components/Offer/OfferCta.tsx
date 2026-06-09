"use client";
import { useState } from "react";
import OfferModal from "./OfferModal";
import styles from "./OfferCta.module.css";

// Two CTAs in the pitch panel. Both open the same "get 50% off code" popup.
export default function OfferCta() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={styles.ctaRow}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => setOpen(true)}
        >
          Pre-order now
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          onClick={() => setOpen(true)}
        >
          Get 50% off code
        </button>
      </div>
      {open && <OfferModal onClose={() => setOpen(false)} />}
    </>
  );
}
