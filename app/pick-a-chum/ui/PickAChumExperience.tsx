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

export default function PickAChumExperience({ onClose }: { onClose: () => void }) {
  const sessionRef = useRef<Session | null>(null);
  const [phase, setPhase] = useState<Phase>('selecting');
  const [dog, setDog] = useState<Dog>('collie'); // active dog (the anchor medallion)
  const [swap, setSwap] = useState<Swap>('none');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);
  const after = useCallback((ms: number, fn: () => void) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Drive a handover: post the user line (and any handover line), pause, pop the
  // old dog out and the new dog in, then land the new dog's reply.
  const runSwap = useCallback(
    (opts: {
      lead: number;
      userMsg: Message;
      handoverMsg: Message | null;
      toDog: Dog;
      afterMsg: Message;
      closed?: boolean;
    }) => {
      clearTimers();
      const popOut = reducedMotion ? 0 : POP_OUT;
      const settle = reducedMotion ? 120 : POP_IN_SETTLE;
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
        if (opts.closed) {
          setPhase('ending');
        } else {
          setPhase('idle');
          inputRef.current?.focus();
        }
      });
    },
    [reducedMotion, clearTimers, after]
  );

  // Lock background scroll for the lifetime of the open experience.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Cancel any in-flight handover timers when the experience unmounts.
  useEffect(() => clearTimers, [clearTimers]);

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, phase]);

  const selectDog = useCallback((d: Dog) => {
    clearTimers();
    sessionRef.current = newSession(d);
    setDog(d);
    setSwap('none');
    setMessages([]);
    setInput('');
    setPhase('idle');
    window.setTimeout(() => inputRef.current?.focus(), 60);
  }, [clearTimers]);

  const send = useCallback(() => {
    const session = sessionRef.current;
    const text = input.trim();
    if (!session || !text || session.closed || phase === 'transferring') return;

    const fromDog = session.activeDog;
    const result = submit(CHUM_DATA, session, text);
    const r = result.response;
    const toDog = session.activeDog; // submit applied any transfer in place
    const swapped = toDog !== fromDog; // the active dog actually changed
    const userMsg: Message = { id: idRef.current++, who: 'user', text };
    setInput('');

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
      runSwap({ lead: BEAT, userMsg, handoverMsg, toDog, afterMsg: incomingMsg, closed: r.closed });
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
      runSwap({ lead: 240, userMsg, handoverMsg: null, toDog, afterMsg: swapMsg, closed: r.closed });
      return;
    }

    // No swap: the active dog answers directly.
    const dogMsg: Message = {
      id: idRef.current++,
      who: 'dog',
      text: r.text,
      dog: toDog,
      name: dogInfo(toDog).name,
      action: actionFor(r),
      closed: r.closed,
    };
    setDog(toDog);
    setMessages((m) => [...m, userMsg, dogMsg]);
    setPhase(r.closed ? 'ending' : 'idle');
    if (!r.closed) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [input, phase, runSwap]);

  // Escape closes the interface (parent restores focus to the launcher).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Ending: the Boxer cut-off closes the HUD abruptly after the line is read.
  useEffect(() => {
    if (phase !== 'ending') return;
    const id = window.setTimeout(onClose, reducedMotion ? 1200 : 2600);
    return () => window.clearTimeout(id);
  }, [phase, onClose, reducedMotion]);

  const { image: dogImage } = dogInfo(dog);
  const inputLocked = phase === 'ending' || phase === 'transferring' || !!sessionRef.current?.closed;
  const anchorSwap = swap === 'out' ? styles.anchorOut : swap === 'in' ? styles.anchorIn : '';

  return (
    <div className={styles.root} role="dialog" aria-label="Pick a Chum" aria-modal="true">
      <div className={styles.wash} onClick={phase === 'selecting' ? onClose : undefined} />

      {phase === 'selecting' ? (
        <div className={styles.selectorWrap}>
          <div className={styles.selector}>
            <svg className={styles.connectors} viewBox="0 0 450 540" aria-hidden="true" focusable="false">
              {/* Random control centre is (40,510); lines run out to each dog. */}
              <line className={styles.connectorLine} style={{ animationDelay: '0.15s' }} x1="40" y1="510" x2="135" y2="425" />
              <line className={styles.connectorLine} style={{ animationDelay: '0.45s' }} x1="40" y1="510" x2="250" y2="330" />
              <line className={styles.connectorLine} style={{ animationDelay: '0.75s' }} x1="40" y1="510" x2="345" y2="210" />
              <line className={styles.connectorLine} style={{ animationDelay: '1.05s' }} x1="40" y1="510" x2="375" y2="65" />
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
        <div className={styles.panel}>
          <div className={styles.thread} ref={threadRef} aria-live="polite">
            <div className={styles.threadInner}>
              {messages.map((msg) =>
                msg.who === 'user' ? (
                  <div key={msg.id} className={`${styles.msgRow} ${styles.rowUser}`}>
                    <div className={styles.bubbleUser}>{msg.text}</div>
                  </div>
                ) : (
                  <div key={msg.id} className={`${styles.msgRow} ${styles.rowDog}`}>
                    <div className={styles.bubbleDog}>
                      <div className={styles.nameplate}>{msg.name}</div>
                      <p className={styles.dialogue}>{msg.text}</p>

                      {msg.action && (msg.action.kind === 'popup' || msg.closed) && (
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
                disabled={inputLocked}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className={styles.go} aria-label="Send" disabled={inputLocked}>
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
