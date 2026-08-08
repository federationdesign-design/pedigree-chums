// The three in-chat games (Task 115): Nine-Square, Missing Sheep, Kennel Sketch.
//
// Pure, DETERMINISTIC logic. No Math.random at runtime (banned): the nine-square dog move is a fixed
// strategy (take-win, then block, then first-open cell), the missing-sheep word is chosen by a session
// counter over a fixed list, and the kennel-sketch order is the fixed order of the drawings file. The
// engine owns the session game state and calls into here; the assembler serves the copy + the display.
//
// The copy is the workbook B41-B45 rows (served verbatim by the engine, with {{WORD}} and {{ANSWER}}
// substituted at runtime). This module returns the responseId to serve plus the monospace display block.

import { GameId } from './types';
import { KENNEL_SKETCHES } from '../data/kennel-sketches';
import { TREAT_TRAIL_OBJECTS } from '../data/treat-trail';
import { BISCUIT_CASES } from '../data/missing-biscuit';
import { FEED_COOKIES } from '../data/feed-cookie';
import { wordFuzzyEq } from './normalise';

export interface GameState {
  board: string[]; // nine-square: 9 cells, ' ' | 'X' (visitor) | 'O' (dog)
  word: string; // missing-sheep: the hidden word
  guessed: string[]; // missing-sheep: letters guessed (upper case)
  wrong: number; // missing-sheep: wrong guesses so far (one sheep lost each)
  sketchIndex: number; // kennel-sketch: current drawing index
  objectIndex: number; // treat-trail: current object (0..9)
  clueIndex: number; // treat-trail: current clue shown (0..2)
  guesses: number; // treat-trail / missing-biscuit: wrong guesses on the current object/case (0..3)
  caseIndex: number; // missing-biscuit: current case (0..4)
  cluesGiven: number; // missing-biscuit: clues revealed on the current case (0..3), given on request
  awaitingAnother: boolean; // missing-biscuit: a case just closed, waiting for "another one?" yes/no
  fed: string[]; // feed-cookie: the cookie ids already eaten (the UI renders the rest as pills)
}

export interface GameResult {
  line: string; // the B4x/B65/B66/B67 responseId to serve (or a synthetic id for an ongoing board, served as no text)
  display: string; // the monospace block rendered above/with the response
  word?: string; // {{WORD}} substitution (missing-sheep loss)
  answer?: string; // {{ANSWER}} substitution (kennel-sketch reveal / treat-trail move-on / biscuit reveal)
  clueId?: string; // treat-trail / missing-biscuit / feed-cookie: a workbook row to append after the reaction line
  suffix?: string; // missing-biscuit: a composed line to append (the suspect list for a case presentation)
  link?: string; // treat-trail: a finale link (SAUSAGE -> /hot-dogs)
  media?: { src: string; alt: string }; // feed-cookie: a clip shown every fifth cookie (good/queasy)
  followUpId?: string; // Task 151: a workbook row served as a SECOND message after a beat (the cookie give-up "zzz")
  ended: boolean; // true: the game is over, clear session.activeGame
}

// Missing Sheep word list (Steve's, fixed order). The word for a game is list[counter % length], so
// consecutive games walk the list deterministically.
const MISSING_SHEEP_WORDS = ['BOWL', 'NOSE', 'EARS', 'LEAD', 'FETCH', 'PAW', 'TAIL', 'BARK', 'BONE', 'BALL', 'WALK', 'STICK', 'PUPPY', 'HOUND', 'SNIFF', 'DIG', 'CHEW', 'FIELD'];
const START_SHEEP = 5;

function freshState(): GameState {
  return { board: Array(9).fill(' '), word: '', guessed: [], wrong: 0, sketchIndex: 0, objectIndex: 0, clueIndex: 0, guesses: 0, caseIndex: 0, cluesGiven: 0, awaitingAnother: false, fed: [] };
}

