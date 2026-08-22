// Shared session state (brief section 13). Browser-session lifetime; no account.

import { Dog, ActionType, GameId } from './types';
import { GameState } from './games';

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
  safetyAskStreak: number; // Task 139: consecutive safety questions. Three in a row hands to a human; any other turn resets it.
  deathAskStreak: number; // Task 142: consecutive death-cluster questions. The first is answered; a second (persistence) escalates to safeguarding. Any other turn resets it.
  terrierSitStep: number; // Task 145: the Terrier's sit-gag step (0 none, 1 he has asked "why?", 2 he has asked the magic word). Same shape as deathAskStreak: "sit" starts it, the next input advances it, anything else resets it.
  boxerKnockStep: number; // Task 145: the Boxer's visitor-initiated knock-knock step (0 none, 1 he has asked "whos there?"). The next input, whatever it is, gets the punchline. Same shape.
  boxerStopStreak: number; // Task 145: consecutive "stop"s to the Boxer while he is telling jokes. The first two are ignored (he keeps joking); the third gets a flat "ok" and resets. Same shape as deathAskStreak.
  godAskStreak: number; // Task 145: consecutive god questions. The first is answered (belief / which-god + Anubis link); persistence points at the article. Any other turn resets it. Same shape as deathAskStreak.
  anatomyRedirectUsed: boolean; // ANATOMY_GENERAL_REDIRECT fires at most once per session
  protectedState: ProtectedState; // S12 protected-state machine (Task 15)
  personalSadnessCount: number; // Task 20: qualifying personal-sadness statements this session (L1 at 1, L2 at 2)
  lastWasComplaint: boolean; // the previous turn answered the complaint/contact FAQ (for follow-up context)
  complaintOpened: boolean; // Task 25b: the full FAQ015 complaint answer was already served this context (subsequent turns get the short repeat)
  // Task 57: the dog-led loop's candidate subject, carried for one turn. Set on a fallback-family
  // turn (the fallback catch-all or the GK refuse-to-guess) outside a protected state to the
  // canonical inside-world entity found in the input, or null when none is present. Cleared to
  // null on every other turn.
  candidateSubject: string | null;
  // Task 79: whether the fallback's repeat (LOOP-01) has already fired in the current run of
  // consecutive fallback turns. LOOP-01 fires on the first candidate-bearing turn, once; a
  // non-fallback turn breaks the run and re-arms it. Reset on a new session. (Task 79 retired the
  // loop counter, the completed-loop count, the ORIENT nudge and the repair ladder: the fallback
  // now has exactly two outcomes, a repeat/offer for a subject or B40 "im a dog" for none.)
  loopRepeatUsed: boolean;
  // Task 117: consecutive no-subject fallback serves (the B40 "im a dog" branch). After two in a row,
  // the third and further consecutive no-subject turns rotate through the B46 bank instead of repeating
  // "im a dog". Reset to 0 the moment anything else is served (a real answer, LOOP-01 or LOOP-02).
  noSubjectStreak: number;
  // Task 142: how many diversions (destination offers) have been shown this session, to rotate through
  // the eight offers. One diversion fires on the third consecutive no-subject turn, then it is back to
  // "im a dog" (three offers in a row is pestering).
  diversionsShown: number;
  // Fetch (random_link): how many times the visitor has fetched this session. Drives the deterministic
  // 1-in-4 mix (every 4th fetch brings a physical thing, rotating ball -> newspaper -> hat) and a cycling
  // page rotation, so fetch never sticks on one page after all are spent. Incremented in the engine after
  // each fetch turn; the assembler reads the pre-turn value to decide what this fetch serves.
  fetchCount: number;
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
  // Task 115: the three in-chat games. `activeGame` is the game that currently owns the input (null
  // when none is running); `game` is its state; `gamesPlayed` is a monotonic counter used to pick the
  // Missing Sheep word deterministically. A safety, grief or any non-move turn ends the game (the
  // engine clears activeGame), so a disclosure mid-game is never swallowed as a move.
  activeGame: GameId | null;
  game: GameState | null;
  gamesPlayed: number;
  // Task 151: set by the UI when the Labrador asks "can you get me a cookie?" (his /hot-dogs thread
  // pickup). It arms a one-turn window in which a bare "yes" starts the feed-cookie game, so the ask is
  // a certain entry point rather than relying on the visitor typing the word "cookie". Cleared each turn.
  cookieAskPending?: boolean;
  // Task 164 fix: the Boxer just offered his mini game (his B17). Arms a one-turn window in which a bare
  // "yes" / "lets play" / "play" starts DO NOT PRESS THAT BUTTON, so his offer is a certain entry point
  // rather than relying on the visitor typing the game name. Cleared each turn, exactly like the cookie ask.
  boxerGameAskPending?: boolean;
  // Task 140: the page the visitor is standing on, from usePathname in the experience, carried
  // as session state the same way lastAction is. Lets "what is this page" answer with that page's
  // bio. Undefined outside the browser (the harness), so the page-bio route only fires live.
  route?: string;
  // Task 177 / 179: the active "naming loop" -- a dog serving one line per visitor reply from a fixed
  // pool until it runs out, then silence. `dog` names which loop is live (and so which pool + rules the
  // engine uses): the Boxer's ten /about misreads, or the Labrador's ten YES-tier foods on /hot-dogs.
  // `used` is the pool indices already served (no-repeat). While a loop is live a filler reply (a
  // greeting, "ok", "why", "haha", a shrug, a lone unresolved word) draws the next line; a real route
  // (safety, grief, sadness, health, commerce, rules, FAQ, a dismissal, a breed, a named food, or any
  // coherent multi-word statement) sets this back to null and ENDS the loop. null when none is running.
  // Seeded by the experience at the appearance; survives navigation via the persisted chat.
  namingLoop?: { dog: Dog; used: number[] } | null;
  // Task 177 / 179: the dogs whose naming loop has already started this session. A loop is seeded ONLY
  // for a dog NOT in here, so it never resumes: once it has run (spent or broken) a fresh appearance /
  // pickup cannot restart it. Cleared only by a new browser session (a tab close wipes the chat).
  namingLoopStarted?: Dog[];
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
    safetyAskStreak: 0,
    deathAskStreak: 0,
    terrierSitStep: 0,
    boxerKnockStep: 0,
    boxerStopStreak: 0,
    godAskStreak: 0,
    anatomyRedirectUsed: false,
    protectedState: null,
    personalSadnessCount: 0,
    lastWasComplaint: false,
    complaintOpened: false,
    candidateSubject: null,
    loopRepeatUsed: false,
    noSubjectStreak: 0,
    diversionsShown: 0,
    fetchCount: 0,
    pendingConfirm: null,
    topic: null,
    previousTopic: null,
    barkStreakByDog: {},
    barkCompletedByDog: {},
    activeGame: null,
    game: null,
    gamesPlayed: 0,
    cookieAskPending: false,
    boxerGameAskPending: false,
    namingLoop: null,
    namingLoopStarted: [],
  };
}
