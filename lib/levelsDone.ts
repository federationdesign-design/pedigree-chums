/* LEVELS COMPLETED, 27 September 2026 (owner: a green tick on every level a player
   has finished, still there when they come back). Kept in localStorage, by level
   name (the same key the timeline and lineage records use), so it lasts until the
   browser's data is cleared. The save code will carry this list when it lands.
   Browser only: every function is safe to call on the server, where it does
   nothing. */
export const LEVELS_DONE_KEY = "pc-levels-done";
export const LEVELS_DONE_EVENT = "pc-levels-done-changed";

export function readLevelsDone(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(LEVELS_DONE_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export function markLevelDone(name: string): void {
  if (typeof window === "undefined" || !name) return;
  const done = readLevelsDone();
  if (done.has(name)) return;
  done.add(name);
  try {
    window.localStorage.setItem(LEVELS_DONE_KEY, JSON.stringify([...done]));
    window.dispatchEvent(new Event(LEVELS_DONE_EVENT));
  } catch {
    /* private mode or full storage: the tick simply does not persist */
  }
}
