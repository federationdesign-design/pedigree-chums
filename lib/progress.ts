/* A PLAYER'S PROGRESS, 27 September 2026 (owner). Everything the game keeps
   between visits, in the browser, until the save code copies it online:
     - levels completed          (lib/levelsDone.ts, pc-levels-done)
     - facts seen                (pc-facts-seen, in BreedTree)
     - and, here, in one record (pc-progress): best score per level, total
       points, dogs found, chums collected and the total caught, the chum rate
       (caught out of dropped, in completed levels, the game's own sum), the
       record chum chain and quiz answers right.
   Browser only: every function is safe to call on the server, where it does
   nothing. A change fires PROGRESS_EVENT, so any screen showing progress can
   refresh. */
export const PROGRESS_KEY = "pc-progress";
export const PROGRESS_EVENT = "pc-progress-changed";

export type Progress = {
  v: 1;
  bestScore: Record<string, number>;
  totalPoints: number;
  dogsFound: Record<string, string>; // dog name -> the era it was found in
  chums: Record<string, number>; // chum name -> times caught
  chumsTotal: number;
  rateFound: number; // chums caught in completed levels
  ratePossible: number; // chums that dropped in completed levels
  recordChumChain: number;
  quizRight: number;
};

const EMPTY: Progress = { v: 1, bestScore: {}, totalPoints: 0, dogsFound: {}, chums: {}, chumsTotal: 0, rateFound: 0, ratePossible: 0, recordChumChain: 0, quizRight: 0 };

export function readProgress(): Progress {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    const p = raw ? (JSON.parse(raw) as Partial<Progress>) : {};
    return { ...EMPTY, ...p, v: 1 };
  } catch {
    return { ...EMPTY };
  }
}

function update(fn: (p: Progress) => void): void {
  if (typeof window === "undefined") return;
  const p = readProgress();
  fn(p);
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    /* private mode or full storage: progress simply does not persist */
  }
}

/** A level finished: its score this time, and the chums caught and dropped in it. */
export function recordLevelWon(level: string, levelScore: number, chumsCaught: number, chumsDropped: number): void {
  update((p) => {
    const s = Math.max(0, Math.round(levelScore));
    p.bestScore[level] = Math.max(p.bestScore[level] ?? 0, s);
    p.totalPoints += s;
    if (chumsDropped > 0) { p.rateFound += chumsCaught; p.ratePossible += chumsDropped; }
  });
}
export function recordChumCaught(name: string): void {
  update((p) => { p.chums[name] = (p.chums[name] ?? 0) + 1; p.chumsTotal += 1; });
}
export function recordDogFound(name: string, era: string): void {
  update((p) => { if (!(name in p.dogsFound)) p.dogsFound[name] = era; });
}
export function recordChumChain(length: number): void {
  update((p) => { if (length > p.recordChumChain) p.recordChumChain = length; });
}
export function recordQuizRight(): void {
  update((p) => { p.quizRight += 1; });
}
/** The chum rate as a whole percentage, or null before any completed level had chums. */
export function chumRate(p: Progress): number | null {
  return p.ratePossible > 0 ? Math.round((p.rateFound / p.ratePossible) * 100) : null;
}