// ---- Nine-Square (noughts and crosses on nine numbered cells) ----

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winner(b: string[]): string | null {
  for (const [x, y, z] of LINES) if (b[x] !== ' ' && b[x] === b[y] && b[y] === b[z]) return b[x];
  return null;
}
function boardFull(b: string[]): boolean {
  return b.every((c) => c !== ' ');
}
// The empty cell that completes a line already holding two of `mark`, or -1.
function completing(b: string[], mark: string): number {
  for (const line of LINES) {
    const cells = line.map((i) => b[i]);
    if (cells.filter((c) => c === mark).length === 2 && cells.filter((c) => c === ' ').length === 1) {
      return line[cells.indexOf(' ')];
    }
  }
  return -1;
}
// Deterministic dog move: take a winning cell, else block the visitor, else the first open cell.
function dogMove(b: string[]): number {
  const win = completing(b, 'O');
  if (win >= 0) return win;
  const block = completing(b, 'X');
  if (block >= 0) return block;
  return b.findIndex((c) => c === ' ');
}
function renderBoard(b: string[]): string {
  const cell = (i: number) => (b[i] === ' ' ? String(i + 1) : b[i]);
  const row = (a: number, c: number, d: number) => ` ${cell(a)} | ${cell(c)} | ${cell(d)}`;
  return [row(0, 1, 2), '---+---+---', row(3, 4, 5), '---+---+---', row(6, 7, 8)].join('\n');
}
function nineMove(state: GameState, input: string): { state: GameState; result: GameResult } {
  const raw = input.trim();
  if (!/^[1-9]$/.test(raw)) {
    return { state, result: { line: 'B41-NINESQUARE-03', display: renderBoard(state.board), ended: false } }; // "A number. One to nine."
  }
  const cell = Number(raw) - 1;
  if (state.board[cell] !== ' ') {
    return { state, result: { line: 'B41-NINESQUARE-02', display: renderBoard(state.board), ended: false } }; // "Taken. Another."
  }
  const b = state.board.slice();
  b[cell] = 'X';
  // A win/draw shows the final board and resets to a fresh board (so "Again?" starts a new round),
  // keeping the game active.
  if (winner(b) === 'X') return { state: freshState(), result: { line: 'B41-NINESQUARE-05', display: renderBoard(b), ended: false } }; // "You win. Again?"
  if (boardFull(b)) return { state: freshState(), result: { line: 'B41-NINESQUARE-06', display: renderBoard(b), ended: false } }; // "Nobody. Again?"
  const move = dogMove(b);
  if (move >= 0) b[move] = 'O';
  if (winner(b) === 'O') return { state: freshState(), result: { line: 'B41-NINESQUARE-04', display: renderBoard(b), ended: false } }; // "Mine. Again?"
  if (boardFull(b)) return { state: freshState(), result: { line: 'B41-NINESQUARE-06', display: renderBoard(b), ended: false } };
  return { state: { ...state, board: b }, result: { line: 'B41-NINESQUARE-MOVE', display: renderBoard(b), ended: false } }; // ongoing: board only, no line
}

// ---- Missing Sheep (letter guessing; a sheep is lost per wrong guess) ----

function sheepDisplay(state: GameState): string {
  const left = Math.max(0, START_SHEEP - state.wrong);
  const sheep = 'Number of sheep left: ' + Array(left).fill('\u{1F411}').join(' ');
  const mask = state.word.split('').map((ch) => (state.guessed.includes(ch) ? ch : '█')).join(' ');
  return sheep + '\n' + mask;
}
function sheepMove(state: GameState, input: string): { state: GameState; result: GameResult } {
  const g = input.trim().toUpperCase();
  if (!/^[A-Z]$/.test(g)) {
    return { state, result: { line: 'B42-MISSINGSHEEP-07', display: sheepDisplay(state), ended: false } }; // "One letter."
  }
  if (state.guessed.includes(g)) {
    return { state, result: { line: 'B42-MISSINGSHEEP-04', display: sheepDisplay(state), ended: false } }; // "Already had that one."
  }
  const guessed = [...state.guessed, g];
  if (state.word.includes(g)) {
    const ns = { ...state, guessed };
    const complete = ns.word.split('').every((ch) => guessed.includes(ch));
    if (complete) return { state: ns, result: { line: 'B42-MISSINGSHEEP-05', display: sheepDisplay(ns), ended: true } }; // "Got it. Sheep safe."
    return { state: ns, result: { line: 'B42-MISSINGSHEEP-02', display: sheepDisplay(ns), ended: false } }; // "Yes."
  }
  const wrong = state.wrong + 1;
  const ns = { ...state, guessed, wrong };
  if (wrong >= START_SHEEP) {
    return { state: ns, result: { line: 'B42-MISSINGSHEEP-06', display: sheepDisplay(ns), word: ns.word, ended: true } }; // "Sheep gone. It was {{WORD}}."
  }
  return { state: ns, result: { line: 'B42-MISSINGSHEEP-03', display: sheepDisplay(ns), ended: false } }; // "No."
}

// ---- Kennel Sketch (name the drawing) ----

