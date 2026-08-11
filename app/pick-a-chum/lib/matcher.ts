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
import { CANNED_BUCKETS, keyTokens } from './router';

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

// Stage 3: SCORING and THE THRESHOLD.
//
// The matcher reduces both the input and every candidate trigger to their content words (keyTokens: filler
// stripped, the SAME primitive the router uses) with a light plural stem, then scores order-independent
// overlap. So "dogs wag tails why?" and "why do dogs wag their tails" reduce to the same {dog, wag, tail,
// why} and match, which is exactly the reorder failure being fixed.
//
// Discrimination matters: "dog" appears in most triggers and carries almost no signal, while "wag" appears
// in a handful and is highly diagnostic. Each token is weighted by an IDF-like value over the candidate set,
// so a shared rare word counts far more than a shared common one, and a match on common words alone cannot
// clear the bar.
//
// THE THRESHOLD (conservative first pass, per brief section 3 -- a wrong answer costs trust, a miss costs
// nothing). A candidate is served only when ALL hold against its best trigger:
//   - weighted coverage of the trigger >= COVERAGE_MIN  (the input carries nearly all the trigger's signal)
//   - plain coverage >= RAW_MIN                          (most of the trigger's actual words are present)
//   - at least MIN_DISC shared DISCRIMINATIVE words      (not a fluke on common words)
//   - the input itself has >= 2 content words            (a bare token is never confident)
// Anything short of that returns null and the caller serves im a dog, exactly as now.
const COVERAGE_MIN = 0.85;
const RAW_MIN = 0.66;
const MIN_DISC = 2;

// keyTokens keeps any word of 3+ letters that is not in the router's STOP set, which is tuned for the
// router and leaves through possessives, pronouns and conjunctions ("their", "them", "because", "when"...).
// Left in, a rare function word like "their" (in "wag their tails") scores as a high-weight discriminative
// token, so a reorder that drops it fails to match. This is the hand-tuned filler list the content-word
// approach needs (brief section 4): pure grammar words with no topic signal, so removing them changes which
// inputs MATCH but never which ANSWER is chosen.
const EXTRA_STOP = new Set([
  'their', 'them', 'they', 'theirs', 'this', 'that', 'these', 'those', 'there', 'here',
  'because', 'cause', 'when', 'while', 'your', 'yours', 'our', 'ours', 'its', 'whose',
  'been', 'being', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'than',
  'from', 'into', 'out', 'off', 'not', 'but', 'get', 'got', 'one', 'why', 'who',
]);

// Strip a single trailing plural 's' (tail/tails, dog/dogs), keeping >= 3 chars and leaving "ss" words alone.
function stem(tok: string): string {
  return tok.length > 3 && tok.endsWith('s') && !tok.endsWith('ss') ? tok.slice(0, -1) : tok;
}
function contentTokens(compact: string): string[] {
  return [...new Set(keyTokens(compact).filter((w) => !EXTRA_STOP.has(w)).map(stem))];
}

export function matchReworded(n: Normalised, data: ChumData, dog: Dog): RewordedHit | null {
  const inputToks = contentTokens(n.compact);
  if (inputToks.length < 2) return null; // a single content word is never a confident match
  const inputSet = new Set(inputToks);

  const candidates = rewordedCandidates(data, dog);
  // Prepare each candidate's trigger token sets, and count document frequency (how many candidate ROWS a
  // token appears in) to weight discrimination. Common tokens (many rows) get little weight; rare ones a lot.
  const prepped = candidates.map((c) => {
    const rowTokens = new Set<string>();
    const trigTokenSets = c.triggers.map((t) => {
      const ts = contentTokens(t);
      ts.forEach((x) => rowTokens.add(x));
      return ts;
    });
    return { c, trigTokenSets, rowTokens };
  });
  const df = new Map<string, number>();
  for (const p of prepped) for (const tok of p.rowTokens) df.set(tok, (df.get(tok) ?? 0) + 1);
  const nRows = prepped.length || 1;
  const weight = (tok: string) => Math.log(1 + nRows / (1 + (df.get(tok) ?? 0)));
  // A token is DISCRIMINATIVE if it is rare across the candidate set (<= ~15% of rows, floor of 3), so
  // "wag"/"tail" count as discriminative while "dog"/"dogs"/"why" do not.
  const discMax = Math.max(3, Math.floor(nRows * 0.15));

  let best: { hit: RewordedHit; score: number } | null = null;
  for (const p of prepped) {
    for (const T of p.trigTokenSets) {
      if (!T.length) continue;
      const shared = T.filter((t) => inputSet.has(t));
      if (shared.length < MIN_DISC) continue;
      const discShared = shared.filter((t) => (df.get(t) ?? 0) <= discMax).length;
      if (discShared < MIN_DISC) continue;
      const rawCoverage = shared.length / T.length;
      if (rawCoverage < RAW_MIN) continue;
      const wTotal = T.reduce((s, t) => s + weight(t), 0);
      const wShared = shared.reduce((s, t) => s + weight(t), 0);
      const coverage = wTotal ? wShared / wTotal : 0;
      if (coverage < COVERAGE_MIN) continue;
      // Prefer the best-covered, most information-rich trigger (its total weight breaks ties toward the more
      // specific phrase). This never lowers the bar, only chooses among candidates that already cleared it.
      const score = coverage * wTotal;
      if (!best || score > best.score) best = { hit: { responseId: p.c.responseId, template: p.c.template }, score };
    }
  }
  return best ? best.hit : null;
}
