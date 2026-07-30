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
  repairCount: number; // Task 29: consecutive failed-understanding turns (the repair ladder rung); a valid intent resets it
  // Task 56: the dog-led loop counters. Not read by anything yet (no flag, no served change).
  // noActionCount increments wherever the fallback path fires today (the same trigger as the
  // repair ladder: FAILED_UNDERSTANDING outside a protected state), capped at 4. The fourth
  // consecutive fire rolls it over: it resets to 0 and increments completedLoops. It is also
  // reset to 0 by any non-fallback resolution (a successful route, game start, safety route,
  // stop or goodbye all fall through to the reset), and both reset on a new session.
  noActionCount: number;
  completedLoops: number; // Task 56: how many times noActionCount was reset by reaching 4
  // Task 57: the dog-led loop's candidate subject, carried for one turn. Set on a fallback-family
  // turn (the fallback catch-all or the GK refuse-to-guess) outside a protected state to the
  // canonical inside-world entity found in the input, or null when none is present. Cleared to
  // null on every other turn. Not read by anything yet (no served change).
  candidateSubject: string | null;
  // Task 58: the dog-led loop's session-level flags. candidateEverFound latches true the first
  // time any candidate subject is found this session (D3: the ORIENT nudge is withheld if the
  // visitor is exploring rather than stuck). orientServed caps the ORIENT nudge at once per
  // session. Both reset on a new session.
  candidateEverFound: boolean;
  orientServed: boolean;
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
    repairCount: 0,
    noActionCount: 0,
    completedLoops: 0,
    candidateSubject: null,
    candidateEverFound: false,
    orientServed: false,
    pendingConfirm: null,
    topic: null,
    previousTopic: null,
    barkStreakByDog: {},
    barkCompletedByDog: {},
  };
}
