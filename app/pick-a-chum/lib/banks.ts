// Per-dog response banks (Task: per-dog architecture).
//
// Each dog can have its own response sheet (Labrador / Boxer / Terrier), on top of the Collie bank.
// Model (a): a dog inherits Collie for any bucket it has not written. Ownership is per BUCKET, not per
// row: if a dog has written ANY row for a bucket it owns that whole bucket (its rows replace Collie's
// for that bucket); otherwise it inherits Collie's rows for that bucket.
//
// SAFETY IS NOT A FALLBACK. Safeguarding, grief and the fear-of-a-person routes are bucket:null action
// routes served from moderation.ts / hardcoded constants, resolved above every content route, so they
// never read a response bank at all -- a per-dog bucket structurally cannot reach them. PROTECTED_BUCKETS
// is the belt-and-braces reserve: any bucket id ever assigned to safety copy goes here, and the dog
// layer is skipped for it (so a dog can never shadow it), matching the build-time assertion in
// build:chumdata. It is empty today because no safety route has a sheet bucket.

import { ChumData, CollieResponse, Dog } from './types';

export const PROTECTED_BUCKETS = new Set<string>();

function dogBank(data: ChumData, dog: Dog): CollieResponse[] {
  switch (dog) {
    case 'labrador':
      return data.labradorResponses;
    case 'boxer':
      return data.boxerResponses;
    case 'terrier':
      return data.terrierResponses;
    default:
      return data.collieResponses;
  }
}

// The active dog's effective response bank: its own rows for every bucket it owns, plus Collie's rows
// for every bucket it does not (and always Collie for protected buckets). This is the ONE place the
// fallback lives; the assembler swaps it in for data.collieResponses so every downstream lookup
// (pickResponse, the canned find, pickBark) is dog-aware without threading the dog through each call,
// and the router's canned matcher uses the same function so both see the same rows.
export function effectiveBank(data: ChumData, dog: Dog): CollieResponse[] {
  if (dog === 'collie') return data.collieResponses;
  const own = dogBank(data, dog).filter((r) => !PROTECTED_BUCKETS.has(r.bucketId));
  const ownedBuckets = new Set(own.map((r) => r.bucketId));
  const inherited = data.collieResponses.filter((r) => !ownedBuckets.has(r.bucketId));
  return [...own, ...inherited];
}

// The buckets a dog OWNS (has written at least one non-protected row for). Used by the gap report and
// diagnostics; the runtime uses effectiveBank directly.
export function ownedBuckets(data: ChumData, dog: Dog): Set<string> {
  return new Set(dogBank(data, dog).filter((r) => !PROTECTED_BUCKETS.has(r.bucketId)).map((r) => r.bucketId));
}
