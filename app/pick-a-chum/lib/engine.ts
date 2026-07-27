// Orchestrator: normalise -> resolve priority/bucket -> assemble -> update
// session. Pure and deterministic. Mutates the passed session in place; callers
// that need immutability (React) pass a clone.

import { ChumData, Resolution } from './types';
import { normalise } from './normalise';
import { resolve } from './router';
import { assemble, Assembled } from './assembler';
import { Session, Topic } from './session';
import { detectSadnessClear } from './safety';

// Task 27: classify a resolution's subject KIND for the topic slot. This is a subject
// classifier, not a rival MEANINGFUL_TOPIC set (which stays in its S12 role only). A
// breed page carries its slug as the subject; the others carry a stable label.
function topicOf(r: Resolution): Topic | null {
  switch (r.action) {
    case 'breed_page':
      return r.breedSlug ? { kind: 'breed', subject: r.breedSlug } : null;
    case 'open_discount_popup':
      return { kind: 'commercial', subject: 'the game' };
    case 'fun_tease':
    case 'rules_answer':
      return { kind: 'game', subject: 'the game' };
    case 'link':
      return { kind: 'article', subject: r.destinationId ?? 'that page' };
    default:
      return null;
  }
}

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

// Task 25b: the FAQ015 complaint answer is served in full ONCE per complaint context;
// subsequent complaint-context turns get this approved short repeat instead of the same
// line five times. Approved by Steve, verbatim.
const COMPLAINT_REPEAT_LINE = 'Noted. Put that in the email too and someone will look at it.';

// Task 29: the repair ladder. A "failed understanding" is an unresolved catch-all outcome;
// consecutive ones climb the three approved rungs. A valid new intent (anything that
// resolves, including safety) cancels the ladder and resets the count. Approved lines,
// verbatim (provided directly by Steve; not yet in the generated Collie Responses). No
// dynamic candidates, no slots.
// A "failed understanding" is the B13 free-text catch-all: the router could not resolve the
// message at all. gk_unknown (a deliberate refuse-to-guess), gibberish (keyboard smash) and
// emoji_only each keep their own diagnostic line, so they are NOT ladder rungs; like any
// non-catch-all turn they cancel the ladder and reset the count.
const FAILED_UNDERSTANDING = new Set(['fallback']);
const REPAIR_LADDER: Record<number, { id: string; text: string }> = {
  1: { id: 'REPAIR-L1', text: 'That one got past me. Say it a different way and I will try again.' },
  2: { id: 'REPAIR-L2', text: 'That could mean a few things. Do you mean a dog breed, or how the card game works?' },
  3: { id: 'REPAIR-L3', text: 'I could not sort that out, and I am sorry. Come back another time with a different question. Goodbye.' },
};

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
    topic: session.topic,
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

  // Task 25b: complaint short-repeat. The first FAQ015 turn serves the full answer; while
  // the complaint context holds, subsequent FAQ015 turns get the short repeat line. The
  // reset when the context ends (a clear topic change) is handled with lastWasComplaint below.
  if (resolution.faqId === 'FAQ015') {
    if (session.complaintOpened) {
      response.text = COMPLAINT_REPEAT_LINE;
      response.responseId = 'B04-FAQ015-REPEAT';
    } else {
      session.complaintOpened = true;
    }
  }

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

  // Task 29: the repair ladder. Only outside a protected state (the S12 machine owns those
  // turns). A failed understanding climbs the ladder and its response is replaced by the
  // rung's approved line; a fourth consecutive miss leaves the plain catch-all (so no rung
  // ever repeats). Anything that resolves, or a safety signal, is a valid new intent that
  // cancels the ladder and resets the count.
  if (session.protectedState === null && FAILED_UNDERSTANDING.has(resolution.action)) {
    session.repairCount += 1;
    const rung = REPAIR_LADDER[session.repairCount];
    if (rung) {
      response.text = rung.text;
      response.responseId = rung.id;
    }
  } else {
    session.repairCount = 0;
  }

  session.lastWasComplaint = resolution.faqId === 'FAQ015'; // complaint follow-up context (Task 18)
  if (!session.lastWasComplaint) session.complaintOpened = false; // Task 25b: a clear topic change ends the complaint context, so the next complaint gets the full answer again
  // Task 27: dialogue-state update. Point 4 is a safety requirement, not tidiness: the
  // topic must NOT survive into PROTECTED_ACTIVE, so it (and the previous topic) is cleared
  // whenever the state is active. Otherwise a topic-bearing turn sets the current topic,
  // demoting the previous one so an explicit return has something to restore.
  if (session.protectedState === 'active') {
    session.topic = null;
    session.previousTopic = null;
  } else {
    const newTopic = topicOf(resolution);
    if (newTopic) {
      if (session.topic && session.topic.subject !== newTopic.subject) session.previousTopic = session.topic;
      session.topic = newTopic;
    }
  }
  session.lastAction = resolution.action; // for the next turn's clarifier follow-up

  return { input, resolution, response };
}
