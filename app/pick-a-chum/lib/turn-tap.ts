// Neutral turn tap. This file SHIPS to production but is completely inert there:
// it only forwards resolved turns to a sink if one has been registered, and the
// only thing that ever registers a sink is the dev conversation recorder, which
// runs on preview hosts only. Keeping the tap here (not in dev/) means the
// shipping experience can emit each turn without importing any dev code, so the
// recorder can live entirely under app/pick-a-chum/dev and be stripped for
// production without touching the send path or this file.

import type { Resolution, Dog } from './types';
import type { Assembled } from './assembler';

export interface TurnEvent {
  sessionId: string; // one id per engine session (a dog pick / page load reset)
  turn: number; // 1-based, within that engine session
  activeDog: Dog; // the dog that received the input
  input: string; // raw input, exactly as typed
  resolution: Resolution;
  response: Assembled;
  transferTo?: Dog; // set when this turn switched the active dog
  candidateSubject?: string | null; // Task 57: the loop's candidate inside-world subject this turn, or null
}

type Sink = (e: TurnEvent) => void;
let sink: Sink | null = null;

export function setTurnTap(fn: Sink | null): void {
  sink = fn;
}

export function emitTurn(e: TurnEvent): void {
  if (sink) {
    try {
      sink(e);
    } catch {
      // Recording must never break the conversation.
    }
  }
}

// Hosts where the recorder must never run by default. Everything else (Vercel branch
// previews, localhost) is a test surface where recording is allowed.
const PROD_HOSTS = new Set(['www.pedigreechums.co.uk', 'pedigreechums.co.uk']);
export function recorderEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  // Task 72: explicit opt-in. `?rec=1` in the URL turns the recorder on ANYWHERE, including
  // production, so it can be run on the live domain without exposing it to visitors. A normal
  // visit (no `?rec=1`) is unchanged: on a production host the recorder and its panel stay off.
  if (new URLSearchParams(window.location.search).get('rec') === '1') return true;
  return !PROD_HOSTS.has(window.location.hostname);
}
