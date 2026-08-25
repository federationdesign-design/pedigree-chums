"use client";

// Hidden Games discovery toast (CHANGE-LIST C02). Confirms each non-final find.
// It is mounted in the root layout at a z-index above the mini pit modal.
//
// A find can be awarded while the visitor is still playing (G02 awards the moment
// the mini pit round starts; G01 in the Main Pit), and the toast should not pop
// up over the game and break concentration. So a find made while a game is in
// play is deferred: the toast waits until the visitor has left, then shows once,
// reflecting the remaining count at that moment (so multiple finds in one session
// collapse to a single, correct toast). A find made with nothing in play shows
// 2s later. The final find shows the completion card instead, so the engine fires
// no discovery there, and a deferred toast that turns out to complete the set is
// suppressed.
//
// Task B: the toast is one of the campaign's on-screen surfaces, so it holds the
// single campaign slot (surfaceLock) while it is up. If a card holds the slot the
// toast waits, and is shown when the slot frees; while the toast is up, cards
// wait. It appears 2s after the find, stays until the visitor closes it (no
// auto-dismiss), and has a close control.

import { useCallback, useEffect, useRef, useState } from "react";
import { getHiddenGamesEngine } from "../../lib/hiddenGames/browserEngine";
import { discoveryToast } from "../../lib/hiddenGames/copy";
import {
  claimSurface,
  releaseSurface,
  subscribeSurfaceFree,
  TOAST_SURFACE,
} from "../../lib/hiddenGames/surfaceLock";
import styles from "./HiddenGamesToast.module.css";

const TOAST_DELAY_MS = 2000; // appears 2s after a find (Task B; was immediate)

// A full-screen game is in play and a toast would cover it: the mini pit modal
// (the `pc-modal-open` body class the pits set) or the Main Pit on the home route
// (the `data-pc-pit-playing` body attribute PackPit sets). Either defers the
// toast until the visitor leaves.
function gameInPlay(): boolean {
  if (typeof document === "undefined") return false;
  const body = document.body;
  return (
    body.classList.contains("pc-modal-open") ||
    body.hasAttribute("data-pc-pit-playing")
  );
}

export default function HiddenGamesToast() {
  const [toast, setToast] = useState<{ remaining: number; key: number } | null>(
    null
  );
  const keyRef = useRef(0);
  // A find happened while a game was in play; show the toast once the visitor
  // has left.
  const deferredRef = useRef(false);
  // The toast is due but a card holds the campaign slot; show it when it frees.
  const waitingRef = useRef(false);

  // Show now if the campaign slot is free, else wait for it. Remaining is
  // recomputed from the live engine so the toast reflects the count at the moment
  // it shows, however many finds happened. Skips the completing find (remaining 0),
  // which shows the completion card instead. A find while the toast is already up
  // re-claims (same id) and refreshes the count in place.
  const attemptShow = useCallback(() => {
    const s = getHiddenGamesEngine().getState();
    const remaining = s.total - s.count;
    if (remaining <= 0) return;
    if (!claimSurface(TOAST_SURFACE)) {
      waitingRef.current = true;
      return;
    }
    waitingRef.current = false;
    keyRef.current += 1;
    setToast({ remaining, key: keyRef.current });
  }, []);

  // Subscribe to non-final awards. Shown 2s later, unless a game is in play: then
  // it is deferred until the visitor leaves so the toast never covers the game.
  useEffect(() => {
    return getHiddenGamesEngine().subscribeDiscovery(() => {
      if (gameInPlay()) {
        deferredRef.current = true;
      } else {
        window.setTimeout(attemptShow, TOAST_DELAY_MS);
      }
    });
  }, [attemptShow]);

  // Flush a deferred find once no game is in play, applying the same 2s delay from
  // the moment the visitor leaves. Both signals live on <body>: the mini pit
  // toggles a class, the Main Pit a data attribute, so watch both.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const obs = new MutationObserver(() => {
      if (deferredRef.current && !gameInPlay()) {
        deferredRef.current = false;
        window.setTimeout(attemptShow, TOAST_DELAY_MS);
      }
    });
    obs.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-pc-pit-playing"],
    });
    return () => obs.disconnect();
  }, [attemptShow]);

  // When the slot frees (a card was dismissed), show the waiting toast.
  useEffect(() => {
    return subscribeSurfaceFree(() => {
      if (waitingRef.current) attemptShow();
    });
  }, [attemptShow]);

  if (!toast) return null;

  const close = () => {
    releaseSurface(TOAST_SURFACE);
    setToast(null);
  };

  return (
    <div key={toast.key} className={styles.toast} role="status" aria-live="polite">
      <span className={styles.toastText}>{discoveryToast(toast.remaining)}</span>
      <button
        type="button"
        className={styles.close}
        onClick={close}
        aria-label="Dismiss"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.closeIcon} src="/red-icon.svg" alt="" />
      </button>
    </div>
  );
}
