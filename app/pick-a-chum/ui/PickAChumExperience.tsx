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

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './PickAChum.module.css';
import PickAChumIcon from './PickAChumIcon';
import { CHUM_DATA } from '../lib/data';
import { submit, isSensitiveInput, Turn } from '../lib/engine';
import { newSession, Session } from '../lib/session';
import { Dog, GameId } from '../lib/types';
import { reportHiddenGame, reportHat } from '../../../lib/hiddenGames/browserEngine';
import { chatHatFor, BIRTHDAY_HAT_ID, KENNEL_SKETCH_HAT_ID } from '../../../lib/hiddenGames/hatHunt';
import type { GameId as HiddenGameId } from '../../../lib/hiddenGames/registry';
import { openDiscountPopup } from '../data/discount-popup';
import { FEED_COOKIES, RED_TOOLTIP, CookiePill } from '../data/feed-cookie';
import { applyBoxerEffect, resetBoxerEffects } from '../lib/boxerEffects';
import { BOXER_BUTTONS, BoxerButton } from '../data/boxer-button-game';
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
  plainSurface?: boolean; // Task 156: a safety/grief response -- keep the neutral bubble, never a dog's playful colour
  typing?: boolean; // thinking dots are showing
  display?: string; // text revealed so far (typing theatre)
  done?: boolean; // performance finished (show the action link, allow the next)
  contextualLink?: boolean; // a contextual link allowed mid-chat (breed_page only)
  fetchGame?: boolean; // Task 135: the fetch game's link keeps the chat open so 'play again?' can follow
  gameOutput?: string; // Task 115: the game board / sheep tiles / drawing, rendered in a monospace block
  media?: { src: string; alt: string }; // Task 138: a short looping clip served with the line
  avatar?: boolean; // Task 165: show this dog's face beside the bubble -- a second dog cutting in (the Collie's food interjection), where the medallion stays the active dog so colour alone is too subtle a cue
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
// Task 156 (§2/§3): the tappable portrait cycles through each dog's alternate images, IN ORDER. The files
// follow the pattern `<prefix>-chat-profile-<variant>.jpg` (the Labrador's file prefix is "lab"), so no
// lookup table maps a logical name to a path -- but the AVAILABLE variants differ per dog (the Boxer has
// no scarf2, the Collie only hat1), so the set each dog cycles is listed here. Index 0 (`img2`) is the
// current default portrait, so the cycle starts where it does today.
const PROFILE_PREFIX: Record<Dog, string> = { collie: 'collie', labrador: 'lab', boxer: 'boxer', terrier: 'terrier' };
const PROFILE_CYCLE: Record<Dog, string[]> = {
  collie: ['img2', 'hat1'],
  labrador: ['img2', 'hat1', 'hat2', 'scarf1', 'scarf2'],
  boxer: ['img2', 'hat1', 'hat2', 'scarf1'],
  terrier: ['img2', 'hat1', 'hat2', 'scarf1', 'scarf2'],
};
function portraitSrc(dog: Dog, idx: number): string {
  const list = PROFILE_CYCLE[dog];
  return `/${PROFILE_PREFIX[dog]}-chat-profile-${list[((idx % list.length) + list.length) % list.length]}.jpg`;
}

// Task 123: each in-chat game is a Hidden Games find, awarded the moment its opening surface (the
// board / masked word / drawing) is SERVED -- i.e. on game_start, before any move or guess. The bark
// game is deliberately NOT here: a single "woof" is a turn, not finding a game.
const HIDDEN_GAME_ID: Record<GameId, HiddenGameId> = { ninesquare: 'G03', missingsheep: 'G04', kennelsketch: 'G05', treattrail: 'G07', missingbiscuit: 'G08', feedcookie: 'G09', buttonpanel: 'G11' };
// Task 164: the one FIX IT / repair button (effect null), reused by the panel and the emergency reset.
const BOXER_FIX = BOXER_BUTTONS.find((b) => b.effect === null) as BoxerButton;
// Task 156 (§4): which Kennel Sketch drawing carries the hidden hat -- the KENNEL sketch, index 5 (BONE,
// BALL, BOWL, LEAD, STICK, KENNEL, ...). Reached by playing, so the hat is not free with the game find.
const KENNEL_HAT_SKETCH_INDEX = 9;

// Task 148: an unbidden Terrier appearance. When passed (and there is no restored chat), the
// experience mounts with the Terrier already chosen and MINIMISED, seeded with his `offer` line; on
// the first open (engage), his `reveal` (the page's extended bio, or a game hint) is appended.
// Task 152/153: an appearance may carry a SEQUENCE -- `offer` is the first message (the chip line), and
// `followUps` are the extras that arrive whole, spaced by `gapMs` (playSequence). `chums` marks the one
// dynamic case (the Collie naming three random breeds on /know-your-chums): the lines are generated in
// the experience so the lightweight launcher never pulls the breed data.
export type AutoAppear = { dog: Dog; offer: string; reveal: string; route: string; followUps?: string[]; gapMs?: number; chums?: boolean };

// Task 156: safety and grief responses keep the neutral bubble, never a dog's playful fill. safeguarding
// already hides the dog identity (support); grief, the health boundary, the anatomy redirect and the bare-
// help clarifier are the rest of the "this is help, not chat" surface.
const NEUTRAL_SURFACE = new Set(['grief', 'health_answer', 'anatomy_redirect', 'clarifier', 'safety_signpost', 'safety_boundary']);
// Task 156 (§7): per-dog dialogue-bubble fills -- another signal of who you are talking to. The class sets
// the bubble background and its text colour (module CSS). Labrador yellow/black, Collie navy/white, Terrier
// light blue/black, Boxer light orange/dark blue. Applied to normal messages only.
const BUBBLE_CLASS: Record<Dog, string> = { labrador: 'bubbleLabrador', collie: 'bubbleCollie', terrier: 'bubbleTerrier', boxer: 'bubbleBoxer' };

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

