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

type Phase = 'selecting' | 'idle' | 'ending';

const DOG_SLUGS: Record<Dog, string> = {
  collie: 'border-collie',
  labrador: 'labrador',
  terrier: 'border-terrier',
  boxer: 'boxer',
};

// Fixed selector order so returning visitors learn where each dog lives.
const SELECT_ORDER: Dog[] = ['collie', 'labrador', 'terrier', 'boxer'];

function dogInfo(dog: Dog): { name: string; image: string } {
  const rec = CHUM_DATA.dogs.find((d) => d.slug === DOG_SLUGS[dog]);
  return { name: rec?.name ?? dog, image: rec ? encodeURI(rec.image) : '' };
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
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(0);

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Lock background scroll for the lifetime of the open experience.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, phase]);

  const selectDog = useCallback((d: Dog) => {
    sessionRef.current = newSession(d);
    setDog(d);
    setMessages([]);
    setInput('');
    setPhase('idle');
    window.setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const send = useCallback(() => {
    const session = sessionRef.current;
    const text = input.trim();
    if (!session || !text || session.closed) return;
    const result = submit(CHUM_DATA, session, text);
    const r = result.response;
    const activeDog = session.activeDog; // reflect any transfer
    const info = dogInfo(activeDog);
    const userMsg: Message = { id: idRef.current++, who: 'user', text };
    const dogMsg: Message = {
      id: idRef.current++,
      who: 'dog',
      text: r.text,
      dog: activeDog,
      name: info.name,
      action: actionFor(r),
      closed: r.closed,
    };
    setDog(activeDog);
    setInput('');
    setMessages((m) => [...m, userMsg, dogMsg]);
    setPhase(r.closed ? 'ending' : 'idle');
    if (!r.closed) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [input]);

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
  const inputLocked = phase === 'ending' || !!sessionRef.current?.closed;

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
              className={styles.dogAnchor}
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
