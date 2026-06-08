"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./HowToPlay.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Controlled "How it works" popup. The trigger (the feature card) lives in
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

        <h3 className={styles.title}>
          How <span className={styles.accent}>it works</span>
        </h3>

        <div className={styles.stripFrame}>
          <Image
            src="/how-to-play-comic-strip.png"
            alt="How to play, step by step"
            fill
            className={styles.strip}
            sizes="(max-width: 900px) 92vw, 1100px"
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
