// Typing theatre (presentation-layer only). The engine never sees this; it
// returns whole messages and the UI performs them. This module holds the pure,
// testable core: per-dog profiles, the hard "render instantly" rule for safety,
// and the keystroke-plan builder (thinking dots, human tempo, mid-message pauses,
// all capped at eight seconds). It types CLEAN copy: no deliberate misspellings
// are generated, so a factual breed or FAQ answer is never rendered wrong, not
// even transiently. (Deliberate typos were removed after the standing "uncorrected
// typo" was seen corrupting breed facts, e.g. "accdient".) The animation loop and
// tap/Enter-to-complete live in the UI.

import { Dog, ActionType } from './types';

export interface TypingProfile {
  thinkMin: number; // thinking-dots duration (ms)
  thinkMax: number;
  charMin: number; // per-character delay (ms)
  charMax: number;
  midPauseChance: number; // chance of a considering-pause at a space
  midPauseMin: number;
  midPauseMax: number;
  correctedPerWords: number; // ~1 self-correcting typo per this many words
  correctedCap: number; // hard cap of self-correcting typos per message
}

// Border Terrier is the base profile. Collie is fast and precise (short thinking,
// quick even tempo, half the typo rate). Labrador is enthusiastic (faster bursts,
// more typos). Boxer is chaotic (longer, more variable thinking, big mid-message
// pauses, most typos). The self-correcting typo is a CHARACTER-copy flourish only
// (never on factual or safety copy, see NO_TYPO), and there is never a standing
// uncorrected typo. Profiles apply from the active dog onward, so the feel changes
// on a transfer.
export const TYPING_PROFILES: Record<Dog, TypingProfile> = {
  terrier: { thinkMin: 500, thinkMax: 1500, charMin: 20, charMax: 60, midPauseChance: 0.08, midPauseMin: 200, midPauseMax: 500, correctedPerWords: 32, correctedCap: 2 },
  collie: { thinkMin: 300, thinkMax: 800, charMin: 12, charMax: 32, midPauseChance: 0.04, midPauseMin: 150, midPauseMax: 300, correctedPerWords: 64, correctedCap: 1 },
  labrador: { thinkMin: 400, thinkMax: 1200, charMin: 14, charMax: 44, midPauseChance: 0.07, midPauseMin: 200, midPauseMax: 450, correctedPerWords: 21, correctedCap: 2 },
  boxer: { thinkMin: 700, thinkMax: 2000, charMin: 22, charMax: 72, midPauseChance: 0.16, midPauseMin: 300, midPauseMax: 800, correctedPerWords: 20, correctedCap: 2 },
};

// Responses that render instantly and completely: no dots, no typing, no typos.
// Safety-layer answers must never watch a dog perform; the generated bark volleys
// have their own rhythm. This is a hard, permanent guarantee (asserted by tests).
const INSTANT: ReadonlySet<ActionType> = new Set<ActionType>([
  'safety_signpost',
  'safety_boundary',
  'health_answer',
  'bark',
  'bark_break',
  'bark_ack',
]);
export function skipTheatre(action: ActionType): boolean {
  return INSTANT.has(action);
}

// Content that types CLEAN, with no self-correcting typo: factual answers a child
// might rely on, and any safeguarding line. The typo flourish belongs on CHARACTER
// copy (greetings, jokes, repair lines, goodbyes). Safety and bark are already
// INSTANT (no theatre at all); listed here too so the whole "never on facts or
// safety" rule reads in one place. A standing (uncorrected) typo is never produced
// for ANY action.
const NO_TYPO: ReadonlySet<ActionType> = new Set<ActionType>([
  'breed_page',
  'breed_answer',
  'faq_answer',
  'rules_answer',
  'gk_answer',
  'safety_signpost',
  'safety_boundary',
  'health_answer',
  'anatomy_redirect',
]);
export function allowsTypos(action: string): boolean {
  return !NO_TYPO.has(action as ActionType);
}

export const THEATRE_MAX_MS = 8000;

// Which words are eligible to typo: plain lowercase, 4+ letters (excludes numbers,
// prices, URLs, the discount command, dog/breed names and proper nouns (any
// capital), and anything with digits). Word-level filter; the action-level "never
// on facts or safety" rule is NO_TYPO / allowsTypos above.
export function isTypoEligible(word: string): boolean {
  return /^[a-z]{4,}$/.test(word);
}

type Rng = () => number;
const between = (rng: Rng, lo: number, hi: number) => lo + rng() * (hi - lo);
const wordCount = (s: string) => (s.match(/\S+/g) ?? []).length;

