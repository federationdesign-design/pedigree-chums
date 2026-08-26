"use client";

// Hidden Games counter (C03 timed reveal + prelude + palette).
//
// NOTE: the prelude and introduction cards are currently switched OFF behind the
// CARDS_ENABLED flag (defined just above the timing constants below). No visitor
// sees either card while it is false. The description that follows documents the
// intact, dormant behaviour so it can be turned back on by flipping that flag.
//
// The prelude and introduction cards are spread across the visitor's first few
// pages, at most one per page, gated by the persisted page tally and the
// once-only flags:
//   page 1        the plain counter only, neither card
//   from page 2   the prelude card on the first such page where prelude_seen is
//                 false, immediately as the page loads (auto-dismisses after 10s,
//                 and also has a close X)
//   from page 3   the introduction card on the first such page where intro_seen
//                 is false, 10s after the page loads (stays until the visitor
//                 closes it)
// The prelude takes precedence, so the two never share a page: a visitor who
// leaves page 2 before the prelude has shown gets the prelude on page 3 and the
// introduction on page 4. Each card shows once only (prelude_seen / intro_seen),
// marked seen the moment it appears. The page tally is counted per pathname,
// since the root layout persists across client-side navigations.
//
// Task B collision guard: every card claims the single campaign slot
// (surfaceLock) before it shows and releases it when dismissed, so a card and
// the discovery toast can never be on screen together; whichever is second
// waits for the slot to free. The counter's `phase` still serialises the cards
// relative to one another.
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
import {
  claimSurface,
  releaseSurface,
  subscribeSurfaceFree,
  CARD_SURFACE,
} from "../../lib/hiddenGames/surfaceLock";
import { fireConfetti } from "../../lib/confetti";
import styles from "./HiddenGamesCounter.module.css";

// FEATURE FLAG (the single switch for the prelude + introduction cards).
// While this is false, no visitor ever sees the prelude or the introduction
// card. All their machinery below stays intact and wired: the timings, the
// showCard/releaseCard slot helpers, the surface-lock claim/release, the render
// blocks and the once-only flags. Flip this back to true to bring both cards
// back with no rebuilding. This flag gates ONLY those two cards: the counter,
// the discovery toast and the completion celebration are unaffected.
const CARDS_ENABLED = false;

