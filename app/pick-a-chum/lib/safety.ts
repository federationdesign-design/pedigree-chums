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

export type SafetyKind = 'distress' | 'safeguarding' | 'unsafe' | 'explicit' | 'abuse';

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

// D8: the old EXPLICIT list did two unrelated jobs. Split it. CONTENT_SEEKING is
// request/content-shaped and keeps the existing boundary. ANATOMY is body-part
// words that must NEVER trigger the inappropriate-content boundary on their own.
// The ANATOMY list here is only the body-part subset of the previous approved
// EXPLICIT list; the widened child vocabulary is a separate reviewed list
// (D8 step 3), not yet added.
const CONTENT_SEEKING = ['sex', 'porn', 'nude'];
const ANATOMY = ['penis', 'vagina', 'boobs', 'naked'];

// A body-part word together with a person reference or an action reads as a
// safeguarding disclosure, not inappropriate content. Lists approved in the D8
// ruling.
const PERSON_REF = ['he', 'she', 'my dad', 'my uncle', 'my brother', 'my teacher', 'a man', 'someone'];
const ACTION = ['touched', 'touches', 'made me', 'showed me', 'put', 'took', 'hurt'];

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
  // Safeguarding: a body-part word WITH a person reference or an action. Checked
  // above content-seeking so a disclosure ("he touched my penis") is read as a
  // safeguarding signal, never as inappropriate content. Interim response is the
  // approved distress signpost (Childline); a dedicated safeguarding line is
  // wired in D8 step 4.
  if (hasAny(n, ANATOMY) && (hasAny(n, PERSON_REF) || hasAny(n, ACTION)))
    return { kind: 'safeguarding', moderationId: 'MOD_DISTRESS' };
  if (hasAny(n, UNSAFE)) return { kind: 'unsafe', moderationId: 'MOD_UNSAFE' };
  if (hasAny(n, CONTENT_SEEKING)) return { kind: 'explicit', moderationId: 'MOD_EXPLICIT' };
  // A body-part word ALONE (no person, no action) is NOT a safety hit: it must
  // never get the inappropriate-content boundary. It falls through to normal
  // routing; the gentle "curious child" reply is Steve's copy (pending).
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
