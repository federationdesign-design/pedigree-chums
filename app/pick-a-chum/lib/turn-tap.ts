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

// Hosts where the recorder must never run. Everything else (Vercel branch
// previews, localhost) is a test surface where recording is allowed.
const PROD_HOSTS = new Set(['www.pedigreechums.co.uk', 'pedigreechums.co.uk']);
export function recorderEnabled(): boolean {
  return typeof window !== 'undefined' && !PROD_HOSTS.has(window.location.hostname);
}
