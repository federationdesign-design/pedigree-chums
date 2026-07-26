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
}

// Border Terrier is the base profile. Collie is fast and precise (short thinking,
// quick even tempo). Labrador is enthusiastic (faster bursts). Boxer is chaotic
// (longer, more variable thinking, big mid-message pauses). The dogs differ by
// thinking time, per-character speed and pausing only; none of them misspell.
// Profiles apply from the active dog onward, so the feel changes on a transfer.
export const TYPING_PROFILES: Record<Dog, TypingProfile> = {
  terrier: { thinkMin: 500, thinkMax: 1500, charMin: 20, charMax: 60, midPauseChance: 0.08, midPauseMin: 200, midPauseMax: 500 },
  collie: { thinkMin: 300, thinkMax: 800, charMin: 12, charMax: 32, midPauseChance: 0.04, midPauseMin: 150, midPauseMax: 300 },
  labrador: { thinkMin: 400, thinkMax: 1200, charMin: 14, charMax: 44, midPauseChance: 0.07, midPauseMin: 200, midPauseMax: 450 },
  boxer: { thinkMin: 700, thinkMax: 2000, charMin: 22, charMax: 72, midPauseChance: 0.16, midPauseMin: 300, midPauseMax: 800 },
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

// Which words WOULD be eligible to typo: plain lowercase, 4+ letters (excludes
// numbers, prices, URLs, the discount command, dog/breed names and proper nouns
// (any capital), and anything with digits). The theatre now types clean copy and
// generates no misspellings; this stays as the single source of truth (and is
// still tested) for the day a self-correcting flourish is deliberately reintroduced.
export function isTypoEligible(word: string): boolean {
  return /^[a-z]{4,}$/.test(word);
}

type Rng = () => number;
const between = (rng: Rng, lo: number, hi: number) => lo + rng() * (hi - lo);

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
// space. Every character shown is the real one, so the final text always equals
// the input: the theatre performs the copy, it never rewrites it.
export function buildTypingPlan(text: string, profile: TypingProfile, rng: Rng = Math.random): TypingPlan {
  // Emit keystrokes: one character per step, no typos.
  const steps: TypingStep[] = [];
  let shown = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    shown += ch;
    let delay = between(rng, profile.charMin, profile.charMax);
    if (ch === ' ' && rng() < profile.midPauseChance) delay += between(rng, profile.midPauseMin, profile.midPauseMax);
    steps.push({ display: shown, delay });
  }
  const finalText = text;

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
