"use client";
import { useEffect, useState } from "react";
import styles from "./HowToPlay.module.css";

export default function HowToPlay() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const ready = name.trim() !== "" && emailValid;

  function submit() {
    if (!ready) return;
    // Email backend (Resend) is not wired for Pedigree Chums yet, so this is
    // simulated for now, the same as the other forms on the site.
    setSent(true);
  }

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label="See how to play"
      />

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.stage} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>

            <div className={styles.form}>
              {sent ? (
                <p className={styles.thanks}>Thanks! We will be in touch.</p>
              ) : (
                <>
                  <h3 className={styles.formTitle}>Be first to play</h3>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.submit}
                    onClick={submit}
                    disabled={!ready}
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
