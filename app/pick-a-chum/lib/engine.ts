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

// After a protected safety state, these families must not be selected until a
// meaningful non-safety topic is established (the safety guard). A meaningful
// topic clears the latch.
const BLOCKED_AFTER_SAFETY = new Set(['orientation', 'fun_tease', 'open_discount_popup', 'transfer']);
const MEANINGFUL_TOPIC = new Set(['breed_answer', 'rules_answer', 'faq_answer', 'gk_answer', 'link']);
// Weak routes that, after a complaint answer, should stay in the complaint context.
const WEAK_AFTER_COMPLAINT = new Set(['fallback', 'gk_unknown', 'gibberish', 'clarifier']);

export function submit(data: ChumData, session: Session, input: string): Turn {
  session.submissionCount += 1;
  const n = normalise(input);
  const dog = session.activeDog; // whose bark game this message belongs to
  let resolution = resolve(n, data, {
    submissionCount: session.submissionCount,
    activeDog: dog,
    barkStreak: session.barkStreakByDog[dog] ?? 0,
    barkCompleted: session.barkCompletedByDog[dog] ?? false,
    lastAction: session.lastAction,
    anatomyRedirectUsed: session.anatomyRedirectUsed,
  });

  // Safety guard: once a protected safety state has fired this session, do not let
  // comedy/game/sales/orientation be selected. Redirect to the neutral fallback.
  if (session.safetyLatched && BLOCKED_AFTER_SAFETY.has(resolution.action)) {
    resolution = { layer: 9, layerName: 'Recognised conversation', bucket: 'B13', action: 'fallback' };
  }

  // Complaint context: a weak follow-up after a complaint answer stays in the
  // complaint (the human-contact FAQ), rather than falling to the catch-all.
  if (session.lastWasComplaint && !session.safetyLatched && WEAK_AFTER_COMPLAINT.has(resolution.action)) {
    resolution = { layer: 4, layerName: 'FAQ knowledge', bucket: 'B04', action: 'faq_answer', faqId: 'FAQ012' };
  }

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
  // Safety guard latch: a protected safety state sets it; a meaningful topic clears it.
  if (resolution.action === 'safety_signpost' || resolution.action === 'safety_boundary') session.safetyLatched = true;
  else if (MEANINGFUL_TOPIC.has(resolution.action)) session.safetyLatched = false;
  session.lastWasComplaint = resolution.faqId === 'FAQ012'; // complaint follow-up context
  session.lastAction = resolution.action; // for the next turn's clarifier follow-up

  return { input, resolution, response };
}
