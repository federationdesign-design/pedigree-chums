"use client";

// Hidden Games Stage 1: the fixed progress counter.
//
// A small fixed figure in the bottom-left corner showing "0/2 games found". It
// occupies the corner OfferLauncher (right edge) does not hold (BRIEF 6.1).
//
// Restore before render (BRIEF 9): the count is read through useSyncExternalStore
// whose server snapshot is null. The server and the first hydration render draw
// nothing, then the client shows the real restored count. A returning visitor on
// 1/2 therefore never sees a 0/2 flash; a fresh visitor simply resolves to 0/2.
//
// No game is wired in Batch 1, so nothing calls reportHiddenGame and the counter
// stays at its restored value. Completion behaviour, the found-games list and
// discovery animation are later batches and are deliberately absent here.

import { useState } from "react";
import { useSyncExternalStore } from "react";
import { getHiddenGamesEngine } from "../../lib/hiddenGames/browserEngine";
import styles from "./HiddenGamesCounter.module.css";

export default function HiddenGamesCounter() {
  const state = useSyncExternalStore(
    (onChange) => getHiddenGamesEngine().subscribe(onChange),
    () => getHiddenGamesEngine().getState(),
    () => null
  );

  const [minimised, setMinimised] = useState(false);

  // Null on the server and during hydration: nothing renders until progress is
  // restored, which is what prevents the 0/2 flash.
  if (!state) return null;

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
  );
}
