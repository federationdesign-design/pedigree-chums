'use client';

// Task 148: the Terrier's job. Shared logic for his unbidden appearances (auto-appear on two pages,
// and the 10-second game hint), plus THE SUPPRESSION RULE (brief section 2) that governs all of them.

import { CHAT_KEY, PROTECTED_FLAG } from './pcKeys';
import { STORAGE_KEY, REGISTRY, type GameId } from '../../../lib/hiddenGames/registry';
import { readRecord } from '../../../lib/hiddenGames/record';

// Section 2, checked before EVERY unbidden appearance. He never appears when:
//  - a chat is already open (switching dogs would wipe a live conversation), OR
//  - this session has ever entered a protected safety state (a disclosure -> no dog pops out), OR
//  - the discount offer modal is open, OR
//  - the launcher itself is hidden -- checkout renders no nav, so no logo, so no appearance.
// The last two mirror the rules the discount popup already respects.
export function canTerrierAppear(): boolean {
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

// Per-page dismissal (brief section 8): once he is closed on a route, he stays gone for that route for
// the rest of the session. Session-scoped, cleared on tab close, holds only a list of routes.
const DISMISS_KEY = 'pc-terrier-dismissed';
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

// The two pages he appears on unbidden (brief section 4). TWO ONLY -- do not extend without the owner
// asking, or he becomes wallpaper.
export const AUTO_APPEAR_ROUTES = ['/britains-dog-history', '/name-generator'];

// His warmer-or-colder hint at a game NOT yet found: the first unfound game in registry order, or null
// when all are found (he says nothing). The hint text comes from the registry, so a new game brings its
// own -- nothing hand-written here to go stale.
export function unfoundGameHint(): string | null {
  if (typeof window === 'undefined') return null;
  let found: GameId[] = [];
  try {
    found = readRecord(window.localStorage.getItem(STORAGE_KEY), Date.now()).record.completed_game_ids;
  } catch {}
  const remaining = REGISTRY.games.filter((g) => !found.includes(g.id));
  return remaining.length ? remaining[0].hint : null;
}
