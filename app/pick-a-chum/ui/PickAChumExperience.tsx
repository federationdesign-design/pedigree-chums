'use client';

// Pick a Chum: the conversation experience (Checkpoint 2 visual layer, revised).
// The heavy half, code-split behind next/dynamic in PickAChumLauncher: it pulls
// in the engine and every data record, so it only loads once the visitor opens
// the launcher. The whole thing is anchored to the bottom-left and grows out of
// the launcher: tapping it ripples four large dog circles into being; picking one
// grows a chat widget from that spot, with the chosen dog's medallion, a running
// message thread (dog on the left, visitor on the right) and a command bar that
// persists below. Each dog message appears in full at once (no paged reveal).
// Only response-specific action links that ARE the response's action remain, and
// navigation links only on the final interaction; the discount pop-up is the one
// exception kept in buying replies.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './PickAChum.module.css';
import PickAChumIcon from './PickAChumIcon';
import { CHUM_DATA } from '../lib/data';
import { submit, Turn } from '../lib/engine';
import { newSession, Session } from '../lib/session';
import { Dog } from '../lib/types';
import { openDiscountPopup } from '../data/discount-popup';
import { skipTheatre, buildTypingPlan, TYPING_PROFILES, TypingPlan } from '../lib/theatre';
import { emitTurn } from '../lib/turn-tap';

type Phase = 'selecting' | 'idle' | 'transferring' | 'ending';

// Anchor medallion animation during a handover: 'out' pops the current dog away,
// 'in' pops the new dog in (the same overshoot the selector circles use).
type Swap = 'none' | 'out' | 'in';

const DOG_SLUGS: Record<Dog, string> = {
  collie: 'border-collie',
  labrador: 'labrador',
  terrier: 'border-terrier',
  boxer: 'boxer',
};

// Workbook Transfers-sheet labels, mirroring the engine assembler so the handover
// line we display is the exact string the response text was built from.
const DOG_LABEL: Record<Dog, string> = {
  collie: 'Collie',
  labrador: 'Labrador',
  terrier: 'Border Terrier',
  boxer: 'Boxer',
};

// Handover pacing (ms). The current dog announces the handover, then a beat, then
// the medallion pops out and the new dog pops in, then the new dog's reply lands.
const BEAT = 1000;
const POP_OUT = 260;
const POP_IN_SETTLE = 380;

// Fixed selector order so returning visitors learn where each dog lives.
const SELECT_ORDER: Dog[] = ['collie', 'labrador', 'terrier', 'boxer'];

function dogInfo(dog: Dog): { name: string; image: string } {
  const rec = CHUM_DATA.dogs.find((d) => d.slug === DOG_SLUGS[dog]);
  return { name: rec?.name ?? dog, image: rec ? encodeURI(rec.image) : '' };
}

// Match the assembler's whitespace collapse so a handover prefix strips cleanly.
function collapse(s: string): string {
  return s.replace(/\s{2,}/g, ' ').trim();
}

interface Command {
  label: string;
  kind: 'popup' | 'internal' | 'external';
  href?: string;
}

interface Message {
  id: number;
  who: 'user' | 'dog';
  text: string;
  dog?: Dog; // dog turn
  name?: string;
  action?: Command;
  closed?: boolean; // this dog turn is the session cut-off
  support?: boolean; // S12: rendered under the shared support surface (no dog identity)
  typing?: boolean; // thinking dots are showing
  display?: string; // text revealed so far (typing theatre)
  done?: boolean; // performance finished (show the action link, allow the next)
  contextualLink?: boolean; // a contextual link allowed mid-chat (breed_page only)
}

// The response-specific action link (if any). Navigation links (a destination or
// article page) only ever render on the final interaction: visitors arrive not
// knowing what any of these names are, so an obscure clickable link mid-chat
// confuses more than it helps. The journey is text; the dog names places in
// words, not links, until the very end. The one exception is the discount
// pop-up (kind 'popup'): it opens the offer in place and is the purchase path,
// not navigation away, so it stays in buying replies. Gating lives at render.
function actionFor(r: Turn['response']): Command | undefined {
  if (r.openPopup) return { label: 'Get the 30% discount code', kind: 'popup' };
  if (r.url) {
    const external = /^https?:/.test(r.url) || r.url.startsWith('mailto:');
    const name = destinationName(r.destinationId) || 'Open it';
    return { label: name, kind: external ? 'external' : 'internal', href: r.url };
  }
  return undefined;
}

