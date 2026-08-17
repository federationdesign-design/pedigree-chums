"use client";

// Hidden Games counter (C03 timed reveal + prelude + palette).
//
// First visit (prelude not yet seen): a timed sequence from page load -
//   0-5s   nothing renders
//   5-8s   the prelude card
//   8-12s  the introduction card
//   >12s   the plain counter
// Return visit (prelude seen): the counter renders immediately.
//
// Lifecycle (suspended/closed/hidden) and completion take precedence over the
// timed sequence. The palette is the campaign palette (C03).

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
  CAMPAIGN_INTRO_EMPHASIS,
  COMPLETION_HEADING,
  COMPLETION_BODY,
  PRELUDE_WARNING,
  PRELUDE_HEADING,
} from "../../lib/hiddenGames/copy";
import { getScheme, getHideImages, CONTRAST_EVENT } from "../../lib/contrastScheme";
import styles from "./HiddenGamesCounter.module.css";

const PRELUDE_AT = 5000; // C03 timings, from page load
const INTRO_AT = 8000;
const COUNTER_AT = 12000;
const COMPLETION_TIMEOUT_MS = 10000; // D11 completion auto-collapse

type Phase = "pending" | "hidden" | "prelude" | "intro" | "counter";

export default function HiddenGamesCounter() {
  const state = useSyncExternalStore(
    (onChange) => getHiddenGamesEngine().subscribe(onChange),
    () => getHiddenGamesEngine().getState(),
    () => null
  );

  // Task 136: the counter now sits under the logo, so it follows the logo.
  // Same signal the chat launcher uses: the nav publishes data-pc-logo on its
  // header. Pages with no logo never set it true, so the counter stays hidden.
  const [logoShowing, setLogoShowing] = useState(false);
  useEffect(() => {
    let current: Element | null = null;
    const sync = () => setLogoShowing(current?.getAttribute('data-pc-logo') === 'true');
    const obs = new MutationObserver(sync);
    const attach = () => {
      const header = document.querySelector('header.pc-nav');
      if (header && header !== current) {
        obs.disconnect();
        current = header;
        obs.observe(header, { attributes: true, attributeFilter: ['data-pc-logo'] });
      }
      sync();
    };
    attach();
    window.addEventListener('pc:logo', attach as EventListener);
    return () => {
      obs.disconnect();
      window.removeEventListener('pc:logo', attach as EventListener);
    };
  }, []);

  // Task 136: condensed by DEFAULT. A click expands it (was desktop hover, now
  // click on both platforms, matching the mobile tap). There is no minimise
  // control, so once expanded it stays open until the next page load.
  // Task 174: on mobile, in an accessibility mode, an OPEN chat covers this corner and sits over the dog
  // profile. Gate the counter off only in that exact intersection: mobile AND accessibility AND chat open.
  // The chat (a separate component) publishes data-pc-chat-open on <body>; accessibility is the scheme/
  // hide-images signal; mobile is the width. Still shows in the default view, on desktop, and when the chat
  // is minimised or closed (no data-pc-chat-open).
  const [hideForChat, setHideForChat] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 480px)");
    const compute = () => {
      const accessible = getScheme() !== null || getHideImages();
      const chatOpen = document.body.hasAttribute("data-pc-chat-open");
      setHideForChat(mq.matches && accessible && chatOpen);
    };
    compute();
    mq.addEventListener("change", compute);
    window.addEventListener(CONTRAST_EVENT, compute);
    const obs = new MutationObserver(compute);
    obs.observe(document.body, { attributes: true, attributeFilter: ["data-pc-chat-open"] });
    return () => {
      mq.removeEventListener("change", compute);
      window.removeEventListener(CONTRAST_EVENT, compute);
      obs.disconnect();
    };
  }, []);

  const [minimised, setMinimised] = useState(true);
  const [blockedDismissed, setBlockedDismissed] = useState(false);
  const [completionCollapsed, setCompletionCollapsed] = useState(false);
  const [phase, setPhase] = useState<Phase>("pending");
  const [preludeClosed, setPreludeClosed] = useState(false);
  const visibleTracked = useRef(false);

  // Timed reveal (C03). Mount-once; reads the engine directly, not the reactive
  // state, so find-driven re-renders never restart the sequence.
  useEffect(() => {
    const engine = getHiddenGamesEngine();
    const s = engine.getState();
    if (s.preludeSeen || s.view !== "counter") {
      setPhase("counter"); // return visit, or a lifecycle view: show now
      return;
    }
    setPhase("hidden");
    const t1 = window.setTimeout(() => setPhase("prelude"), PRELUDE_AT);
    const t2 = window.setTimeout(() => {
      setPhase("intro");
      engine.markPreludeSeen();
    }, INTRO_AT);
    const t3 = window.setTimeout(() => {
      setPhase("counter");
      engine.markIntroSeen();
    }, COUNTER_AT);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const collapseCompletion = () => {
    setCompletionCollapsed(true);
    getHiddenGamesEngine().markCompletionSeen();
  };

  // Completion celebration auto-collapse (D11).
  useEffect(() => {
    if (!(state?.completed && !state?.completionSeen && !completionCollapsed)) return;
    const t = window.setTimeout(collapseCompletion, COMPLETION_TIMEOUT_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.completed, state?.completionSeen, completionCollapsed]);

  // Campaign visible (measurement) once, when the campaign first shows something.
  useEffect(() => {
    const showing = phase === "prelude" || phase === "intro" || phase === "counter";
    if (state?.render && showing && !visibleTracked.current) {
      visibleTracked.current = true;
      emitHiddenGamesEvent({ name: HG_EVENTS.visible });
    }
  }, [state?.render, phase]);

  if (!state) return null;
  if (!state.render) return null;
  if (hideForChat) return null;

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

  // Completion (2/2): celebration once, then a persistent completed chip.
  if (state.completed) {
    if (!state.completionSeen && !completionCollapsed) {
      return (
        <div className={styles.completed} role="status" aria-live="polite">
          <button
            type="button"
            className={styles.iconBtn}
            onClick={collapseCompletion}
            aria-label="Dismiss completion message"
          >
            <img className={styles.redIcon} src="/red-icon.svg" alt="" />
          </button>
          <p className={styles.completeHeading}>{COMPLETION_HEADING}</p>
          <p className={styles.completeBody}>{COMPLETION_BODY}</p>
        </div>
      );
    }
    return (
      <div className={styles.completeChip} role="status" aria-live="polite">
        <span>{state.label}</span>
      </div>
    );
  }

  // Timed sequence (first visit) or immediate (return / lifecycle).
  if (phase === "pending" || phase === "hidden") return null;

  if (phase === "prelude") {
    if (preludeClosed) return null;
    return (
      <div className={styles.prelude} role="status" aria-live="polite">
        <img className={styles.preludeIcon} src="/prelude-icon-redux.svg" alt="" />
        <div className={styles.preludeText}>
          <p className={styles.preludeWarning}>{PRELUDE_WARNING}</p>
          <p className={styles.preludeHeading} style={{ whiteSpace: "pre-line" }} data-hg-aa-exception>{PRELUDE_HEADING}</p>
        </div>
        <button
          type="button"
          className={styles.preludeClose}
          onClick={() => {
            setPreludeClosed(true);
            getHiddenGamesEngine().markPreludeSeen();
          }}
          aria-label="Close"
        >
          <img className={styles.redIcon} src="/red-icon.svg" alt="" />
        </button>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className={styles.intro} role="status" aria-live="polite">
        <span className={styles.introScore}><span className={styles.introScoreNum}>{state.count}/{state.total}</span><span className={styles.introScoreWord}>games found</span></span>
        <p className={styles.introLine}>{CAMPAIGN_INTRO}<br /><span className={styles.introEmphasis}>{CAMPAIGN_INTRO_EMPHASIS}</span></p>
        <button type="button" className={styles.preludeClose} onClick={() => { setPhase("counter"); getHiddenGamesEngine().markIntroSeen(); }} aria-label="Close">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.redIcon} src="/red-icon.svg" alt="" />
        </button>
      </div>
    );
  }

  if (!logoShowing) return null;

  // phase === "counter"
  // Open on click (no hover-to-open); the expanded counter auto-collapses when
  // the cursor leaves it.
  const collapse = () => setMinimised(true);

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
      <div className={styles.counter} role="status" aria-live="polite" onMouseLeave={collapse}>
        <span className={styles.label}>{state.label}</span>
      </div>
      {state.storageBlocked && !blockedDismissed && (
        <div className={styles.blocked} role="alert">
          <span>{STORAGE_BLOCKED}</span>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setBlockedDismissed(true)}
            aria-label="Dismiss storage warning"
          >
            <img className={styles.redIcon} src="/red-icon.svg" alt="" />
          </button>
        </div>
      )}
    </>
  );
}
