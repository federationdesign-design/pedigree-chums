// Shared session state (brief section 13). Browser-session lifetime; no account.

import { Dog, ActionType } from './types';

// S12 protected-state machine (Task 15). Two states only:
//   'active'    a safety state is live: only safety responses route (games, sales,
//               comedy, orientation and ordinary variation are all held back).
//   'aftercare' the visitor acknowledged or moved to a clear ordinary topic:
//               ordinary factual answers, rules and navigation are served plainly,
//               but games, sales, teasing and comic variants stay blocked for the
//               rest of the session. A new safety signal returns to 'active'.
//   null        no protected state has fired.
export type ProtectedState = 'active' | 'aftercare' | null;

// Task 27: dialogue state (register item 11). The current subject and its kind, carried
// across turns so an explicit return can restore it. `subject` is the breed slug for a
// breed topic (folding in the old lastBreedSlug), and a stable label otherwise.
export interface Topic {
  kind: 'breed' | 'commercial' | 'game' | 'article';
  subject: string;
}

export interface Session {
  activeDog: Dog;
  submissionCount: number; // human submissions so far
  usedResponseIds: string[]; // exact-line rotation
  offeredDestinationIds: string[]; // destination rotation
  previousDogs: Dog[]; // for returning-dog lines
  safetyState: string | null; // last moderation id, if any
  closed: boolean; // Boxer cut-off performed
  lastAction: ActionType | null; // the previous turn's resolved action (for clarifier follow-up)
  anatomyRedirectUsed: boolean; // ANATOMY_GENERAL_REDIRECT fires at most once per session
  protectedState: ProtectedState; // S12 protected-state machine (Task 15)
  personalSadnessCount: number; // Task 20: qualifying personal-sadness statements this session (L1 at 1, L2 at 2)
  lastWasComplaint: boolean; // the previous turn answered the complaint/contact FAQ (for follow-up context)
  complaintOpened: boolean; // Task 25b: the full FAQ015 complaint answer was already served this context (subsequent turns get the short repeat)
  // Task 57: the dog-led loop's candidate subject, carried for one turn. Set on a fallback-family
  // turn (the fallback catch-all or the GK refuse-to-guess) outside a protected state to the
  // canonical inside-world entity found in the input, or null when none is present. Cleared to
  // null on every other turn.
  candidateSubject: string | null;
  // Task 79: whether the fallback's repeat (LOOP-01) has already fired in the current run of
  // consecutive fallback turns. LOOP-01 fires on the first candidate-bearing turn, once; a
  // non-fallback turn breaks the run and re-arms it. Reset on a new session. (Task 79 retired the
  // loop counter, the completed-loop count, the ORIENT nudge and the repair ladder: the fallback
  // now has exactly two outcomes, a repeat/offer for a subject or B40 "im a dog" for none.)
  loopRepeatUsed: boolean;
  // Task 68: the subject the previous turn offered via LOOP-01 (repeat) or LOOP-02 (destination),
  // awaiting a yes/no. A bare affirmation next turn routes to this subject's destination; anything
  // else (including "no") clears it and lets the loop advance. Set only when LOOP-01/LOOP-02 is
  // served; null otherwise. Reset on a new session.
  pendingConfirm: string | null;
  topic: Topic | null; // Task 27: the current subject + kind (folds in the old lastBreedSlug)
  previousTopic: Topic | null; // Task 27: the prior subject, so an explicit return has something to restore
  // The bark game: consecutive bark exchanges and completion, tracked per dog by
  // stable Dog id (a visitor can discover a version for each of the four dogs).
  barkStreakByDog: Partial<Record<Dog, number>>;
  barkCompletedByDog: Partial<Record<Dog, boolean>>;
}

export function newSession(activeDog: Dog = 'collie'): Session {
  return {
    activeDog,
    submissionCount: 0,
    usedResponseIds: [],
    offeredDestinationIds: [],
    previousDogs: [activeDog],
    safetyState: null,
    closed: false,
    lastAction: null,
    anatomyRedirectUsed: false,
    protectedState: null,
    personalSadnessCount: 0,
    lastWasComplaint: false,
    complaintOpened: false,
    candidateSubject: null,
    loopRepeatUsed: false,
    pendingConfirm: null,
    topic: null,
    previousTopic: null,
    barkStreakByDog: {},
    barkCompletedByDog: {},
  };
}
