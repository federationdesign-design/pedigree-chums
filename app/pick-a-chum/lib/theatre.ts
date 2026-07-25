// Typing theatre (presentation-layer only). The engine never sees this; it
// returns whole messages and the UI performs them. This module holds the pure,
// testable core: per-dog profiles, the hard "render instantly" rule for safety,
// and the keystroke-plan builder (thinking dots, human tempo, mid-message pauses,
// corrected and uncorrected typos, all capped at eight seconds). The animation
// loop and tap/Enter-to-complete live in the UI.

import { Dog, ActionType } from './types';

export interface TypingProfile {
  thinkMin: number; // thinking-dots duration (ms)
  thinkMax: number;
  charMin: number; // per-character delay (ms)
  charMax: number;
  midPauseChance: number; // chance of a considering-pause at a space
  midPauseMin: number;
  midPauseMax: number;
  correctedPerWords: number; // ~1 corrected typo per this many words
  correctedCap: number; // hard cap of corrected typos per message
  uncorrectedPerWords: number; // ~1 uncorrected typo per this many words
}

// Border Terrier is the base profile. Collie is fast and precise (short thinking,
// quick even tempo, near-instant corrections, half the typo rates). Labrador is
// enthusiastic (faster bursts, more corrected typos, ~1.5x uncorrected). Boxer is
// chaotic (longer, more variable thinking, big mid-message pauses, most typos).
// Profiles apply from the active dog onward, so the feel changes on a transfer.
export const TYPING_PROFILES: Record<Dog, TypingProfile> = {
  terrier: { thinkMin: 500, thinkMax: 1500, charMin: 20, charMax: 60, midPauseChance: 0.08, midPauseMin: 200, midPauseMax: 500, correctedPerWords: 32, correctedCap: 2, uncorrectedPerWords: 100 },
  collie: { thinkMin: 300, thinkMax: 800, charMin: 12, charMax: 32, midPauseChance: 0.04, midPauseMin: 150, midPauseMax: 300, correctedPerWords: 64, correctedCap: 1, uncorrectedPerWords: 200 },
  labrador: { thinkMin: 400, thinkMax: 1200, charMin: 14, charMax: 44, midPauseChance: 0.07, midPauseMin: 200, midPauseMax: 450, correctedPerWords: 21, correctedCap: 2, uncorrectedPerWords: 66 },
  boxer: { thinkMin: 700, thinkMax: 2000, charMin: 22, charMax: 72, midPauseChance: 0.16, midPauseMin: 300, midPauseMax: 800, correctedPerWords: 20, correctedCap: 2, uncorrectedPerWords: 55 },
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

export const THEATRE_MAX_MS = 8000;

// A word is safe to typo only if it is plain lowercase letters (4+). This excludes
// numbers, prices, URLs, the discount command, dog/breed names and proper nouns
// (any capital), and anything with digits.
export function isTypoEligible(word: string): boolean {
  return /^[a-z]{4,}$/.test(word);
}

type Rng = () => number;
const between = (rng: Rng, lo: number, hi: number) => lo + rng() * (hi - lo);
const wordCount = (s: string) => (s.match(/\S+/g) ?? []).length;

function mistype(ch: string, rng: Rng): string {
  const a = 'abcdefghijklmnopqrstuvwxyz';
  let c = ch;
  while (c === ch) c = a[Math.floor(rng() * 26)];
  return c;
}

// Char indices (into the text) where a corrected typo begins: on distinct
// eligible words, never the first letter.
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
  final: string; // the text as it ends up (an uncorrected typo is left standing)
  totalMs: number;
}

// Build the full keystroke plan for one message.
export function buildTypingPlan(text: string, profile: TypingProfile, rng: Rng = Math.random): TypingPlan {
  // 1. Uncorrected typo: transpose two adjacent middle letters of one eligible
  //    8+ letter word, left standing in the final text.
  let finalText = text;
  const longWords = [...text.matchAll(/[A-Za-z]+/g)].filter((m) => /^[a-z]{8,}$/.test(m[0]));
  if (longWords.length && rng() < wordCount(text) / profile.uncorrectedPerWords) {
    const m = longWords[Math.floor(rng() * longWords.length)];
    const w = m[0];
    const i = Math.floor(w.length / 2) - 1;
    const swapped = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
    finalText = text.slice(0, m.index) + swapped + text.slice((m.index ?? 0) + w.length);
  }

  // 2. Corrected typo positions.
  const nWords = wordCount(finalText);
  const base = Math.floor(nWords / profile.correctedPerWords);
  const frac = (nWords % profile.correctedPerWords) / profile.correctedPerWords;
  const wantCorrected = Math.min(profile.correctedCap, base + (rng() < frac ? 1 : 0));
  const correctedAt = pickCorrectedIndices(finalText, wantCorrected, rng);

  // 3. Emit keystrokes.
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

  // 4. Cap the whole performance at THEATRE_MAX_MS by scaling the typing delays
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
