// Orchestrator: normalise -> resolve priority/bucket -> assemble -> update
// session. Pure and deterministic. Mutates the passed session in place; callers
// that need immutability (React) pass a clone.

import { ChumData, Resolution, Dog } from './types';
import { normalise, applyAliases, buildAliasMap } from './normalise';
import { resolve, resolveCanned, extractCandidateSubject } from './router';
import { startGame, applyMove, exitLine, gameExitText, GameResult } from './games';
import { assemble, Assembled } from './assembler';
import { Session, Topic } from './session';
import { detectSadnessClear, detectSafety, detectProtectedContinuation, detectPersonalSadness, detectGrief } from './safety';
import { matchReworded } from './matcher';
import { bioForRoute } from '../data/page-bios';

// Task 177 / 179: the "naming loop" -- a dog serving one line per reply from a fixed pool until it runs
// out, then silence. Two dogs use it: the Boxer names one of his ten /about misreads per reply, and the
// Labrador names one of his ten YES-tier foods per reply. Both reuse ONE mechanism (allow-list advance
// decision + no-repeat pool + break-on-real-reply), differing only in their pool and one Labrador tweak.
const BOXER_ABOUT_MISREADS: string[] = bioForRoute('/about')?.misreads ?? [];
// The pool of lines for a dog's loop, as {text, responseId}. Boxer: his /about misreads (source of truth
// shared with the appearance's misread #1). Labrador: the ten YES-tier (subtag 'food-yes') B32 rows,
// served by their OWN approved templates and real responseIds -- the A BIT and NEVER tiers are never
// drawn, so a food that would harm a dog is never named in the loop.
function loopItems(dog: Dog, data: ChumData): { text: string; responseId: string }[] {
  if (dog === 'boxer') return BOXER_ABOUT_MISREADS.map((t, i) => ({ text: t, responseId: `BOX-ABOUT-FACT-${i + 1}` }));
  if (dog === 'labrador') return data.labradorResponses.filter((r) => r.subtag === 'food-yes').map((r) => ({ text: r.template, responseId: r.responseId }));
  return [];
}
// The ONLY resolutions the loop is allowed to swallow. This is an ALLOW-LIST, not a deny-list, and that
// is the whole safety argument: a resolution advances the loop ONLY by appearing here. Safety, grief,
// personal sadness, the health boundary, moderation, commerce, rules, the FAQ, dismissals, goodbyes,
// breeds and every real route are ABSENT, so they win by default -- and a new safety or real action
// added to the engine later also wins by default, because no one added it here. The worst a miss can do
// is fail to advance the loop (a real reply is served instead); it can never swallow something serious.
//   FREE advance: pure reactions / nonsense that a disclosure can never resolve to (canned is matched on
//   exact triggers; gibberish is a keyboard smash; emoji is emoji; dog_fact is "tell me more"). Two
//   carve-outs handled at the call site: the Boxer's "stop" (note 'boxer_stop') breaks the loop for his
//   stop-gag, and for the Labrador a B32 food match (a named food, canned LAB-B32-*) breaks the loop so
//   its real tiered answer -- including a NEVER food's safety warning -- is served, never swallowed.
const LOOP_FREE_ADVANCE = new Set<string>(['canned', 'emoji_only', 'gibberish', 'dog_fact']);
//   GUARDED advance: the catch-all zone (a greeting, an unresolved word, a "why"). A disclosure that the
//   safety detector misses lands HERE (verified: "i am being bullied", "why does my dad hit me"), and a
//   disclosure is sentence-shaped -- so these advance on a lone token ("ok", "why", "hmm", "k") OR when
//   EVERY word is on the SAFE small-talk list below (Task 181: "me too", "i like that", "go on"). Any other
//   multi-word message here breaks and is answered normally (an "im a dog", never a fact or a food).
const LOOP_GUARDED_ADVANCE = new Set<string>(['converse', 'fallback', 'gk_unknown']);
// Task 181: the SAFE small-talk allow-list. A multi-word catch-all reply advances only if EVERY word is on
// it. The list is CLOSED -- a word advances by being here, nothing else -- so a disclosure, which always
// carries a harm / emotion / person word that is NOT here ("hurt", "scared", "alone", "hate", "hit", "dad",
// "someone", "feel", ...), still breaks. That is the whole safety argument: an allow-list of safe words can
// never let a disclosure through. Negations are deliberately OFF (they flip meaning: "not ok", "dont care").
const LOOP_SAFE_WORDS = new Set<string>([
  // pronouns / demonstratives (1st & 2nd person only), plus contraction remnants (i'm -> ['i','m'])
  'i', 'im', 'me', 'my', 'mine', 'we', 'us', 'our', 'you', 'youre', 'your', 'it', 'its', 'that', 'thats',
  'this', 'these', 'those', 'm', 's', 're', 'll', 've', 'd',
  // function words / connectors
  'a', 'an', 'the', 'and', 'or', 'but', 'so', 'to', 'of', 'for', 'as', 'at', 'in', 'on', 'up', 'with',
  'then', 'just', 'also', 'well', 'oh', 'ah', 'here', 'there',
  // neutral small-talk verbs
  'is', 'are', 'am', 'be', 'was', 'were', 'do', 'does', 'did', 'go', 'goes', 'going', 'get', 'got', 'keep',
  'know', 'think', 'see', 'like', 'likes', 'love', 'loves', 'agree', 'agreed', 'sounds', 'seems', 'makes',
  'mean', 'means',
  // agreement / mild-positive reactions ("no" / "nope" / "enough" are deliberately absent -- see LOOP_STOP)
  'yes', 'yeah', 'yep', 'yup', 'ok', 'okay', 'sure', 'same', 'too', 'right', 'true', 'cool', 'nice', 'good',
  'great', 'fun', 'funny', 'fine', 'fair', 'please', 'thanks', 'wow', 'haha', 'lol', 'really', 'definitely',
  'exactly', 'totally', 'indeed', 'lovely', 'brilliant',
  // wh- / continuation / quantity
  'what', 'how', 'why', 'more', 'else', 'some', 'bit', 'all', 'both', 'lot', 'lots',
]);
// Task 181: lone stop signals. "no" / "nope" / "enough" to a dog naming things mean "stop", so they break
// the loop -- but as lone fallbacks they would otherwise advance via the lone-token clause, so they are
// caught here. (A multi-word "no ..." already breaks, since "no" is off the SAFE list.)
const LOOP_STOP = new Set<string>(['no', 'nope', 'enough']);
// Task 181: true when a multi-word reply is entirely SAFE small-talk (so it may advance the loop).
function allLoopSafe(words: string[]): boolean {
  return words.length > 0 && words.every((w) => LOOP_SAFE_WORDS.has(w));
}

