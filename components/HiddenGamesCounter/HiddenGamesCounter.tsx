"use client";

// Hidden Games Stage 1: the fixed progress counter.
//
// A small fixed figure in the bottom-left corner (BRIEF 6.1). Restore before
// render (BRIEF 9): the count is read through useSyncExternalStore whose server
// snapshot is null, so the server and first hydration draw nothing and a
// returning visitor never sees a 0/2 flash.
//
// States, in precedence order:
//   DRAFT / ARCHIVED  -> nothing renders
//   SUSPENDED / CLOSED-> the lifecycle message (BRIEF 5)
//   completed (2/2)   -> the completion state, two approved lines (D11)
//   first-ever view   -> the expanded introduction, once (D10)
//   otherwise         -> the plain counter, plus a storage-blocked notice (4.2)

import { useEffect, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  getHiddenGamesEngine,
  emitHiddenGamesEvent,
} from "../../lib/hiddenGames/browserEngine";
import { HG_EVENTS } from "../../lib/hiddenGames/measure";
import {
  SUSPENDED,
  STORAGE_BLOCKED,
  closedMessage,
  CAMPAIGN_INTRO,
  COMPLETION_HEADING,
  COMPLETION_BODY,
} from "../../lib/hiddenGames/copy";
import styles from "./HiddenGamesCounter.module.css";

const INTRO_TIMEOUT_MS = 10000; // D10: auto-collapse after ten seconds
const COMPLETION_TIMEOUT_MS = 10000; // D11: same ten-second auto-collapse

export default function HiddenGamesCounter() {
  const state = useSyncExternalStore(
    (onChange) => getHiddenGamesEngine().subscribe(onChange),
    () => getHiddenGamesEngine().getState(),
    () => null
  );

  const [minimised, setMinimised] = useState(false);
  const [blockedDismissed, setBlockedDismissed] = useState(false);
  const [introCollapsed, setIntroCollapsed] = useState(false);
  const [completionCollapsed, setCompletionCollapsed] = useState(false);
  const visibleTracked = useRef(false);

  // Safe defaults while state is null (server / hydration) so the hooks below
  // stay unconditional and stable.
  const view = state?.view ?? "hidden";
  const introSeen = state?.introSeen ?? true; // unknown -> treat as seen (no flash)
  const completed = state?.completed ?? false;
  const completionSeen = state?.completionSeen ?? true;
  const count = state?.count ?? 0;

  const introEligible = view === "counter" && !introSeen && !completed;
  const introOpen = introEligible && !introCollapsed;
  const completionCardOpen =
    completed && !completionSeen && !completionCollapsed;

  // Collapse the intro and persist the seen flag, once (D10).
  const collapseIntro = () => {
    setIntroCollapsed(true);
    getHiddenGamesEngine().markIntroSeen();
  };

  // Collapse the completion celebration and persist its seen flag, once (D11).
  const collapseCompletion = () => {
    setCompletionCollapsed(true);
    getHiddenGamesEngine().markCompletionSeen();
  };

  // The first find collapses the intro (the count moved above zero).
  useEffect(() => {
    if (introEligible && count > 0 && !introCollapsed) collapseIntro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, introEligible]);

  // Ten-second auto-collapse while the intro is open.
  useEffect(() => {
    if (!introOpen) return;
    const t = window.setTimeout(collapseIntro, INTRO_TIMEOUT_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introOpen]);

  // Ten-second auto-collapse while the completion card is open.
  useEffect(() => {
    if (!completionCardOpen) return;
    const t = window.setTimeout(collapseCompletion, COMPLETION_TIMEOUT_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionCardOpen]);

  // Campaign visible (BRIEF 8): fire once when the campaign UI is first shown to
  // this visitor. The emit is consent-gated, so it only reaches GA4 for
  // consented visitors.
  useEffect(() => {
    if (state?.render && !visibleTracked.current) {
      visibleTracked.current = true;
      emitHiddenGamesEvent({ name: HG_EVENTS.visible });
    }
  }, [state?.render]);

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

  // Completed (2/2): show the celebration once (D11), then collapse to a
  // persistent completed chip. Same show-once-then-persist pattern as the intro.
  if (state.completed) {
    if (completionCardOpen) {
      return (
        <div className={styles.completed} role="status" aria-live="polite">
          <button
            type="button"
            className={styles.completeDismiss}
            onClick={collapseCompletion}
            aria-label="Dismiss completion message"
          >
            {"×"}
          </button>
          <p className={styles.completeHeading}>{COMPLETION_HEADING}</p>
          <p className={styles.completeBody}>{COMPLETION_BODY}</p>
        </div>
      );
    }
    return (
      <div className={styles.completeChip} role="status" aria-live="polite">
        <span className={styles.completeTick} aria-hidden="true">
          {"✓"}
        </span>
        <span>{state.label}</span>
      </div>
    );
  }

  // First-ever view: the expanded introduction (D10).
  if (introOpen) {
    return (
      <div className={styles.intro} role="status" aria-live="polite">
        <p className={styles.introLine}>{CAMPAIGN_INTRO}</p>
        <div className={styles.introFoot}>
          <span className={styles.label}>{state.label}</span>
          <button
            type="button"
            className={styles.introDismiss}
            onClick={collapseIntro}
            aria-label="Dismiss introduction"
          >
            {"×"}
          </button>
        </div>
      </div>
    );
  }

  // Plain counter.
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
