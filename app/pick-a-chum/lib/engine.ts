// Orchestrator: normalise -> resolve priority/bucket -> assemble -> update
// session. Pure and deterministic. Mutates the passed session in place; callers
// that need immutability (React) pass a clone.

import { ChumData, Resolution } from './types';
import { normalise } from './normalise';
import { resolve } from './router';
import { assemble, Assembled } from './assembler';
import { Session } from './session';

export interface Turn {
  input: string;
  resolution: Resolution;
  response: Assembled;
}

export function submit(data: ChumData, session: Session, input: string): Turn {
  session.submissionCount += 1;
  const n = normalise(input);
  const dog = session.activeDog; // whose bark game this message belongs to
  const resolution = resolve(n, data, {
    submissionCount: session.submissionCount,
    activeDog: dog,
    barkStreak: session.barkStreakByDog[dog] ?? 0,
    barkCompleted: session.barkCompletedByDog[dog] ?? false,
    lastAction: session.lastAction,
    anatomyRedirectUsed: session.anatomyRedirectUsed,
  });
  const response = assemble(resolution, data, n, session);

  // The bark game (per dog): a bark exchange extends this dog's streak and the
  // fifth completes it; a post-completion bark leaves state untouched; anything
  // else resets this dog's unfinished streak (completion persists).
  if (resolution.action === 'bark' || resolution.action === 'bark_break') {
    session.barkStreakByDog[dog] = (session.barkStreakByDog[dog] ?? 0) + 1;
    if (resolution.action === 'bark_break') session.barkCompletedByDog[dog] = true;
  } else if (resolution.action !== 'bark_ack') {
    session.barkStreakByDog[dog] = 0;
  }

  // Session updates for rotation and continuity.
  session.usedResponseIds.push(response.responseId);
  if (response.destinationId) session.offeredDestinationIds.push(response.destinationId);
  if (resolution.moderationId) session.safetyState = resolution.moderationId;
  if (response.transferTo && response.transferTo !== session.activeDog) {
    // Switching dogs resets the dog we are leaving (completion is kept).
    session.barkStreakByDog[session.activeDog] = 0;
    session.activeDog = response.transferTo;
    if (!session.previousDogs.includes(response.transferTo)) session.previousDogs.push(response.transferTo);
  }
  if (response.closed) session.closed = true;
  if (resolution.action === 'anatomy_redirect') session.anatomyRedirectUsed = true; // max 1 per session
  session.lastAction = resolution.action; // for the next turn's clarifier follow-up

  return { input, resolution, response };
}
