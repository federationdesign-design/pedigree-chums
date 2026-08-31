"use client";

import { useState } from "react";

/* NG-SHARE-5, 31 Aug 2026. Share button for the two shared-link landing pages.

   A recipient lands on somebody else's name or podium with no way to pass it on,
   which is a dead end in the one place the site is most likely to spread. This
   sends the page's own URL: the native sheet where there is one, the clipboard
   everywhere else.

   Deliberately not the generator's captureAndShare. That rasterises a card with
   html2canvas and pulls in the whole library; here the page already has an
   OpenGraph card, so the link alone is enough and the recipient's device does
   the rendering.

   The only client component on those pages, so they stay server-rendered. */

export default function ShareLinkButton({ label = "Share this" }: { label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2200);
    } catch {
      // A cancelled native share throws too, so only report a real failure when
      // the clipboard was the route taken.
      if (!navigator.share) {
        setState("failed");
        setTimeout(() => setState("idle"), 2600);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      style={{
        display: "inline-block",
        background: "transparent",
        color: "#ffffff",
        fontFamily: "var(--font-body)",
        fontSize: "1rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
        border: "2px solid rgba(255,255,255,0.55)",
        borderRadius: 999,
        padding: "14px 32px",
        cursor: "pointer",
      }}
      aria-live="polite"
    >
      {state === "copied" ? "Link copied" : state === "failed" ? "Could not copy" : label}
    </button>
  );
}
