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
import { usePathname } from 'next/navigation';
import styles from './PickAChum.module.css';
import PickAChumIcon from './PickAChumIcon';
import { CHUM_DATA } from '../lib/data';
import { submit, Turn } from '../lib/engine';
import { newSession, Session } from '../lib/session';
import { Dog, GameId } from '../lib/types';
import { reportHiddenGame } from '../../../lib/hiddenGames/browserEngine';
import type { GameId as HiddenGameId } from '../../../lib/hiddenGames/registry';
import { openDiscountPopup } from '../data/discount-popup';
import { FEED_COOKIES, RED_TOOLTIP, CookiePill } from '../data/feed-cookie';
import { breeds } from '../../../data/breeds';
import { skipTheatre, buildTypingPlan, TYPING_PROFILES, TypingPlan } from '../lib/theatre';
import { emitTurn } from '../lib/turn-tap';
import { CHAT_KEY, PROTECTED_FLAG } from './pcKeys';

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

// Task 121: the selector arc, parametric. Dogs sit on a circle of ARC_RADIUS around the centre anchor
// (64,64 in selector space), starting at ARC_START_DEG (clockwise from the 3 o'clock/right axis) and
// spaced ARC_SPREAD_DEG apart. Rotated down off the top row so the first dog clears the top-right
// hamburger; the spread is tightened so the last dog stays on screen at 768px. To re-aim the whole
// arc, change ARC_START_DEG alone (one number, was four hardcoded left/top pairs). The dog positions
// AND the connector lines both derive from here, so they can never drift. The mobile fan is shrunk via
// --pc-selector-scale (CSS), not here, so these selector-space coordinates are breakpoint-independent.
// (Task 129 briefly re-laid this as a level row; the owner restored the arc. The dogs stay in these
// exact positions when one is picked, and the two LOW dogs get upward-growing columns instead.)
const ARC_RADIUS = 300;
const ARC_CENTER = 64; // the "pick for me" anchor centre, in selector space
const ARC_START_DEG = 35;
const ARC_SPREAD_DEG = 25;
const ARC_BODY_R = 26; // icon circular-body radius: lines start here, not at the centre (Task 113)
const dogAngleRad = (i: number) => ((ARC_START_DEG + i * ARC_SPREAD_DEG) * Math.PI) / 180;
// Dog button top-left (its box is 128px, centred on the ARC point): left/top = radius * cos/sin.
const dogPos = (i: number) => ({ left: ARC_RADIUS * Math.cos(dogAngleRad(i)), top: ARC_RADIUS * Math.sin(dogAngleRad(i)) });
// Dog centre (connector far end) and the near end on the icon's body edge.
const dogCentre = (i: number) => ({ x: ARC_CENTER + ARC_RADIUS * Math.cos(dogAngleRad(i)), y: ARC_CENTER + ARC_RADIUS * Math.sin(dogAngleRad(i)) });
const lineStart = (i: number) => ({ x: ARC_CENTER + ARC_BODY_R * Math.cos(dogAngleRad(i)), y: ARC_CENTER + ARC_BODY_R * Math.sin(dogAngleRad(i)) });
const round1 = (n: number) => Math.round(n * 10) / 10;

// Owner review: the medallion name breaks after each word, so a two-word
// dog stacks her name on two lines.
function nameLines(name: string) {
  const words = name.split(' ');
  return words.map((w, i) => (
    <span key={i}>
      {w}
      {i < words.length - 1 && <br />}
    </span>
  ));
}

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
  fetchGame?: boolean; // Task 135: the fetch game's link keeps the chat open so 'play again?' can follow
  gameOutput?: string; // Task 115: the game board / sheep tiles / drawing, rendered in a monospace block
  media?: { src: string; alt: string }; // Task 138: a short looping clip served with the line
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
    // Task 140: the fetch-to-bio fall-through carries its own label (many bio pages have no
    // destination record, so destinationName would return nothing and read as "Open it").
    const name = r.linkLabel || destinationName(r.destinationId) || 'Open it';
    return { label: name, kind: external ? 'external' : 'internal', href: r.url };
  }
  return undefined;
}

