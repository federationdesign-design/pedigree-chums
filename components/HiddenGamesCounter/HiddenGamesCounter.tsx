"use client";

// Hidden Games Stage 1: the fixed progress counter.
//
// A small fixed figure in the bottom-left corner showing "0/2 games found". It
// occupies the corner OfferLauncher (right edge) does not hold (BRIEF 6.1).
//
// Restore before render (BRIEF 9): the count is read through useSyncExternalStore
// whose server snapshot is null. The server and the first hydration render draw
// nothing, then the client shows the real restored count, so a returning visitor
// never sees a 0/2 flash.
//
// Lifecycle (BRIEF 5): the engine hands the view down. DRAFT and ARCHIVED render
// nothing; SUSPENDED and CLOSED show their messages; OPEN shows the counter. A
// refused write surfaces the storage-blocked message once (BRIEF 4.2).
//
// Completion behaviour, the campaign introduction and the found-games list are
// later batches and are deliberately absent here.

import { useState } from "react";
import { useSyncExternalStore } from "react";
import { getHiddenGamesEngine } from "../../lib/hiddenGames/browserEngine";
import {
  SUSPENDED,
  STORAGE_BLOCKED,
  closedMessage,
} from "../../lib/hiddenGames/copy";
import styles from "./HiddenGamesCounter.module.css";

export default function HiddenGamesCounter() {
  const state = useSyncExternalStore(
    (onChange) => getHiddenGamesEngine().subscribe(onChange),
    () => getHiddenGamesEngine().getState(),
    () => null
  );

  const [minimised, setMinimised] = useState(false);
  const [blockedDismissed, setBlockedDismissed] = useState(false);

  // Null on the server and during hydration: nothing renders until progress is
  // restored, which is what prevents the 0/2 flash.
  if (!state) return null;

  // DRAFT (hidden from public) and ARCHIVED (component does not render).
  if (!state.render) return null;

  if (state.view === "suspended") {
    return (
      <div className={styles.notice} role="status" aria-live="polite">
        {SUSPENDED}
      </div>
    );
  }

  if (state.view === "closed") {
    return (
      <div className={styles.notice} role="status" aria-live="polite">
        {closedMessage(state.count, state.total)}
      </div>
    );
  }

  // view === "counter" (OPEN).
  if (minimised) {
    return (
      <button
        type="button"
        className={styles.reveal}
        onClick={() => setMinimised(false)}
        aria-label={`Show hidden games progress, ${state.label}`}
      >
        {state.count}/{state.total}
      </button>
    );
  }

  return (
    <>
      <div className={styles.counter} role="status" aria-live="polite">
        <span className={styles.label}>{state.label}</span>
        <button
          type="button"
          className={styles.minimise}
          onClick={() => setMinimised(true)}
          aria-label="Minimise hidden games progress"
        >
          {"-"}
        </button>
      </div>
      {state.storageBlocked && !blockedDismissed && (
        <div className={styles.blocked} role="alert">
          <span>{STORAGE_BLOCKED}</span>
          <button
            type="button"
            className={styles.blockedDismiss}
            onClick={() => setBlockedDismissed(true)}
            aria-label="Dismiss storage warning"
          >
            {"×"}
          </button>
        </div>
      )}
    </>
  );
}
