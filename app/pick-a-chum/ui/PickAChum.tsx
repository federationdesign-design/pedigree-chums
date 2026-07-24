'use client';

// Pick a Chum: Checkpoint 2 visual layer. A retro-console dialogue system that
// looks like live chat, waits silently, then reveals itself as a game. Built to
// the client mock-ups (which win on aesthetics): full-viewport blue focus wash,
// rounded white command bar and response panel, blue dialogue text, green GO and
// a circular blue-ringed portrait medallion. The "retro" is the interaction:
// silent opening, one active panel (no transcript), paged type-on reveal with a
// continue marker, and > command links. All copy/links come from the mechanics.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './PickAChum.module.css';
import { CHUM_DATA } from '../lib/data';
import { submit, Turn } from '../lib/engine';
import { newSession, Session } from '../lib/session';
import { Dog } from '../lib/types';
import { openDiscountPopup } from '../data/discount-popup';

type Phase = 'closed' | 'selecting' | 'waiting' | 'revealing' | 'continue' | 'ending';

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

// Split a reply into dialogue pages at sentence boundaries (no internal scroll).
function paginate(text: string, max = 200): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const pages: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && (cur + s).length > max) {
      pages.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) pages.push(cur.trim());
  return pages.length ? pages : [text];
}

interface Command {
  label: string;
  kind: 'popup' | 'internal' | 'external' | 'ask' | 'close';
  href?: string;
}