// Task 105: the open chat + transcript persist across page navigations in sessionStorage, so a link
// reopens the panel intact. SAFETY (not optional): a session that has EVER entered a protected state
// (active/aftercare) is never persisted -- a child's disclosure must not sit in sessionStorage raw.
// Cleared on tab close (sessionStorage) and on an explicit close (the launcher removes the key).
// CHAT_KEY / PROTECTED_FLAG live in ./pcKeys (imported at the top) so the lightweight launcher and the
// appearance helper can read them without pulling in this heavy, code-split module.
function readChat(): { messages: Message[]; session: Session; dog: Dog; phase: Phase; recSessionId: string; minimised?: boolean } | null {
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(CHAT_KEY) : null;
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.session || s.session.protectedState || s.session.closed) {
      // Never restore a protected session; scrub it if one somehow landed there. Task 142 (3.4): a
      // closed (Boxer cut-off) session is never restored either -- she has left, so reopening starts
      // fresh at the selector rather than a dead input box.
      if (typeof window !== 'undefined') window.sessionStorage.removeItem(CHAT_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

// Task 108: per-dog chat profile image, shown beside that dog's messages. Cached per URL, so it is
// fetched once per dog, not per message. (Resized JPEGs to be dropped in with the same names.)
const PROFILE_IMG: Record<Dog, string> = {
  collie: '/collie-chat-profile-img2.jpg',
  labrador: '/lab-chat-profile-img2.jpg',
  boxer: '/boxer-chat-profile-img2.jpg',
  terrier: '/terrier-chat-profile-img2.jpg',
};

// Task 123: each in-chat game is a Hidden Games find, awarded the moment its opening surface (the
// board / masked word / drawing) is SERVED -- i.e. on game_start, before any move or guess. The bark
// game is deliberately NOT here: a single "woof" is a turn, not finding a game.
const HIDDEN_GAME_ID: Record<GameId, HiddenGameId> = { ninesquare: 'G03', missingsheep: 'G04', kennelsketch: 'G05', treattrail: 'G07', missingbiscuit: 'G08', feedcookie: 'G09' };

// Task 148: an unbidden Terrier appearance. When passed (and there is no restored chat), the
// experience mounts with the Terrier already chosen and MINIMISED, seeded with his `offer` line; on
// the first open (engage), his `reveal` (the page's extended bio, or a game hint) is appended.
// Task 152/153: an appearance may carry a SEQUENCE -- `offer` is the first message (the chip line), and
// `followUps` are the extras that arrive whole, spaced by `gapMs` (playSequence). `chums` marks the one
// dynamic case (the Collie naming three random breeds on /know-your-chums): the lines are generated in
// the experience so the lightweight launcher never pulls the breed data.
export type AutoAppear = { dog: Dog; offer: string; reveal: string; route: string; followUps?: string[]; gapMs?: number; chums?: boolean };

// Task 151 Case A: the Labrador's thread pickup on /hot-dogs. He speaks FIRST (new: every message so far
// has been a reply) into an existing chat, and arms the cookie ask so a "yes" feeds him. Owner copy, verbatim.
const LAB_HOTDOG_PICKUP = 'you made it, I got here first. can you get me a cookie?';

// Task 153: the Collie's chum-naming lines for /know-your-chums. THREE DISTINCT breeds, PICKED AT RANDOM
// (a different three each session), drawn from each breed's OWN `fact` and `character` in her register
// rather than 54 authored lines. Every one of the 54 has both fields, so no guard is needed; a missing
// field simply drops out of the line. SHAPE (reported for approval): "The <Name>. <fact>. <first
// sentence of character>." Generated here, not in the launcher, so the launcher stays lightweight.
function collieChumLines(): string[] {
  const pool = [...breeds];
  const picks: typeof breeds = [];
  for (let i = 0; i < 3 && pool.length; i++) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return picks.map((b) => {
    const fact = (b.fact || '').trim().replace(/[.\s]+$/, '');
    const factSentence = fact ? `${fact[0].toUpperCase()}${fact.slice(1)}.` : '';
    const charFirst = (b.character || '').split(/(?<=[.!?])\s+/)[0].replace(/&/g, 'and').trim();
    return [`The ${b.name}.`, factSentence, charFirst].filter(Boolean).join(' ');
  });
}

export default function PickAChumExperience({ onClose, autoAppear, pickupRoute }: { onClose: () => void; autoAppear?: AutoAppear; pickupRoute?: string | null }) {
  // Task 140: the page the visitor is on, carried into the engine as session state (like lastAction)
  // so "what is this page" answers with that page's bio. Always a string on a real route.
  const pathname = usePathname();
  const restoredRef = useRef<ReturnType<typeof readChat> | undefined>(undefined);
  if (restoredRef.current === undefined) restoredRef.current = readChat();
  const restored = restoredRef.current;
  // Task 148: an unbidden appearance only takes effect when there is no chat to restore (the launcher
  // already guarantees that via the suppression rule; this is belt-and-braces).
  const auto = !restored && autoAppear ? autoAppear : null;
  const everProtectedRef = useRef(false); // latches once the session enters a protected state
  const sessionRef = useRef<Session | null>(restored ? restored.session : auto ? newSession(auto.dog) : null);
  const [phase, setPhase] = useState<Phase>(restored ? restored.phase || 'idle' : auto ? 'idle' : 'selecting');
  const [dog, setDog] = useState<Dog>(restored ? restored.dog || 'collie' : auto ? auto.dog : 'collie'); // active dog (the anchor medallion)
  const [swap, setSwap] = useState<Swap>('none');
  // Task 78: the two visual tricks on the dog image. dead persists (black image) until the next submit;
  // roll is a one-off rotation that clears itself when the animation ends.
  const [dead, setDead] = useState(false);
  const [roll, setRoll] = useState(false);
  const [input, setInput] = useState('');
  // Task 149: the Feed the Dog a Cookie tray. `feedFed` mirrors the game's eaten-cookie ids into React
  // state (sessionRef is a ref, so the tray needs its own reactive copy); it is null whenever the
  // Labrador's cookie game is not the one running, which also hides the tray the moment a safety turn
  // ends the game. `armedRed` is the red pill whose "we dont use this" tooltip is currently open.
  const [feedFed, setFeedFed] = useState<string[] | null>(null);
  const [armedRed, setArmedRed] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(
    restored
      ? restored.messages || []
      : auto && auto.offer // Task 153: a dynamic (chums) sequence has no static offer -- its first line is injected on mount, so seed nothing here
        ? [{ id: 0, who: 'dog', text: auto.offer, dog: auto.dog, name: dogInfo(auto.dog).name, display: auto.offer, done: true }]
        : []
  );
  const [announce, setAnnounce] = useState(''); // aria-live: whole messages, once
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Task 82: messages the visitor sent while a reply was still performing. The input is never
  // disabled, so they can type ahead; each queued line is processed when the dog finishes, in order.
  const queueRef = useRef<string[]>([]);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(auto ? 1 : 0);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  // Recorder session id: one per engine session (a dog pick / page load reset).
  // Inert in production (the turn tap has no sink there); see lib/turn-tap.ts.
  const recSessionRef = useRef(restored ? restored.recSessionId || '' : auto ? `s${Date.now().toString(36)}-auto` : '');
  // The active typing performance, so a tap or Enter can complete it instantly.
  const playbackRef = useRef<{ id: number; plan: TypingPlan; closed?: boolean; done: boolean } | null>(null);
  // Task 152: the in-flight consecutive-message sequence (a dog sending two or three in a row), or null.
  // Its token guards the abandon rule: the visitor typing, navigation, or a protected state all set
  // `aborted` and drop it, so the remaining messages never fire.
  const seqRef = useRef<{ aborted: boolean } | null>(null);

  // Task 129 targets above 480px only; at or below, the pre-129 stacked panel
  // renders unchanged and mobile stays Task 120's problem.
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const wide = vw > 480;

  // Task 130: minimise collapses the chat to a dog-face chip bottom right;
  // restore brings the conversation back exactly where it was. The flag rides
  // the persistence payload so a minimised chat survives page navigation.
  const [minimised, setMinimised] = useState<boolean>(restored ? !!restored.minimised : auto ? true : false);
  // Task 151 Case A: a small pulse on the minimised chip when the Labrador speaks unprompted, so an
  // unread line is noticed rather than sitting in the corner. Cleared the moment the visitor opens the chip.
  const [spoke, setSpoke] = useState(false);
  // Task 148: on the first open of an unbidden appearance (the visitor engages), append his reveal --
  // the page's extended bio, or a game hint -- as a second message. revealedRef guards it to once.
  const revealedRef = useRef(false);
  useEffect(() => {
    if (!auto || minimised || revealedRef.current) return;
    revealedRef.current = true; // first open: stop the chip pulse whether or not there is a reveal to add
    // Task 151: the Labrador's Case B line is the opener alone (empty reveal), so append no second bubble
    // rather than a blank one; the Terrier and Boxer always carry a reveal.
    if (auto.reveal.trim()) {
      setMessages((m) => [...m, { id: idRef.current++, who: 'dog', text: auto.reveal, dog: auto.dog, name: dogInfo(auto.dog).name, display: auto.reveal, done: true }]);
    }
  }, [minimised, auto]);
  // Task 151 Case A: the Labrador picks up the thread on /hot-dogs. He is already here (a chat exists), so
  // this is a MESSAGE, not an arrival -- no suppression, no appearance. He becomes the active dog, speaks
  // his line, and arms the cookie ask so a "yes" starts the feed game. NEVER into a protected session
  // (the launcher checks pc-protected too, but guard here as well): a disclosure must not be chatted at.
  // Once per page visit (pickupDoneRef), and not while a game is already running.
  const pickupDoneRef = useRef<string | null>(null);
  useEffect(() => {
    if (pickupRoute !== '/hot-dogs' || pickupDoneRef.current === pickupRoute) return;
    const session = sessionRef.current;
    if (!session || session.protectedState || everProtectedRef.current || session.activeGame) return;
    pickupDoneRef.current = pickupRoute;
    session.activeDog = 'labrador';
    session.cookieAskPending = true;
    if (!session.previousDogs.includes('labrador')) session.previousDogs.push('labrador');
    setDog('labrador');
    setMessages((m) => [...m, { id: idRef.current++, who: 'dog', text: LAB_HOTDOG_PICKUP, dog: 'labrador', name: dogInfo('labrador').name, display: LAB_HOTDOG_PICKUP, done: true }]);
    setAnnounce(LAB_HOTDOG_PICKUP);
    if (minimised) setSpoke(true);
  }, [pickupRoute, minimised]);
  // One body-level signal drives everything that must not co-exist with the
  // chip: the scrim (owner ruling: no chat UI left to lift) and the offer
  // card (owner ruling: two floating things in one corner is worse than
  // either). CSS reads it; nothing else needs wiring.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (minimised) document.body.setAttribute('data-pc-min', '1');
    else document.body.removeAttribute('data-pc-min');
    return () => document.body.removeAttribute('data-pc-min');
  }, [minimised]);

  // Task 130/131 + review fix: the conversation column sits at the chosen
  // dog's side (right when there is room, flipped left when the viewport
  // narrows), ANCHORED AT HER LEVEL: the column's bottom edge rides her
  // circle's bottom, so the newest message lands next to her face and the
  // older ones move UP into the space below the nav as the conversation
  // grows (owner review, inverting the bottom-of-screen stack). Content
  // pins to the bottom of the window; the visitor bar keeps its own spot
  // and the bubbles never come near it. Left and bottom are measured from
  // the anchor medallion's rect, so they track the arc, the selector scale,
  // resizes and handover pops.
  const fanAnchorRef = useRef<HTMLDivElement | null>(null);
  const [colBox, setColBox] = useState<{ left: number; top: number; bottom: number } | null>(null);
  const COL_W = 380;
  // Owner review: the chat reaches the TOP of the window, so a long history
  // slides off the window edge rather than vanishing at an invisible line.
  const COL_TOP_CLEAR = 8;
  // Owner review: once chatting, the visitor can pick the chat up and move
  // it. The offset shifts the column's anchor point (its bottom edge, where
  // the newest message sits): placed low, the window above is tall and shows
  // more messages; placed high, it shows fewer. Resets on a dog change.
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [dragging, setDragging] = useState(false); // grows the handle while moving
  useEffect(() => { setDragOffset({ dx: 0, dy: 0 }); }, [dog]);
  const startColumnDrag = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const sx = e.clientX;
    const sy = e.clientY;
    const start = { ...dragOffsetRef.current };
    setDragging(true);
    const move = (ev: PointerEvent) => {
      dragOffsetRef.current = { dx: start.dx + (ev.clientX - sx), dy: start.dy + (ev.clientY - sy) };
      setDragOffset(dragOffsetRef.current);
    };
    const up = () => {
      setDragging(false);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }, []);
  const dragOffsetRef = useRef(dragOffset);
  useEffect(() => { dragOffsetRef.current = dragOffset; }, [dragOffset]);
  useEffect(() => {
    if (!wide || phase === 'selecting') return;
    const measure = () => {
      const r = fanAnchorRef.current?.getBoundingClientRect();
      if (!r) return;
      const gap = 12;
      const roomRight = window.innerWidth - (r.right + gap);
      const rawLeft = roomRight >= COL_W + 12 ? r.right + gap : Math.max(12, r.left - gap - COL_W);
      const left = Math.min(Math.max(rawLeft, 8), window.innerWidth - COL_W - 8);
      const bottom = Math.min(Math.max(window.innerHeight - r.bottom, 112), window.innerHeight - 180);
      setColBox({ left, top: COL_TOP_CLEAR, bottom });
    };
    measure();
    const settle = window.setTimeout(measure, 600); // after the pop-in lands
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('resize', measure);
    };
  }, [wide, phase, dog, vw, swap, minimised, dragOffset]);

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

  // Task 152 section 2: play a short run of extra dog messages after the main reply, without waiting for
  // a reply -- generalising the fetch/cookie follow-up. Each lands whole, spaced by `gapMs`, and the run
  // is capped at TWO extras (three messages total, a beat, not a monologue). THE ABANDON RULE: the run
  // holds a token in seqRef; the visitor typing, navigating, or the session entering a protected state
  // all drop it, so the rest never fire (see send(), the pathname effect, and the protected checks here).
  // The extras appear whole (no per-message typing), so there is no theatre to stack -- the 40s ceiling
  // is never approached by a sequence, only by the single main message that precedes it.
  const SEQ_MAX_EXTRAS = 2;
  const playSequence = useCallback(
    (lines: string[], seqDog: Dog, gapMs: number) => {
      const items = lines.filter((l) => l && l.trim()).slice(0, SEQ_MAX_EXTRAS);
      if (!items.length) return;
      const s = sessionRef.current;
      // Never BEGIN a sequence in a protected session: a child who disclosed something must not have a
      // dog carry on with more messages.
      if (!s || s.protectedState || everProtectedRef.current) return;
      const token = { aborted: false };
      seqRef.current = token;
      const play = (i: number) => {
        if (token.aborted || seqRef.current !== token) return;
        // Stop in flight if the session has since become protected.
        const sess = sessionRef.current;
        if (!sess || sess.protectedState || everProtectedRef.current) {
          seqRef.current = null;
          return;
        }
        const line = items[i];
        setMessages((m) => [...m, { id: idRef.current++, who: 'dog', text: line, display: line, done: true, dog: seqDog, name: dogInfo(seqDog).name }]);
        setAnnounce(line);
        if (i + 1 < items.length) {
          after(gapMs, () => play(i + 1));
        } else {
          seqRef.current = null; // the run is complete
        }
      };
      after(gapMs, () => play(0));
    },
    [after]
  );

  // Task 152 section 2: abandon any in-flight sequence. Shared by the visitor's reply (send), navigation
  // (the pathname effect), and disclosure. Cancels the pending message timers and drops the token.
  const abandonSequence = useCallback(() => {
    if (!seqRef.current) return;
    seqRef.current.aborted = true;
    seqRef.current = null;
    clearTimers();
  }, [clearTimers]);

  // Task 153: the Collie's sequence pages. Her extra messages arrive AUTOMATICALLY, spaced, a beat (or
  // twenty seconds on /know-your-chums) apart -- the beat is where the joke sits, so they do not wait for
  // the visitor to open the chip. The offer (message one) is already seeded; playSequence plays the rest
  // with the Task 152 guards (abandon on type, stop on navigation, stop on a protected state). For the
  // dynamic /know-your-chums case the three lines are generated here and the first is injected.
  const seqStartedRef = useRef(false);
  useEffect(() => {
    if (!auto || seqStartedRef.current) return;
    if (auto.chums) {
      seqStartedRef.current = true;
      const lines = collieChumLines();
      if (!lines.length) return;
      setMessages((m) => [...m, { id: idRef.current++, who: 'dog', text: lines[0], display: lines[0], done: true, dog: auto.dog, name: dogInfo(auto.dog).name }]);
      setAnnounce(lines[0]);
      playSequence(lines.slice(1), auto.dog, auto.gapMs ?? 20000);
    } else if (auto.followUps?.length) {
      seqStartedRef.current = true;
      playSequence(auto.followUps, auto.dog, auto.gapMs ?? 2500);
    }
  }, [auto, playSequence]);

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
    // Task 142 (3.4): a closed (cut-off) session is scrubbed and never persisted, so it cannot be
    // restored as a dead input box; reopening the launcher starts a fresh conversation.
    if (everProtectedRef.current || session.protectedState || session.closed) {
      everProtectedRef.current = true;
      try {
        window.sessionStorage.removeItem(CHAT_KEY);
        // Task 148: the chat content is scrubbed (a disclosure must never sit in sessionStorage), but
        // leave a CONTENT-FREE flag so the Terrier's unbidden appearances stay suppressed for the rest
        // of the session -- a child who has disclosed something must not have a dog pop out at them.
        if (session.protectedState) window.sessionStorage.setItem(PROTECTED_FLAG, '1');
      } catch {}
      return;
    }
    try {
      window.sessionStorage.setItem(CHAT_KEY, JSON.stringify({ messages, session, dog, phase, recSessionId: recSessionRef.current, minimised }));
    } catch {}
  }, [messages, phase, dog, minimised]);

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
    setDead(false); // Task 78: any submit, whatever it is, revives the Collie (play dead lasts one turn)
    // Task 152 section 2: THE ABANDON RULE. If a consecutive-message sequence is in flight, the visitor's
    // reply WINS IMMEDIATELY -- drop the remaining messages and process this input now, never queue it. A
    // dog that keeps talking over you is a fault, not a gag. (A live submit only reaches here when a real
    // sequence is running, which plays at phase 'idle', so this precedes the type-ahead queue below.)
    const abandonedSeq = !!seqRef.current;
    abandonSequence();
    // Task 82: the dog is still performing. Never block or disable the input -- queue the message and
    // process it when the reply lands (see the drain effect below). textArg is set only when draining
    // the queue, so a live submit still clears the box and keeps focus while a queued one does not.
    if (!abandonedSeq && phase === 'transferring') {
      queueRef.current.push(text);
      if (textArg === undefined) {
        setInput('');
        inputRef.current?.focus();
      }
      return;
    }

    const fromDog = session.activeDog;
    session.route = pathname ?? undefined; // Task 140: the page context for the page-bio route
    const result = submit(CHUM_DATA, session, text);
    // Task 105 SAFETY: the moment a turn enters a protected state, latch it so this session is never
    // persisted (the save effect also checks, but latch early, before the message is even added).
    if (session.protectedState) everProtectedRef.current = true;
    const r = result.response;
    const toDog = session.activeDog; // submit applied any transfer in place
    const swapped = toDog !== fromDog; // the active dog actually changed
    // Task 149: refresh the cookie tray from the freshly-mutated session. Null unless the Labrador's
    // cookie game owns the input, so this line alone hides the tray when a safety/grief turn ends the
    // game, when all twelve are eaten (the engine clears activeGame), or on any transfer away.
    setFeedFed(session.activeGame === 'feedcookie' && session.game ? [...session.game.fed] : null);
    setArmedRed(null);
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

    // Task 78: the visual tricks. play_dead just blacks the image out (no bubble; the black image is
    // the answer) until the next submit. roll_over rolls the image over then lands on ':)'; under
    // reduced motion the rotation is skipped and only the ':)' end state shows. Both are instant.
    if (result.resolution.action === 'play_dead') {
      setMessages((m) => [...m, userMsg]);
      setDead(true);
      setAnnounce('the Collie plays dead');
      return;
    }
    if (result.resolution.action === 'roll_over') {
      const rollMsg: Message = { id: idRef.current++, who: 'dog', text: ':)', display: ':)', done: true, dog: toDog, name: dogInfo(toDog).name };
      setMessages((m) => [...m, userMsg, rollMsg]);
      if (!reducedMotion) setRoll(true);
      setAnnounce('the Collie rolls over');
      return;
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
      fetchGame: result.resolution.action === 'random_link',
      gameOutput: r.gameOutput,
      media: r.media,
    };
    setDog(toDog);
    setMessages((m) => [...m, userMsg, dogMsg]);

    // Task 123: the in-chat game qualifies as a Hidden Games find the moment its opening surface is
    // served (game_start carries the board / masked word / drawing in gameOutput), before any move.
    if (result.resolution.action === 'game_start' && result.resolution.game) {
      reportHiddenGame(HIDDEN_GAME_ID[result.resolution.game]);
    }
    // Task 135: fetch is a hidden game too. It has no game state, so it reports
    // on the turn that throws the link rather than on a game_start.
    if (result.resolution.action === 'random_link') {
      reportHiddenGame('G06');
    }

    // Bark-game break / fetch / the cookie give-up: the main lands instantly, then a follow-up message.
    // Task 152 section 2: the follow-up now flows through the general sequence player, so it inherits the
    // abandon rule, the stop-on-navigation and the protected guard. Phase stays 'idle' during the gap so a
    // reply in that window wins immediately (abandons the follow-up) rather than queuing behind it.
    if (r.followUp) {
      const followUp = r.followUp;
      setMsg(dogMsg.id, { display: r.text, typing: false, done: true });
      setAnnounce(r.text);
      setPhase('idle');
      window.setTimeout(() => inputRef.current?.focus(), 0);
      playSequence([followUp], toDog, reducedMotion ? 0 : 500);
      return;
    }

    performTheatre(dogMsg.id, r.text, toDog, result.resolution.action, r.closed);
  }, [input, phase, runSwap, after, clearTimers, reducedMotion, performTheatre, setMsg, pathname, playSequence, abandonSequence]);

  // Task 152 section 2: stop a consecutive-message sequence on navigation. If the visitor leaves the
  // page, the remaining messages do not fire. Guarded on an active sequence so ordinary theatre in
  // progress on other pages is untouched.
  useEffect(() => {
    if (seqRef.current) abandonSequence();
  }, [pathname, abandonSequence]);

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

  // Task 149: feeding a cookie. Blue pills feed him on the first tap. Red pills warn first: the first
  // tap opens the "we dont use this" tooltip WITHOUT feeding (tap matters more than hover), and a
  // second tap on the same red pill then feeds him -- he eats everything, red ones just taste wrong.
  // A tap anywhere else dismisses the tooltip (the effect below), so a warning is never fed by accident.
  const feedPill = useCallback((c: CookiePill) => {
    if (c.red && armedRed !== c.id) {
      setArmedRed(c.id);
      return;
    }
    setArmedRed(null);
    send(c.id);
  }, [armedRed, send]);

  // Task 149: "next tap anywhere dismisses" -- while a red tooltip is open, any pointer down that is not
  // on that same pill closes it. Capture phase so it runs before the pill's own click (a second tap on
  // the armed pill is left alone here and feeds via feedPill).
  useEffect(() => {
    if (armedRed === null) return;
    const dismiss = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest?.(`[data-cookie="${armedRed}"]`)) setArmedRed(null);
    };
    document.addEventListener('pointerdown', dismiss, true);
    return () => document.removeEventListener('pointerdown', dismiss, true);
  }, [armedRed]);

  // Task 149: the tray of cookies still to feed him. Rendered only while his cookie game owns the input
  // (feedFed is non-null) and he is not playing dead. Each pill keeps its shape by original index, so a
  // pill does not change shape as its neighbours are eaten. Red pills are tinted red and carry the
  // tooltip; blue pills help a site work and carry none.
  const trayEl = feedFed !== null && !dead ? (
    <div className={styles.cookieTray} role="group" aria-label="Cookies to feed him">
      {FEED_COOKIES.map((c, idx) =>
        feedFed.includes(c.id) ? null : (
          <span key={c.id} className={styles.cookiePillWrap}>
            <button
              type="button"
              data-cookie={c.id}
              className={`${styles.cookiePill} ${c.red ? styles.cookieRed : styles.cookieBlue} ${styles[`cookieShape${idx % 5}`]}`}
              aria-label={c.red ? `${c.label} cookie. ${RED_TOOLTIP}` : `${c.label} cookie`}
              onClick={() => feedPill(c)}
            >
              {c.label}
            </button>
            {/* Red-only tip: shown on hover (CSS) and, more importantly, on tap (the open class). The
                button's aria-label already carries the same words, so screen readers get it either way. */}
            {c.red && (
              <span className={`${styles.cookieTip} ${armedRed === c.id ? styles.cookieTipOpen : ''}`} aria-hidden="true">
                {RED_TOOLTIP}
              </span>
            )}
          </span>
        )
      )}
    </div>
  ) : null;

  // Task 129: the thread and composer render in two homes -- the >480px
  // column-under-the-dog plus fixed visitor bar, or the pre-129 stacked panel
  // at mobile widths -- so both are built once here. Only one home mounts at
  // a time, so the shared refs stay unique.
  const threadEl = (
    /* Tap anywhere in the thread to complete an in-progress performance. */
    <div className={styles.thread} ref={threadRef} onClick={completeTheatre}>
      <div className={styles.threadInner}>
        {messages.map((msg) =>
          msg.who === 'user' ? (
            <div key={msg.id} className={`${styles.msgRow} ${styles.rowUser}`}>
              <div className={styles.bubbleUser}>{msg.text}</div>
            </div>
          ) : (
            <div key={msg.id} className={`${styles.msgRow} ${styles.rowDog}`}>
              {/* Task 132: no per-bubble avatar or nameplate -- the dog's face
                  and name live once, on the medallion at the top of the
                  column. A visually hidden speaker label keeps each bubble
                  attributed for screen readers. */}
              <div className={styles.bubbleDog}>
                {/* S12: the support surface keeps its VISIBLE header -- it is
                    the safety surface's label, not name repetition. */}
                {msg.support ? (
                  <div className={styles.supportPlate}>{msg.name}</div>
                ) : (
                  msg.name && <span className={styles.srOnly}>{msg.name} says</span>
                )}
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

                {/* Task 115: the game board / sheep tiles / drawing. MONOSPACE + pre so the ASCII
                    keeps its shape (a proportional font collapses it). Not typed; it appears whole. */}
                {/* Task 152 section 3: hold the clip until the typing theatre has finished, so it lands
                    WITH the completed message rather than before the text. INSTANT messages (safety,
                    games) are `done` at once, so their clip still appears immediately. */}
                {msg.done && msg.media && (() => {
                  // Task 149: honour prefers-reduced-motion for the COOKIE-GAME clips only -- they are
                  // decoration (a reaction to a feed), so a reduced-motion visitor gets controls instead
                  // of autoplay. Every other clip (how-are-you, paw, good boy, ...) is CONTENT: it is the
                  // whole answer, so it must still autoplay or the visitor would get nothing. A still
                  // frame for those is its own task.
                  const decorative = msg.media.src.startsWith('/chat-media/cookie-');
                  const hold = reducedMotion && decorative;
                  return (
                    <video
                      className={styles.bubbleMedia}
                      src={msg.media.src}
                      aria-label={msg.media.alt}
                      autoPlay={!hold}
                      controls={hold}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  );
                })()}
                {msg.gameOutput && (
                  <pre className={styles.gameOutput}>{msg.gameOutput}</pre>
                )}

                {msg.done && msg.action && (
                  <div className={styles.actionWrap}>
                    <ActionLink command={msg.action} onNavigate={msg.fetchGame ? undefined : () => setMinimised(true)} />
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {/* Task 149: the cookie tray sits at the foot of the thread, under his latest line. */}
        {trayEl}
      </div>
    </div>
  );
  const composerEl = (
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
  );
  // Task 105: clicking the now-usable page blurs the input; when the visitor
  // clicks back into a non-interactive part of the chat, keep focus in the
  // input (else Task 82's fix is undone).
  const keepFocus = (e: { target: unknown; preventDefault: () => void }) => {
    const t = e.target as HTMLElement;
    if (!t.closest('button, a, input, textarea, [tabindex]')) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  return (
    <div className={styles.root} role="dialog" aria-label="Pick a Chum" aria-modal="false">
      {/* Task 105: the wash dims but no longer captures clicks (pointer-events via .wash/.root), so the
          page beneath stays usable; it no longer closes on click (X and Escape still close). */}
      <div className={styles.wash} />

      {(phase === 'selecting' || (wide && !minimised)) && (
        <div className={styles.selectorWrap}>
          <div className={styles.selector}>
            {phase === 'selecting' && (
              <svg className={styles.connectors} viewBox="0 0 440 440" aria-hidden="true" focusable="false">
                {/* Task 113 + 121: each radial starts at the icon's circular-body edge (ARC_BODY_R from
                    the anchor centre) and runs to its dog's centre. Both ends derive from the arc, so
                    the lines always track the dogs. viewBox is square (440), overflow visible, so a dog
                    that fans past its edge still gets its line drawn. */}
                {SELECT_ORDER.map((_d, i) => {
                  const s = lineStart(i);
                  const c = dogCentre(i);
                  return (
                    <line
                      key={i}
                      className={styles.connectorLine}
                      style={{ animationDelay: `${0.15 + i * 0.3}s` }}
                      x1={round1(s.x)}
                      y1={round1(s.y)}
                      x2={round1(c.x)}
                      y2={round1(c.y)}
                    />
                  );
                })}
              </svg>
            )}
            {SELECT_ORDER.map((d, i) => {
              const info = dogInfo(d);
              const p = dogPos(i);
              // Task 129: after a pick the fan STAYS. The chosen dog becomes the
              // conversation anchor IN PLACE (she never moves); the medallion
              // markup is reused wholesale so play dead, roll over and the
              // handover pops all still ride on her.
              if (phase !== 'selecting' && d === dog) {
                return (
                  <div
                    key={d}
                    ref={fanAnchorRef}
                    className={`${styles.dogAnchor} ${styles.anchorFan} ${anchorSwap}`}
                    style={{ left: `${round1(p.left + dragOffset.dx)}px`, top: `${round1(p.top + dragOffset.dy)}px` }}
                    role="img"
                    aria-label={dead ? 'the Collie plays dead' : roll ? 'the Collie rolls over' : dogInfo(dog).name}
                  >
                    {/* Task 78 fix: the tricks apply to the dog image layer ONLY, so the red X and the
                        ring do not go black or rotate with her. */}
                    <div
                      className={`${styles.dogFace} ${dead ? styles.anchorDead : ''} ${roll ? styles.anchorRoll : ''}`}
                      style={{ backgroundImage: `url("${PROFILE_IMG[dog]}")` }}
                      onAnimationEnd={() => setRoll(false)}
                    />
                    <button type="button" className={styles.close} aria-label="Close Pick a Chum" onClick={onClose}>
                      <img src="/red-icon.svg" alt="" aria-hidden="true" />
                    </button>
                    {/* Task 130: minimise to a corner chip; restore brings the
                        conversation back exactly as it was. */}
                    <button type="button" className={styles.minimise} aria-label="Minimise the chat" onClick={() => setMinimised(true)}>
                      <span aria-hidden="true" />
                    </button>
                    {/* Task 132: the dog's name, once, beside her medallion.
                        Reads the active dog, so a switch renames it. */}
                    <div className={styles.anchorName} aria-hidden="true">{nameLines(dogInfo(dog).name)}</div>
                    {/* Owner review: the move handle rides the medallion,
                        centred on her bottom rim; dragging moves the whole
                        dog-and-chat unit. */}
                    <button
                      type="button"
                      className={`${styles.dragHandle}${dragging ? ` ${styles.dragHandleActive}` : ''}`}
                      aria-label="Move the chat"
                      title="Move the chat"
                      onPointerDown={startColumnDrag}
                    >
                      {/* The standard four-arrow move glyph, inline (no asset). */}
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                          d="M12 2l3 3h-2v5h5V8l3 3-3 3v-2h-5v5h2l-3 3-3-3h2v-5H6v2l-3-3 3-3v2h5V5H9l3-3z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
                );
              }
              // Task 130 (owner ruling, reversing 129): the other three
              // disappear completely on a pick. They were visual noise over a
              // busy page, and switching started a fresh conversation anyway;
              // closing with the X and reopening the launcher is the way back
              // to the fan.
              if (phase !== 'selecting') return null;
              return (
                <button
                  key={d}
                  type="button"
                  className={styles.dogBtn}
                  onClick={() => selectDog(d)}
                  title={info.name}
                  aria-label={info.name}
                  style={{ backgroundImage: `url("${PROFILE_IMG[d]}")`, left: `${round1(p.left)}px`, top: `${round1(p.top)}px`, animationDelay: `${0.15 + i * 0.3}s` }}
                />
              );
            })}
            {phase === 'selecting' && (
              <>
                <button
                  type="button"
                  className={styles.randomBtn}
                  onClick={() => selectDog(SELECT_ORDER[Math.floor(Math.random() * SELECT_ORDER.length)])}
                  aria-label="Pick for me"
                  title="Pick for me"
                >
                  <PickAChumIcon />
                </button>
                {/* Task 126: the selector's close control -- a readable red X on the centre icon's
                    top-right, closing the selector back to the closed launcher (same onClose as the
                    chat medallion X). */}
                <button type="button" className={styles.selectorClose} aria-label="Close Pick a Chum" onClick={onClose}>
                  <img src="/red-icon.svg" alt="" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Task 129 (>480px): the conversation hangs in a column beneath the
          chosen dog, and the input is the visitor's own, fixed at the bottom
          centre of the viewport, attached to no dog. */}
      {phase !== 'selecting' && wide && !minimised && (
        <>
          <div
            className={styles.chatColumn}
            style={colBox ? { left: `${Math.round(colBox.left)}px`, top: `${Math.round(colBox.top)}px`, bottom: `${Math.round(colBox.bottom)}px` } : undefined}
            onMouseDown={keepFocus}
          >
            {threadEl}
          </div>
          <div className={styles.visitorBar} onMouseDown={keepFocus}>
            {composerEl}
          </div>
        </>
      )}
      {/* Owner review: while minimised the dog persists at her full size,
          parked TOP LEFT, with none of the chat showing. Her face restores
          the conversation; the X still closes. The scrim and the offer card
          hide via body[data-pc-min] as before. */}
      {phase !== 'selecting' && minimised && (
        <div className={styles.miniDock}>
          <button
            type="button"
            className={`${styles.miniFace} ${(auto && !revealedRef.current) || spoke ? styles.miniAuto : ''}`}
            aria-label={`Reopen the chat with the ${dogInfo(dog).name}`}
            title={`Reopen the chat with the ${dogInfo(dog).name}`}
            style={{ backgroundImage: `url("${PROFILE_IMG[dog]}")` }}
            onClick={() => {
              setMinimised(false);
              setSpoke(false); // Task 151: opening the chip clears the "he said something" pulse
              window.setTimeout(() => inputRef.current?.focus(), 60); // Task 82
            }}
          />
          <button type="button" className={styles.close} aria-label="Close Pick a Chum" onClick={onClose}>
            <img src="/red-icon.svg" alt="" aria-hidden="true" />
          </button>
          <div className={styles.anchorName} aria-hidden="true">{nameLines(dogInfo(dog).name)}</div>
        </div>
      )}
      {/* Screen-reader announcements stay mounted through minimise, so a
          reply that lands while collapsed is still announced once. */}
      {phase !== 'selecting' && wide && (
        <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
          {announce}
        </div>
      )}

      {phase !== 'selecting' && !wide && !minimised && (
        <div className={styles.panel} onMouseDown={keepFocus}>
          {/* The pre-129 stacked layout, kept verbatim for mobile until Task 120. */}
          {threadEl}
          {/* Screen-reader announcements: each dog message once, whole, when done. */}
          <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
            {announce}
          </div>

          <div className={styles.composerRow}>
            <div
              className={`${styles.dogAnchor} ${anchorSwap}`}
              role="img"
              aria-label={dead ? 'the Collie plays dead' : roll ? 'the Collie rolls over' : dogInfo(dog).name}
            >
              {/* Task 78 fix: the tricks apply to the dog image layer ONLY, so the red X and the ring
                  do not go black or rotate with her. */}
              <div
                className={`${styles.dogFace} ${dead ? styles.anchorDead : ''} ${roll ? styles.anchorRoll : ''}`}
                // Task 111: the anchor uses the same -img2 profile photo as the dog's messages, so they match.
                style={{ backgroundImage: `url("${PROFILE_IMG[dog]}")` }}
                onAnimationEnd={() => setRoll(false)}
              />
              <button type="button" className={styles.close} aria-label="Close Pick a Chum" onClick={onClose}>
                <img src="/red-icon.svg" alt="" aria-hidden="true" />
              </button>
              {/* Task 130 on mobile: the desktop medallion block is gated on
                  `wide`, so the minimise never rendered here. Same control,
                  same state. */}
              <button type="button" className={styles.minimise} aria-label="Minimise the chat" onClick={() => setMinimised(true)}>
                <span aria-hidden="true" />
              </button>
              {/* Task 132: the name once, on the medallion (mobile too). */}
              <div className={styles.anchorName} aria-hidden="true">{nameLines(dogInfo(dog).name)}</div>
            </div>
            {composerEl}
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

function ActionLink({ command, onNavigate }: { command: Command; onNavigate?: () => void }) {
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
      <Link href={command.href} className={cls} onClick={onNavigate}>
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
