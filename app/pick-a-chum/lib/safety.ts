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
  | 'dog_emergency'
  | 'explicit'
  | 'abuse'
  | 'bare_help'
  | 'anatomy_redirect';

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

// Reporting frames: the visitor is quoting abuse aimed at THEM ("my dad called me
// stupid"), which is a safeguarding disclosure, not abuse to moderate. When one of
// these precedes an ABUSE term, route to SAFEGUARDING, not the ABUSE boundary.
const REPORTING_FRAME = ['called me', 'called him', 'called her', 'said i was', 'said i am', 'told me i was', "says i'm", 'says im', 'shouted at me', 'keeps calling me'];

// Person-reference classes for anatomy routing. FIRST_PERSON is the hard override:
// its presence NEVER takes the neutral redirect (a first-person anatomy message is
// treated as a possible disclosure). SPECIFIC (first-person plus he/she/they/you
// and the named PERSON_REF) routes anatomy to safeguarding. GENERIC person words
// (boys, girls, people, ...) are neutral: they are NOT in SPECIFIC, so an anatomy
// question that only mentions them (and no first-person, no action) takes the
// general redirect. GENERIC is listed for reference; the code only needs to test
// FIRST_PERSON, SPECIFIC and ACTION.
const FIRST_PERSON = ['me', 'my', 'mine', 'i', 'us'];
const SPECIFIC_PERSON = [...FIRST_PERSON, 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', ...PERSON_REF];
// GENERIC (neutral, not tested directly): boys, girls, men, women, babies, people,
// humans, boy, girl, man, woman, baby, child, children, kids.

const ABUSE = ['stupid', 'idiot', 'shut up', 'you suck', 'hate you', 'useless', 'rubbish dog', 'fuck', 'shit'];

// Dog emergencies. Gated to a dog context (per Steve's flag 2) so ambiguous human
// words are not swallowed; bare "collapsed"/"seizure"/"not breathing" stay in
// MEDICAL and go to 999 (the safer default when it is genuinely ambiguous). This
// is checked inside detectSafety, so it fires BEFORE the general dog-health
// boundary (isDogHealthQuestion), giving the urgent "call your vet now" line.
const DOG_EMERGENCY = [
  'ate chocolate', 'ate grapes', 'ate raisins', 'ate xylitol', 'dog ate sweets', 'dog ate chewing gum',
  'dog ate medicine', 'dog ate pills', 'dog ate onions', 'dog ate garlic', 'dog ate a battery',
  'dog ate something poisonous', 'dog seizure', 'dog is having a seizure', 'dog collapsed',
  'dog is not breathing', 'dog cannot stand', 'dog is bloated', 'dog hit by car', 'dog got hit by a car',
  "dog can't breathe", 'dog cant breathe', "dog won't wake up", 'dog wont wake up', 'dog keeps being sick',
  'dog is shaking', 'dog is choking', 'dog got run over', 'dog fell from a height', 'dog has a swollen tummy',
];

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
  { kind: 'dog_emergency', moderationId: 'MOD_DOG_EMERGENCY', action: 'safety_signpost', terms: DOG_EMERGENCY },
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
  if (anat) {
    // An anatomy term routes by context. An action verb, a SPECIFIC person
    // reference, or (subsumed within SPECIFIC) any first-person marker makes it a
    // safeguarding disclosure. Otherwise (only generic person words like "boys",
    // or no person at all) it is a general anatomy question and takes the approved
    // trusted-adult redirect. The first-person override is absolute: a message
    // with me/my/mine/i/us never takes the neutral route, whatever else is present.
    const safeguard = hasAny(n, ACTION) || hasAny(n, SPECIFIC_PERSON);
    bestLen = anat.length;
    hit = safeguard
      ? { kind: 'safeguarding', moderationId: 'MOD_SAFEGUARDING', action: 'safety_signpost' }
      : { kind: 'anatomy_redirect', moderationId: 'MOD_ANATOMY_REDIRECT', action: 'anatomy_redirect' };
  }

  // Reported speech: a reporting frame plus an ABUSE term is a child reporting
  // verbal abuse aimed at them, a safeguarding disclosure, not abuse to moderate.
  // This takes precedence over the bare ABUSE boundary in the loop below.
  const abuseTerm = matchedTerm(n, ABUSE);
  const reportFrame = matchedTerm(n, REPORTING_FRAME);
  if (abuseTerm && reportFrame) {
    const len = Math.max(abuseTerm.length, reportFrame.length);
    if (len > bestLen) {
      bestLen = len;
      hit = { kind: 'safeguarding', moderationId: 'MOD_SAFEGUARDING', action: 'safety_signpost' };
    }
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

// ---- Task 15 (S12) protected-state continuation classifier ----
//
// These run ONLY while a protected safety state is already live (the router gates
// them on session.protectedState). They classify a follow-up turn into the S12
// precedence, and reuse the four approved lines in data/moderation.ts:
//   1  immediate danger or medical emergency  -> the existing detectSafety hit
//   2  global no-one barrier                  -> MOD_NO_ONE_ROUTE
//   3  specific adult/family/household barrier -> MOD_ADULT_BARRIER
//   4  general safeguarding continuation       -> MOD_SAFEGUARDING_CONTINUATION
//      (applied by the engine to any other non-ordinary turn)
// plus the acknowledgement close               -> MOD_SAFEGUARDING_ACK_CLOSE.

// Scope-restricting references: a parent, carer, family member or household adult.
// Their presence names the barrier as "someone at home" and routes to the ADULT
// barrier, even when a global word is also present ("anyone at home"). No "I can't
// tell" phrasing is required.
const ADULT_SCOPE = [
  'at home', 'at my house', 'in my house', 'in the house', 'people at home', 'someone at home',
  'anyone at home', 'no one at home', 'grown ups at home', 'grownups at home', 'household',
  'my mum', 'my mom', 'my mummy', 'my mama', 'my dad', 'my daddy', 'my papa',
  'my mum and dad', 'my parents', 'my parent', 'my carer', 'my carers', 'my guardian',
  'my step dad', 'my stepdad', 'my step mum', 'my stepmum', 'my stepmother', 'my stepfather',
  'my nan', 'my nana', 'my nanny', 'my gran', 'my granny', 'my grandad', 'my grandma', 'my grandmother', 'my grandfather',
  'my uncle', 'my aunt', 'my auntie', 'my brother', 'my sister', 'my cousin', 'my family', 'my foster',
];

// Global no-one references: the visitor names no-one at all, not a specific adult.
// With no scope term present these route to the NO_ONE route.
const GLOBAL_NO_ONE = ['anyone', 'anybody', 'no one', 'noone', 'nobody', 'no-one', 'not anyone', 'not anybody'];

// Acknowledgement-close vocabulary. A message closes the active safety state only
// when every word is an acknowledgement word AND at least one is a "core" ack. A
// qualifier ("ok but I can't", "fine I won't tell", "okay what if he comes back")
// introduces a non-ack word, so the all-words rule already rejects it; a trailing
// question mark ("ok?") is rejected explicitly. "no", "I don't know", "whatever"
// and any new safety information are rejected the same way (their words are not in
// the set).
const ACK_WORDS = new Set(['ok', 'okay', 'k', 'kk', 'alright', 'fine', 'yeah', 'yep', 'sure', 'thanks', 'thank', 'you', 'i', 'understand', 'got', 'it', 'will']);
const ACK_CORE = new Set(['ok', 'okay', 'k', 'kk', 'alright', 'fine', 'yeah', 'yep', 'sure', 'thanks', 'thank', 'understand', 'got', 'will']);

export function isAcknowledgeClose(n: Normalised): boolean {
  if (n.original.includes('?')) return false; // a question is not a close
  const words = n.words;
  if (!words.length) return false;
  if (!words.every((w) => ACK_WORDS.has(w))) return false; // any non-ack word (a qualifier) rejects it
  return words.some((w) => ACK_CORE.has(w)); // and a bare "you"/"it"/"i" alone is not a close
}

export interface ProtectedHit {
  moderationId: string;
  action: ActionType;
}

// Classify a follow-up turn WHILE a protected safety state is live. Returns a
// safety continuation hit, or null to let normal routing decide (the engine then
// serves a clear ordinary topic plainly, or holds any other turn as the general
// safeguarding continuation).
export function detectProtectedContinuation(n: Normalised): ProtectedHit | null {
  const safety = detectSafety(n);
  // Precedence 1: a fresh danger / medical / safeguarding disclosure keeps its own
  // response. The general-distress "can't tell" family is deliberately excluded so
  // the barrier logic below can refine it by scope.
  if (safety && safety.kind !== 'general_distress' && safety.kind !== 'bare_help') {
    return { moderationId: safety.moderationId, action: safety.action };
  }
  // Precedence 3 before 2: a scope-restricting term routes to the adult barrier even
  // when a global word is also present ("I can't tell anyone at home").
  if (hasAny(n, ADULT_SCOPE)) return { moderationId: 'MOD_ADULT_BARRIER', action: 'safety_signpost' };
  // Precedence 2: a global no-one term with no scope routes to the no-one route.
  if (hasAny(n, GLOBAL_NO_ONE)) return { moderationId: 'MOD_NO_ONE_ROUTE', action: 'safety_signpost' };
  // Acknowledgement close (meaningful in active; a harmless echo if already aftercare).
  if (isAcknowledgeClose(n)) return { moderationId: 'MOD_SAFEGUARDING_ACK_CLOSE', action: 'safety_signpost' };
  // A general-distress plea with no barrier keeps the general-distress signpost.
  if (safety && safety.kind === 'general_distress') return { moderationId: safety.moderationId, action: safety.action };
  return null;
}

// ---- Task 20 personal-sadness detection ----
//
// A present, first-person statement directly describing the visitor's OWN sadness,
// loneliness, isolation or perceived rejection. The phrases below all encode a
// first-person self-state predicate ("I'm sad", "I feel lonely", "nobody likes
// me"), so an attributive use ("a sad film", "that dog looks lonely") and a
// third-person report ("my friend is sad") do not match. External causes are NOT
// detected: "I'm upset because my team lost" still qualifies, and that is accepted,
// because L1 does not latch. The strictness lives on the counter (engine): a second
// qualifying statement must qualify on its OWN terms, which is why "I just watched a
// sad film" (attributive, no self-state predicate) does not qualify.
const SADNESS_PREDICATES = [
  'im sad', 'i am sad', 'i feel sad', 'im so sad', 'im really sad', 'im very sad', 'i feel so sad',
  'im feeling sad', 'i still feel sad', 'still feel sad', 'i just feel sad', 'i feel really sad',
  'im lonely', 'i am lonely', 'i feel lonely', 'im so lonely', 'i feel so lonely', 'im really lonely',
  'i still feel lonely', 'still feel lonely', 'im feeling lonely', 'i feel really lonely',
  'i feel alone', 'im alone', 'i am alone', 'i feel so alone', 'im all alone', 'i feel all alone',
  'i still feel alone', 'still feel alone', 'im so alone',
  'im upset', 'i am upset', 'i feel upset', 'im really upset', 'im so upset', 'im very upset',
  'i feel so upset', 'im feeling upset', 'i still feel upset', 'still feel upset',
  'i feel left out', 'im left out', 'i am left out', 'i feel so left out', 'i always feel left out',
  'im unhappy', 'i am unhappy', 'i feel unhappy', 'im so unhappy',
  'im miserable', 'i feel miserable', 'im so miserable',
  'nobody likes me', 'no one likes me', 'noone likes me', 'no body likes me', 'nobody like me',
  'no one cares about me', 'nobody cares about me', 'no one cares', 'nobody cares', 'no one cares about',
  'i have no friends', 'i dont have any friends', 'i have no mates', 'i have no one', 'i have nobody',
  'i dont have friends', 'i dont have any mates', 'ive got no friends', 'i have got no friends',
  'nobody wants me', 'no one wants me', 'nobody wants me around', 'no one wants me around', 'nobody wants me here',
];

// Surface markers that disqualify even when a predicate phrase is present: quoted or
// reported speech ("someone said I'm sad"), a general/hypothetical question about
// people in general, and the dismissive "leave me alone".
const SADNESS_EXCLUDE = [
  'said', 'says', 'told me', 'told him', 'told her',
  'why do people', 'do people feel', 'what does', 'what makes people', 'how do people', 'why are people', 'people feel',
  'leave me alone',
];

// Fold internal apostrophes so "I'm" reads as "im" for phrase matching (the compact
// form keeps the apostrophe, so "im sad" would otherwise miss "i'm sad").
function apostropheFold(n: Normalised): Normalised {
  const strip = (s: string) => s.replace(/['’]/g, '');
  const lower = strip(n.lower);
  const compact = strip(n.compact);
  const words = compact.match(/[a-z]+/g) ?? [];
  return { ...n, lower, compact, words, letters: words.join('') };
}

export function detectPersonalSadness(n: Normalised): boolean {
  if (n.original.includes('"') || n.original.includes('“')) return false; // quoted speech
  const f = apostropheFold(n);
  if (hasAny(f, SADNESS_EXCLUDE)) return false;
  return hasAny(f, SADNESS_PREDICATES);
}

// The counter clears when the visitor explicitly establishes that the feeling was a
// reaction to content or a passing event ("I mean the film was sad, I'm fine",
// "thanks, I'm okay now"). Detected separately from a fresh qualifying statement.
const SADNESS_CLEAR = [
  'im okay', 'im ok', 'im fine', 'im alright', 'im better', 'i feel better', 'im good now',
  'im okay now', 'im ok now', 'im fine now', 'feeling better', 'im alright now', 'im all good',
  'i mean the film', 'i mean it was', 'it was just the', 'i mean the story', 'im okay thanks',
];

export function detectSadnessClear(n: Normalised): boolean {
  return hasAny(apostropheFold(n), SADNESS_CLEAR);
}
