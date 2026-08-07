"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./discountCode.module.css";

// The email capture, lifted out of OfferModal onto its own page. Same fields,
// same validation, same /api/subscribe call, same list: someone who lands here
// is joining the pre-launch list for a code, not paying. The buy-now path lives
// separately at /preorder so the two never compete on one page. The popup keeps
// this exact behaviour wherever it still opens.
export default function DiscountCapture() {
  const [email, setEmail] = useState("");
  const [reserve, setReserve] = useState(false);
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
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
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), reserve, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Sorry, something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      setSent(true);
      window.dispatchEvent(new Event("pc:offer-success"));
    } catch {
      setError("Sorry, something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>
        Get <span className={styles.accent}>discount code</span>
      </h1>
      {sent ? (
        <p className={styles.thanks}>
          Thanks! You are on the list. We will email your discount code 1 day
          before our pre-release launch
          {reserve ? ", and we have noted your pack reservation" : ""}.
        </p>
      ) : (
        <>
          <p className={styles.sub}>
            Pop in your email and we will send your discount code 1 day before we
            pre-release which will be before general sale. Orders will be taken on
            a first come first served basis unless you check the box below. We
            expect the stock to run out so be quick. After our pre-release launch,
            we will have a general release, so don&apos;t panic.
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
                  I agree to Pedigree Chums™ storing my email so they can send my
                  discount code and launch updates. I can unsubscribe at any time.
                  See the{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    Privacy Policy
                  </Link>{" "}
                  for how your data is handled.
                </span>
              </label>
            </div>

            <button
              type="button"
              className={styles.submit}
              onClick={submit}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send my code"}
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </>
      )}
    </section>
  );
}
