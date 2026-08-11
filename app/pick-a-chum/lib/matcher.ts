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
import type { Normalised } from './normalise';

export interface RewordedHit {
  responseId: string;
  template: string;
}

// Stage 1 (plumbing): the seam only. Candidate narrowing (stage 2) and scoring/threshold (stage 3) follow.
// Returns null so behaviour is unchanged even with the switch on until the later stages land.
export function matchReworded(_n: Normalised, _data: ChumData, _dog: Dog): RewordedHit | null {
  return null;
}
