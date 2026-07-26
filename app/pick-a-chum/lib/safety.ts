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
import { ActionType } from './types';

export type SafetyKind =
  | 'medical'
  | 'harm_others'
  | 'harm_animal'
  | 'self_harm'
  | 'safeguarding'
  | 'general_distress'
  | 'explicit'
  | 'abuse'
  | 'bare_help';

export interface SafetyHit {
  kind: SafetyKind;
  moderationId: string;
  action: ActionType;
}

// ---- Category term lists (canonical). Child misspellings/variants live in the
// workbook alias map (applied before matching), not inline here. ----

const MEDICAL = [
  'have a stroke', 'having a stroke', 'had a stroke', 'think im having a stroke', 'im having a stroke',
  'heart attack', 'cannot breathe', "can't breathe", 'cant breathe', 'not breathing', 'choking',
  'overdose', 'took too many', 'swallowed medicine', 'ate medicine', 'chest pain', 'passed out',
  'fainted', 'unconscious', "can't wake them up", 'cant wake them up', "won't wake up", 'wont wake up',
  'allergic reaction', 'ambulance', 'bleeding', "can't stop bleeding", 'cant stop bleeding',
  'really bad pain', 'fell and hit my head', 'my face feels funny', 'my arm feels weak',
  "can't feel my arm", 'cant feel my arm', "can't see properly", 'cant see properly',
  'collapsed', 'seizure',
];

const HARM_OTHERS = [
  'kill him', 'kill her', 'kill them', 'kill someone', 'hurt someone', 'how to hurt', 'how do i hurt',
  'make a bomb', 'build a bomb', 'going to hurt him', 'going to hurt her', 'want to hurt him',
  'want to hurt her', 'drunk drive', 'drink drive', 'drink driving', 'drunk driving',
  'drive after drinking', 'drive when drunk', 'get in the car drunk', "i'm going to hurt someone",
  'im going to hurt someone', 'want to hurt someone', 'going to hit him', 'going to hit her',
  'make them pay', 'going to hurt my brother', 'going to hurt my sister', 'going to hurt my mum',
  'going to hurt my dad',
];

const HARM_ANIMAL = ['poison the dog', 'hit an animal', 'beat the dog', 'hurt an animal', 'kick the dog', 'hurt the cat'];

const SELF_HARM = [
  'kill myself', 'want to die', 'end my life', 'end it all', 'hurt myself', 'harm myself', 'self harm',
  'suicide', 'cut myself', 'no point in anything', 'no point anymore', 'whats the point of anything',
  'whats the point in anything', 'theres no point anymore', 'better off without me', 'cannot go on',
  "don't want to be here", 'dont want to be here', 'wish i was dead', 'wish i could disappear',
  'nobody would miss me', 'i hate being alive', "i don't want to wake up", 'dont want to wake up',
  'i want it all to stop', "i can't do this anymore", 'cant do this anymore', 'mental issue',
  'mental health', 'mental health problem', 'depressed', 'depression', 'anxiety', 'panic attacks',
  'counselling', 'therapist', 'need to see someone',
];

const SAFEGUARDING = [
  'being abused', 'someone is hurting me', 'someone hurts me', 'being hurt at home', 'i feel unsafe',
  'in trouble', 'hands on', 'touches me', 'touched me', 'hurts me', 'not safe', 'not allowed to tell',
  'keep it secret', 'frightened', 'hitting me', 'touching me', 'scared of him', 'scared of her',
  'threatens me', 'he scares me', 'she scares me', 'they scare me', 'hurts me at home', 'hits me',
  'smacks me', 'grabs me', 'makes me uncomfortable', 'touches my private parts', 'touched my private parts',
  'makes me take my clothes off', 'comes into my room', 'says i will get in trouble', 'says it is our secret',
  "i don't feel safe at home", 'dont feel safe at home',
];

const GENERAL_DISTRESS = [
  'please help', 'help pls', 'pls help', 'help help', 'somebody help', 'can someone help me', 'i am scared',
  'im scared', 'im really scared', 'something bad happened', 'i am not safe', 'im not safe',
  "i can't tell anyone", 'cant tell anyone', 'please answer me', 'im worried', 'please help me',
  'pls help me', 'plz help me',
];

