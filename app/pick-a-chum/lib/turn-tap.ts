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
  input: string; // raw input, exactly as typed ('' for an unbidden appearance -- no visitor input)
  // A reply turn carries the engine's resolution + response. An UNBIDDEN appearance (trigger !== 'reply')
  // has neither -- it just served `line` from a dog, so both are optional and `line` carries the text.
  resolution?: Resolution;
  response?: Assembled;
  line?: string; // Task 159 stage 2: the dog line for an appearance/sequence/listener turn
  transferTo?: Dog; // set when this turn switched the active dog
  candidateSubject?: string | null; // Task 57: the loop's candidate inside-world subject this turn, or null
  // Task 159 (recorder v2): context the log needs but the resolution/response do not carry.
  route?: string; // the page pathname the visitor was on
  gameActive?: string | null; // session.activeGame this turn, if any
  protectedState?: string | null; // session.protectedState ('active' | 'aftercare' | null) -- a set value means DO NOT record this turn (only the transition marker)
  trigger?: string; // why this turn happened: 'reply' (the visitor typed) | 'appearance' | 'sequence' | 'listener' | 'link' | 'hat'
  sync?: boolean; // Task 159: capture this turn SYNCHRONOUSLY (an external link unloads the page before an async write lands)
}

type Sink = (e: TurnEvent) => void;
// Multiple sinks: the dev recorder AND (Task 163) the gap-log both tap here, each gated by its own flag.
const sinks = new Set<Sink>();

export function addTurnTap(fn: Sink): () => void {
  sinks.add(fn);
  return () => {
    sinks.delete(fn);
  };
}

export function emitTurn(e: TurnEvent): void {
  for (const sink of sinks) {
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

// Task 163: the gap-log flag. OFF BY DEFAULT, EVERYWHERE. It collects free text typed by children (only the
// unanswerable no-subject fallback), so unlike the recorder it is NEVER host-derived -- it is on ONLY with
// an explicit `?gaplog=1`. Off => no sink registered => nothing is collected, counted or sent.
export function gapLogEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('gaplog') === '1';
}

// ---- Task 171 (Section 0): THE OFF SWITCH for sending tester transcripts to a Google Sheet ----
//
// The send path (built later, and only once the owner has answered the children's-data question) will be off
// unless BOTH are true:
//   1. the visitor carries `?rec=1` -- the same per-visitor flag the owner hands testers, checked EXPLICITLY
//      here and NEVER host-derived, so an ordinary visitor and a flagless developer on localhost post nothing;
//   2. a RUNTIME kill switch reports enabled.
//
// The kill switch is RUNTIME, not a build-time env var, so the owner can STOP IT INSTANTLY with no redeploy.
// It lives in Vercel Edge Config (key `pickachum_sync`, field `enabled`) and is read server-side by the
// /api/pc-sync-config route; this client helper only asks that route. DEFAULT IS OFF: no `?rec=1`, no Edge
// Config store connected, a disabled value, or any network/parse error all resolve to false. Nothing here
// sends transcript data -- it only reports the on/off state the send path will check before it does anything.
export async function fetchSheetSyncEnabled(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).get('rec') !== '1') return false; // gate before any fetch
  try {
    const res = await fetch('/api/pc-sync-config', { cache: 'no-store' });
    if (!res.ok) return false;
    const v: unknown = await res.json();
    return typeof v === 'object' && v !== null && (v as { enabled?: unknown }).enabled === true;
  } catch {
    return false;
  }
}
