// Task 173: the reworded-input matcher.
//
// It maps an otherwise-unmatched visitor input to an EXISTING approved row by scoring on content words
// (filler stripped), so a reordered or lightly-reworded question reaches the same answer as its canonical
// form -- e.g. "dogs wag tails why?" reaches the row "why do dogs wag their tails" already serves.
//
// PD-01: it NEVER writes text. It returns a row (responseId + that row's approved template) or null. The
// engine serves the returned row's template verbatim, exactly as the canned matcher does.
//
// SAFETY / SCOPE (enforced by the caller and the candidate set, not this note):
//   - It runs ONLY where the im-a-dog family (LOOP-01 / LOOP-02 / B40) would have (see engine.ts), which is
//     already guarded by protectedState === null, so it can never fire in a protected state.
//   - Its candidate set is drawn ONLY from the answerable conversational buckets (stage 2), so reserved
//     safeguarding/grief/moderation rows are never a match target.
//   - Below the confidence threshold it returns null and the caller serves im a dog, exactly as now.

import type { ChumData, Dog } from './types';
import { normalise, type Normalised } from './normalise';
import { effectiveBank } from './banks';
import { CANNED_BUCKETS } from './router';

export interface RewordedHit {
  responseId: string;
  template: string;
}

// A candidate is one answerable row the matcher may serve: its id, its approved template, and its triggers
// in compact form (tokenised at scoring time). Nothing here is scored yet -- this is the NARROWED universe.
export interface RewordedCandidate {
  responseId: string;
  template: string;
  triggers: string[];
}

// Stage 2: THE CANDIDATE NARROWING.
//
// The universe is drawn from the active dog's effective bank (dog-aware, and already excluding
// PROTECTED_BUCKETS) and narrowed to EXACTLY the answerable conversational buckets the deterministic canned
// matcher uses (CANNED_BUCKETS: B21-B39, B47-B53, B64). This is a SAFETY narrowing as much as a scope one:
//   - reserved safeguarding / grief / moderation rows are bucket:null routes that never enter a bank, and
//     are further outside this range, so they can never be a match target;
//   - the fallback-loop family (B40-B46) and the wired buckets (B54-B63) are excluded, so the matcher can
//     never serve im-a-dog, a diversion, or a wired ask as if it were an answer.
// Further guards: only Approved rows, only non-empty templates, and (conservative first pass) only
// self-contained TEXT rows -- any row carrying a destination route is skipped, so the matcher never serves a
// link-bearing offer stripped of its link. Pseudo-triggers ("ANY unrecognised input") are dropped, matching
// matchCanned. Cost: this is a synchronous in-memory filter over ~445 rows (no API, no network, no per-turn
// spend); it yields the fixed answerable set below (see the stage-2 report for the exact count).
export function rewordedCandidates(data: ChumData, dog: Dog): RewordedCandidate[] {
  const out: RewordedCandidate[] = [];
  for (const r of effectiveBank(data, dog)) {
    if (!CANNED_BUCKETS.test(r.bucketId)) continue; // answerable conversational buckets only
    if (r.status !== 'Approved') continue; // never serve a non-approved row
    if (r.defaultRoute && r.defaultRoute.trim()) continue; // skip destination-bearing rows (serve text only)
    const template = (r.template ?? '').trim();
    if (!template) continue; // never serve an empty row
    const triggers = r.triggers
      .map((t) => normalise(t).compact.replace(/'/g, '')) // same normalisation matchCanned uses
      .filter((t) => t && !t.startsWith('any ')); // drop the "ANY unrecognised input" pseudo-trigger
    if (!triggers.length) continue;
    out.push({ responseId: r.responseId, template, triggers });
  }
  return out;
}

// Stage 2 leaves the seam a no-op still: the candidate set exists and is testable, but scoring and the
// threshold (stage 3) are what turn a candidate into a served row. Returns null, so behaviour is unchanged.
export function matchReworded(_n: Normalised, _data: ChumData, _dog: Dog): RewordedHit | null {
  return null;
}
