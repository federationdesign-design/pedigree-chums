/* SAVE CODES: WHAT A SAVE HOLDS, 27 September 2026 (owner, J18-315). Shared by the
   browser and the server. A snapshot is the three things the game keeps in the
   browser: levels completed (pc-levels-done), facts seen (pc-facts-seen, short
   hashes) and the progress record (pc-progress, lib/progress.ts). No personal
   data: nothing here says who the player is.

   sanitise() is the only way in from outside. It keeps just the known fields,
   in the right types, with caps on counts and lengths, so a bad or oversized
   payload is trimmed or refused rather than stored. mergeSnapshots() joins two
   saves without losing anything: sets are united, best scores and records take
   the higher value, running totals take the larger. */
import type { Progress } from "../progress";

export type Snapshot = { v: 1; levelsDone: string[]; factsSeen: string[]; progress: Progress };

export const MAX_BODY_BYTES = 120_000;
const MAX_LIST = 5_000; // facts seen are about 2,000 today; room to grow
const MAX_KEYS = 1_000; // levels, dogs and chums
const MAX_STR = 80;
const MAX_NUM = 1e12;

const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 && v.length <= MAX_STR ? v : null);
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(MAX_NUM, Math.round(v))) : 0);
const list = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  const out = new Set<string>();
  for (const x of v) { const s = str(x); if (s) out.add(s); if (out.size >= MAX_LIST) break; }
  return [...out];
};
function numMap(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!v || typeof v !== "object" || Array.isArray(v)) return out;
  let n = 0;
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    if (!str(k)) continue;
    out[k] = num(x);
    if (++n >= MAX_KEYS) break;
  }
  return out;
}
function strMap(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!v || typeof v !== "object" || Array.isArray(v)) return out;
  let n = 0;
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    const val = str(x) ?? "";
    if (!str(k)) continue;
    out[k] = val;
    if (++n >= MAX_KEYS) break;
  }
  return out;
}

export function sanitise(raw: unknown): Snapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const p = (r.progress && typeof r.progress === "object" ? r.progress : {}) as Record<string, unknown>;
  const progress: Progress = {
    v: 1,
    bestScore: numMap(p.bestScore),
    totalPoints: num(p.totalPoints),
    dogsFound: strMap(p.dogsFound),
    chums: numMap(p.chums),
    chumsTotal: num(p.chumsTotal),
    rateFound: num(p.rateFound),
    ratePossible: num(p.ratePossible),
    recordChumChain: num(p.recordChumChain),
    quizRight: num(p.quizRight),
  };
  // Found can never exceed possible; if it does the pair is untrustworthy.
  if (progress.rateFound > progress.ratePossible) { progress.rateFound = 0; progress.ratePossible = 0; }
  return { v: 1, levelsDone: list(r.levelsDone), factsSeen: list(r.factsSeen), progress };
}

const maxMap = (a: Record<string, number>, b: Record<string, number>) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, v);
  return out;
};

export function mergeSnapshots(a: Snapshot, b: Snapshot): Snapshot {
  const pa = a.progress, pb = b.progress;
  // The chum rate is one pair: keep whichever side has seen more drops, so the
  // two halves never come from different saves.
  const rate = pb.ratePossible > pa.ratePossible ? pb : pa;
  return sanitise({
    v: 1,
    levelsDone: [...new Set([...a.levelsDone, ...b.levelsDone])],
    factsSeen: [...new Set([...a.factsSeen, ...b.factsSeen])],
    progress: {
      v: 1,
      bestScore: maxMap(pa.bestScore, pb.bestScore),
      totalPoints: Math.max(pa.totalPoints, pb.totalPoints),
      dogsFound: { ...pb.dogsFound, ...pa.dogsFound },
      chums: maxMap(pa.chums, pb.chums),
      chumsTotal: Math.max(pa.chumsTotal, pb.chumsTotal),
      rateFound: rate.rateFound,
      ratePossible: rate.ratePossible,
      recordChumChain: Math.max(pa.recordChumChain, pb.recordChumChain),
      quizRight: Math.max(pa.quizRight, pb.quizRight),
    },
  }) as Snapshot;
}
