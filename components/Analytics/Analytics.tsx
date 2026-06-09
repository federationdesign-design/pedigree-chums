"use client";
import { useState, useEffect } from "react";
import Script from "next/script";

const GA_ID = "G-7FZ4898NK8";
const KEY = "pc-cookie-consent";

// GA4, gated on cookie consent. The tag is only injected once the visitor has
// accepted cookies (via the banner). It reacts to the "pc:consent" event the
// banner fires, so accepting starts analytics without a page reload.
export default function Analytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => {
      try {
        setAllowed(localStorage.getItem(KEY) === "accepted");
      } catch {
        setAllowed(false);
      }
    };
    // rAF keeps the state update out of the effect body and the first paint
    // analytics-free (no hydration mismatch).
    const raf = requestAnimationFrame(sync);
    window.addEventListener("pc:consent", sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pc:consent", sync);
    };
  }, []);

  if (!allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