export default function PickAChumExperience({ onClose, autoAppear, pickupRoute, terrierSay }: { onClose: () => void; autoAppear?: AutoAppear; pickupRoute?: string | null; terrierSay?: string | null }) {
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
  // Task 168: the receded dogs (the three non-active) sit stacked beside the medallion while a chat is
  // open, each an arrow to switch to it. `activeReceded` is the one being pointed at: on a hover-capable
  // device it is set on hover (and a click switches straight away); on touch the FIRST tap sets it (grey
  // the active dog, keep this one's arrow) and a SECOND tap on the same dog commits -- mirrors the red
  // cookie pills. `canHover` decides which. Null when nothing is pointed at.
  const [activeReceded, setActiveReceded] = useState<Dog | null>(null);
  const [canHover, setCanHover] = useState(true);
  // Task 164: the Boxer's DO NOT PRESS THAT BUTTON panel. `boxer` mirrors the game state into React (like
  // feedFed): null hides the panel (and, going null, resets every effect), an object shows the panel with
  // the currently-live effect class or null. On a RESTORE after refresh/navigation it starts with no effect
  // (brief section 8: a clean page after refresh), even if the game itself is still active.
  const [boxer, setBoxer] = useState<{ effect: string | null } | null>(
    restored?.session?.activeGame === 'buttonpanel' ? { effect: null } : null
  );
  const boxerEffect = boxer?.effect ?? null;
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
  // Task 159: a live pathname ref + a stable meta-logger, so a link-follow or a hat-find can be recorded
  // from anywhere (a callback, JSX) with the CURRENT route and no stale closure. `line` holds the target
  // href (link) or the hat id. protectedState is passed so a protected session records none of these.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const logMeta = useCallback((trigger: string, line: string, sync = false) => {
    if (!line) return;
    const session = sessionRef.current;
    // sync=true for an EXTERNAL link: the page unloads before an async IndexedDB write could land, so it is
    // captured synchronously to localStorage instead (see DevRecorder / recordPendingSync).
    emitTurn({ sessionId: recSessionRef.current, turn: session?.submissionCount ?? 0, activeDog: session?.activeDog ?? 'collie', input: '', line, route: pathnameRef.current ?? '', protectedState: session?.protectedState ?? null, trigger, sync });
  }, []);
  // Task 164 fix: a DELIBERATE close (the X or Escape) records a 'closed' marker, so the per-session
  // summary can tell "left" from "gave up" (endReason: closed vs abandoned). Navigating away or closing the
  // tab does NOT come through here, so it stays 'abandoned', which is the intended distinction. A protected
  // (or ever-protected) session leaves no marker -- record() drops it, and this guards as well.
  const closeChat = useCallback(() => {
    const session = sessionRef.current;
    if (session && !session.protectedState && !everProtectedRef.current) {
      emitTurn({ sessionId: recSessionRef.current, turn: session.submissionCount, activeDog: session.activeDog, input: '', line: '', route: pathnameRef.current ?? '', protectedState: null, trigger: 'closed' });
    }
    onClose();
  }, [onClose]);
  // The active typing performance, so a tap or Enter can complete it instantly.
  const playbackRef = useRef<{ id: number; plan: TypingPlan; closed?: boolean; done: boolean } | null>(null);
  // Task 152: the in-flight consecutive-message sequence (a dog sending two or three in a row), or null.
  // Its token guards the abandon rule: the visitor typing, navigation, or a protected state all set
  // `aborted` and drop it, so the remaining messages never fire. Task 169: `monologue` marks the ONE run
  // that now lets the dog FINISH -- the opened auto-appearance beat -- so send() queues a reply typed over
  // it instead of abandoning it; reply follow-ups leave it unset and keep the old abandon-on-type behaviour.
  const seqRef = useRef<{ aborted: boolean; monologue?: boolean } | null>(null);
  // Task 169: bumped when a sequence FINISHES naturally, so the type-ahead drain (which otherwise only wakes
  // on a phase change) runs a message queued mid-monologue -- the monologue never touches phase, it stays idle.
  const [seqDone, setSeqDone] = useState(0);

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
  // Task 162 (reopen-from-chip): once a chat has been minimised (or arrived minimised, as auto-appearances do) it is
  // DOCKED to the corner -- reopening expands from the chip's corner, not the dog's fan-arc position, so the
  // dog never leaps across the screen. Sticky: it stays corner-anchored (dragging moves it, minimising
  // returns it to the corner). A fresh selector pick starts undocked (the dog stays where it was chosen).
  const [docked, setDocked] = useState<boolean>(restored ? !!restored.minimised : auto ? true : false);
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
    emitTurn({ sessionId: recSessionRef.current, turn: session.submissionCount, activeDog: 'labrador', input: '', line: LAB_HOTDOG_PICKUP, route: pathname ?? '', gameActive: session.activeGame ?? null, protectedState: session.protectedState ?? null, trigger: 'listener' }); // Task 159: the /hot-dogs listener
    if (minimised) setSpoke(true);
  }, [pickupRoute, minimised]);
  // Task 156 (§8): the Terrier's hat-hunt countdown lands IN THE OPEN CHAT (not a toast) -- he speaks it
  // unprompted, becoming the active dog, and pulses the chip so it is noticed. Same pattern as the
  // Labrador's thread pickup. Never into a protected session (double-guarded: the launcher checks
  // pc-protected before passing a line, and reportHat itself is suppressed there, so no line arrives).
  const terrierSaidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!terrierSay || terrierSaidRef.current === terrierSay) return;
    const session = sessionRef.current;
    if (!session || session.protectedState || everProtectedRef.current) return;
    terrierSaidRef.current = terrierSay;
    session.activeDog = 'terrier';
    if (!session.previousDogs.includes('terrier')) session.previousDogs.push('terrier');
    setDog('terrier');
    setMessages((m) => [...m, { id: idRef.current++, who: 'dog', text: terrierSay, dog: 'terrier', name: dogInfo('terrier').name, display: terrierSay, done: true, plainSurface: false }]);
    setAnnounce(terrierSay);
    emitTurn({ sessionId: recSessionRef.current, turn: session.submissionCount, activeDog: 'terrier', input: '', line: terrierSay, route: pathname ?? '', gameActive: session.activeGame ?? null, protectedState: session.protectedState ?? null, trigger: 'appearance' }); // Task 159: the hat countdown
    if (minimised) setSpoke(true);
  }, [terrierSay, minimised]);
  // Task 159 (recorder v2, stage 2): log an unbidden appearance's chip line so the `trigger` column tells
  // it from a reply. Suppressed appearances never reach here. The chums case (no static offer) logs in its
  // seed effect; the /hot-dogs pickup and the Terrier hat line log in their effects above.
  const appearLoggedRef = useRef(false);
  useEffect(() => {
    if (!auto || appearLoggedRef.current || !auto.offer) return;
    appearLoggedRef.current = true;
    emitTurn({ sessionId: recSessionRef.current, turn: sessionRef.current?.submissionCount ?? 0, activeDog: auto.dog, input: '', line: auto.offer, route: pathname ?? '', gameActive: sessionRef.current?.activeGame ?? null, protectedState: sessionRef.current?.protectedState ?? null, trigger: 'appearance' });
  }, [auto]);
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

  // Task 164: drive the page from the Boxer game state. A fresh `boxer` object each turn re-runs this, so
  // applyBoxerEffect (which resets the previous effect first) keeps exactly one effect live; going null
  // (game ended, transfer away, safety) resets the page. This is the ONLY place the game paints the site.
  useEffect(() => {
    if (boxer?.effect) applyBoxerEffect(boxer.effect);
    else resetBoxerEffects();
  }, [boxer]);

  // Task 164 section 2.1: a client-side route change does NOT unload the page, so pagehide never fires and
  // an effect would follow the visitor from one page to the next. Reset on every navigation. Unconditional
  // (the Task 152 sequence abandon just above is guarded; this must run whether or not a sequence is live).
  useEffect(() => {
    resetBoxerEffects();
  }, [pathname]);

  // Task 164 section 2.2: the reset lives in the dog interface, which shrinks to a chip on minimise. Chosen
  // behaviour: MINIMISING TRIGGERS A RESET, so the visitor is never left with a dark site and the recovery
  // tucked into a chip. It does not survive into the chip; on restore the page is already clean, and a
  // further button press re-applies (the mirror above runs on the fresh object).
  useEffect(() => {
    if (minimised) resetBoxerEffects();
  }, [minimised]);

  // Task 164 section 8: belt-and-braces resets that the mirror cannot cover. A real page unload/refresh
  // (pagehide) and an uncaught error both strip the effects, and closing/unmounting the chat leaves the
  // page clean. Client-side navigation and minimise are handled by their own effects above.
  useEffect(() => {
    const reset = () => resetBoxerEffects();
    window.addEventListener('pagehide', reset);
    window.addEventListener('error', reset);
    return () => {
      window.removeEventListener('pagehide', reset);
      window.removeEventListener('error', reset);
      resetBoxerEffects();
    };
  }, []);

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
  // Task 162 (reopen-from-chip): where a docked (corner-anchored) dog sits -- the same spot the minimised chip uses
  // (.miniDock left/top). The fan anchor is 128px, matching the chip, so a reopen lands exactly. Keep DOCK_L in sync
  // with .miniDock's left (202px, shifted right to sit beside the logo) or the reopened chat jumps away from the chip.
  const DOCK_L = 202;
  const DOCK_T = 18;
  // Owner review: the chat reaches the TOP of the window, so a long history
  // slides off the window edge rather than vanishing at an invisible line.
  const COL_TOP_CLEAR = 8;
  // Owner review: once chatting, the visitor can pick the chat up and move
  // it. The offset shifts the column's anchor point (its bottom edge, where
  // the newest message sits): placed low, the window above is tall and shows
  // more messages; placed high, it shows fewer. Task 171: it PERSISTS across a dog change (switch or handover)
  // so the chat stays exactly where the visitor left it; only minimise resets it (to return to the corner).
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [dragging, setDragging] = useState(false); // grows the handle while moving
  // Minimise: collapse to the chip AND dock to the corner, resetting any drag so a reopen returns to the
  // corner (not the last-dragged spot). Shared by the desktop and mobile minimise controls.
  const minimise = useCallback(() => {
    setMinimised(true);
    setDocked(true);
    setDragOffset({ dx: 0, dy: 0 });
  }, []);
  // Task 156 (§3): which alternate portrait each dog is showing, in cycle order. Component state, so it
  // STICKS for the session but RESETS on reload (consistent with everything else being stateless); the
  // hats it uncovers persist separately in the Hidden Games record.
  const [profileIdx, setProfileIdx] = useState<Record<Dog, number>>({ collie: 0, labrador: 0, boxer: 0, terrier: 0 });
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
  // Task 156 (§3): the WHOLE portrait is now the draggable surface AND the tap-to-cycle surface, told
  // apart by MOVEMENT. Press and release without moving past the threshold -> the next profile image (on
  // RELEASE, so a drag never flips the image on its way out). Press and move past the threshold -> drag
  // the dog and chat, no cycle. Thresholds: 5px mouse, 10px touch (fingers wobble, a phone tap is never
  // perfectly still). The yellow handle still drags too (startColumnDrag); the close X and minimise are
  // separate elements, so they never become drag targets.
  const cyclePortrait = useCallback(() => {
    setProfileIdx((prev) => {
      const next = (prev[dog] ?? 0) + 1;
      // Task 156 (§4): revealing a HAT portrait finds that hat. reportHat carries the protected guard
      // itself; the extra check here stops it the instant a disclosure lands, before the flag is written.
      const list = PROFILE_CYCLE[dog];
      const variant = list[((next % list.length) + list.length) % list.length];
      const hat = chatHatFor(dog, variant);
      if (hat && !sessionRef.current?.protectedState && !everProtectedRef.current) { reportHat(hat.id); logMeta('hat', hat.id); }
      return { ...prev, [dog]: next };
    });
  }, [dog]);
  const startPortrait = useCallback((e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const sx = e.clientX;
    const sy = e.clientY;
    const start = { ...dragOffsetRef.current };
    const threshold = e.pointerType === 'touch' ? 10 : 5;
    let moved = false;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > threshold) {
        moved = true;
        setDragging(true);
      }
      if (moved) {
        dragOffsetRef.current = { dx: start.dx + dx, dy: start.dy + dy };
        setDragOffset(dragOffsetRef.current);
      }
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      if (moved) setDragging(false);
      else cyclePortrait(); // a tap (never passed the threshold): cycle on release, silently
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }, [cyclePortrait]);
  const dragOffsetRef = useRef(dragOffset);
  useEffect(() => { dragOffsetRef.current = dragOffset; }, [dragOffset]);

  // Task 170: the scrim FOLLOWS the dog (it is a single gradient box moved by transform, see .scrim CSS). Its
  // centre is the dog medallion's viewport centre, MEASURED only when a layout-affecting state settles (a
  // switch, dock/undock, restore, resize) -- never per drag frame, which would thrash layout and judder. Once
  // measured we store the centre AND the drag offset it was read at; during a drag the live centre is that
  // base plus (current drag - base drag), so the box moves by transform alone with no re-measure. Null while
  // selecting or minimised (no single medallion): the scrim then falls back to the origin, reproducing the
  // old top-left glow (and it is hidden outright while minimised via body[data-pc-min]).
  const [scrimBase, setScrimBase] = useState<{ cx: number; cy: number; dx: number; dy: number } | null>(null);
  useLayoutEffect(() => {
    const el = fanAnchorRef.current;
    if (phase === 'selecting' || minimised || !el) { setScrimBase(null); return; }
    const r = el.getBoundingClientRect();
    setScrimBase({ cx: r.left + r.width / 2, cy: r.top + r.height / 2, dx: dragOffsetRef.current.dx, dy: dragOffsetRef.current.dy });
    // dragOffset is deliberately NOT a dep: the delta below tracks it without a re-measure.
  }, [phase, dog, docked, minimised, vw]);
  const scrimX = scrimBase ? scrimBase.cx + (dragOffset.dx - scrimBase.dx) : 0;
  const scrimY = scrimBase ? scrimBase.cy + (dragOffset.dy - scrimBase.dy) : 0;
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
    (lines: string[], seqDog: Dog, gapMs: number, showAvatar = false, media?: { src: string; alt: string }, monologue = false) => {
      const items = lines.filter((l) => l && l.trim()).slice(0, SEQ_MAX_EXTRAS);
      if (!items.length) return;
      const s = sessionRef.current;
      // Never BEGIN a sequence in a protected session: a child who disclosed something must not have a
      // dog carry on with more messages.
      if (!s || s.protectedState || everProtectedRef.current) return;
      const token = { aborted: false, monologue };
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
        // Task 166: the media rides ONLY the last line of the run (a red cookie's clip on its single
        // follow-up line), so a multi-line sequence never repeats the clip.
        const withMedia = media && i === items.length - 1 ? media : undefined;
        setMessages((m) => [...m, { id: idRef.current++, who: 'dog', text: line, display: line, done: true, dog: seqDog, name: dogInfo(seqDog).name, avatar: showAvatar, media: withMedia }]);
        setAnnounce(line);
        if (i + 1 < items.length) {
          after(gapMs, () => play(i + 1));
        } else {
          seqRef.current = null; // the run is complete
          setSeqDone((t) => t + 1); // Task 169: wake the drain -- a reply queued during the run waits on this
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

  // Task 160: an UNPROMPTED appearance serves ONE message -- the seeded chip line -- and only continues to
  // its extras once the visitor INTERACTS (opens the chip: `minimised` flips to false). No monologue at
  // someone who has not replied; it waits. (Typing instead routes through send(), which abandons the run
  // and gives a real reply -- Task 152.) This reverses Task 153's auto-play: the beat now lands AFTER the
  // open. REPLY sequences (the interjection and followUps in send()) are unaffected -- they only ever run
  // while the chat is open. The extras keep the Task 152 guards (abandon on type / navigation / protected)
  // via playSequence, and once opened the rest arrive as a run (see the report on run-vs-one-per-turn).
  const seqStartedRef = useRef(false);
  const chumLinesRef = useRef<string[] | null>(null);
  // The dynamic /know-your-chums (`chums`) case has no seeded offer, so its FIRST line is the unprompted
  // chip message and is injected here at mount; its rest wait for the open like every other appearance.
  useEffect(() => {
    if (!auto || !auto.chums || chumLinesRef.current) return;
    const lines = collieChumLines();
    chumLinesRef.current = lines;
    if (!lines.length) return;
    setMessages((m) => [...m, { id: idRef.current++, who: 'dog', text: lines[0], display: lines[0], done: true, dog: auto.dog, name: dogInfo(auto.dog).name }]);
    setAnnounce(lines[0]);
    emitTurn({ sessionId: recSessionRef.current, turn: sessionRef.current?.submissionCount ?? 0, activeDog: auto.dog, input: '', line: lines[0], route: pathname ?? '', gameActive: sessionRef.current?.activeGame ?? null, protectedState: sessionRef.current?.protectedState ?? null, trigger: 'appearance' }); // Task 159
  }, [auto]);
  useEffect(() => {
    if (!auto || seqStartedRef.current || minimised) return; // Task 160: hold the extras until the chip is opened
    const extras = auto.chums ? (chumLinesRef.current ?? []).slice(1) : auto.followUps ?? [];
    if (!extras.length) return;
    seqStartedRef.current = true;
    // Task 169: the beat lands 2s after the visitor opens the chip (was 2.5s), and marks the run a `monologue`
    // so a reply typed over it QUEUES rather than cutting it short -- the dog finishes, then the reply is answered.
    // ONLY the fast followUps run (2s beats, at most 4s total) queues. The know-your-chums Collie names breeds
    // on 20s gaps: making a reply wait up to 40s behind that would be worse than abandoning, so it keeps the
    // old abandon-on-type (the visitor's reply wins at once).
    playSequence(extras, auto.dog, auto.gapMs ?? (auto.chums ? 20000 : 2000), false, undefined, !auto.chums);
  }, [auto, minimised, playSequence]);

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

  // Task 168 (point 3): the medallion's position belongs to the CHAT, not to the dog. It is FROZEN when the
  // chat opens -- the fan slot of the FIRST dog picked (or the restored/auto dog) -- and reused for every
  // dog after, so switching changes the portrait, NOT the position. Before this, the anchor used the active
  // dog's own fan slot (dogPos of its SELECT_ORDER index), so the whole cluster relocated on a switch (with
  // the Boxer active it jumped off the left edge). The fan slots are for the selector only. Same principle
  // as the Task 162 docked chip: position is the chat's, not the dog's.
  const chatAnchorRef = useRef<{ left: number; top: number } | null>(
    restored?.dog ? dogPos(SELECT_ORDER.indexOf(restored.dog)) : auto?.dog ? dogPos(SELECT_ORDER.indexOf(auto.dog)) : null
  );
  const selectDog = useCallback((d: Dog) => {
    clearTimers();
    // Task 171: a switch mid-monologue must ABANDON that run, not just cancel its timers. clearTimers stops the
    // pending messages but leaves the seqRef token live, and send()'s Task 169 guard reads a live monologue token
    // as "queue this reply" -- so without this every message to the switched-in dog queued behind a dead run and
    // never appeared. abandonSequence nulls the token; clearing the queue drops anything the old dog had parked.
    abandonSequence();
    queueRef.current = [];
    if (chatAnchorRef.current === null) chatAnchorRef.current = dogPos(SELECT_ORDER.indexOf(d)); // freeze on the FIRST pick
    // Task 171: a switch must leave the medallion EXACTLY where it is. It changes the portrait and the session,
    // nothing about position: `docked`, the frozen chatAnchorRef and dragOffset are all left untouched here (and
    // the drag offset no longer zeroes on a dog change, see below), so a docked corner chat stays in the corner
    // and a dragged one stays where it was dragged. The earlier setDocked(false) fixed the look but relocated it
    // to the fan slot, which is the very jump this removes.
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
  }, [clearTimers, abandonSequence]);

  // Task 168: hover-capable (desktop) vs touch. Decides one-click-switch vs first-tap-reveals / second-
  // tap-commits, and whether hover drives the pointed-at state. Read once on mount (SSR-safe).
  useEffect(() => {
    setCanHover(typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);
  // The three non-active dogs, in the fixed selector order (so the stack is stable across switches).
  const recededDogs = useMemo(() => SELECT_ORDER.filter((d) => d !== dog), [dog]);
  // Switch to a receded dog (a fresh conversation, selectDog). Desktop: one click. Touch: the first tap
  // arms the state (grey the active dog, keep this one's arrow, fade the others), the second tap on the
  // SAME dog commits. A tap elsewhere disarms (the effect below).
  const pressReceded = useCallback((d: Dog) => {
    if (canHover) { selectDog(d); return; }
    if (activeReceded !== d) { setActiveReceded(d); return; }
    setActiveReceded(null);
    selectDog(d);
  }, [canHover, activeReceded, selectDog]);
  // Touch only: a pointerdown that is not on a receded dog disarms the revealed state (like the cookie tip).
  useEffect(() => {
    if (activeReceded === null || canHover) return;
    const dismiss = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest?.('[data-receded]')) setActiveReceded(null);
    };
    document.addEventListener('pointerdown', dismiss, true);
    return () => document.removeEventListener('pointerdown', dismiss, true);
  }, [activeReceded, canHover]);
  // A switch (dog change) clears the pointed-at state so the new stack starts at rest.
  useEffect(() => { setActiveReceded(null); }, [dog]);

  const send = useCallback((textArg?: string) => {
    const session = sessionRef.current;
    const text = (textArg ?? input).trim();
    if (!session || !text || session.closed) return;
    setDead(false); // Task 78: any submit, whatever it is, revives the Collie (play dead lasts one turn)
    // Task 169: the OPENED auto-appearance monologue now lets the dog FINISH. A reply typed over it is QUEUED
    // (the Task 82 type-ahead queue) and answered the moment the run ends -- not thrown away. This REVERSES
    // Task 152's abandon-on-type rule for that ONE case: that rule was written when a monologue could start
    // UNBIDDEN, but since Task 160 it only plays because the visitor opened the chip, so they asked for it.
    // SENSITIVE input is the exception: a safeguarding disclosure (reaches support at once), or a grief or
    // personal-sadness line (any delay there reads as not listening), abandons the rest of the run and is
    // processed now, never queued (isSensitiveInput is a pure, non-mutating check). Reply follow-ups are NOT
    // monologues -- they keep the old abandon-on-type behaviour (a fresh reply beats a trailing quip, per the
    // phase-stays-idle note at the interjection/followUp sites). Guarded to live submits: a drained line
    // (textArg set) has no live sequence of its own to weigh.
    if (seqRef.current && seqRef.current.monologue && textArg === undefined && !isSensitiveInput(CHUM_DATA, session, text)) {
      queueRef.current.push(text);
      setInput('');
      inputRef.current?.focus();
      return; // the run finishes; the drain effect (woken by setSeqDone) answers this once seqRef clears
    }
    // Task 152 section 2: a reply over a reply-follow-up, or a disclosure over any run, drops the remaining
    // messages and processes this input now. A dog that keeps talking over you (uninvited) is a fault.
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
    // Task 169: a protected turn STOPS EVERYTHING -- drop any type-ahead queued behind a monologue so a
    // pending "tell me a joke" cannot drain on top of a live safeguarding state.
    if (session.protectedState) {
      everProtectedRef.current = true;
      queueRef.current = [];
    }
    const r = result.response;
    const toDog = session.activeDog; // submit applied any transfer in place
    const swapped = toDog !== fromDog; // the active dog actually changed
    // Task 149: refresh the cookie tray from the freshly-mutated session. Null unless the Labrador's
    // cookie game owns the input, so this line alone hides the tray when a safety/grief turn ends the
    // game, when all twelve are eaten (the engine clears activeGame), or on any transfer away.
    setFeedFed(session.activeGame === 'feedcookie' && session.game ? [...session.game.fed] : null);
    setArmedRed(null);
    // Task 164: refresh the Boxer panel from the freshly-mutated session. Null (panel hidden) unless his
    // button game owns the input, which also strips every effect the instant a safety/grief turn, a FIX IT
    // (the engine clears activeGame on ended) or a transfer away ends the game. A fresh object each turn, so
    // the mirror effect re-asserts the live effect even when the same button is pressed twice.
    setBoxer(session.activeGame === 'buttonpanel' && session.game ? { effect: session.game.effect } : null);
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
      // Task 159 (recorder v2): context off the freshly-mutated session. protectedState set means the
      // recorder logs only the became-protected marker and nothing more from this session.
      route: pathname ?? '',
      gameActive: session.activeGame ?? null,
      protectedState: session.protectedState ?? null,
      trigger: 'reply',
    });
    // Task 165: a dismissal ("go away" and its kin) is a deliberate leave -- the clearest "left" signal in
    // the whole dataset. Emit a 'closed' marker right after the reply turn (the same marker the X / Escape
    // close writes) so the session's endReason reads "closed", not "abandoned". Guarded like closeChat: a
    // protected (or ever-protected) session records nothing. The Boxer turn-20 cut-off is untouched -- it
    // records boxer_cutoff, which endReason reads as 'ceiling' (the ceiling, not the visitor leaving).
    if (result.resolution.action === 'dismiss' && !session.protectedState && !everProtectedRef.current) {
      emitTurn({ sessionId: recSessionRef.current, turn: session.submissionCount, activeDog: session.activeDog, input: '', line: '', route: pathname ?? '', protectedState: null, trigger: 'closed' });
    }
    const userMsg: Message = { id: idRef.current++, who: 'user', text };
    // Task 82: clear + keep focus only for a live submit; a queued/drained line must not wipe what
    // the visitor has since typed ahead into the box.
    if (textArg === undefined) {
      setInput('');
      inputRef.current?.focus();
    }

    // Task 78 / 165: the visual tricks. play_dead blacks the image out AND lands on a non-verbal 'x_x'
    // face bubble (Task 165: an empty bubble read as broken in live testing, so there is always a visible
    // reply now). roll_over rolls the image over then lands on ':)'; under reduced motion the rotation is
    // skipped and only the end-state face shows. Both are instant.
    if (result.resolution.action === 'play_dead') {
      const deadMsg: Message = { id: idRef.current++, who: 'dog', text: 'x_x', display: 'x_x', done: true, dog: toDog, name: dogInfo(toDog).name };
      setMessages((m) => [...m, userMsg, deadMsg]);
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
      // Task 156: safety and grief stay on the neutral bubble (never a dog's playful fill), so they read
      // as help, not chat. safeguarding already hides the dog identity; grief and the anatomy/health
      // boundaries are added here.
      plainSurface: r.hideDogIdentity || NEUTRAL_SURFACE.has(result.resolution.action),
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
    // Task 156 (§4): the Kennel Sketch hat rides the HAT drawing -- the tenth sketch (index 9), added to
    // kennel-sketches.ts for exactly this. When the game serves it (reached by playing, not on start), the
    // hat is found. reportHat is protected-guarded. The drawing is a flat cap, so the hat is really in it.
    if ((result.resolution.action === 'game_start' || result.resolution.action === 'game_move') &&
      sessionRef.current?.activeGame === 'kennelsketch' && sessionRef.current.game?.sketchIndex === KENNEL_HAT_SKETCH_INDEX &&
      !sessionRef.current.protectedState && !everProtectedRef.current) {
      reportHat(KENNEL_SKETCH_HAT_ID);
      logMeta('hat', KENNEL_SKETCH_HAT_ID);
    }

    // Bark-game break / fetch / the cookie give-up: the main lands instantly, then a follow-up message.
    // Task 152 section 2: the follow-up now flows through the general sequence player, so it inherits the
    // abandon rule, the stop-on-navigation and the protected guard. Phase stays 'idle' during the gap so a
    // reply in that window wins immediately (abandons the follow-up) rather than queuing behind it.
    // Task 161: the Collie interjects on the Labrador's dangerous-food answers. His line lands, then she
    // cuts in with ONE navy-bubble line via the sequence player. She never becomes the active dog (no
    // setDog, no transfer): the medallion stays the Labrador, and the sequence inherits the abandon and
    // protected guards. Same shape as a follow-up, but the second speaker is a different dog.
    if (r.interjection) {
      const ij = r.interjection;
      setMsg(dogMsg.id, { display: r.text, typing: false, done: true });
      setAnnounce(r.text);
      setPhase('idle');
      window.setTimeout(() => inputRef.current?.focus(), 0);
      // Task 165: show the interjecting dog's face beside her bubble. She is not the active dog (the
      // medallion stays the Labrador), so navy alone is too subtle -- the face makes "a second dog spoke"
      // unmistakable.
      playSequence([ij.line], ij.dog, reducedMotion ? 0 : 700, true);
      return;
    }
    if (r.followUp) {
      const followUp = r.followUp;
      setMsg(dogMsg.id, { display: r.text, typing: false, done: true });
      setAnnounce(r.text);
      setPhase('idle');
      window.setTimeout(() => inputRef.current?.focus(), 0);
      // Task 166: a red cookie's follow-up carries the clip + the reason, and lands 1.0s after his reaction
      // (a deliberate beat, longer than the usual 500ms follow-up). Other follow-ups are unchanged.
      const gap = r.followUpMedia ? (reducedMotion ? 0 : 1000) : (reducedMotion ? 0 : 500);
      playSequence([followUp], toDog, gap, false, r.followUpMedia);
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
  // Task 169: also wake on seqDone (a monologue completing, which never moves phase off 'idle'), and hold
  // off while a sequence is still in flight, so a message queued mid-monologue drains only once it ends.
  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    if (phase === 'idle' && !seqRef.current && queueRef.current.length > 0) {
      const next = queueRef.current.shift();
      if (next) sendRef.current(next);
    }
  }, [phase, seqDone]);

  // Escape closes the interface; a BARE Enter while a message is typing completes it (skips the
  // reveal). Task 82: if the visitor has typed something, do NOT steal the Enter -- let the form
  // submit it (queued) so type-ahead works, keyboard and focus intact.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeChat();
      else if (e.key === 'Enter' && playbackRef.current && !playbackRef.current.done && !inputRef.current?.value.trim()) {
        e.preventDefault();
        completeTheatre();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeChat, completeTheatre]);

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

  // Task 149 / 171: feeding a cookie. Every pill feeds him on the FIRST tap now, red included -- he eats
  // everything, red ones just taste wrong. A red tap also arms the "we dont use this" tooltip (its meaning
  // still lands in his reply, Task 166, and on hover on desktop); the two-tap warning gate is gone, so a
  // red pill is no longer a dead first tap. A tap elsewhere still dismisses any open tooltip (effect below).
  const feedPill = useCallback((c: CookiePill) => {
    if (c.red) setArmedRed(c.id);
    send(c.id);
  }, [send]);

  // Task 164: press a Boxer control-panel button. Announce the result for screen readers (brief section 9);
  // for FIX IT (and the emergency reset), strip the page SYNCHRONOUSLY so the site is clean instantly rather
  // than after the reply's typing theatre, then send the move so his line still lands and the game ends.
  const pressBoxer = useCallback((btn: BoxerButton) => {
    setAnnounce(btn.announce);
    if (btn.effect === null) resetBoxerEffects();
    send(btn.id);
  }, [send]);

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

  // Task 164: the Boxer's control panel. Rendered while his button game owns the input (boxer non-null).
  // Each button submits its id as a move (like a cookie pill); the engine records the effect and the mirror
  // paints it. Every EFFECT button is tagged data-boxer-wobble so the wobble effect can move them; FIX IT is
  // NOT tagged, so the way back never moves (Task 164 section 3). Real <button>s, keyboard-accessible.
  const panelEl = boxer !== null ? (
    <div className={styles.buttonPanel} role="group" aria-label="The Boxer's control panel">
      {BOXER_BUTTONS.map((b) => (
        <button
          key={b.id}
          type="button"
          data-boxer-btn={b.id}
          {...(b.wobble ? { 'data-boxer-wobble': '' } : {})}
          className={`${styles.buttonPanelBtn} ${b.effect === null ? styles.buttonPanelFix : ''}`}
          onClick={() => pressBoxer(b)}
        >
          {b.label}
        </button>
      ))}
    </div>
  ) : null;

  // Task 168: the three receded dogs, stacked beside the medallion. Rendered INSIDE the active-dog anchor
  // (both the desktop selector medallion and the mobile composer medallion) so they track it wherever it
  // sits. Each is a real <button> that switches to that dog (a fresh conversation); the green arrow points
  // at the active dog. `recededOn` is the pointed-at dog (keeps colour + a bright arrow); `recededOff` is
  // the rest while one is pointed at (their arrows fade). Close X and minimise sit above these (z-index).
  const recededEl = (
    <div className={styles.recededGroup}>
      {recededDogs.map((d, i) => (
        <button
          key={d}
          type="button"
          data-receded={d}
          className={`${styles.recededDog} ${styles[`receded${i}`]} ${activeReceded === d ? styles.recededOn : ''} ${activeReceded && activeReceded !== d ? styles.recededOff : ''}`}
          aria-label={`Switch to the ${dogInfo(d).name}`}
          title={`Switch to the ${dogInfo(d).name}`}
          onClick={() => pressReceded(d)}
          onMouseEnter={canHover ? () => setActiveReceded(d) : undefined}
          onMouseLeave={canHover ? () => setActiveReceded(null) : undefined}
        >
          {/* Task 168: the portrait is its OWN layer so the greyscale-at-rest filter greys the dog but NOT
              the green arrow (a sibling). The active dog is colour; an unselected dog is grey until hovered. */}
          <span className={styles.recededFace} style={{ backgroundImage: `url("${PROFILE_IMG[d]}")` }} aria-hidden="true" />
          <span className={styles.recededArrow} aria-hidden="true" />
        </button>
      ))}
    </div>
  );

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
            <div key={msg.id} className={`${styles.msgRow} ${styles.rowDog} ${msg.avatar ? styles.rowDogAvatar : ''}`}>
              {/* Task 132: no per-bubble avatar or nameplate -- the dog's face
                  and name live once, on the medallion at the top of the
                  column. A visually hidden speaker label keeps each bubble
                  attributed for screen readers.
                  Task 165 EXCEPTION: an interjection (msg.avatar) is a DIFFERENT dog cutting in while the
                  medallion stays the active dog, so it carries a small face to mark the second speaker. */}
              {msg.done && msg.avatar && msg.dog && (
                <span
                  className={styles.interjectFace}
                  style={{ backgroundImage: `url("${portraitSrc(msg.dog, 0)}")` }}
                  aria-hidden="true"
                />
              )}
              <div className={`${styles.bubbleDog} ${!msg.support && !msg.plainSurface && msg.dog ? styles[BUBBLE_CLASS[msg.dog]] : ''}`}>
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

                {/* Task 173: ONE msg.done guard around the WHOLE in-bubble attachment cluster -- the clip
                    (Task 152 section 3), the game board / sheep tiles / drawing (Task 115), and the action /
                    fetch link -- so every attachment lands WITH the finished message, never before the text.
                    It was three separate `msg.done` checks (and the board had none), which is three chances
                    for the next attachment to render on arrival; this single gate is the one place it passes.
                    INSTANT messages (safety, games) are `done` at once, so theirs still appear immediately. */}
                {msg.done && (
                  <>
                    {msg.media && (() => {
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
                          // Task 156 (§4): the party-hat pug in birthday.mp4 is a hidden hat -- it counts ON
                          // PLAY (seeing the clip finds it), not on tap. reportHat carries the protected guard.
                          onPlay={msg.media.src.includes('/birthday.mp4') ? () => { if (!sessionRef.current?.protectedState && !everProtectedRef.current) { reportHat(BIRTHDAY_HAT_ID); logMeta('hat', BIRTHDAY_HAT_ID); } } : undefined}
                        />
                      );
                    })()}
                    {msg.gameOutput && (
                      <pre className={styles.gameOutput}>{msg.gameOutput}</pre>
                    )}
                    {msg.action && (
                      <div className={styles.actionWrap}>
                        <ActionLink command={msg.action} onNavigate={msg.fetchGame ? undefined : () => { logMeta('link', msg.action?.href ?? '', msg.action?.kind === 'external'); setMinimised(true); }} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        )}
        {/* Task 149: the cookie tray sits at the foot of the thread, under his latest line. */}
        {trayEl}
        {/* Task 164: the Boxer's control panel sits at the foot of the thread, under his latest line. */}
        {panelEl}
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
      {/* Task 164: the composer Send is the one SITE-side control tagged for the Boxer wobble (it is not a
          navigation or commerce control, so moving it is safe and on-joke). Every other wobble target is a
          panel effect button. FIX IT and the emergency reset are never tagged, so the way back stays still. */}
      <button type="submit" className={styles.go} aria-label="Send" data-boxer-wobble>
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

      {/* Task 118/170: the brand-blue glow, now living in the experience (where the dog's position is known)
          rather than the launcher, so it can FOLLOW her. Decoration only (pointer-events:none in CSS); the
          transform drops the gradient's centre onto her medallion and rides every drag. Hidden while
          minimised via body[data-pc-min] (unchanged). */}
      <div className={styles.scrim} aria-hidden="true" style={{ transform: `translate3d(${round1(scrimX)}px, ${round1(scrimY)}px, 0)` }} />

      {/* Task 164 (brief section 8): a persistent, visible emergency reset in the dog interface, shown
          whenever an effect is live and the chat is open. It sits fixed above the effects (it lives in the
          chat overlay, which stays bright), never wobbles, and restores the page instantly on press. When
          the chat is minimised the effect is already reset (section 2.2), so it is not needed there. */}
      {boxerEffect && !minimised && (
        <div className={styles.boxerResetFloat}>
          <button type="button" className={styles.boxerReset} onClick={() => pressBoxer(BOXER_FIX)}>
            RESET THE PAGE
          </button>
        </div>
      )}

      {(phase === 'selecting' || (wide && !minimised)) && (
        <div className={styles.selectorWrap}>
          <div className={`${styles.selector} ${docked && phase !== 'selecting' ? styles.selectorDocked : ''}`}>
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
                    className={`${styles.dogAnchor} ${styles.anchorFan} ${docked ? styles.anchorDocked : ''} ${anchorSwap}`}
                    style={docked
                      ? { left: `${round1(DOCK_L + dragOffset.dx)}px`, top: `${round1(DOCK_T + dragOffset.dy)}px` }
                      // Task 168 (point 3): the FROZEN chat position (set on the first pick), NOT the active
                      // dog's own fan slot -- so a switch changes the portrait, not the position.
                      : { left: `${round1((chatAnchorRef.current?.left ?? p.left) + dragOffset.dx)}px`, top: `${round1((chatAnchorRef.current?.top ?? p.top) + dragOffset.dy)}px` }}
                    role="img"
                    aria-label={dead ? 'the Collie plays dead' : roll ? 'the Collie rolls over' : dogInfo(dog).name}
                    data-recede={activeReceded ? '1' : undefined}
                  >
                    {/* Task 78 fix: the tricks apply to the dog image layer ONLY, so the red X and the
                        ring do not go black or rotate with her. */}
                    <div
                      className={`${styles.dogFace} ${dead ? styles.anchorDead : ''} ${roll ? styles.anchorRoll : ''}`}
                      style={{ backgroundImage: `url("${portraitSrc(dog, profileIdx[dog] ?? 0)}")`, touchAction: 'none', cursor: 'grab' }}
                      onPointerDown={startPortrait}
                      onAnimationEnd={() => setRoll(false)}
                    />
                    {/* Task 168: the receded dogs, stacked beside this medallion. */}
                    {recededEl}
                    <button type="button" className={styles.close} aria-label="Close Pick a Chum" onClick={closeChat}>
                      <img src="/red-icon.svg" alt="" aria-hidden="true" />
                    </button>
                    {/* Task 130: minimise to a corner chip; restore brings the
                        conversation back exactly as it was. */}
                    <button type="button" className={styles.minimise} aria-label="Minimise the chat" onClick={minimise}>
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
                <button type="button" className={styles.selectorClose} aria-label="Close Pick a Chum" onClick={closeChat}>
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
      {/* While minimised the dog persists at her full size, parked beside the
          logo, with none of the chat showing. Her face restores the
          conversation; there is no close on the chip (minimise and close are
          separate: to end a session, reopen and close from the chat). No name
          either -- the chip is a face, the name shows only in the active chat.
          The scrim and the offer card hide via body[data-pc-min] as before. */}
      {phase !== 'selecting' && minimised && (
        <div className={styles.miniDock}>
          <button
            type="button"
            className={`${styles.miniFace} ${(auto && !revealedRef.current) || spoke ? styles.miniAuto : ''}`}
            aria-label={`Reopen the chat with the ${dogInfo(dog).name}`}
            title={`Reopen the chat with the ${dogInfo(dog).name}`}
            style={{ backgroundImage: `url("${portraitSrc(dog, profileIdx[dog] ?? 0)}")` }}
            onClick={() => {
              setMinimised(false);
              setSpoke(false); // Task 151: opening the chip clears the "he said something" pulse
              window.setTimeout(() => inputRef.current?.focus(), 60); // Task 82
            }}
          />
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
              data-recede={activeReceded ? '1' : undefined}
            >
              {/* Task 78 fix: the tricks apply to the dog image layer ONLY, so the red X and the ring
                  do not go black or rotate with her. */}
              <div
                className={`${styles.dogFace} ${dead ? styles.anchorDead : ''} ${roll ? styles.anchorRoll : ''}`}
                // Task 156: the portrait cycles on tap and drags on move (mobile medallion too).
                style={{ backgroundImage: `url("${portraitSrc(dog, profileIdx[dog] ?? 0)}")`, touchAction: 'none', cursor: 'grab' }}
                onPointerDown={startPortrait}
                onAnimationEnd={() => setRoll(false)}
              />
              {/* Task 168: the receded dogs, stacked beside this medallion (mobile). */}
              {recededEl}
              <button type="button" className={styles.close} aria-label="Close Pick a Chum" onClick={closeChat}>
                <img src="/red-icon.svg" alt="" aria-hidden="true" />
              </button>
              {/* Task 130 on mobile: the desktop medallion block is gated on
                  `wide`, so the minimise never rendered here. Same control,
                  same state. */}
              <button type="button" className={styles.minimise} aria-label="Minimise the chat" onClick={minimise}>
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
      <a href={command.href} className={cls} onClick={onNavigate}>
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
