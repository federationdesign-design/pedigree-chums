// Hidden Games: the single on-screen slot for campaign surfaces.
//
// Task B collision guard. The prelude card, the introduction card, the
// completion celebration and the discovery toast are the campaign's visitor-
// facing surfaces. Only ONE of them may be on screen at any moment; a surface
// that finds the slot taken WAITS and is shown when the slot frees.
//
// Before this, exclusivity was emergent: the two cards shared a single `phase`
// in HiddenGamesCounter and were ordered by an if/else, but the discovery toast
// is a SEPARATE component (HiddenGamesToast) with no knowledge of that phase.
// Nothing coordinated the toast with the cards, so the toast (which defers while
// a game is open and then flushes onto the very next page) could land on a
// prelude/introduction page and sit alongside a card. This module replaces the
// emergent rule with one explicit lock both components hold against.
//
// The holder is identified by a coarse surface id (CARD_SURFACE for any of the
// counter's cards, TOAST_SURFACE for the toast). The counter's own `phase` still
// serialises the cards relative to each other; this lock serialises the counter
// against the toast. Re-claiming with the same id is allowed (idempotent), so a
// card handing off to another card does not have to release first.

export const CARD_SURFACE = "card";
export const TOAST_SURFACE = "toast";

type Listener = () => void;

let holder: string | null = null;
const waiters = new Set<Listener>();

// Take the slot for `id`. Returns true if it was free (or already held by `id`),
// false if another surface holds it. A false return means the caller should wait
// and retry from subscribeSurfaceFree.
export function claimSurface(id: string): boolean {
  if (holder !== null && holder !== id) return false;
  holder = id;
  return true;
}

// Give the slot back. Only the current holder may release it. Waiters are then
// notified so a queued surface can claim it. The set is copied first so a waiter
// that re-subscribes inside its callback does not disturb the iteration.
export function releaseSurface(id: string): void {
  if (holder !== id) return;
  holder = null;
  for (const w of Array.from(waiters)) w();
}

// The current holder, or null. Exposed for tests and debugging only.
export function currentSurface(): string | null {
  return holder;
}

// Subscribe to slot-free notifications. The callback fires each time a surface
// releases the slot; a waiting surface tries to claim it there. Returns an
// unsubscribe.
export function subscribeSurfaceFree(cb: Listener): () => void {
  waiters.add(cb);
  return () => {
    waiters.delete(cb);
  };
}
