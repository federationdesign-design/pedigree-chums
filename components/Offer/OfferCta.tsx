"use client";
import { useState } from "react";
import OfferModal from "./OfferModal";
import styles from "./OfferCta.module.css";

// Two CTAs in the pitch panel. Both open the same email popup; "Reserve me a
// pack" opens it with the reserve tickbox already checked. The id lets the
// hero announcement scroll down to this row.
export default function OfferCta() {
  const [open, setOpen] = useState(false);
  const [reserve, setReserve] = useState(false);

  const openModal = (withReserve: boolean) => {
    setReserve(withReserve);
    setOpen(true);
  };

  return (
    <>
      <div className={styles.ctaRow} id="preorder">
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => openModal(false)}
        >
          Get discount code emailed on launch day
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          onClick={() => openModal(true)}
        >
          Reserve me a pack
        </button>
      </div>
      {open && <OfferModal reserveDefault={reserve} onClose={() => setOpen(false)} />}
    </>
  );
}
