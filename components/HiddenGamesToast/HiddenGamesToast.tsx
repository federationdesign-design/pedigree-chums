"use client";

// Hidden Games discovery toast (CHANGE-LIST C02). Confirms each non-final find
// at the moment it happens. It is mounted in the root layout and rendered at a
// z-index above the mini pit modal, so a G02 find (which starts a full-screen
// modal that covers the counter) is still acknowledged. The final find shows
// the completion card instead, so the engine does not fire a discovery there.

import { useEffect, useState } from "react";
import { getHiddenGamesEngine } from "../../lib/hiddenGames/browserEngine";
import { discoveryToast } from "../../lib/hiddenGames/copy";
import styles from "./HiddenGamesToast.module.css";

const TOAST_MS = 4500; // auto-dismiss; no dismiss control

export default function HiddenGamesToast() {
  const [toast, setToast] = useState<{ remaining: number; key: number } | null>(
    null
  );

  // Subscribe to non-final awards. The engine passes the remaining count,
  // derived from the registry (total - count).
  useEffect(() => {
    let n = 0;
    return getHiddenGamesEngine().subscribeDiscovery((remaining) => {
      n += 1;
      setToast({ remaining, key: n });
    });
  }, []);

  // Auto-dismiss.
  useEffect(() => {
    if (!toast) return;
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
