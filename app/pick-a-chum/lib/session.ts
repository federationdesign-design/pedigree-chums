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
    barkStreakByDog: {},
    barkCompletedByDog: {},
  };
}
