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
import { wordFuzzyEq } from './normalise';

export interface GameState {
  board: string[]; // nine-square: 9 cells, ' ' | 'X' (visitor) | 'O' (dog)
  word: string; // missing-sheep: the hidden word
  guessed: string[]; // missing-sheep: letters guessed (upper case)
  wrong: number; // missing-sheep: wrong guesses so far (one sheep lost each)
  sketchIndex: number; // kennel-sketch: current drawing index
  objectIndex: number; // treat-trail: current object (0..9)
  clueIndex: number; // treat-trail: current clue shown (0..2)
  guesses: number; // treat-trail: wrong guesses on the current object (0..3)
}

export interface GameResult {
  line: string; // the B4x/B65 responseId to serve (or a synthetic id for an ongoing board, served as no text)
  display: string; // the monospace block rendered above/with the response
  word?: string; // {{WORD}} substitution (missing-sheep loss)
  answer?: string; // {{ANSWER}} substitution (kennel-sketch reveal / treat-trail move-on)
  clueId?: string; // treat-trail: the workbook clue row to append after the reaction line
  link?: string; // treat-trail: a finale link (SAUSAGE -> /hot-dogs)
  ended: boolean; // true: the game is over, clear session.activeGame
}

// Missing Sheep word list (Steve's, fixed order). The word for a game is list[counter % length], so
// consecutive games walk the list deterministically.
const MISSING_SHEEP_WORDS = ['BOWL', 'NOSE', 'EARS', 'LEAD', 'FETCH', 'PAW', 'TAIL', 'BARK', 'BONE', 'BALL', 'WALK', 'STICK', 'PUPPY', 'HOUND', 'SNIFF', 'DIG', 'CHEW', 'FIELD'];
const START_SHEEP = 5;

function freshState(): GameState {
  return { board: Array(9).fill(' '), word: '', guessed: [], wrong: 0, sketchIndex: 0, objectIndex: 0, clueIndex: 0, guesses: 0 };
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
  // kennelsketch: fixed order from the drawings file, starting at the first.
  const state: GameState = { ...freshState(), sketchIndex: 0 };
  return { state, result: { line: 'B43-KENNELSKETCH-01', display: sketchDisplay(0), ended: false } };
}

export function applyMove(game: GameId, state: GameState, input: string): { state: GameState; result: GameResult } {
  if (game === 'ninesquare') return nineMove(state, input);
  if (game === 'missingsheep') return sheepMove(state, input);
  if (game === 'treattrail') return treatMove(state, input);
  return sketchMove(state, input);
}

export function exitLine(game: GameId): string {
  if (game === 'ninesquare') return 'B41-NINESQUARE-07';
  if (game === 'missingsheep') return 'B42-MISSINGSHEEP-08';
  if (game === 'treattrail') return 'B65-TREATTRAIL-EXIT';
  return 'B43-KENNELSKETCH-05';
}