function sketchDisplay(idx: number): string {
  const s = KENNEL_SKETCHES[idx];
  return `${s.art}\n\n${s.clue}`;
}
function sketchMove(state: GameState, input: string): { state: GameState; result: GameResult } {
  const guess = input.trim().toLowerCase();
  const s = KENNEL_SKETCHES[state.sketchIndex];
  if (!s.accept.includes(guess)) {
    return { state, result: { line: 'B43-KENNELSKETCH-03', display: sketchDisplay(state.sketchIndex), ended: false } }; // "No. Look again."
  }
  const next = state.sketchIndex + 1;
  if (next >= KENNEL_SKETCHES.length) {
    return { state, result: { line: 'B43-KENNELSKETCH-04', display: sketchDisplay(state.sketchIndex), answer: s.answer, ended: true } }; // "It was a {{ANSWER}}."
  }
  return { state: { ...state, sketchIndex: next }, result: { line: 'B43-KENNELSKETCH-02', display: sketchDisplay(next), ended: false } }; // "Yes." + next drawing
}

// ---- Treat Trail (guess the object from three clues; the Labrador's game) ----
//
// Ten objects, three clues each given one at a time, three guesses per object. Warm, never punishing:
// a wrong guess serves an encouragement line and the next clue; three wrong reveals the answer and
// moves on. Each turn serves a reaction row plus the current clue row (both workbook B65), combined by
// the engine. Matching reuses the fuzzy matcher: any word of the guess that fuzzy-equals the answer,
// or is in the object's accept list ("bal", "sausige"), counts. SAUSAGE is last and links to /hot-dogs.

function treatMatch(objectIndex: number, input: string): boolean {
  const obj = TREAT_TRAIL_OBJECTS[objectIndex];
  const answer = obj.answer.toLowerCase();
  const words = input.trim().toLowerCase().match(/[a-z]+/g) ?? [];
  const whole = input.trim().toLowerCase();
  return obj.accept.includes(whole) || words.some((w) => obj.accept.includes(w) || wordFuzzyEq(w, answer));
}

function treatStartResult(): GameResult {
  return { line: 'B65-TREATTRAIL-START', clueId: TREAT_TRAIL_OBJECTS[0].clueIds[0], display: '', ended: false };
}

function treatMove(state: GameState, input: string): { state: GameState; result: GameResult } {
  const obj = TREAT_TRAIL_OBJECTS[state.objectIndex];
  const isLast = state.objectIndex >= TREAT_TRAIL_OBJECTS.length - 1;
  const advance = () => ({ ...state, objectIndex: state.objectIndex + 1, clueIndex: 0, guesses: 0 });

  if (treatMatch(state.objectIndex, input)) {
    // Correct. SAUSAGE (the last object) ends the game with the /hot-dogs finale.
    if (isLast) return { state, result: { line: 'B65-TREATTRAIL-END', display: '', link: obj.link, ended: true } };
    const ns = advance();
    return { state: ns, result: { line: 'B65-TREATTRAIL-RIGHT', clueId: TREAT_TRAIL_OBJECTS[ns.objectIndex].clueIds[0], display: '', ended: false } };
  }

  const guesses = state.guesses + 1;
  if (guesses < 3) {
    // Wrong, clues left: encouragement + the next clue. No penalty.
    const clueIndex = guesses; // guess 1 -> clue 2 (index 1), guess 2 -> clue 3 (index 2)
    const line = guesses === 1 ? 'B65-TREATTRAIL-CLUE2' : 'B65-TREATTRAIL-CLUE3';
    return { state: { ...state, guesses, clueIndex }, result: { line, clueId: obj.clueIds[clueIndex], display: '', ended: false } };
  }
  // Third wrong: reveal the answer and move on warmly. SAUSAGE still ends at /hot-dogs.
  if (isLast) return { state, result: { line: 'B65-TREATTRAIL-END', display: '', link: obj.link, answer: obj.answer, ended: true } };
  const ns = advance();
  return { state: ns, result: { line: 'B65-TREATTRAIL-MOVEON', answer: obj.answer, clueId: TREAT_TRAIL_OBJECTS[ns.objectIndex].clueIds[0], display: '', ended: false } };
}

// ---- The Case of the Missing Biscuit (a mystery; the Border Terrier's game) ----
//
// Five cases, three suspects each, three clues each given ONE AT A TIME ON REQUEST, three guesses.
// Blunt and never encouraging (his verbatim lines). Each case presents its opening (case 1 = his
// OPENING line; 2-5 = the title) plus the three suspects; the child asks for clues and names a suspect.
// Matching reuses the fuzzy matcher plus each suspect's accept list. A closed case offers "another
// one?"; case 5 is last. Safety wins mid-case above this (the engine ends the game on any non-move).

