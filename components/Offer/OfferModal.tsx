"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./OfferModal.module.css";

// Shared "get 50% off code" popup. Mounted only while open (so its form state
// resets each time) and portaled to the body so it escapes the pitch panel's
// stacking context. The email submit is simulated until Resend is wired up
// (reuse the ANT Training backend pattern).
export default function OfferModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const submit = () => {
    const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
    if (!ok) {
      setError(true);
      return;
    }
    setError(false);
    // TODO: wire to Resend (reuse the ANT Training pattern). Simulated for now.
    setSent(true);
  };

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.stage} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          &times;
        </button>
        <h3 className={styles.title}>
          Get <span className={styles.accent}>50% off code</span>
        </h3>
        {sent ? (
          <p className={styles.thanks}>
            Thanks! Your 50% off code is on its way to your inbox.
          </p>
        ) : (
          <>
            <p className={styles.sub}>
              Pop in your email and we will send your discount code straight over.
            </p>
            <div className={styles.form}>
              <input
                type="email"
                className={styles.input}
                placeholder="you@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                aria-label="Email address"
              />
              <button type="button" className={styles.submit} onClick={submit}>
                Send my code
              </button>
            </div>
            {error && <p className={styles.error}>Please enter a valid email address.</p>}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