// Task 105: the open chat + transcript persist across page navigations in sessionStorage, so a link
// reopens the panel intact. SAFETY (not optional): a session that has EVER entered a protected state
// (active/aftercare) is never persisted -- a child's disclosure must not sit in sessionStorage raw.
// Cleared on tab close (sessionStorage) and on an explicit close (the launcher removes the key).
export const CHAT_KEY = 'pc-chat';
function readChat(): { messages: Message[]; session: Session; dog: Dog; phase: Phase; recSessionId: string } | null {
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(CHAT_KEY) : null;
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.session || s.session.protectedState) {
      // never restore a protected session; scrub it if one somehow landed there
      if (typeof window !== 'undefined') window.sessionStorage.removeItem(CHAT_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export default function PickAChumExperience({ onClose }: { onClose: () => void }) {
  const restoredRef = useRef<ReturnType<typeof readChat> | undefined>(undefined);
  if (restoredRef.current === undefined) restoredRef.current = readChat();
  const restored = restoredRef.current;
  const everProtectedRef = useRef(false); // latches once the session enters a protected state
  const sessionRef = useRef<Session | null>(restored ? restored.session : null);
  const [phase, setPhase] = useState<Phase>(restored ? restored.phase || 'idle' : 'selecting');
  const [dog, setDog] = useState<Dog>(restored ? restored.dog || 'collie' : 'collie'); // active dog (the anchor medallion)
  const [swap, setSwap] = useState<Swap>('none');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(restored ? restored.messages || [] : []);
  const [announce, setAnnounce] = useState(''); // aria-live: whole messages, once
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Task 82: messages the visitor sent while a reply was still performing. The input is never
  // disabled, so they can type ahead; each queued line is processed when the dog finishes, in order.
  const queueRef = useRef<string[]>([]);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  // Recorder session id: one per engine session (a dog pick / page load reset).
  // Inert in production (the turn tap has no sink there); see lib/turn-tap.ts.
  const recSessionRef = useRef(restored ? restored.recSessionId || '' : '');
  // The active typing performance, so a tap or Enter can complete it instantly.
  const playbackRef = useRef<{ id: number; plan: TypingPlan; closed?: boolean; done: boolean } | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);
  const after = useCallback((ms: number, fn: () => void) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const setMsg = useCallback((id: number, patch: Partial<Message>) => {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  // Finish a performance: show the whole message, announce it once, hand back.
  const finishTheatre = useCallback(
    (id: number, finalText: string, closed?: boolean) => {
      if (playbackRef.current?.id === id) playbackRef.current = { ...playbackRef.current, done: true };
      setMsg(id, { display: finalText, typing: false, done: true });
      setAnnounce(finalText);
      if (closed) setPhase('ending');
      else {
        setPhase('idle');
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [setMsg]
  );

  // Perform a dog message: safety and barks render instantly and whole (no dots,
  // no typing, no typos); otherwise thinking dots, then the per-dog typed reveal.
  const performTheatre = useCallback(
    (id: number, text: string, dog: Dog, action: string, closed?: boolean) => {
      if (skipTheatre(action as never) || reducedMotion) {
        finishTheatre(id, text, closed);
        return;
      }
      // Pass the action so factual/safety copy types clean and only character copy
      // gets the self-correcting typo (see theatre.ts NO_TYPO).
      const plan = buildTypingPlan(text, TYPING_PROFILES[dog], undefined, action);
      playbackRef.current = { id, plan, closed, done: false };
      setMsg(id, { typing: true, display: '' });
      setPhase('transferring'); // lock the composer while the dog performs

      // Clock-driven playback: each step's delay is turned into a wall-clock
      // deadline, and every animation frame we jump the shown text to whichever
      // step the elapsed time has reached. Because the whole thing is paced by
      // performance.now, not by counting setTimeouts, the performance always ends
      // at plan.totalMs (<= 8s) regardless of per-frame render or timer overhead,
      // so the eight-second cap holds as real wall-clock, not just on paper.
      const deadlines = new Array<number>(plan.steps.length);
      let acc = plan.think;
      for (let i = 0; i < plan.steps.length; i++) {
        acc += plan.steps[i].delay;
        deadlines[i] = acc;
      }
      const total = plan.totalMs;
      const start = performance.now();
      let shownIdx = -1;
      const frame = () => {
        const pb = playbackRef.current;
        if (!pb || pb.done || pb.id !== id) return;
        const elapsed = performance.now() - start;
        if (elapsed >= total) {
          finishTheatre(id, plan.final, closed);
          return;
        }
        if (elapsed >= plan.think) {
          let i = shownIdx;
          while (i + 1 < plan.steps.length && deadlines[i + 1] <= elapsed) i++;
          if (i >= 0 && i !== shownIdx) {
            shownIdx = i;
            setMsg(id, { typing: false, display: plan.steps[i].display });
          }
        }
        rafRef.current = window.requestAnimationFrame(frame);
      };
      rafRef.current = window.requestAnimationFrame(frame);
    },
    [reducedMotion, finishTheatre, setMsg]
  );

  // Tap the message or press Enter to complete the current performance instantly.
  const completeTheatre = useCallback(() => {
    const p = playbackRef.current;
    if (!p || p.done) return;
    clearTimers();
    finishTheatre(p.id, p.plan.final, p.closed);
  }, [clearTimers, finishTheatre]);

  // Drive a handover: post the user line (and any handover line), pause, pop the
  // old dog out and the new dog in, then land the new dog's reply.
  const runSwap = useCallback(
    (opts: {
      lead: number;
      userMsg: Message;
      handoverMsg: Message | null;
      toDog: Dog;
      afterMsg: Message;
      action: string;
      closed?: boolean;
    }) => {
      clearTimers();
      const popOut = reducedMotion ? 0 : POP_OUT;
      const settle = reducedMotion ? 120 : POP_IN_SETTLE;
      // The handover line (the old dog) lands whole; the new dog's reply is then
      // performed with the NEW dog's typing profile, so the change is felt.
      if (opts.handoverMsg) {
        opts.handoverMsg.display = opts.handoverMsg.text;
        opts.handoverMsg.done = true;
        setAnnounce(opts.handoverMsg.text);
      }
      setMessages((m) => (opts.handoverMsg ? [...m, opts.userMsg, opts.handoverMsg] : [...m, opts.userMsg]));
      setPhase('transferring');
      setSwap('none');
      after(opts.lead, () => setSwap('out'));
      after(opts.lead + popOut, () => {
        setDog(opts.toDog);
        setSwap('in');
      });
      after(opts.lead + popOut + settle, () => {
        setMessages((m) => [...m, opts.afterMsg]);
        performTheatre(opts.afterMsg.id, opts.afterMsg.text, opts.toDog, opts.action, opts.closed);
      });
    },
    [reducedMotion, clearTimers, after, performTheatre]
  );

  // Task 105: background scroll is NO LONGER locked -- the page beneath stays scrollable while the
  // chat is open (the overlay is pointer-events:none). (Was: document.body.style.overflow = 'hidden'.)

  // Cancel any in-flight handover timers when the experience unmounts.
  useEffect(() => clearTimers, [clearTimers]);

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, phase]);

  // Task 105: persist the open chat on every change, UNLESS the session has entered a protected state,
  // in which case the key is scrubbed and never written again (a child's disclosure must not persist).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const session = sessionRef.current;
    if (phase === 'selecting' || !session) return; // nothing to persist until a dog is picked
    if (everProtectedRef.current || session.protectedState) {
      everProtectedRef.current = true;
      try {
        window.sessionStorage.removeItem(CHAT_KEY);
      } catch {}
      return;
    }
    try {
      window.sessionStorage.setItem(CHAT_KEY, JSON.stringify({ messages, session, dog, phase, recSessionId: recSessionRef.current }));
    } catch {}
  }, [messages, phase, dog]);

  const selectDog = useCallback((d: Dog) => {
    clearTimers();
    everProtectedRef.current = false; // Task 105: a fresh engine session starts un-protected and persistable
    sessionRef.current = newSession(d);
    // A fresh engine session starts a fresh recorded conversation. Time-prefixed
    // so exported rows sort into conversation order.
    recSessionRef.current = `s${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    setDog(d);
    setSwap('none');
    setMessages([]);
    setInput('');
    setPhase('idle');
    window.setTimeout(() => inputRef.current?.focus(), 60);
  }, [clearTimers]);

  const send = useCallback((textArg?: string) => {
    const session = sessionRef.current;
    const text = (textArg ?? input).trim();
    if (!session || !text || session.closed) return;
    // Task 82: the dog is still performing. Never block or disable the input -- queue the message and
    // process it when the reply lands (see the drain effect below). textArg is set only when draining
    // the queue, so a live submit still clears the box and keeps focus while a queued one does not.
    if (phase === 'transferring') {
      queueRef.current.push(text);
      if (textArg === undefined) {
        setInput('');
        inputRef.current?.focus();
      }
      return;
    }

    const fromDog = session.activeDog;
    const result = submit(CHUM_DATA, session, text);
    // Task 105 SAFETY: the moment a turn enters a protected state, latch it so this session is never
    // persisted (the save effect also checks, but latch early, before the message is even added).
    if (session.protectedState) everProtectedRef.current = true;
    const r = result.response;
    const toDog = session.activeDog; // submit applied any transfer in place
    const swapped = toDog !== fromDog; // the active dog actually changed
    // Record this turn (no-op in production; the dev recorder is the only sink).
    // submissionCount was just incremented by submit, so it is this turn's number.
    emitTurn({
      sessionId: recSessionRef.current,
      turn: session.submissionCount,
      activeDog: fromDog,
      input: text,
      resolution: result.resolution,
      response: r,
      transferTo: swapped ? toDog : undefined,
      candidateSubject: session.candidateSubject, // Task 57: set by submit on the mutated session
    });
    const userMsg: Message = { id: idRef.current++, who: 'user', text };
    // Task 82: clear + keep focus only for a live submit; a queued/drained line must not wipe what
    // the visitor has since typed ahead into the box.
    if (textArg === undefined) {
      setInput('');
      inputRef.current?.focus();
    }

    // A specialist handoff: the current dog announces it (using the workbook
    // handover line), a beat passes, the medallion pops the old dog out and the
    // new dog in, then the new dog's reply lands. No cold, silent image swap.
    if (swapped && result.resolution.action === 'transfer') {
      const toLabel = DOG_LABEL[toDog];
      const handover = collapse(
        CHUM_DATA.transfers.find((t) => t.from === 'Collie' && t.to === toLabel)?.exampleLine ??
          `This needs the ${toLabel}.`
      );
      const incoming = r.text.startsWith(handover) ? r.text.slice(handover.length).trim() : r.text;
      const handoverMsg: Message = {
        id: idRef.current++,
        who: 'dog',
        text: handover,
        dog: fromDog,
        name: dogInfo(fromDog).name,
      };
      const incomingMsg: Message = {
        id: idRef.current++,
        who: 'dog',
        text: incoming,
        dog: toDog,
        name: dogInfo(toDog).name,
        action: actionFor(r),
        closed: r.closed,
      };
      runSwap({ lead: BEAT, userMsg, handoverMsg, toDog, afterMsg: incomingMsg, action: result.resolution.action, closed: r.closed });
      return;
    }

    // A dog change with no handover line (the Boxer cut-off): pop-swap so the
    // change is still legible, then the message lands.
    if (swapped) {
      const swapMsg: Message = {
        id: idRef.current++,
        who: 'dog',
        text: r.text,
        dog: toDog,
        name: dogInfo(toDog).name,
        action: actionFor(r),
        closed: r.closed,
      };
      runSwap({ lead: 240, userMsg, handoverMsg: null, toDog, afterMsg: swapMsg, action: result.resolution.action, closed: r.closed });
      return;
    }

    // No swap: the active dog answers directly, performed with typing theatre.
    // S12: a protected safety response is served under the shared support surface,
    // so its nameplate reads HELP AND SUPPORT and the dog identity is hidden.
    const dogMsg: Message = {
      id: idRef.current++,
      who: 'dog',
      text: r.text,
      dog: toDog,
      name: r.hideDogIdentity ? (r.header ?? 'HELP AND SUPPORT') : dogInfo(toDog).name,
      support: r.hideDogIdentity,
      action: actionFor(r),
      closed: r.closed,
      // A breed page link and the breed-hub index link are CONTEXTUAL links (they
      // end a breed answer), so they may show mid-chat. These are the only
      // exceptions to "nav links at the very end"; every other action's link stays
      // gated below. Not a general loosening.
      contextualLink: result.resolution.action === 'breed_page' || result.resolution.action === 'breed_hub',
    };
    setDog(toDog);
    setMessages((m) => [...m, userMsg, dogMsg]);

    // Bark-game break: the volley is instant (a bark action skips theatre); the
    // English line follows as a separate message after a short pause.
    if (r.followUp) {
      const followUp = r.followUp;
      setMsg(dogMsg.id, { display: r.text, typing: false, done: true });
      setAnnounce(r.text);
      const followUpMsg: Message = { id: idRef.current++, who: 'dog', text: followUp, display: followUp, done: true, dog: toDog, name: dogInfo(toDog).name };
      setPhase('transferring');
      clearTimers();
      after(reducedMotion ? 0 : 500, () => {
        setMessages((m) => [...m, followUpMsg]);
        setAnnounce(followUp);
        setPhase('idle');
        inputRef.current?.focus();
      });
      return;
    }

    performTheatre(dogMsg.id, r.text, toDog, result.resolution.action, r.closed);
  }, [input, phase, runSwap, after, clearTimers, reducedMotion, performTheatre, setMsg]);

  // Task 82: drain the type-ahead queue. When a reply finishes (phase returns to idle) the next
  // queued line is sent, which starts its own performance; this effect re-runs when that lands, so
  // the queue empties in order. sendRef holds the latest send without re-subscribing per keystroke.
  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    if (phase === 'idle' && queueRef.current.length > 0) {
      const next = queueRef.current.shift();
      if (next) sendRef.current(next);
    }
  }, [phase]);

  // Escape closes the interface; a BARE Enter while a message is typing completes it (skips the
  // reveal). Task 82: if the visitor has typed something, do NOT steal the Enter -- let the form
  // submit it (queued) so type-ahead works, keyboard and focus intact.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'Enter' && playbackRef.current && !playbackRef.current.done && !inputRef.current?.value.trim()) {
        e.preventDefault();
        completeTheatre();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, completeTheatre]);

  // Ending: the Boxer cut-off closes the HUD abruptly after the line is read.
  useEffect(() => {
    if (phase !== 'ending') return;
    const id = window.setTimeout(onClose, reducedMotion ? 1200 : 2600);
    return () => window.clearTimeout(id);
  }, [phase, onClose, reducedMotion]);

  const { image: dogImage } = dogInfo(dog);
  // Task 82: the input is NEVER disabled. Disabling it dropped focus (and closed the mobile
  // keyboard) between turns; instead the visitor types freely and send() queues while the dog
  // performs, and no-ops after the session closes.
  const anchorSwap = swap === 'out' ? styles.anchorOut : swap === 'in' ? styles.anchorIn : '';

  return (
    <div className={styles.root} role="dialog" aria-label="Pick a Chum" aria-modal="false">
      {/* Task 105: the wash dims but no longer captures clicks (pointer-events via .wash/.root), so the
          page beneath stays usable; it no longer closes on click (X and Escape still close). */}
      <div className={styles.wash} />

      {phase === 'selecting' ? (
        <div className={styles.selectorWrap}>
          <div className={styles.selector}>
            <svg className={styles.connectors} viewBox="0 0 440 420" aria-hidden="true" focusable="false">
              {/* Task 81: launcher centre is now (64,64) top-left; clean radials fan down-right. */}
              <line className={styles.connectorLine} style={{ animationDelay: '0.15s' }} x1="64" y1="64" x2="364" y2="64" />
              <line className={styles.connectorLine} style={{ animationDelay: '0.45s' }} x1="64" y1="64" x2="324" y2="214" />
              <line className={styles.connectorLine} style={{ animationDelay: '0.75s' }} x1="64" y1="64" x2="214" y2="324" />
              <line className={styles.connectorLine} style={{ animationDelay: '1.05s' }} x1="64" y1="64" x2="64" y2="364" />
            </svg>
            {SELECT_ORDER.map((d, i) => {
              const info = dogInfo(d);
              return (
                <button
                  key={d}
                  type="button"
                  className={`${styles.dogBtn} ${styles[`dog${i}`]}`}
                  onClick={() => selectDog(d)}
                  title={info.name}
                  aria-label={info.name}
                  style={{ backgroundImage: `url("${info.image}")`, animationDelay: `${0.15 + i * 0.3}s` }}
                />
              );
            })}
            <button
              type="button"
              className={styles.randomBtn}
              onClick={() => selectDog(SELECT_ORDER[Math.floor(Math.random() * SELECT_ORDER.length)])}
              aria-label="Pick for me"
              title="Pick for me"
            >
              <PickAChumIcon />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={styles.panel}
          onMouseDown={(e) => {
            // Task 105: clicking the now-usable page blurs the input; when the visitor clicks back into
            // a non-interactive part of the panel, keep focus in the input (else Task 82's fix is undone).
            const t = e.target as HTMLElement;
            if (!t.closest('button, a, input, textarea, [tabindex]')) {
              e.preventDefault();
              inputRef.current?.focus();
            }
          }}
        >
          {/* Tap anywhere in the thread to complete an in-progress performance. */}
          <div className={styles.thread} ref={threadRef} onClick={completeTheatre}>
            <div className={styles.threadInner}>
              {messages.map((msg) =>
                msg.who === 'user' ? (
                  <div key={msg.id} className={`${styles.msgRow} ${styles.rowUser}`}>
                    <div className={styles.bubbleUser}>{msg.text}</div>
                  </div>
                ) : (
                  <div key={msg.id} className={`${styles.msgRow} ${styles.rowDog}`}>
                    <div className={styles.bubbleDog}>
                      <div className={`${styles.nameplate}${msg.support ? ` ${styles.nameplateSupport}` : ''}`}>{msg.name}</div>
                      {msg.typing ? (
                        <div className={styles.typingDots} aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </div>
                      ) : (
                        // aria-hidden while still typing so the character stream is
                        // never announced; the completed text is announced once via
                        // the live region below.
                        <p className={styles.dialogue} aria-hidden={!msg.done}>
                          {msg.display ?? msg.text}
                        </p>
                      )}

                      {msg.done && msg.action && (msg.action.kind === 'popup' || msg.closed || msg.contextualLink) && (
                        <div className={styles.actionWrap}>
                          <ActionLink command={msg.action} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
          {/* Screen-reader announcements: each dog message once, whole, when done. */}
          <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
            {announce}
          </div>

          <div className={styles.composerRow}>
            <div
              className={`${styles.dogAnchor} ${anchorSwap}`}
              style={{ backgroundImage: `url("${dogImage}")` }}
              role="img"
              aria-label={dogInfo(dog).name}
            >
              <button type="button" className={styles.close} aria-label="Close Pick a Chum" onClick={onClose}>
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form
              className={styles.composer}
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                ref={inputRef}
                className={styles.input}
                aria-label="Type something here"
                placeholder="Type something here"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className={styles.go} aria-label="Send">
                GO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function destinationName(id?: string): string {
  if (!id) return '';
  const d = CHUM_DATA.destinations.find((x) => x.destinationId === id);
  if (d) return d.name;
  const a = CHUM_DATA.articles.find((x) => x.articleId === id);
  return a ? a.title : '';
}

function ActionLink({ command }: { command: Command }) {
  const label = (
    <>
      <span className={styles.pointer} aria-hidden="true">
        {'>'}
      </span>{' '}
      {command.label}
    </>
  );
  const cls = styles.command;
  if (command.kind === 'internal' && command.href) {
    return (
      <Link href={command.href} className={cls}>
        {label}
      </Link>
    );
  }
  if (command.kind === 'external' && command.href) {
    return (
      <a href={command.href} className={cls}>
        {label}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={openDiscountPopup}>
      {label}
    </button>
  );
}
