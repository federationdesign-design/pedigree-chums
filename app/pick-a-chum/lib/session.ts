// Shared session state (brief section 13). Browser-session lifetime; no account.

import { Dog, ActionType } from './types';

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
  safetyLatched: boolean; // a protected safety state fired; block comedy/game/sales/orientation until a meaningful topic
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
    safetyLatched: false,
    lastWasComplaint: false,
    lastBreedSlug: null,
    barkStreakByDog: {},
    barkCompletedByDog: {},
  };
}
