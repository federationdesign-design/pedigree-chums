// Safety layer (Priority 1) detection. Deterministic, conservative patterns.
//
// Two concerns live here, both above every comic layer:
//   1. Moderation: distress, unsafe/prohibited, explicit and abusive input.
//   2. Dog health and food toxicity: answered with general info, never a
//      diagnosis and never a comic transfer to the Labrador.
//
// A bare food noun ("Sausages.") is NOT a health match: only a health or
// toxicity FRAME ("can dogs eat...", "is X safe for dogs", "toxic to dogs")
// counts, so the food transfer still fires for plain food words.

import { Normalised, hasAny } from './normalise';

export type SafetyKind = 'distress' | 'unsafe' | 'explicit' | 'abuse';

export interface SafetyHit {
  kind: SafetyKind;
  moderationId: string;
}

const DISTRESS = [
  'kill myself',
  'want to die',
  'end my life',
  'end it all',
  'hurt myself',
  'harm myself',
  'self harm',
  'suicide',
  'being abused',
  'someone is hurting me',
  'someone hurts me',
  'being hurt at home',
  'i feel unsafe',
];

const UNSAFE = [
  'make a bomb',
  'build a bomb',
  'how to hurt',
  'how do i hurt',
  'kill him',
  'kill her',
  'kill them',
  'kill someone',
  'hurt someone',
];

const EXPLICIT = ['sex', 'porn', 'nude', 'naked', 'penis', 'vagina', 'boobs'];

const ABUSE = [
  'stupid',
  'idiot',
  'shut up',
  'you suck',
  'hate you',
  'useless',
  'rubbish dog',
  'fuck',
  'shit',
];

export function detectSafety(n: Normalised): SafetyHit | null {
  if (hasAny(n, DISTRESS)) return { kind: 'distress', moderationId: 'MOD_DISTRESS' };
  if (hasAny(n, UNSAFE)) return { kind: 'unsafe', moderationId: 'MOD_UNSAFE' };
  if (hasAny(n, EXPLICIT)) return { kind: 'explicit', moderationId: 'MOD_EXPLICIT' };
  if (hasAny(n, ABUSE)) return { kind: 'abuse', moderationId: 'MOD_ABUSE' };
  return null;
}

// Dog-health and food-toxicity questions. Requires a health/safety frame, not a
// bare food word.
const HEALTH_FRAMES = [
  'can dogs eat',
  'can my dog eat',
  'can dogs have',
  'can my dog have',
  'safe for dogs',
  'safe for my dog',
  'toxic to dogs',
  'poisonous to dogs',
  'bad for dogs',
  'harmful to dogs',
  'my dog ate',
  'dog is sick',
  'dog is ill',
  'dog is vomiting',
  'dog keeps being sick',
  'is my dog ok',
  'dog has a lump',
];

export function isDogHealthQuestion(n: Normalised): boolean {
  return hasAny(n, HEALTH_FRAMES);
}