const PRELUDE_AT = 0; // the prelude appears immediately on its eligible page
const PRELUDE_DISMISS_MS = 10000; // ...and auto-dismisses after 10s (also has an X)
const INTRO_AT = 10000; // the introduction appears 10s into its eligible page
const COMPLETION_AT = 2000; // the completion celebration appears 2s after completing
const PRELUDE_FROM_PAGE = 2; // earliest page the prelude may appear on
const INTRO_FROM_PAGE = 3; // earliest page the introduction may appear on

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
  const [completionVisible, setCompletionVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("pending");
  const visibleTracked = useRef(false);
  // Campaign-slot bookkeeping (Task B). cardHeldRef: this component currently
  // holds the single slot for a card or the celebration. pendingCardRef: a card
  // due while the slot was taken (by the toast), waiting to be shown when it
  // frees. pendingCompletionRef: the celebration waiting the same way.
  // preludeDismissRef: the prelude's 10s auto-dismiss timer.
  const cardHeldRef = useRef(false);
  const pendingCardRef = useRef<
    { target: "prelude" | "intro"; mark: () => void; autoDismissMs?: number } | null
  >(null);
  const pendingCompletionRef = useRef(false);
  const preludeDismissRef = useRef<number | null>(null);
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

  // ---- Campaign-slot helpers (Task B) --------------------------------------
  const clearPreludeDismiss = useCallback(() => {
    if (preludeDismissRef.current != null) {
      window.clearTimeout(preludeDismissRef.current);
      preludeDismissRef.current = null;
    }
  }, []);

  // Release the single campaign slot if this component holds it, and clear the
  // prelude's auto-dismiss timer.
  const releaseCard = useCallback(() => {
    clearPreludeDismiss();
    if (cardHeldRef.current) {
      cardHeldRef.current = false;
      releaseSurface(CARD_SURFACE);
    }
  }, [clearPreludeDismiss]);

  // Show a card if the slot is free; otherwise remember it and wait
  // (subscribeSurfaceFree retries when the slot frees). A prelude also arms its
  // 10s auto-dismiss.
  const showCard = useCallback(
    (target: "prelude" | "intro", mark: () => void, autoDismissMs?: number) => {
      if (!claimSurface(CARD_SURFACE)) {
        pendingCardRef.current = { target, mark, autoDismissMs };
        setPhase("counter"); // wait behind the toast; the counter shows meanwhile
        return;
      }
      cardHeldRef.current = true;
      pendingCardRef.current = null;
      setPhase(target);
      mark();
      if (autoDismissMs != null) {
        clearPreludeDismiss();
        preludeDismissRef.current = window.setTimeout(() => {
          releaseCard();
          setPhase("counter");
        }, autoDismissMs);
      }
    },
    [clearPreludeDismiss, releaseCard]
  );

  // Dismiss a showing card via its X: free the slot and return to the counter.
  const dismissCard = useCallback(() => {
    releaseCard();
    setPhase("counter");
  }, [releaseCard]);

  // Card reveal (C03 + Task B). Re-runs on each navigation (the root layout
  // persists, so this component is not remounted per page). Reads the engine
  // directly, not the reactive state, so find-driven re-renders never restart a
  // card's timer. Navigation first ends any card on screen and frees the slot.
  useEffect(() => {
    const engine = getHiddenGamesEngine();
    const s = engine.getState();
    releaseCard();
    pendingCardRef.current = null;
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
    // Gated by CARDS_ENABLED: while the flag is off, no prelude is ever due.
    if (CARDS_ENABLED && page >= PRELUDE_FROM_PAGE && !s.preludeSeen) {
      setPhase("hidden");
      const t = window.setTimeout(() => {
        if (pitInPlay()) {
          // Held: the Main Pit is being played. Leave prelude_seen unset so the
          // card stays due and reveals on a later page not in the pit.
          setPhase("counter");
          return;
        }
        showCard("prelude", () => engine.markPreludeSeen(), PRELUDE_DISMISS_MS);
      }, PRELUDE_AT);
      return () => window.clearTimeout(t);
    }
    if (CARDS_ENABLED && page >= INTRO_FROM_PAGE && !s.introSeen) {
      setPhase("hidden");
      const t = window.setTimeout(() => {
        if (pitInPlay()) {
          setPhase("counter"); // held for a later page, as the prelude is
          return;
        }
        showCard("intro", () => engine.markIntroSeen());
      }, INTRO_AT);
      return () => window.clearTimeout(t);
    }
    setPhase("counter"); // no card due on this page: counter only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const collapseCompletion = () => {
    setCompletionCollapsed(true);
    setCompletionVisible(false);
    if (cardHeldRef.current) {
      cardHeldRef.current = false;
      releaseSurface(CARD_SURFACE);
    }
    getHiddenGamesEngine().markCompletionSeen();
  };

  // Completion celebration (D11 + Task B): 2s after the set completes, show the
  // celebration if the slot is free, else wait for it. It stays until the visitor
  // closes it (no auto-collapse); dismissing it frees the slot.
  useEffect(() => {
    if (!(state?.completed && !state?.completionSeen && !completionCollapsed)) return;
    const t = window.setTimeout(() => {
      if (claimSurface(CARD_SURFACE)) {
        clearPreludeDismiss(); // completion reuses CARD_SURFACE: cancel a prelude's
        // stale auto-dismiss so it cannot release the slot under the celebration
        cardHeldRef.current = true;
        pendingCompletionRef.current = false;
        setCompletionVisible(true);
      } else {
        pendingCompletionRef.current = true; // wait behind the toast
      }
    }, COMPLETION_AT);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.completed, state?.completionSeen, completionCollapsed]);

  // Task B: when the slot frees, show whichever card or celebration was waiting.
  useEffect(() => {
    return subscribeSurfaceFree(() => {
      const pc = pendingCardRef.current;
      if (pc && claimSurface(CARD_SURFACE)) {
        cardHeldRef.current = true;
        pendingCardRef.current = null;
        setPhase(pc.target);
        pc.mark();
        if (pc.autoDismissMs != null) {
          clearPreludeDismiss();
          preludeDismissRef.current = window.setTimeout(() => {
            releaseCard();
            setPhase("counter");
          }, pc.autoDismissMs);
        }
        return;
      }
      if (pendingCompletionRef.current && claimSurface(CARD_SURFACE)) {
        clearPreludeDismiss();
        pendingCompletionRef.current = false;
        cardHeldRef.current = true;
        setCompletionVisible(true);
      }
    });
  }, [clearPreludeDismiss, releaseCard]);

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
    if (!state.completionSeen && !completionCollapsed && completionVisible) {
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
            dismissCard();
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
        <button type="button" className={styles.preludeClose} onClick={() => { dismissCard(); getHiddenGamesEngine().markIntroSeen(); }} aria-label="Close">
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
