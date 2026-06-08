"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./HowToPlay.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Controlled instructions popup. The trigger (the feature card) lives in
// CardRail and drives this via the open/onClose props.
export default function HowToPlay({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const modal = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.stage} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        <h3 className={styles.title}>How to Play</h3>
        <ol className={styles.steps}>
          <li>Step one instructions go here.</li>
          <li>Step two instructions go here.</li>
          <li>Step three instructions go here.</li>
          <li>Step four instructions go here.</li>
        </ol>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
