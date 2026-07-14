"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./trade.module.css";

// Inline trade enquiry form (not a modal — it lives in the page's closing
// section). Mirrors OfferModal's submit pattern: client-side validation, POST
// to /api/trade-subscribe, success/error states, GDPR consent.
const BUSINESS_TYPES = [
  "Gift shop",
  "Museum or attraction shop",
  "Garden centre",
  "Pet shop",
  "Farm shop",
  "Toy or book shop",
  "Other",
];

export default function TradeEnquiryForm() {
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!company.trim() || !name.trim()) {
      setError("Please add your shop name and a contact name.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!consent) {
      setError("Please tick the box to agree to how we use your details.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/trade-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          name: name.trim(),
          email: email.trim(),
          businessType,
          consent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Sorry, something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Sorry, something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <p className={styles.thanks}>
        Thanks — your enquiry is in. We will be in touch from
        hello@pedigreechums.co.uk with the full trade price list and next steps.
      </p>
    );
  }

  return (
    <div className={styles.form}>
      <input
        type="text"
        className={styles.input}
        placeholder="Shop / company name"
        value={company}
        onChange={(e) => {
          setCompany(e.target.value);
          if (error) setError("");
        }}
        aria-label="Shop or company name"
      />
      <input
        type="text"
        className={styles.input}
        placeholder="Your name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (error) setError("");
        }}
        aria-label="Your name"
      />
      <input
        type="email"
        className={styles.input}
        placeholder="you@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError("");
        }}
        aria-label="Email address"
      />
      <select
        className={styles.select}
        value={businessType}
        onChange={(e) => setBusinessType(e.target.value)}
        aria-label="Business type"
      >
        <option value="">What kind of business are you? (optional)</option>
        {BUSINESS_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

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
            I agree to Pedigree Chums™ storing these details so they can respond to
            my trade enquiry. I can ask to be removed at any time. See the{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Privacy Policy
            </Link>{" "}
            for how data is handled.
          </span>
        </label>
      </div>

      <button
        type="button"
        className={styles.submit}
        onClick={submit}
        disabled={loading}
      >
        {loading ? "Sending..." : "Request the trade price list"}
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
