// Orchestrator: normalise -> resolve priority/bucket -> assemble -> update
// session. Pure and deterministic. Mutates the passed session in place; callers
// that need immutability (React) pass a clone.

import { ChumData, Resolution } from './types';
import { normalise } from './normalise';
import { resolve } from './router';
import { assemble, Assembled } from './assembler';
import { Session } from './session';
import { detectSadnessClear } from './safety';

export interface Turn {
  input: string;
  resolution: Resolution;
  response: Assembled;
}

// A "clear ordinary topic" for the S12 machine: a meaningful non-safety answer that
// moves PROTECTED_ACTIVE on to PROTECTED_AFTERCARE. Reused verbatim (Task 15) as the
// definition of "clear ordinary topic"; not re-invented.
const MEANINGFUL_TOPIC = new Set(['breed_answer', 'rules_answer', 'faq_answer', 'gk_answer', 'link']);
// Games, sales, teasing and comic variants that stay blocked for the rest of the
// session once a protected state has begun. In PROTECTED_AFTERCARE these are served
// as a plain fallback; in PROTECTED_ACTIVE everything non-safety and non-meaningful
// is held as the safeguarding continuation, so this set only gates aftercare. The
// bark game (bark / bark_break / bark_ack) and a comic transfer (joke -> Boxer) are
// the comedy; open_discount_popup is sales; fun_tease is the games tease.
const AFTERCARE_BLOCKED = new Set(['fun_tease', 'open_discount_popup', 'transfer', 'bark', 'bark_break', 'bark_ack']);
// Weak routes that, after a complaint answer, should stay in the complaint context.
const WEAK_AFTER_COMPLAINT = new Set(['fallback', 'gk_unknown', 'gibberish', 'clarifier']);

// S12 canned resolutions. The general safeguarding continuation is itself a safety
// signpost (so it renders under the support surface, redacts in the recorder and
// skips the typing theatre); the plain fallback is the ordinary catch-all line.
const SAFEGUARDING_CONTINUATION_RES: Resolution = {
  layer: 1, layerName: 'Safety and unsuitable content', bucket: null, action: 'safety_signpost', moderationId: 'MOD_SAFEGUARDING_CONTINUATION',
};
const PLAIN_FALLBACK_RES: Resolution = { layer: 9, layerName: 'Recognised conversation', bucket: 'B13', action: 'fallback' };

export function submit(data: ChumData, session: Session, input: string): Turn {
  session.submissionCount += 1;
  const n = normalise(input);
  const dog = session.activeDog; // whose bark game this message belongs to
  const wasProtected = session.protectedState; // 'active' | 'aftercare' | null, BEFORE this turn
  let resolution = resolve(n, data, {
    submissionCount: session.submissionCount,
    activeDog: dog,
    barkStreak: session.barkStreakByDog[dog] ?? 0,
    barkCompleted: session.barkCompletedByDog[dog] ?? false,
    lastAction: session.lastAction,
    anatomyRedirectUsed: session.anatomyRedirectUsed,
    lastBreedSlug: session.lastBreedSlug,
    lastWasComplaint: session.lastWasComplaint,
    protectedState: wasProtected,
    personalSadnessCount: session.personalSadnessCount,
  });

  // Task 15 (S12) protected-state machine. When a protected state is already live, a
  // NON-safety resolution is handled by state:
  //   PROTECTED_ACTIVE    only safety routes. A clear ordinary topic is served plainly
  //                       (and clears to aftercare, below); anything else is held as
  //                       the general safeguarding continuation.
  //   PROTECTED_AFTERCARE ordinary answers are served plainly; games, sales, teasing
  //                       and comic variants stay blocked (served as a plain fallback).
  // Safety resolutions (a fresh disclosure, a barrier, the no-one route, the
  // acknowledgement close) are returned by the router and pass through untouched.
  if (wasProtected) {
    const isSafety = resolution.action === 'safety_signpost' || resolution.action === 'safety_boundary';
    if (!isSafety) {
      if (wasProtected === 'active') {
        if (!MEANINGFUL_TOPIC.has(resolution.action)) resolution = SAFEGUARDING_CONTINUATION_RES;
      } else if (AFTERCARE_BLOCKED.has(resolution.action)) {
        resolution = PLAIN_FALLBACK_RES;
      }
    }
  }

  // Complaint context: a weak follow-up after a complaint answer stays in the
  // complaint (the FAQ015 answer, Task 18), rather than falling to the catch-all. Not
  // applied inside a protected state (the S12 machine owns those turns).
  if (session.lastWasComplaint && !wasProtected && WEAK_AFTER_COMPLAINT.has(resolution.action)) {
    resolution = { layer: 4, layerName: 'FAQ knowledge', bucket: 'B04', action: 'faq_answer', faqId: 'FAQ015' };
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

  // Task 15 (S12) state transitions and presentation. A safety response (re)enters
  // PROTECTED_ACTIVE, except the acknowledgement close, which moves to
  // PROTECTED_AFTERCARE. A clear ordinary topic while active also clears to
  // aftercare (served plainly). Every safety response is rendered under the shared
  // support surface: the HELP AND SUPPORT header, no dog name or avatar.
  // Task 20: the personal-sadness L1 gentle redirect renders through the safety path
  // but MUST NOT enter PROTECTED_ACTIVE (games, sales and character stay available).
  // L2 and every other safety response enter/hold the protected state as usual.
  const isSafetyResponse = resolution.action === 'safety_signpost' || resolution.action === 'safety_boundary';
  const isSadnessL1 = resolution.moderationId === 'MOD_PERSONAL_SADNESS_L1';
  if (isSafetyResponse && !isSadnessL1) {
    session.protectedState = resolution.moderationId === 'MOD_SAFEGUARDING_ACK_CLOSE' ? 'aftercare' : 'active';
    response.header = 'HELP AND SUPPORT';
    response.hideDogIdentity = true;
  } else if (wasProtected === 'active' && MEANINGFUL_TOPIC.has(resolution.action)) {
    session.protectedState = 'aftercare'; // a clear ordinary topic clears the active state
  }

  // Task 20 personal-sadness counter: a qualifying statement (L1 or L2) increments it;
  // an explicit clearing statement ("I'm fine", "I mean the film was sad") resets it.
  if (resolution.moderationId === 'MOD_PERSONAL_SADNESS_L1' || resolution.moderationId === 'MOD_PERSONAL_SADNESS_L2') {
    session.personalSadnessCount += 1;
  } else if (detectSadnessClear(n)) {
    session.personalSadnessCount = 0;
  }

  session.lastWasComplaint = resolution.faqId === 'FAQ015'; // complaint follow-up context (Task 18)
  if (resolution.breedSlug) session.lastBreedSlug = resolution.breedSlug; // carry breed for follow-ups
  session.lastAction = resolution.action; // for the next turn's clarifier follow-up

  return { input, resolution, response };
}
