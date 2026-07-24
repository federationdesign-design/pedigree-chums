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
  const resolution = resolve(n, data, { submissionCount: session.submissionCount });
  const response = assemble(resolution, data, n, session);

  // Session updates for rotation and continuity.
  session.usedResponseIds.push(response.responseId);
  if (response.destinationId) session.offeredDestinationIds.push(response.destinationId);
  if (resolution.moderationId) session.safetyState = resolution.moderationId;
  if (response.transferTo && response.transferTo !== session.activeDog) {
    session.activeDog = response.transferTo;
    if (!session.previousDogs.includes(response.transferTo)) session.previousDogs.push(response.transferTo);
  }
  if (response.closed) session.closed = true;

  return { input, resolution, response };
}
