"use client";
import { useState, useEffect } from "react";
import OfferModal from "./OfferModal";
import styles from "./OfferCta.module.css";

// Single CTA in the pitch panel that opens the email popup. The id lets the
// hero announcement scroll target this row, and the "pc:open-offer" window
// event lets the hero announcement open the popup directly.
export default function OfferCta() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("pc:open-offer", onOpen);
    return () => window.removeEventListener("pc:open-offer", onOpen);
  }, []);

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