const BISCUIT_CLUE_REQUEST = new Set(['clue', 'a clue', 'another clue', 'next clue', 'give me a clue', 'give us a clue', 'can i have a clue', 'clue please', 'hint', 'a hint', 'more', 'another']);
const BISCUIT_YES = new Set(['yes', 'yeah', 'yep', 'yes please', 'ok', 'okay', 'sure', 'go on', 'aye', 'another', 'another one', 'more', 'next', 'go']);

function suspectLine(caseIndex: number): string {
  const names = BISCUIT_CASES[caseIndex].suspects.map((s) => s.name);
  return names.slice(0, -1).join(', ') + ' or ' + names[names.length - 1];
}

// The index of the suspect the guess names, or -1. Reuses the fuzzy matcher (per accept word) plus a
// whole-phrase accept check, so "the boy next door", "boy" or "next door" all reach the same suspect.
function matchBiscuitSuspect(caseIndex: number, input: string): number {
  const whole = input.trim().toLowerCase();
  const words: string[] = whole.match(/[a-z]+/g) ?? [];
  const suspects = BISCUIT_CASES[caseIndex].suspects;
  for (let i = 0; i < suspects.length; i++) {
    const accept = suspects[i].accept;
    if (accept.includes(whole)) return i;
    if (accept.some((a) => !a.includes(' ') && (words.includes(a) || words.some((w) => wordFuzzyEq(w, a))))) return i;
  }
  return -1;
}

// Present a case: its opening line (case 1 = his OPENING; 2-5 = the title) plus the three suspects.
function biscuitPresent(caseIndex: number): GameResult {
  return { line: BISCUIT_CASES[caseIndex].introId, suffix: suspectLine(caseIndex), display: '', ended: false };
}

function biscuitMove(state: GameState, input: string): { state: GameState; result: GameResult } {
  const compact = input.trim().toLowerCase();

  // Between cases: "another one?" -> yes presents the next case; anything else ends the game.
  if (state.awaitingAnother) {
    if (BISCUIT_YES.has(compact)) {
      const ns = { ...state, caseIndex: state.caseIndex + 1, cluesGiven: 0, guesses: 0, awaitingAnother: false };
      return { state: ns, result: biscuitPresent(ns.caseIndex) };
    }
    return { state, result: { line: 'B66-MISSINGBISCUIT-EXIT', display: '', ended: true } };
  }

  const c = BISCUIT_CASES[state.caseIndex];
  const isLast = state.caseIndex >= BISCUIT_CASES.length - 1;
  // Close a case: case 5 ends the game; earlier cases offer "another one?" and wait.
  const closeCase = (line: string, answer?: string): { state: GameState; result: GameResult } =>
    isLast
      ? { state, result: { line, answer, display: '', ended: true } }
      : { state: { ...state, awaitingAnother: true }, result: { line, answer, clueId: 'B66-MISSINGBISCUIT-ANOTHER', display: '', ended: false } };

  // A clue on request: one at a time. When all three are out, he tells the child to name someone.
  if (BISCUIT_CLUE_REQUEST.has(compact)) {
    if (state.cluesGiven >= 3) return { state, result: { line: 'B66-MISSINGBISCUIT-OUTOFCLUES', display: '', ended: false } };
    return { state: { ...state, cluesGiven: state.cluesGiven + 1 }, result: { line: 'B66-MISSINGBISCUIT-CLUE', clueId: c.clueIds[state.cluesGiven], display: '', ended: false } };
  }

  // Otherwise it is a guess (naming a suspect).
  if (matchBiscuitSuspect(state.caseIndex, input) === c.answer) return closeCase('B66-MISSINGBISCUIT-CORRECT');
  const guesses = state.guesses + 1;
  if (guesses < 3) {
    return { state: { ...state, guesses }, result: { line: guesses === 1 ? 'B66-MISSINGBISCUIT-WRONG' : 'B66-MISSINGBISCUIT-WRONG2', display: '', ended: false } };
  }
  // Third wrong: the reveal, with the guilty suspect substituted for {{ANSWER}}.
  return closeCase('B66-MISSINGBISCUIT-REVEAL', c.suspects[c.answer].name);
}

// ---- Feed the Dog a Cookie (tap the pills; the Labrador's second game) ----
//
// A dozen cookies are shown as tappable pills (the UI renders them from data/feed-cookie.ts, minus the
// ones eaten). A tap sends the cookie's id as a move; he eats it with delight and a one-line lesson on
// what it does. Blue cookies help a site work; red ones follow you elsewhere. A blue cookie shows a happy
// clip on the cadence (cookies 1, 4, 7, 10); a red cookie always shows the queasy clip. Typed input that
// is not a cookie just nudges him,
// so nothing (including "cookies") leaks out of the game. Safety wins above this and ends the game.

