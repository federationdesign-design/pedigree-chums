// Hidden Games Stage 1: the progress engine.
//
// createEngine wires the pure record logic (record.ts) and the lifecycle rules
// (lifecycle.ts) to injected side effects: storage get/set, a clock, and a
// warning sink. Injecting them keeps the engine fully testable under node:test
// with in-memory stubs, and lets the browser build (browserEngine.ts) supply
// real localStorage, Date.now and console.warn plus the build-time status.
//
// The engine owns: restore before render, deduplication, unknown-id handling
// with a warning, the version-keyed schema-3 record, fail-soft reads and writes
// with storage-blocked detection, and lifecycle gating of finds (BRIEF sections
// 3, 4.2, 5). It does NOT know about any game.

import { STORAGE_KEY, REGISTRY } from "./registry";
import {
  type HiddenGamesRecord,
  type ReportOutcome,
  applyReport,
  counterLabel,
  readRecord,
  serializeRecord,
} from "./record";
import {
  type LifecycleStatus,
  type CounterView,
  lifecycleView,
} from "./lifecycle";
import { type MeasurementEvent, HG_EVENTS } from "./measure";

export interface EngineDeps {
  // Read the raw string for a key, or null. May throw; the engine treats a
  // throw as "nothing stored" (fail-soft read, BRIEF 4.3).
  getItem: (key: string) => string | null;
  // Persist a raw string. May throw or refuse; the engine records that as
  // storage-blocked and never re-throws (BRIEF 4.2).
  setItem: (key: string, value: string) => void;
  now: () => number;
  warn: (message: string) => void;
  // Operational status from build config (BRIEF 5). Optional: defaults to OPEN,
  // the live experience, so existing callers are unaffected.
  status?: LifecycleStatus;
  // Aggregate measurement sink (BRIEF 8). Optional: when absent the engine
  // emits nothing, so existing callers and tests are unaffected. The browser
  // supplies a consent-gated GA4 emitter; tests supply a spy.
  track?: (event: MeasurementEvent) => void;
}

// A report that reached the engine but did not register because the campaign is
// not accepting finds (SUSPENDED, CLOSED or ARCHIVED).
export type EngineOutcome = ReportOutcome | "frozen";

// The public snapshot the counter renders. Kept as a cached, stable reference
// so useSyncExternalStore does not loop: a new object is created only when
// something the counter shows actually changes.
export interface CounterState {
  count: number;
  total: number;
  label: string;
  status: LifecycleStatus;
  view: CounterView;
  render: boolean;
  // True once a write has been refused by the browser (BRIEF 4.2). The visitor
  // is told once; the site stays playable and nothing throws.
  storageBlocked: boolean;
  // Whether the visitor has seen the one-time introduction (D10).
  introSeen: boolean;
  // Derived completion: count equals the total (BRIEF 4.3, "Completion is
  // derived, not stored").
  completed: boolean;
  // Whether the visitor has seen the one-time completion celebration (D11).
  completionSeen: boolean;
}

export interface HiddenGamesEngine {
  reportHiddenGame: (id: string) => EngineOutcome;
  markIntroSeen: () => void;
  markCompletionSeen: () => void;
  getState: () => CounterState;
  subscribe: (listener: () => void) => () => void;
}

export function createEngine(deps: EngineDeps): HiddenGamesEngine {
  const status: LifecycleStatus = deps.status ?? "OPEN";
  const view = lifecycleView(status);

  function safeGet(): string | null {
    try {
      return deps.getItem(STORAGE_KEY);
    } catch {
      return null; // fail-soft read: a refused read counts as nothing stored
    }
  }

  // True on a successful write, false if the browser refused it. A refusal
  // never throws (BRIEF 4.2); the caller records it as storage-blocked.
  function safeSet(value: string): boolean {
    try {
      deps.setItem(STORAGE_KEY, value);
      return true;
    } catch {
      return false;
    }
  }

  let storageBlocked = false;

  function toState(record: HiddenGamesRecord): CounterState {
    const count = record.count;
    const total = REGISTRY.games.length;
    return {
      count,
      total,
      label: counterLabel(count, total),
      status,
      view: view.view,
      render: view.render,
      storageBlocked,
      introSeen: record.intro_seen,
      completed: total > 0 && count === total,
      completionSeen: record.completion_seen,
    };
  }

  // Restore before render: the first snapshot already reflects storage, so the
  // counter never paints a stale 0 before real progress appears (BRIEF 9).
  // Detection is lazy, so restore performs no write.
  let record = readRecord(safeGet(), deps.now()).record;
  let snapshot: CounterState = toState(record);

  const listeners = new Set<() => void>();
  function emit(): void {
    for (const listener of listeners) listener();
  }

  function reportHiddenGame(id: string): EngineOutcome {
    if (!view.acceptsFinds) {
      // Frozen: SUSPENDED, CLOSED or ARCHIVED. Nothing registers, nothing is
      // written, and the stored record is left exactly as it was (BRIEF 5).
      return "frozen";
    }
    const { record: next, outcome } = applyReport(record, id, deps.now());
    if (outcome === "unknown") {
      // Ignored, logged as a QA warning, never counted (BRIEF 3). The measured
      // signal carries no raw id (no message content, BRIEF 8).
      deps.warn(`[hidden-games] unknown game id ignored: ${id}`);
      deps.track?.({ name: HG_EVENTS.unknownId });
      return outcome;
    }
    if (outcome === "duplicate") {
      // A game may call as many times as it likes; the count does not move.
      deps.track?.({ name: HG_EVENTS.duplicate, params: { game_id: id } });
      return outcome;
    }
    record = next;
    if (!safeSet(serializeRecord(record))) {
      // The find is kept in memory so play is unaffected, but it could not be
      // saved: tell the visitor once (BRIEF 4.2) and measure it once.
      if (!storageBlocked) {
        storageBlocked = true;
        deps.track?.({ name: HG_EVENTS.storageBlocked });
      }
    }
    snapshot = toState(record);
    emit();
    deps.track?.({ name: HG_EVENTS.award, params: { game_id: id } });
    if (snapshot.completed) {
      deps.track?.({ name: HG_EVENTS.completion });
    }
    return outcome;
  }

  // Mark the one-time introduction as seen and persist it in the record (D10),
  // so it never expands again for this browser. Best-effort: a refused write
  // just re-shows the intro on the next visit and is not the storage-blocked
  // (finds cannot be saved) condition, so it does not set that flag.
  function markIntroSeen(): void {
    if (record.intro_seen) return;
    record = { ...record, intro_seen: true };
    safeSet(serializeRecord(record));
    snapshot = toState(record);
    emit();
  }

  // Mark the one-time completion celebration as seen and persist it alongside
  // the progress (D11), so the completion card collapses to a persistent
  // completed chip and does not reappear on the next page. Same best-effort
  // persistence as markIntroSeen.
  function markCompletionSeen(): void {
    if (record.completion_seen) return;
    record = { ...record, completion_seen: true };
    safeSet(serializeRecord(record));
    snapshot = toState(record);
    emit();
  }

  return {
    reportHiddenGame,
    markIntroSeen,
    markCompletionSeen,
    getState: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
