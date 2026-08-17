"use client";

// Hidden Games discovery toast (CHANGE-LIST C02). Confirms each non-final find.
// It is mounted in the root layout at a z-index above the mini pit modal.
//
// A find can be awarded while the visitor is still inside a game (G02 awards the
// moment the mini pit round starts), and the toast should not pop up over the
// game. So a find made while a full-screen game modal is open is deferred: the
// toast waits until the visitor has exited, then shows once, reflecting the
// remaining count at that moment (so multiple finds in one session collapse to a
// single, correct toast). A find made with no modal open shows straight away.
// The open/exited signal is the `pc-modal-open` body class the pits set. The
// final find shows the completion card instead, so the engine fires no discovery
// there, and a deferred toast that turns out to complete the set is suppressed.

import { useEffect, useRef, useState } from "react";
import { getHiddenGamesEngine } from "../../lib/hiddenGames/browserEngine";
import { discoveryToast } from "../../lib/hiddenGames/copy";
import styles from "./HiddenGamesToast.module.css";

const TOAST_MS = 7000; // auto-dismiss; no dismiss control (C03: 4.5s -> 7s)

// A full-screen game modal (the mini pit) is open. The pits add this class to
// <body> on mount and remove it on exit (globals.css hides the nav under it).
function gameModalOpen(): boolean {
  return (
    typeof document !== "undefined" &&
    document.body.classList.contains("pc-modal-open")
  );
}

export default function HiddenGamesToast() {
  const [toast, setToast] = useState<{ remaining: number; key: number } | null>(
    null
  );
  const keyRef = useRef(0);
  // A find happened while a game modal was open; show the toast on exit.
  const deferredRef = useRef(false);

  const showRemaining = (remaining: number) => {
    if (remaining <= 0) return; // the completing find shows the completion card
    keyRef.current += 1;
    setToast({ remaining, key: keyRef.current });
  };

  // Subscribe to non-final awards. The engine passes the remaining count
  // (total - count). Shown immediately, unless a game modal is open: then it is
  // deferred until exit so the toast never covers the game.
  useEffect(() => {
    return getHiddenGamesEngine().subscribeDiscovery((remaining) => {
      if (gameModalOpen()) {
        deferredRef.current = true;
      } else {
        showRemaining(remaining);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flush a deferred find once the game modal is gone. Recompute the remaining
  // from the live engine state so the toast reflects the count at the moment it
  // shows, however many finds happened inside the game.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const obs = new MutationObserver(() => {
      if (deferredRef.current && !gameModalOpen()) {
        deferredRef.current = false;
        const s = getHiddenGamesEngine().getState();
        showRemaining(s.total - s.count);
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss.
  useEffect(() => {
    if (!toast) return;
    // ?toast=hold pins it open for design review. No effect otherwise.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("toast") === "hold") return;
    const t = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div key={toast.key} className={styles.toast} role="status" aria-live="polite">
      {discoveryToast(toast.remaining)}
    </div>
  );
}
