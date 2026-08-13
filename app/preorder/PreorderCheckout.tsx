"use client";
import { useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import Image from "next/image";
import styles from "./preorderCheckout.module.css";

// The publishable key is safe to expose (it is the public half of the Stripe
// key pair) and MUST carry the NEXT_PUBLIC_ prefix so Next includes it in the
// client bundle. loadStripe runs once at module scope so Stripe.js is fetched a
// single time, not per render.
const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

// Mounts Stripe's embedded checkout on our own page. The card fields live inside
// Stripe's iframe, so the PCI position is unchanged from the old hosted redirect;
// only the redirect itself is gone.
export default function PreorderCheckout() {
  // Ask our server to create the embedded session and hand back its client
  // secret. EmbeddedCheckoutProvider calls this once on mount.
  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const data: { clientSecret?: string; error?: string } = await res
      .json()
      .catch(() => ({}));
    if (!res.ok || !data.clientSecret) {
      throw new Error(
        data.error || "Could not start checkout. Please try again."
      );
    }
    return data.clientSecret;
  }, []);

  if (!stripePromise) {
    return (
      <p className={styles.notice}>
        Pre-orders are not available just yet. Please try again shortly.
      </p>
    );
  }

  return (
    <div className={styles.checkout}>
      {/* Brand logo above the iframe. The JPG's background is pure white
          (#ffffff), the same as the container, so it merges with no visible box.
          Drawn at 240px (prototype default). */}
      <Image
        className={styles.checkoutLogo}
        src="/PC-logo-black.jpg"
        alt="Pedigree Chums™"
        width={240}
        height={156}
        priority
      />
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
