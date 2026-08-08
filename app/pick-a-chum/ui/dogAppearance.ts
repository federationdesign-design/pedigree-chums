'use client';

// Task 148 / 150: unbidden dog appearances. Shared logic for the dogs who turn up on a page on their
// own (the Terrier on arrival, the Boxer at half-scroll), plus the Terrier's 10-second game hint, and
// THE SUPPRESSION RULE (brief section 2) that governs all of them. One module, now serving two dogs.

import { CHAT_KEY, PROTECTED_FLAG } from './pcKeys';
import { STORAGE_KEY, REGISTRY, type GameId } from '../../../lib/hiddenGames/registry';
import { readRecord } from '../../../lib/hiddenGames/record';
import type { Dog } from '../lib/types';

// Section 2, checked before EVERY unbidden appearance. No dog appears when:
//  - a chat is already open (switching dogs would wipe a live conversation), OR
//  - this session has ever entered a protected safety state (a disclosure -> no dog pops out), OR
//  - the discount offer modal is open, OR
//  - the launcher itself is hidden -- checkout renders no nav, so no logo, so no appearance.
// The last two mirror the rules the discount popup already respects. (Task 150: renamed from
// canTerrierAppear; the rule is identical and now guards the Boxer's pages too.)
export function canDogAppear(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.sessionStorage.getItem(CHAT_KEY)) return false;
    if (window.sessionStorage.getItem(PROTECTED_FLAG)) return false;
  } catch {
    return false;
  }
  if (document.body.hasAttribute('data-offer-open')) return false;
  const header = document.querySelector('header.pc-nav');
  return !!header && header.getAttribute('data-pc-logo') === 'true';
}

// Per-page dismissal (brief section 4/8): once a dog is closed on a route, he stays gone for that route
// for the rest of the session. Session-scoped, cleared on tab close, holds only a list of routes. There
// is deliberately NO session cap: a visitor who hits all his pages meets him on each (Task 150 section 4).
const DISMISS_KEY = 'pc-dog-dismissed';
function dismissedSet(): Set<string> {
  try {
    return new Set(JSON.parse(window.sessionStorage.getItem(DISMISS_KEY) || '[]') as string[]);
  } catch {
    return new Set<string>();
  }
}
export function isDismissed(route: string): boolean {
  return typeof window !== 'undefined' && dismissedSet().has(route);
}
export function markDismissed(route: string): void {
  try {
    const s = dismissedSet();
    s.add(route);
    window.sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...s]));
  } catch {}
}

// Task 160: pick ONE of the Boxer's ten /about misreads at random, with no repeat until all ten have
// shown -- the B57-facts rotation (assembler dog_fact), but session-scoped in sessionStorage because the
// appearance path never runs through the engine (so session.usedResponseIds is not written for it). Once
// every index has been used the set refills, so a long session keeps cycling; it clears on tab close.
const MISREAD_KEY = 'pc-boxer-misreads-used';
export function pickMisread(misreads: string[]): string {
  if (!misreads.length) return '';
  let used: number[] = [];
  try {
    used = JSON.parse(window.sessionStorage.getItem(MISREAD_KEY) || '[]') as number[];
  } catch {}
  let pool = misreads.map((_, i) => i).filter((i) => !used.includes(i));
  if (!pool.length) {
    pool = misreads.map((_, i) => i); // all ten seen -> refill
    used = [];
  }
  const idx = pool[Math.floor(Math.random() * pool.length)];
  try {
    window.sessionStorage.setItem(MISREAD_KEY, JSON.stringify([...used, idx]));
  } catch {}
  return misreads[idx];
}

// The pages a dog appears on unbidden, and how (brief section 8 -- the allocation is settled, the set is
// now complete).
//   'arrival'  after the reveal hold, the moment the page settles (the Terrier's two, two of the Collie's).
//   'scroll'   only once the visitor has scrolled halfway down -- a real commitment signal, and it
//              stops a dog meeting every /home visitor at the door (the Boxer's three).
//   'section'  only once a specific SECTION scrolls into view (Task 153: the Collie names dogs on
//              /know-your-chums, but not until the visitor reaches the image rails). The `selector` finds
//              the element to watch; a plain percentage would be wrong (the rails sit near the foot).
// `gapMs` is the pause between a sequence's messages (Task 152). A beat for a joke; twenty seconds for the
// ambient chum-naming. Do NOT extend this list without the owner asking, or the dogs become wallpaper.
export type AppearTrigger = 'arrival' | 'scroll' | 'section';
export type DogAppearance = { route: string; dog: Dog; trigger: AppearTrigger; selector?: string; gapMs?: number };
export const DOG_APPEARANCES: DogAppearance[] = [
  { route: '/britains-dog-history', dog: 'terrier', trigger: 'arrival' },
  { route: '/name-generator', dog: 'terrier', trigger: 'arrival' },
  { route: '/home', dog: 'boxer', trigger: 'scroll' },
  { route: '/about', dog: 'boxer', trigger: 'scroll' },
  { route: '/smarter-than-the-test', dog: 'boxer', trigger: 'scroll' },
  // Task 151: the Labrador on /hot-dogs, but ONLY the Case B path (he did not send them, no chat exists).
  // ON ARRIVAL, not scroll -- the Boxer's 50% gate is his own. When a chat DOES exist he is already there
  // and the launcher's thread-pickup listener speaks for him instead (no appearance); that is Case A.
  { route: '/hot-dogs', dog: 'labrador', trigger: 'arrival' },
  // Task 153: the Collie, the last dog. She ASSESSES. good-dog-bad-dog is a warning about length, so it
  // comes a few seconds after load (before they commit to 3,000 words), NOT on scroll. dogs-at-work is
  // her professional listing. know-your-chums is ambient naming, gated on reaching the rails, twenty
  // seconds apart. The first two are 'arrival'; their sequence gap is a beat.
  { route: '/good-dog-bad-dog', dog: 'collie', trigger: 'arrival' },
  { route: '/dogs-at-work', dog: 'collie', trigger: 'arrival' },
  { route: '/know-your-chums', dog: 'collie', trigger: 'section', selector: '[data-pc-appear="rails"]', gapMs: 20000 },
];
export function appearanceForRoute(route: string): DogAppearance | null {
  return DOG_APPEARANCES.find((a) => a.route === (route || '')) ?? null;
}

// The Terrier's warmer-or-colder hint at a game NOT yet found: the first unfound game in registry order,
// or null when all are found (he says nothing). The hint text comes from the registry, so a new game
// brings its own -- nothing hand-written here to go stale.
export function unfoundGameHint(): string | null {
  if (typeof window === 'undefined') return null;
  let found: GameId[] = [];
  try {
    found = readRecord(window.localStorage.getItem(STORAGE_KEY), Date.now()).record.completed_game_ids;
  } catch {}
  const remaining = REGISTRY.games.filter((g) => !found.includes(g.id));
  return remaining.length ? remaining[0].hint : null;
}