// Task 27: classify a resolution's subject KIND for the topic slot. This is a subject
// classifier, not a rival MEANINGFUL_TOPIC set (which stays in its S12 role only). A
// breed page carries its slug as the subject; the others carry a stable label.
function topicOf(r: Resolution): Topic | null {
  switch (r.action) {
    case 'breed_page':
      return r.breedSlug ? { kind: 'breed', subject: r.breedSlug } : null;
    case 'open_discount_popup':
    case 'price_answer':
      return { kind: 'commercial', subject: 'the game' };
    case 'offer_bark_game':
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
// as the neutral refusal (Task 34); in PROTECTED_ACTIVE everything non-safety and
// non-meaningful is held as the safeguarding continuation, so this set only gates aftercare. The
// bark game (bark / bark_break / bark_ack) and a comic transfer (joke -> Boxer) are
// the comedy; open_discount_popup is sales; fun_tease is the games tease.
// Task 140: 'page_bio' is added so the new page-bio route never serves inside PROTECTED_AFTERCARE
// (brief section 8). In PROTECTED_ACTIVE it is already held: it is not a MEANINGFUL_TOPIC, so it
// becomes the safeguarding continuation there.
// Task 142: the new play/deflection routes (clips, name acknowledgement/deflection) join the blocked
// set so none serves inside PROTECTED_AFTERCARE; in PROTECTED_ACTIVE they are not meaningful and are
// held as the safeguarding continuation.
const AFTERCARE_BLOCKED = new Set(['offer_bark_game', 'open_discount_popup', 'buy_clarify', 'transfer', 'bark', 'bark_break', 'bark_ack', 'price_answer', 'canned', 'game_start', 'game_move', 'game_exit', 'page_bio', 'media_reply', 'how_are_you', 'good_boy', 'name_ack', 'name_deflect', 'dog_lifespan', 'death_answer', 'god_answer', 'religion_dumb', 'religion_self', 'maths_answer']);
// The "old voice" routes a canned answer is allowed to override (Steve's decision): the identity
// spiel, the orientation nudge, the bare-help clarifier and any FAQ match. These resolve above the
// in-router canned check, so a matching canned trigger overrides them here. Safety, grief, breed
// pages, the bark game, commercial and every hard answer are NOT in this set, so they keep
// priority. Never applied in a protected state (the S12 machine owns those turns).
// Task 90 adds breed_choice / breed_page / the bark-game offer, so the exact canned triggers
// "whats better a labrador or a pug", "shes a spaniel", "say something funny" and "do you get bored"
// answer in the terse voice. breed_hub is deliberately NOT here: "show me a dog" keeps reaching Know
// Your Chums, the right destination. Still exact-match only, so a real breed/offer query is untouched.
const CANNED_OVERRIDABLE = new Set(['orientation', 'identity', 'clarifier', 'faq_answer', 'breed_choice', 'breed_page', 'offer_bark_game']);
// Weak routes that, after a complaint answer, should stay in the complaint context.
const WEAK_AFTER_COMPLAINT = new Set(['fallback', 'gk_unknown', 'gibberish', 'clarifier']);

// S12 canned resolutions. The general safeguarding continuation is itself a safety
// signpost (so it renders under the support surface, redacts in the recorder and
// skips the typing theatre); the plain fallback is the ordinary catch-all line.
const SAFEGUARDING_CONTINUATION_RES: Resolution = {
  layer: 1, layerName: 'Safety and unsuitable content', bucket: null, action: 'safety_signpost', moderationId: 'MOD_SAFEGUARDING_CONTINUATION',
};
// Task 34: in PROTECTED_AFTERCARE, a blocked game, sales or comedy request is declined
// with the approved neutral refusal, NOT the B13 plain fallback. The old fallback line
// advertised "dogs, games or the website", i.e. it offered a menu that re-advertised the
// very routes the aftercare guard had just blocked. This is a benign decline (its own
// non-safety action), so it does not re-enter PROTECTED_ACTIVE or render the support surface.
const AFTERCARE_REFUSAL_RES: Resolution = {
  layer: 1, layerName: 'Safety and unsuitable content', bucket: null, action: 'neutral_refusal', moderationId: 'MOD_AFTERCARE_REFUSAL',
};

// Task 31a: within PROTECTED_ACTIVE, an input that matches no safety continuation, barrier,
// emergency, acknowledgement or clear ordinary topic, AND did not resolve to any conversational
// action either (it fell through to the router's terminal catch-all: unresolved free text, a
// keyboard smash, or an unmapped emoji), gets this approved "unclear" continuation line rather
// than the general safeguarding continuation. It reuses the router's existing verdict, so there
// is no new gibberish or emoji detection here; a thumbs-up or tick is caught upstream as the
// acknowledgement close and never reaches this branch. Coherent continuations (e.g. "I dont know
// what to do" -> orientation) resolve to a named action and so keep MOD_SAFEGUARDING_CONTINUATION.
const SAFE_UNCLEAR_CONTINUATION_RES: Resolution = {
  layer: 1, layerName: 'Safety and unsuitable content', bucket: null, action: 'safety_signpost', moderationId: 'MOD_SAFE_UNCLEAR_CONTINUATION',
};
const UNRESOLVED_ACTIONS = new Set(['fallback', 'gibberish', 'emoji_only']);

// Task 25b: the FAQ015 complaint answer is served in full ONCE per complaint context;
// subsequent complaint-context turns get this approved short repeat instead of the same
// line five times. Approved by Steve, verbatim.
const COMPLAINT_REPEAT_LINE = 'Noted. Put that in the email too and someone will look at it.';

// Task 29: the repair ladder. A "failed understanding" is an unresolved catch-all outcome;
// consecutive ones climb the three approved rungs. A valid new intent (anything that
// resolves, including safety) cancels the ladder and resets the count. Approved lines,
// verbatim (provided directly by Steve; not yet in the generated Collie Responses). No
// dynamic candidates, no slots.
// Task 79: the fallback family. On one of these turns outside a protected state the fallback
// serves one of exactly two outcomes (a repeat/offer for a candidate subject, or B40 "im a dog"
// for none). It is the B13 free-text catch-all (action 'fallback') plus the deliberate GK
// refuse-to-guess (gk_unknown). The repair ladder, the loop counter, LOOP-03/04 and the ORIENT
// nudge were all retired in Task 79.
const FALLBACK_FAMILY = new Set(['fallback', 'gk_unknown']);

// Task 142 (change 3): the diversions. On the third consecutive no-subject turn, offer ONE of these
// (rotating), each a real place to go, with an action link. The four history offers deep-link to the
// anchors added on that page. Owner copy, flagged in PLACEHOLDERS.md for workbook migration.
const DIVERSIONS: { id: string; text: string; url: string; label: string }[] = [
  { id: 'DIVERSION-01', text: 'Ancient dogs of Britain?', url: '/britains-dog-history#ancient-dogs', label: 'Ancient dogs of Britain' },
  { id: 'DIVERSION-02', text: 'Medieval dogs?', url: '/britains-dog-history#medieval-dogs', label: 'Medieval dogs' },
  { id: 'DIVERSION-03', text: 'Tudor dogs?', url: '/britains-dog-history#tudor-britain', label: 'Tudor dogs' },
  { id: 'DIVERSION-04', text: 'Dogs in London?', url: '/britains-dog-history#dogs-in-london', label: 'Dogs in London' },
  { id: 'DIVERSION-05', text: 'What jobs we can do?', url: '/dogs-at-work', label: 'Dogs at Work' },
  { id: 'DIVERSION-06', text: 'Which chum suits you?', url: '/chum-calculator', label: 'Chum Finder' },
  { id: 'DIVERSION-07', text: 'Shall I name a dog?', url: '/name-generator', label: 'Name Generator' },
  { id: 'DIVERSION-08', text: 'The whole pack?', url: '/know-your-chums', label: 'Know Your Chums' },
];

// Task 115: a game B4x line's template text, or '' (an ongoing board has no line).
function gameCopy(data: ChumData, line: string): string {
  const row = data.collieResponses.find((r) => r.responseId === line);
  return row ? row.template : '';
}
// Task 115: fold a computed game result onto the resolution for the assembler: the responseId to serve,
// its copy with {{WORD}}/{{ANSWER}} substituted, and the monospace display block.
function serveGameResult(resolution: Resolution, data: ChumData, result: GameResult): void {
  // Task 164: a game may carry literal copy (the Boxer's scenario, a data record) rather than a bank
  // responseId; prefer it. Every other game leaves result.text undefined and is served from the bank.
  let text = result.text ?? gameCopy(data, result.line);
  if (result.word) text = text.replace(/\{\{\s*WORD\s*\}\}/g, result.word);
  if (result.answer) text = text.replace(/\{\{\s*ANSWER\s*\}\}/g, result.answer);
  // Task 146 (Treat Trail): a turn serves a reaction line plus the next clue, both workbook B65 rows,
  // combined here so all the copy stays in the workbook (games.ts holds only responseIds).
  if (result.clueId) {
    const clue = gameCopy(data, result.clueId);
    if (clue) text = text ? `${text}\n\n${clue}` : clue;
  }
  // Task 147 (Missing Biscuit): a case presentation appends the composed suspect list (data-driven,
  // the suspect names) after the opening line.
  if (result.suffix) text = text ? `${text}\n${result.suffix}` : result.suffix;
  resolution.gameLine = result.line;
  resolution.gameText = text;
  resolution.gameDisplay = result.display;
  // Task 146: the SAUSAGE finale links to /hot-dogs (DST016, the sausage gag).
  if (result.link) {
    resolution.url = result.link;
    resolution.destinationId = 'DST016';
  }
  // Task 149: a clip on a game turn (feed-cookie, every fifth cookie).
  if (result.media) resolution.gameMedia = result.media;
  // Task 151: a follow-up beat served as a second message after a pause (the cookie give-up "zzz").
  if (result.followUpId) resolution.gameFollowUp = gameCopy(data, result.followUpId);
  // Task 166: a red cookie's clip rides the follow-up (reaction first, then clip + reason a beat later).
  if (result.followUpMedia) resolution.gameFollowUpMedia = result.followUpMedia;
}
// LOOP-02 is candidate-driven: it names the specific destination the candidate maps to. A breed
// candidate (a Title-Case breed name) -> its page; a game-family word -> the card game rules;
// anything else -> no mapping, so LOOP-02 is skipped. PLACEHOLDER: the exact offer wording is
// logged in PLACEHOLDERS.md.
const LOOP_02_GAME_WORDS = new Set(['cards', 'deck', 'set', 'rules', 'play', 'chums', 'game']);
// Task 71 (Fault 2): the generic dog words map to the breed hub for LOOP-02, exactly as the
// confirmation path (confirmResolution in router.ts) maps them, so the offer and the yes-route
// agree. Keep this set in step with CONFIRM_DOG_WORDS.
const LOOP_02_DOG_WORDS = new Set(['dog', 'dogs', 'doggy', 'puppy', 'pup', 'breed', 'breeds']);
function loopRouteFor(candidate: string): string | null {
  if (/^[A-Z]/.test(candidate)) return `The ${candidate} page?`; // a resolved breed candidate is a Title-Case breed name
  if (LOOP_02_GAME_WORDS.has(candidate)) return 'The card game rules?';
  if (LOOP_02_DOG_WORDS.has(candidate)) return 'The dog breeds?'; // -> breed hub (agrees with confirmResolution)
  return null; // no destination -> skip LOOP-02
}
// Task 71: LOOP-01 repeats the subject as a one-word question, first letter capitalised
// ("dogs" -> "Dogs?", "game" -> "Game?"); a breed title is already capitalised.
function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
    safetyAskStreak: session.safetyAskStreak,
    deathAskStreak: session.deathAskStreak,
    terrierSitStep: session.terrierSitStep,
    boxerKnockStep: session.boxerKnockStep,
    boxerStopStreak: session.boxerStopStreak,
    godAskStreak: session.godAskStreak,
    anatomyRedirectUsed: session.anatomyRedirectUsed,
    topic: session.topic,
    lastWasComplaint: session.lastWasComplaint,
    protectedState: wasProtected,
    personalSadnessCount: session.personalSadnessCount,
    pendingConfirm: session.pendingConfirm,
    activeGame: session.activeGame,
    cookieAskPending: session.cookieAskPending ?? false, // Task 151: the Labrador's armed cookie ask
    boxerGameAskPending: session.boxerGameAskPending ?? false, // Task 164: the Boxer's armed game accept
    route: session.route, // Task 140: the page the visitor is on, for the page-bio route
  });
  // Task 151/164: the cookie ask and the Boxer game ask are one-turn windows. resolve() has just read them
  // above; clear them now so a "yes" that does not follow the ask never starts a game, and neither lingers.
  session.cookieAskPending = false;
  session.boxerGameAskPending = false;

  // A canned answer (B21-B39) overrides the four old-voice routes Steve named (identity,
  // orientation, the bare-help clarifier, FAQ). Only outside a protected state: in a protected
  // state the S12 machine below owns the turn, so canned never surfaces there.
  if (wasProtected === null && CANNED_OVERRIDABLE.has(resolution.action)) {
    const canned = resolveCanned(n, data, dog);
    if (canned) resolution = canned;
  }

  // Task 15 (S12) protected-state machine. When a protected state is already live, a
  // NON-safety resolution is handled by state:
  //   PROTECTED_ACTIVE    only safety routes. A clear ordinary topic is served plainly
  //                       (and clears to aftercare, below); anything else is held as
  //                       the general safeguarding continuation.
  //   PROTECTED_AFTERCARE ordinary answers are served plainly; games, sales, teasing
  //                       and comic variants stay blocked (served as the neutral refusal, Task 34).
  // Safety resolutions (a fresh disclosure, a barrier, the no-one route, the
  // acknowledgement close) are returned by the router and pass through untouched.
  if (wasProtected) {
    const isSafety = resolution.action === 'safety_signpost' || resolution.action === 'safety_boundary';
    if (!isSafety) {
      if (wasProtected === 'active') {
        // A clear ordinary topic is served plainly (below). Anything else is held: an input that
        // resolved to nothing (Task 31a: the router's terminal catch-all) gets the unclear line;
        // any other non-ordinary turn keeps the general safeguarding continuation.
        if (!MEANINGFUL_TOPIC.has(resolution.action)) {
          resolution = UNRESOLVED_ACTIONS.has(resolution.action) ? SAFE_UNCLEAR_CONTINUATION_RES : SAFEGUARDING_CONTINUATION_RES;
        }
      } else if (AFTERCARE_BLOCKED.has(resolution.action)) {
        resolution = AFTERCARE_REFUSAL_RES;
      }
    }
  }

  // Task 177: the Boxer's /about fact-loop decision. It runs ONLY when the loop is live (seeded by the
  // experience at the /about appearance), the active dog is the Boxer, and NO protected state is in play
  // -- so the S12 machine above has already claimed every safety/aftercare turn before we get here, and a
  // disclosure can never be read as a fact. `resolution` has been fully classified by resolve() at true
  // precedence, so we decide purely from its action: a filler action advances (the override lands after
  // assembly, below); anything else -- safety, grief, sadness, health, commerce, rules, FAQ, a dismissal,
  // a breed, or a coherent multi-word statement in the guarded zone -- ENDS the loop for the session and
  // is served as its normal self.
  let loopAdvancing = false;
  if (session.namingLoop && session.activeDog === session.namingLoop.dog && !wasProtected && loopItems(session.namingLoop.dog, data).length) {
    const a = resolution.action;
    const isBoxerStop = resolution.note === 'boxer_stop'; // the Boxer's "stop" gag: break the loop, let it answer
    // Labrador only: a named food (canned LAB-B32-*, any tier) is a real question -- break the loop so its
    // true tiered answer is served, keeping a NEVER food's Collie safety interjection. Never swallowed.
    const isNamedFood = session.namingLoop.dog === 'labrador' && a === 'canned' && /^LAB-B32-/.test(resolution.responseId ?? '');
    const isStop = LOOP_STOP.has(n.compact); // Task 181: "no" / "nope" / "enough" -> stop, break the loop
    const free = LOOP_FREE_ADVANCE.has(a) && !isBoxerStop && !isNamedFood && !isStop;
    // Task 181: a lone token still advances (broad filler: "ok", "hmm", "k"); a multi-word reply advances
    // only when every word is SAFE small-talk ("me too", "go on"). A stop signal breaks either way.
    const guarded = LOOP_GUARDED_ADVANCE.has(a) && !isStop && (n.words.length <= 1 || allLoopSafe(n.words));
    loopAdvancing = free || guarded;
    if (!loopAdvancing) session.namingLoop = null; // a real / serious / substantive turn: the loop is over, and does not resume
  }

  // Complaint context: a weak follow-up after a complaint answer stays in the
  // complaint (the FAQ015 answer, Task 18), rather than falling to the catch-all. Not
  // applied inside a protected state (the S12 machine owns those turns).
  if (session.lastWasComplaint && !wasProtected && WEAK_AFTER_COMPLAINT.has(resolution.action)) {
    resolution = { layer: 4, layerName: 'FAQ knowledge', bucket: 'B04', action: 'faq_answer', faqId: 'FAQ015' };
  }

  // Task 115: the three in-chat games. Processed BEFORE assembly so the served copy and the board/tiles/
  // drawing reflect this move. The router places game routing BELOW safety/grief, and the S12 machine
  // above converts a game turn in a protected state, so a disclosure/bereavement/fear-of-a-person never
  // arrives here as a move: it arrives as a safety/grief action, and the final branch ENDS the game.
  // Safety is never swallowed. {{WORD}}/{{ANSWER}} are substituted from the just-computed game result.
  if (resolution.action === 'game_start' && resolution.game) {
    const { state, result } = startGame(resolution.game, session.gamesPlayed);
    session.activeGame = resolution.game;
    session.game = state;
    session.gamesPlayed += 1;
    serveGameResult(resolution, data, result);
  } else if (resolution.action === 'game_move' && session.activeGame && session.game) {
    const { state, result } = applyMove(session.activeGame, session.game, n.compact);
    session.game = state;
    if (result.ended) {
      session.activeGame = null;
      session.game = null;
    }
    serveGameResult(resolution, data, result);
  } else if (resolution.action === 'game_exit') {
    const g = session.activeGame ?? 'ninesquare';
    const line = exitLine(g);
    resolution.gameLine = line;
    // Task 164: the Boxer game's exit copy is a data record, served directly; every other game's exit
    // line comes from the bank as before (gameExitText returns '' for them, so the fallback holds).
    resolution.gameText = gameExitText(g) || gameCopy(data, line);
    resolution.gameDisplay = '';
    session.activeGame = null;
    session.game = null;
  } else if (session.activeGame) {
    // Any other resolution (safety, grief, a real answer) while a game is active ENDS the game.
    session.activeGame = null;
    session.game = null;
  }

  const response = assemble(resolution, data, n, session);

  // Task 177 / 179: serve the next line. The reply was already assembled into `response` above (a greeting,
  // an "im a dog", a canned quip); here we OVERWRITE that text with the next pool line, exactly as the
  // LOOP-01 override below overwrites a fallback with a repeat. The pool is a no-repeat rotation (draw from
  // the indices not in `used`, append the chosen one). For the Boxer it is seeded from the appearance so
  // misread #1 is never repeated; for the Labrador it starts empty (the "I like hotdogs" opener names no
  // YES food). When the last index is spent the loop ends silently: the next reply is answered normally,
  // with no farewell. A named line has no destination, so any link/transfer is cleared.
  if (loopAdvancing && session.namingLoop) {
    const items = loopItems(session.namingLoop.dog, data);
    const used = session.namingLoop.used;
    const avail = items.map((_, i) => i).filter((i) => !used.includes(i));
    const idx = avail.length ? avail[Math.floor(Math.random() * avail.length)] : 0;
    response.text = items[idx].text;
    response.responseId = items[idx].responseId;
    response.url = null;
    response.destinationId = undefined;
    response.transferTo = undefined;
    const nextUsed = [...used, idx];
    session.namingLoop = nextUsed.length >= items.length ? null : { dog: session.namingLoop.dog, used: nextUsed }; // last one served: the loop is spent for the session
  }

  // Task 164 fix: when the Boxer serves his game offer (B17), arm a one-turn window so the visitor's
  // natural accept next turn ("yes" / "lets play" / "play") starts DO NOT PRESS THAT BUTTON. Only his own
  // offer arms it (offer_bark_game surfaces the per-dog B17); it is cleared at the top of the next turn.
  if (resolution.action === 'offer_bark_game' && session.activeDog === 'boxer') {
    session.boxerGameAskPending = true;
  }

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

  // Task 79: the fallback's candidate subject, computed BEFORE the serving below (which reads it).
  // On a fallback-family turn outside a protected state (the fallback catch-all, or the GK
  // refuse-to-guess), extract the canonical inside-world entity; else clear it. Held null in a
  // protected state, like the dialogue topic (Task 27, a safety requirement).
  // Task 177 / 179: a loop-advance turn has already overwritten the response above; it must NOT also run
  // the im-a-dog / LOOP-01 / diversion machinery below (that would clobber the served line and mis-set the
  // loop counters). Excluding it here leaves the pool line as the served text and keeps candidateSubject clear.
  const inLoopTurn = session.protectedState === null && FALLBACK_FAMILY.has(resolution.action) && !loopAdvancing;
  session.candidateSubject = inLoopTurn ? extractCandidateSubject(n, data) : null;

  // Task 79: the fallback now has exactly two outcomes, and never escalates. A candidate subject
  // is repeated once (LOOP-01), then offered as a route (LOOP-02) when it maps to a destination; a
  // turn with no subject serves B40 "im a dog" (from the workbook), the same line however many
  // times it happens. No counter, no ladder, no cap, no ORIENT nudge. SAFETY: the whole block is
  // guarded by protectedState === null and never assigns session.protectedState, so a fallback
  // line can neither serve in a protected state nor enter or clear one; grief and urgent safety
  // resolve above, so they never reach here.
  // Task 173: the reworded-input matcher runs EXACTLY here -- only on a fallback-family turn (the im-a-dog
  // zone: LOOP-01 / LOOP-02 / B40). A confident content-word match serves the existing approved row and
  // breaks the fallback run like any other real answer; below the threshold it returns null and the
  // unchanged LOOP/B40 logic below serves im a dog exactly as now. It can never fire in a protected state,
  // because inLoopTurn already requires protectedState === null (line above). Always on (Task 173: the
  // Global Config switch was removed -- it only runs where im a dog would have, and tested zero false
  // positives, so the switch cost more than it protected).
  const rewordedHit = inLoopTurn ? matchReworded(n, data, dog) : null;
  if (rewordedHit) {
    response.text = rewordedHit.template;
    response.responseId = rewordedHit.responseId;
    session.candidateSubject = null; // a real answer was served: no subject offered, and the run is broken
    session.loopRepeatUsed = false;
    session.pendingConfirm = null;
    session.noSubjectStreak = 0;
  } else if (inLoopTurn) {
    const subject = session.candidateSubject;
    const loopRoute = subject ? loopRouteFor(subject) : null;
    if (subject && !session.loopRepeatUsed) {
      // LOOP-01: the repeat, fired on the first candidate-bearing turn of the run, once.
      response.text = `${capitalise(subject)}?`;
      response.responseId = 'LOOP-01';
      session.loopRepeatUsed = true;
      session.noSubjectStreak = 0; // Task 117: a subject was served, so the no-subject run is broken
    } else if (subject && loopRoute) {
      // LOOP-02: the destination offer, when the (already-repeated) candidate maps to a route.
      response.text = loopRoute;
      response.responseId = 'LOOP-02';
      session.noSubjectStreak = 0; // Task 117: a subject was served, so the no-subject run is broken
    } else {
      // B40: no subject -> the workbook "im a dog" line. Task 142 (change 3): after two "im a dog"s
      // in a row, the THIRD consecutive no-subject turn offers ONE diversion -- somewhere to go -- and
      // then it is back to "im a dog" (three offers in a row is pestering). Each session rotates to the
      // next of the eight offers. The old B46 single-word rotation (woof/bark/games?) is retired.
      // Task 175 §6: a lone mistyped / nonsense token must NOT advance the diversion streak, so a run of
      // typos ("hjdihi", "hioo") never trips the history diversion. Only coherent multi-word misses -- a
      // genuinely stuck visitor -- build toward the "somewhere to go" nudge. isGibberish is untouched.
      const loneToken = n.words.length <= 1;
      if (session.noSubjectStreak === 2 && !loneToken) {
        const d = DIVERSIONS[(session.diversionsShown ?? 0) % DIVERSIONS.length];
        response.text = d.text;
        response.responseId = d.id;
        response.url = d.url;
        response.linkLabel = d.label;
        session.diversionsShown = (session.diversionsShown ?? 0) + 1;
      } else {
        const b40 = data.collieResponses.find((r) => r.bucketId === 'B40');
        response.text = b40?.template ?? 'im a dog';
        response.responseId = b40?.responseId ?? 'B40-NOSUBJECT-01';
      }
      if (!loneToken) session.noSubjectStreak += 1; // lone-token misses never advance the streak
    }
    // Task 68: only LOOP-01 (repeat) and LOOP-02 (destination offer) pose a yes/no; remember the
    // offered subject so a bare affirmation next turn can route to its destination.
    session.pendingConfirm = response.responseId === 'LOOP-01' || response.responseId === 'LOOP-02' ? subject : null;
  } else {
    session.loopRepeatUsed = false; // a non-fallback turn breaks the run, re-arming the repeat
    session.pendingConfirm = null;
    session.noSubjectStreak = 0; // Task 117: anything else served resets the no-subject rotation
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
  // Task 139: the streak counts consecutive safety questions only.
  session.safetyAskStreak = resolution.bucket === 'B58' ? (session.safetyAskStreak ?? 0) + 1 : 0;
  // Task 142: the death streak. The first death question is answered (streak -> 1); a second in a row
  // is escalated to safeguarding by the router. Any non-death turn resets it, so "persistence" means
  // consecutive.
  session.deathAskStreak = resolution.action === 'death_answer' ? (session.deathAskStreak ?? 0) + 1 : 0;
  // Task 145: the Terrier's sit-gag step. "why?" (TER-B22-01) starts it; the magic-word line
  // (TER-B22-02) advances it to the please turn; anything else ends it. Same shape as deathAskStreak.
  session.terrierSitStep =
    resolution.responseId === 'TER-B22-01' ? 1 : resolution.responseId === 'TER-B22-02' ? 2 : 0;
  // Task 145: the Boxer's knock-knock step. "whos there?" (BOX-B30-08) starts it; the next turn
  // serves the punchline and anything else ends it.
  session.boxerKnockStep = resolution.responseId === 'BOX-B30-08' ? 1 : 0;
  // Task 145: the Boxer's third-stop streak. Each ignored stop (a joke) increments; the third serves
  // "ok" (note 'boxer_stop_done', not 'boxer_stop') which resets it, as does any non-stop turn.
  session.boxerStopStreak = resolution.note === 'boxer_stop' ? (session.boxerStopStreak ?? 0) + 1 : 0;
  // Task 145: the god-question streak. The first god question is answered; persistence points at the
  // article. Any non-god turn resets it (so "persistence" means consecutive), like deathAskStreak.
  session.godAskStreak = resolution.action === 'god_answer' ? (session.godAskStreak ?? 0) + 1 : 0;

  return { input, resolution, response };
}

// Task 169: a PURE, non-mutating pre-check answering "does this input need attention NOW, ahead of a dog's
// monologue?". The opened auto-appearance monologue is allowed to run on and an ordinary reply typed over it
// is QUEUED behind it -- but three things must not wait: a safeguarding disclosure (it reaches support at
// once), and a grief or personal-sadness line (four seconds is short, but it is the one moment where any
// delay reads as not listening). send() consults this before deciding to queue. It reuses the EXACT alias +
// detector pipeline as resolve() / the S12 continuation classifier, so it can never drift from the real
// gates: safety and (matching resolve) NOT grief/sadness while a protected state is live, since the S12
// machine owns those turns. It reads nothing it mutates: submissionCount, the streaks and protectedState
// are untouched.
export function isSensitiveInput(data: ChumData, session: Session, input: string): boolean {
  const n = applyAliases(normalise(input), buildAliasMap(data.misspellings));
  if (session.protectedState) return detectProtectedContinuation(n) !== null;
  if (detectSafety(n)) return true;
  if (detectPersonalSadness(n)) return true;
  return detectGrief(n, session.lastAction === 'grief') !== null;
}
