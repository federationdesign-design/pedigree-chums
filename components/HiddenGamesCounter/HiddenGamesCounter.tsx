"use client";

// Hidden Games counter (C03 timed reveal + prelude + palette).
//
// The prelude and introduction cards are spread across the visitor's first few
// pages, at most one per page, gated by the persisted page tally and the
// once-only flags:
//   page 1        the plain counter only, neither card
//   from page 2   the prelude card on the first such page where prelude_seen is
//                 false, 5s after the page loads
//   from page 3   the introduction card on the first such page where intro_seen
//                 is false, 5s after the page loads
// The prelude takes precedence, so the two never share a page: a visitor who
// leaves page 2 within the 5s gets the prelude on page 3 and the introduction on
// page 4. Each card shows once only (prelude_seen / intro_seen), marked seen the
// moment it appears, and stays until the visitor closes it, then the counter
// returns. The page tally is counted per pathname, since the root layout
// persists across client-side navigations.
//
// Lifecycle (suspended/closed/hidden) and completion take precedence over the
// cards. The palette is the campaign palette (C03).

import { useCallback, useEffect, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
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
import { fireConfetti } from "../../lib/confetti";
import styles from "./HiddenGamesCounter.module.css";

const CARD_AT = 5000; // a card appears 5s after its page loads (C03 timing)
const PRELUDE_FROM_PAGE = 2; // earliest page the prelude may appear on
const INTRO_FROM_PAGE = 3; // earliest page the introduction may appear on
const COMPLETION_TIMEOUT_MS = 10000; // D11 completion auto-collapse

// The Main Pit (the home route) is on screen and being played: PackPit sets this
// body flag while it is mounted. A prelude or introduction card must not appear
// over it, so a card due while the pit is in play is held for a later page.
function pitInPlay(): boolean {
  return (
    typeof document !== "undefined" &&
    document.body.hasAttribute("data-pc-pit-playing")
  );
}

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
  const visibleTracked = useRef(false);
  // The page number counted for the current pathname. Remembered so a re-run of
  // the effect for the same page (React strict mode double-invokes it, cleanup
  // in between) reuses the number instead of counting the page twice.
  const countedPage = useRef<{ path: string; page: number } | null>(null);
  const pathname = usePathname();

  // The counter's live DOM element, held by a callback ref so the confetti burst can read its on-screen
  // position at fire time. Only one of the in-play roots (the minimised reveal pill or the expanded counter)
  // is ever mounted, so the ref holds whichever is showing, and self-nulls when a card state takes over.
  const anchorRef = useRef<HTMLElement | null>(null);
  const setAnchor = (el: HTMLElement | null) => {
    anchorRef.current = el;
  };

  // A confetti burst from the counter's live on-screen position (its centre, read at fire time), falling back
  // to its resting bottom-left corner when it is off screen. Site-palette squares, distinct from the chat's
  // stars-and-bones win animation. prefers-reduced-motion is honoured (no burst). Stable identity (refs only),
  // so the subscribe effects below can list it as a dependency without re-subscribing.
  const burstFromCounter = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = anchorRef.current?.getBoundingClientRect();
    const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.06;
    const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.92;
    fireConfetti({ particleCount: 90, spread: 120, startVelocity: 44, origin: { x, y } });
  }, []);

  // Card reveal (C03). Re-runs on each navigation (the root layout persists, so
  // this component is not remounted per page). Reads the engine directly, not the
  // reactive state, so find-driven re-renders never restart a card's timer.
  useEffect(() => {
    const engine = getHiddenGamesEngine();
    const s = engine.getState();
    if (s.view !== "counter") {
      setPhase("counter"); // a lifecycle view (suspended/closed): show now
      return;
    }

    // Count this page once per pathname (guard the strict-mode double run).
    let page: number;
    if (countedPage.current && countedPage.current.path === pathname) {
      page = countedPage.current.page;
    } else {
      page = engine.registerPageView();
      countedPage.current = { path: pathname, page };
    }

    // Prelude first: the first page from PRELUDE_FROM_PAGE onwards still unseen.
    // Checked before the introduction, so the two never share a page.
    if (page >= PRELUDE_FROM_PAGE && !s.preludeSeen) {
      setPhase("hidden");
      const t = window.setTimeout(() => {
        if (pitInPlay()) {
          // Held: the Main Pit is being played. Leave prelude_seen unset so the
          // card stays due and reveals on a later page not in the pit.
          setPhase("counter");
          return;
        }
        setPhase("prelude");
        engine.markPreludeSeen(); // once only, even if they leave before closing
      }, CARD_AT);
      return () => window.clearTimeout(t);
    }
    if (page >= INTRO_FROM_PAGE && !s.introSeen) {
      setPhase("hidden");
      const t = window.setTimeout(() => {
        if (pitInPlay()) {
          setPhase("counter"); // held for a later page, as the prelude is
          return;
        }
        setPhase("intro");
        engine.markIntroSeen();
      }, CARD_AT);
      return () => window.clearTimeout(t);
    }
    setPhase("counter"); // no card due on this page: counter only
  }, [pathname]);

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

  // The "you found something" confetti, bursting FROM the counter. This is the site's single find-burst; the
  // old centre-screen game_start burst was removed. Two engine signals feed it, covering all ten finds:
  //   - subscribeDiscovery: finds 1..9. Fires the moment the count ticks up on a genuinely new game (never a
  //     duplicate, an unknown id, or the completing find). The reveal pill / counter stays mounted through a
  //     non-final find, so the burst reads its live position.
  //   - subscribeCompletion: the tenth (completing) find, which discovery deliberately skips. The biggest
  //     moment in the hunt gets the burst too, alongside the completion card -- not less than the other nine.
  //     Deferred to the next frame so the completion card has committed, then the burst reads ITS position
  //     (setAnchor is on the card as well). Fires only on the live completion transition, never on restore of
  //     an already-complete record, so a returning finished visitor gets no burst on load.
  useEffect(() => {
    return getHiddenGamesEngine().subscribeDiscovery(() => burstFromCounter());
  }, [burstFromCounter]);
  useEffect(() => {
    return getHiddenGamesEngine().subscribeCompletion(() => {
      if (typeof window === "undefined") return burstFromCounter();
      window.requestAnimationFrame(() => burstFromCounter());
    });
  }, [burstFromCounter]);

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
        <div ref={setAnchor} className={styles.completed} role="status" aria-live="polite">
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
      <div ref={setAnchor} className={styles.completeChip} role="status" aria-live="polite">
        <span>{state.label}</span>
      </div>
    );
  }

  // Timed sequence (first visit) or immediate (return / lifecycle).
  if (phase === "pending" || phase === "hidden") return null;

  if (phase === "prelude") {
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
            setPhase("counter");
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
        ref={setAnchor}
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
      <div ref={setAnchor} className={styles.counter} role="status" aria-live="polite" onMouseLeave={collapse}>
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