// A single random letter substituted for the given one (for a self-correcting typo).
function mistype(ch: string, rng: Rng): string {
  const a = 'abcdefghijklmnopqrstuvwxyz';
  let c = ch;
  while (c === ch) c = a[Math.floor(rng() * 26)];
  return c;
}

// Char indices where a corrected typo begins: on distinct eligible words, never
// the first letter.
function pickCorrectedIndices(text: string, count: number, rng: Rng): Set<number> {
  const set = new Set<number>();
  if (count <= 0) return set;
  const pool = [...text.matchAll(/[A-Za-z]+/g)].filter((m) => isTypoEligible(m[0]));
  const chosen: RegExpMatchArray[] = [];
  while (chosen.length < count && pool.length) chosen.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  for (const m of chosen) {
    const w = m[0];
    const off = 1 + Math.floor(rng() * (w.length - 1)); // not the first letter
    set.add((m.index ?? 0) + Math.min(off, w.length - 1));
  }
  return set;
}

export interface TypingStep {
  display: string;
  delay: number;
}
export interface TypingPlan {
  think: number;
  steps: TypingStep[];
  final: string; // the completed text; always equals the input (no typos remain)
  totalMs: number;
}

// Build the full keystroke plan for one message. The text is revealed one
// character at a time at a human tempo, with an occasional considering-pause at a
// space. On CHARACTER copy a self-correcting typo may appear (a wrong letter typed,
// run on a few chars, then noticed, backspaced and retyped correctly); on factual
// or safety copy (NO_TYPO), or when no action is given, it types clean. There is
// NEVER a standing uncorrected typo, so the final text always equals the input.
export function buildTypingPlan(text: string, profile: TypingProfile, rng: Rng = Math.random, action?: string): TypingPlan {
  const finalText = text; // never rewritten: no standing typo, ever

  // Self-correcting typo positions, character copy only.
  let correctedAt = new Set<number>();
  if (action === undefined || allowsTypos(action)) {
    const nWords = wordCount(finalText);
    const base = Math.floor(nWords / profile.correctedPerWords);
    const frac = (nWords % profile.correctedPerWords) / profile.correctedPerWords;
    const wantCorrected = Math.min(profile.correctedCap, base + (rng() < frac ? 1 : 0));
    correctedAt = pickCorrectedIndices(finalText, wantCorrected, rng);
  }

  // Emit keystrokes.
  const steps: TypingStep[] = [];
  let shown = '';
  for (let i = 0; i < finalText.length; i++) {
    const ch = finalText[i];
    if (correctedAt.has(i) && /[a-z]/.test(ch)) {
      const extra = Math.min(3 + Math.floor(rng() * 2), finalText.length - i - 1); // 3-4 chars past
      shown += mistype(ch, rng);
      steps.push({ display: shown, delay: between(rng, profile.charMin, profile.charMax) });
      for (let k = 1; k <= extra; k++) {
        shown += finalText[i + k];
        steps.push({ display: shown, delay: between(rng, profile.charMin, profile.charMax) });
      }
      steps.push({ display: shown, delay: 250 }); // the "noticing" pause
      for (let k = 0; k <= extra; k++) {
        shown = shown.slice(0, -1);
        steps.push({ display: shown, delay: 40 }); // backspace to the error
      }
      for (let k = 0; k <= extra; k++) {
        shown += finalText[i + k];
        steps.push({ display: shown, delay: between(rng, profile.charMin, profile.charMax) });
      }
      i += extra;
    } else {
      shown += ch;
      let delay = between(rng, profile.charMin, profile.charMax);
      if (ch === ' ' && rng() < profile.midPauseChance) delay += between(rng, profile.midPauseMin, profile.midPauseMax);
      steps.push({ display: shown, delay });
    }
  }

  // Cap the whole performance at THEATRE_MAX_MS by scaling the typing delays
  //    (thinking time is trimmed first so the message always finishes in time).
  const think = between(rng, profile.thinkMin, profile.thinkMax);
  let stepsMs = steps.reduce((s, x) => s + x.delay, 0);
  let usedThink = think;
  if (think + stepsMs > THEATRE_MAX_MS) {
    usedThink = Math.min(think, 800);
    const scale = (THEATRE_MAX_MS - usedThink) / stepsMs;
    for (const s of steps) s.delay *= scale;
    stepsMs = steps.reduce((s, x) => s + x.delay, 0);
  }
  return { think: usedThink, steps, final: finalText, totalMs: usedThink + stepsMs };
}
