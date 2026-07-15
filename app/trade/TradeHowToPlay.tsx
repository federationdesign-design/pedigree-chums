"use client";
import { useState } from "react";
import HowToPlay from "../../components/HowToPlay/HowToPlay";
import styles from "./trade.module.css";

export default function TradeHowToPlay() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={styles.htpRow}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => setOpen(true)}
        >
          Watch how it plays →
        </button>
      </div>
      <HowToPlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