export default function PickAChum() {
  const sessionRef = useRef<Session | null>(null);
  const [phase, setPhase] = useState<Phase>('closed');
  const [dog, setDog] = useState<Dog>('collie');
  const [input, setInput] = useState('');
  const [userLine, setUserLine] = useState('');
  const [turn, setTurn] = useState<Turn | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [shown, setShown] = useState(0); // chars revealed on the current page
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const active = phase !== 'closed';
  const page = pages[pageIndex] ?? '';
  const revealing = phase === 'revealing' && shown < page.length;
  const lastPage = pageIndex >= pages.length - 1;

  // Lock background scroll while the focus wash is up.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = active ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [active]);

  // Type-on reveal for the current page (instant under reduced motion).
  useEffect(() => {
    if (phase !== 'revealing') return;
    if (reducedMotion) {
      setShown(page.length);
      return;
    }
    setShown(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= page.length) window.clearInterval(id);
    }, 20);
    return () => window.clearInterval(id);
  }, [phase, pageIndex, page, reducedMotion]);

  // When the last page finishes revealing, move to the continue/command state.
  useEffect(() => {
    if (phase === 'revealing' && shown >= page.length && lastPage) setPhase('continue');
  }, [phase, shown, page.length, lastPage]);

  const openSelector = useCallback(() => setPhase('selecting'), []);

  const close = useCallback(() => {
    setPhase('closed');
    setTurn(null);
    setPages([]);
    setInput('');
    setUserLine('');
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  }, []);

  const selectDog = useCallback((d: Dog) => {
    sessionRef.current = newSession(d);
    setDog(d);
    setTurn(null);
    setPages([]);
    setUserLine('');
    setInput('');
    setPhase('waiting');
    window.setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const send = useCallback(() => {
    const session = sessionRef.current;
    const text = input.trim();
    if (!session || !text || session.closed) return;
    const result = submit(CHUM_DATA, session, text);
    setUserLine(text);
    setInput('');
    setTurn(result);
    setDog(session.activeDog); // reflect any transfer in the portrait
    setPages(paginate(result.response.text));
    setPageIndex(0);
    setShown(0);
    setPhase(result.response.closed ? 'ending' : 'revealing');
  }, [input]);

  // Advance: skip the type-on, then page through, click by click.
  const advance = useCallback(() => {
    if (phase !== 'revealing') return;
    if (shown < page.length) {
      setShown(page.length);
    } else if (!lastPage) {
      setPageIndex((i) => i + 1);
    }
  }, [phase, shown, page.length, lastPage]);

  const askAgain = useCallback(() => {
    setTurn(null);
    setPages([]);
    setUserLine('');
    setPhase('waiting');
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // Escape collapses the selector or closes the active interface.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, close]);

  // Ending: the Boxer cut-off closes the HUD abruptly after the line is read.
  useEffect(() => {
    if (phase !== 'ending') return;
    const id = window.setTimeout(close, reducedMotion ? 1200 : 2600);
    return () => window.clearTimeout(id);
  }, [phase, close, reducedMotion]);

  const commands: Command[] = useMemo(() => {
    if (phase !== 'continue' || !turn) return [];
    const r = turn.response;
    const list: Command[] = [];
    if (r.openPopup) {
      list.push({ label: 'Get the 30% discount code', kind: 'popup' });
    } else if (r.url) {
      const external = /^https?:/.test(r.url) || r.url.startsWith('mailto:');
      const name = destinationName(r.destinationId) || 'Open it';
      list.push({ label: name, kind: external ? 'external' : 'internal', href: r.url });
    }
    list.push({ label: 'Ask something else', kind: 'ask' });
    list.push({ label: 'Close', kind: 'close' });
    return list;
  }, [phase, turn]);

  const { name: dogName, image: dogImage } = dogInfo(dog);

  if (phase === 'closed') {
    return (
      <button
        ref={launcherRef}
        type="button"
        className={styles.launcher}
        aria-label="Pick a Chum"
        onClick={openSelector}
      >
        <LauncherIcon />
      </button>
    );
  }

  return (
    <div className={styles.root} role="dialog" aria-label="Pick a Chum" aria-modal="true">
      <div className={styles.wash} onClick={phase === 'selecting' ? close : undefined} />

      <button type="button" className={styles.close} aria-label="Close Pick a Chum" onClick={close}>
        <span aria-hidden="true">×</span>
      </button>

      {phase === 'selecting' ? (
        <div className={styles.selectorWrap}>
          <div className={styles.selector}>
            <svg className={styles.connectors} viewBox="0 0 220 250" aria-hidden="true" focusable="false">
              {/* Random control centre is (184,214); lines run out to each dog. */}
              <line x1="184" y1="214" x2="84" y2="194" />
              <line x1="184" y1="214" x2="44" y2="134" />
              <line x1="184" y1="214" x2="64" y2="64" />
              <line x1="184" y1="214" x2="144" y2="39" />
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
                  style={{ backgroundImage: `url("${info.image}")` }}
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
              <LauncherIcon />
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.stage}>
          <div
            className={styles.portrait}
            style={{ backgroundImage: `url("${dogImage}")` }}
            role="img"
            aria-label={dogName}
          />

          <div className={styles.panelCol}>
            {/* Command bar: the current user line while a reply is showing, or the editable input. */}
            {phase === 'waiting' ? (
              <form
                className={styles.commandBar}
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
            ) : (
              <div className={styles.commandBar}>
                <span className={styles.userLine}>{userLine}</span>
              </div>
            )}

            {/* Response panel: nameplate, paged dialogue, continue marker, commands. */}
            {phase !== 'waiting' && (
              <div className={styles.responsePanel} onClick={advance}>
                <div className={styles.nameplate}>{dogName}</div>
                <p className={styles.dialogue} aria-live="polite">
                  {reducedMotion || !revealing ? page : page.slice(0, shown)}
                </p>

                {phase === 'revealing' && !revealing && !lastPage && (
                  <span className={styles.continueMarker} aria-hidden="true">
                    ▶
                  </span>
                )}

                {phase === 'continue' && commands.length > 0 && (
                  <ul className={styles.commands}>
                    {commands.map((c) => (
                      <li key={c.label}>
                        <CommandRow command={c} onAsk={askAgain} onClose={close} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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

function CommandRow({ command, onAsk, onClose }: { command: Command; onAsk: () => void; onClose: () => void }) {
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
  if (command.kind === 'popup') {
    return (
      <button type="button" className={cls} onClick={openDiscountPopup}>
        {label}
      </button>
    );
  }
  return (
    <button type="button" className={cls} onClick={command.kind === 'ask' ? onAsk : onClose}>
      {label}
    </button>
  );
}

// Placeholder launcher mark (runbook rule 3: the robot head is the approved
// placeholder, implemented as a single easily replaced asset).
function LauncherIcon() {
  return (
    <svg viewBox="0 0 48 48" width="60%" height="60%" aria-hidden="true" focusable="false">
      <rect x="12" y="16" width="24" height="18" rx="5" fill="#ffffff" />
      <circle cx="19" cy="25" r="3" fill="#00A9EF" />
      <circle cx="29" cy="25" r="3" fill="#00A9EF" />
      <rect x="22" y="9" width="4" height="6" rx="2" fill="#ffffff" />
      <circle cx="24" cy="8" r="2.5" fill="#ffffff" />
      <rect x="7" y="22" width="4" height="8" rx="2" fill="#ffffff" />
      <rect x="37" y="22" width="4" height="8" rx="2" fill="#ffffff" />
    </svg>
  );
}
