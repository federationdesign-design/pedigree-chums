// Hidden Games Stage 1: the progress engine.
//
// createEngine wires the pure record logic (record.ts) to injected side
// effects: storage get/set, a clock, and a warning sink. Injecting them keeps
// the engine fully testable under node:test with in-memory stubs, and lets the
// browser build (browserEngine.ts) supply real localStorage, Date.now and
// console.warn.
//
// The engine owns: restore before render, deduplication, unknown-id handling
// with a warning, the version-keyed schema-3 record, and fail-soft reads and
// writes (BRIEF section 3, "Rules the engine owns"). It does NOT know about any
// game: no G01 or G02 wiring lives here.

import { STORAGE_KEY, REGISTRY } from "./registry";
import {
  type HiddenGamesRecord,
  type ReportOutcome,
  applyReport,
  counterLabel,
  readRecord,
  serializeRecord,
} from "./record";

export interface EngineDeps {
  // Read the raw string for a key, or null. May throw; the engine treats a
  // throw as "nothing stored" (fail-soft read, BRIEF 4.3).
  getItem: (key: string) => string | null;
  // Persist a raw string. May throw or refuse; the engine swallows the failure
  // so nothing throws. The visitor-facing storage-blocked message is Batch 2,
  // out of scope here; only "never throws" is in scope.
  setItem: (key: string, value: string) => void;
  now: () => number;
  warn: (message: string) => void;
}

// The public snapshot the counter renders. Kept as a cached, stable reference
// so useSyncExternalStore does not loop: a new object is created only when the
// count actually changes.
export interface CounterState {
  count: number;
  total: number;
  label: string;
}

export interface HiddenGamesEngine {
  reportHiddenGame: (id: string) => ReportOutcome;
  getState: () => CounterState;
  subscribe: (listener: () => void) => () => void;
}

export function createEngine(deps: EngineDeps): HiddenGamesEngine {
  function safeGet(): string | null {
    try {
      return deps.getItem(STORAGE_KEY);
    } catch {
      return null; // fail-soft read: a refused read counts as nothing stored
    }
  }

  function safeSet(value: string): void {
    try {
      deps.setItem(STORAGE_KEY, value);
    } catch {
      // Fail-soft write: a blocked write must not throw. Detection and the
      // visitor message are Batch 2.
    }
  }

  function toState(record: HiddenGamesRecord): CounterState {
    const count = record.count;
    const total = REGISTRY.games.length;
    return { count, total, label: counterLabel(count, total) };
  }

  // Restore before render: the first snapshot already reflects storage, so the
  // counter never paints a stale 0 before real progress appears (BRIEF 9).
  let record = readRecord(safeGet(), deps.now()).record;
  let snapshot: CounterState = toState(record);

  const listeners = new Set<() => void>();
  function emit(): void {
    for (const listener of listeners) listener();
  }

  function reportHiddenGame(id: string): ReportOutcome {
    const { record: next, outcome } = applyReport(record, id, deps.now());
    if (outcome === "unknown") {
      // Ignored, logged as a QA warning, never counted (BRIEF 3).
      deps.warn(`[hidden-games] unknown game id ignored: ${id}`);
      return outcome;
    }
    if (outcome === "duplicate") {
      // A game may call as many times as it likes; the count does not move.
      return outcome;
    }
    record = next;
    safeSet(serializeRecord(record));
    snapshot = toState(record);
    emit();
    return outcome;
  }

  return {
    reportHiddenGame,
    getState: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