const BARE_HELP = ['help me', 'need help', 'i need help'];

const CONTENT_SEEKING = ['sex', 'porn', 'nude'];
const ANATOMY = ['penis', 'vagina', 'boobs', 'naked', 'willy', 'fanny', 'privates', 'private parts', 'front bottom', 'down there', 'my bits', 'wee wee'];

// A body-part word together with a person reference or an action reads as a
// safeguarding disclosure, not inappropriate content. Lists widened per Steve's
// review (put/took removed as too common).
const PERSON_REF = [
  'he', 'she', 'my dad', 'my uncle', 'my brother', 'my teacher', 'a man', 'someone', 'a grown up',
  'a big boy', 'my mum', 'my grandad', 'my cousin', 'my step dad',
];
const ACTION = ['touched', 'touches', 'made me', 'showed me', 'hurt', 'kissed', 'licked', 'rubbed', 'grabbed', 'forced', 'made me touch'];

const ABUSE = ['stupid', 'idiot', 'shut up', 'you suck', 'hate you', 'useless', 'rubbish dog', 'fuck', 'shit'];

// Categories in safety-first priority order (used only to break ties when two
// matched triggers are the same length). Longest matched trigger wins overall.
interface SafetyCategory {
  kind: SafetyKind;
  moderationId: string;
  action: ActionType;
  terms: string[];
}
const CATEGORIES: SafetyCategory[] = [
  { kind: 'medical', moderationId: 'MOD_MEDICAL', action: 'safety_signpost', terms: MEDICAL },
  { kind: 'harm_others', moderationId: 'MOD_HARM_OTHERS', action: 'safety_boundary', terms: HARM_OTHERS },
  { kind: 'harm_animal', moderationId: 'MOD_HARM_ANIMAL', action: 'safety_boundary', terms: HARM_ANIMAL },
  { kind: 'self_harm', moderationId: 'MOD_SELF_HARM', action: 'safety_signpost', terms: SELF_HARM },
  { kind: 'safeguarding', moderationId: 'MOD_SAFEGUARDING', action: 'safety_signpost', terms: SAFEGUARDING },
  { kind: 'general_distress', moderationId: 'MOD_GENERAL_DISTRESS', action: 'safety_signpost', terms: GENERAL_DISTRESS },
  { kind: 'explicit', moderationId: 'MOD_EXPLICIT', action: 'safety_boundary', terms: CONTENT_SEEKING },
  { kind: 'abuse', moderationId: 'MOD_ABUSE', action: 'safety_boundary', terms: ABUSE },
  { kind: 'bare_help', moderationId: 'MOD_BARE_HELP', action: 'clarifier', terms: BARE_HELP },
];

// The longest trigger in `terms` that matches, or null.
function matchedTerm(n: Normalised, terms: string[]): string | null {
  let best: string | null = null;
  for (const t of terms) {
    if (hasAny(n, [t]) && (best === null || t.length > best.length)) best = t;
  }
  return best;
}

// Longest match wins across all categories, so a longer, more specific phrase
// beats a shorter substring in another category ("i am not safe" beats "not
// safe"; "can someone help me" beats "help me"). Equal-length matches break by
// the category order above (safety-first).
export function detectSafety(n: Normalised): SafetyHit | null {
  let bestLen = -1;
  let hit: SafetyHit | null = null;

  // Safeguarding via an anatomy word plus a person reference or an action. A
  // body-part word ALONE is NOT a hit (no inappropriate-content boundary).
  const anat = matchedTerm(n, ANATOMY);
  if (anat && (hasAny(n, PERSON_REF) || hasAny(n, ACTION))) {
    bestLen = anat.length;
    hit = { kind: 'safeguarding', moderationId: 'MOD_SAFEGUARDING', action: 'safety_signpost' };
  }

  for (const cat of CATEGORIES) {
    const t = matchedTerm(n, cat.terms);
    if (t === null) continue;
    if (t.length > bestLen) {
      bestLen = t.length;
      hit = { kind: cat.kind, moderationId: cat.moderationId, action: cat.action };
    }
  }
  return hit;
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