const COOKIE_CLIP = {
  blue: { src: '/chat-media/cookie-good.mp4', alt: 'The Labrador enjoys a cookie' },
  red: { src: '/chat-media/cookie-bad.mp4', alt: 'The Labrador looks queasy' },
};

// Task 161: the Task 151 give-up (COOKIE_GIVE_UP = 8, "im so full" + "zzz") is REMOVED. He is greedy and
// does not know when he is full, so he never stops on his own; the tray running out at twelve is the end.
// The B67-FEEDCOOKIE-FULL and B67-FEEDCOOKIE-SLEEP workbook rows are now dormant.

function feedCookieMove(state: GameState, input: string): { state: GameState; result: GameResult } {
  const guess = input.trim().toLowerCase();
  const cookie = FEED_COOKIES.find((c) => !state.fed.includes(c.id) && (c.id === guess || c.label.toLowerCase() === guess));
  if (!cookie) {
    // Not a cookie (or already eaten): nudge, never leak out of the game (typed "cookies" stays here).
    return { state, result: { line: 'B67-FEEDCOOKIE-NUDGE', display: '', ended: false } };
  }
  const fed = [...state.fed, cookie.id];
  // Task 161: a RED cookie ALWAYS shows the queasy clip (a red cookie is always cookie-bad). A BLUE one
  // shows the happy clip on the cadence: the FIRST cookie, then every third (cookies 1, 4, 7, 10).
  const media = cookie.red ? COOKIE_CLIP.red : fed.length % 3 === 1 ? COOKIE_CLIP.blue : undefined;
  const ns = { ...state, fed };
  // Task 161: he NEVER gives up. He is greedy and does not know when he is full, so every pill can be fed
  // (red included) and the game just ends when the tray runs out at twelve -- no "full"/"zzz" wind-down.
  const ended = fed.length >= FEED_COOKIES.length;
  const line = cookie.red ? 'B67-FEEDCOOKIE-RED' : 'B67-FEEDCOOKIE-BLUE';
  return { state: ns, result: { line, clueId: cookie.teachId, media, display: '', ended } };
}

// ---- Public API ----

export function startGame(game: GameId, counter: number): { state: GameState; result: GameResult } {
  if (game === 'ninesquare') {
    const state = freshState();
    return { state, result: { line: 'B41-NINESQUARE-01', display: renderBoard(state.board), ended: false } };
  }
  if (game === 'missingsheep') {
    const word = MISSING_SHEEP_WORDS[counter % MISSING_SHEEP_WORDS.length];
    const state: GameState = { ...freshState(), word };
    return { state, result: { line: 'B42-MISSINGSHEEP-01', display: sheepDisplay(state), ended: false } };
  }
  if (game === 'treattrail') {
    // The Labrador's game: start at the first object's first clue.
    return { state: freshState(), result: treatStartResult() };
  }
  if (game === 'missingbiscuit') {
    // The Border Terrier's game: present the first case (his opening line + the three suspects).
    return { state: freshState(), result: biscuitPresent(0) };
  }
  if (game === 'feedcookie') {
    // The Labrador's second game: his opening line; the UI serves the pills (this is the G09 threshold).
    return { state: freshState(), result: { line: 'B67-FEEDCOOKIE-OPENING', display: '', ended: false } };
  }
  // kennelsketch: fixed order from the drawings file, starting at the first.
  const state: GameState = { ...freshState(), sketchIndex: 0 };
  return { state, result: { line: 'B43-KENNELSKETCH-01', display: sketchDisplay(0), ended: false } };
}

export function applyMove(game: GameId, state: GameState, input: string): { state: GameState; result: GameResult } {
  if (game === 'ninesquare') return nineMove(state, input);
  if (game === 'missingsheep') return sheepMove(state, input);
  if (game === 'treattrail') return treatMove(state, input);
  if (game === 'missingbiscuit') return biscuitMove(state, input);
  if (game === 'feedcookie') return feedCookieMove(state, input);
  return sketchMove(state, input);
}

export function exitLine(game: GameId): string {
  if (game === 'ninesquare') return 'B41-NINESQUARE-07';
  if (game === 'missingsheep') return 'B42-MISSINGSHEEP-08';
  if (game === 'treattrail') return 'B65-TREATTRAIL-EXIT';
  if (game === 'missingbiscuit') return 'B66-MISSINGBISCUIT-EXIT';
  if (game === 'feedcookie') return 'B67-FEEDCOOKIE-EXIT';
  return 'B43-KENNELSKETCH-05';
}
