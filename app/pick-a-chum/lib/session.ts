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
  lastBreedSlug: string | null; // the breed most recently established, for follow-up questions
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
    lastBreedSlug: null,
    barkStreakByDog: {},
    barkCompletedByDog: {},
  };
}
