"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./OfferModal.module.css";

// Shared email popup. Mounted only while open (so its form state resets each
// time) and portaled to the body so it escapes the pitch panel's stacking
// context. The submit is simulated until Resend is wired up (reuse the ANT
// Training backend pattern); `reserve` flags that the visitor wants a pack
// held, and `consent` is the GDPR opt-in.
export default function OfferModal({
  reserveDefault = false,
  onClose,
}: {
  reserveDefault?: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [reserve, setReserve] = useState(reserveDefault);
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

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
      setError("Please enter a valid email address.");
      return;
    }
    if (!consent) {
      setError("Please tick the box to agree to how we use your email.");
      return;
    }
    setError("");
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
            Thanks! Your discount code is on its way
            {reserve ? ", and we have noted your request to reserve a pack" : ""}.
          </p>
        ) : (
          <>
            <p className={styles.sub}>
              Pop in your email and we will send your discount code 1 day before we
              release for general sale. Orders will be taken on a first come first
              served basis unless you check the box below. We expect the stock to
              run out so be quick.
            </p>
            <div className={styles.form}>
              <input
                type="email"
                className={styles.input}
                placeholder="you@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                aria-label="Email address"
              />

              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={reserve}
                  onChange={(e) => setReserve(e.target.checked)}
                />
                <span>Reserve a pack for me</span>
              </label>

              <div className={styles.gdpr}>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (error) setError("");
                    }}
                  />
                  <span>
                    I agree to Pedigree Chums storing my email so they can send my
                    discount code and launch updates. I can unsubscribe at any time.
                    See the Privacy Policy for how your data is handled.
                  </span>
                </label>
              </div>

              <button type="button" className={styles.submit} onClick={submit}>
                Send my code
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
