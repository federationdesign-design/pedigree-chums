// DEV ONLY (stripped for production). IndexedDB-backed store for the conversation
// recorder. Persists one row per turn so a whole test session survives reloads
// and accumulates across sessions until exported. Nothing here runs on the
// production host (the caller is gated by recorderEnabled()).

import { normalise } from '../lib/normalise';
import type { TurnEvent } from '../lib/turn-tap';

export interface TurnRow {
  sessionId: string;
  turn: number;
  timestamp: string; // ISO
  activeDog: string;
  input: string; // raw
  normalised: string; // the compact normalised form the engine keys off
  layer: number;
  layerName: string;
  bucket: string;
  action: string;
  confidence: string; // Act 2 field if present, else blank
  responseId: string;
  responseText: string;
  transferTo: string;
  outcome: string; // transfer | refusal | unmatched | cutoff | answered
  verdict: string; // always empty; Steve tags rows after export
}

export interface Aggregate {
  conversations: number; // sessions with >= 3 messages
  messages: number; // total turns logged
  missed: number; // turns that were unmatched or a refusal
}

// Column order for export (kept in one place so CSV and any future xlsx agree).
export const COLUMNS: (keyof TurnRow)[] = [
  'sessionId', 'turn', 'timestamp', 'activeDog', 'input', 'normalised',
  'layer', 'layerName', 'bucket', 'action', 'confidence', 'responseId',
  'responseText', 'transferTo', 'outcome', 'verdict',
];

const MIN_MESSAGES = 3; // a conversation counts only at three turns or more

// Catch-all / fallback buckets: the router lands here when it could not map the
// message to anything meaningful, so a hit is a miss (a generic deflection), not
// an answer. B13 = single-word + unresolved conversational catch; B14 = gibberish.
// Add any future fallback bucket here so the miss rate stays honest.
const FALLBACK_BUCKETS = new Set(['B13', 'B14']);

// Outcome is a function of the action AND the bucket (some misses, like the B13
// catch-all, share the benign 'converse' action with real greetings, so action
// alone would call them answers).
function outcomeOf(action: string, bucket: string): string {
  if (action === 'transfer') return 'transfer';
  if (action === 'safety_signpost' || action === 'safety_boundary') return 'refusal';
  if (action === 'gibberish' || action === 'gk_unknown' || action === 'emoji_only') return 'unmatched';
  if (FALLBACK_BUCKETS.has(bucket)) return 'unmatched';
  if (action === 'boxer_cutoff') return 'cutoff';
  return 'answered';
}
const isMiss = (outcome: string) => outcome === 'unmatched' || outcome === 'refusal';

const DB_NAME = 'chum-recorder';
const STORE = 'turns';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      })
  );
}

// Build a row from a raw turn event (recompute the normalised form the same way
// the engine does, so the log shows exactly what routing saw).
// D6: never store or export the visitor's raw safety disclosure. A logged
// disclosure is a child's crisis sitting in a CSV. For a safety turn we keep the
// category, route and timestamp and REDACT the raw input at capture, so it never
// reaches IndexedDB. Non-safety turns keep raw input (replay still works for them).
export const REDACTED_INPUT = '[redacted: safety]';
const isSafetyTurn = (action: string) => action === 'safety_signpost' || action === 'safety_boundary';

export function buildRow(e: TurnEvent, now: string): TurnRow {
  const r = e.resolution;
  const resp = e.response;
  const conf = (r as unknown as { confidence?: number | string }).confidence;
  const outcome = outcomeOf(r.action, r.bucket ?? '');
  const text = resp.followUp ? `${resp.text}\n${resp.followUp}` : resp.text;
  const safety = isSafetyTurn(r.action);
  return {
    sessionId: e.sessionId,
    turn: e.turn,
    timestamp: now,
    activeDog: e.activeDog,
    input: safety ? REDACTED_INPUT : e.input,
    normalised: safety ? '' : normalise(e.input).compact,
    layer: r.layer,
    layerName: r.layerName,
    bucket: r.bucket ?? '',
    action: r.action,
    confidence: conf === undefined || conf === null ? '' : String(conf),
    responseId: resp.responseId,
    responseText: text,
    transferTo: e.transferTo ?? '',
    outcome,
    verdict: '',
  };
}

export async function record(e: TurnEvent, now: string): Promise<void> {
  await tx('readwrite', (s) => s.add(buildRow(e, now)));
}

export async function getAllRows(): Promise<TurnRow[]> {
  const rows = (await tx<TurnRow[]>('readonly', (s) => s.getAll())) ?? [];
  // Recompute the outcome on read from the stored action + bucket, so a
  // classification change (like B13 becoming a miss) applies retroactively to
  // rows already recorded, and the badge and the export always agree.
  // Session order (first-seen) then turn order, so a conversation reads top to
  // bottom. sessionId is time-prefixed, so lexical sort is chronological.
  return rows
    .map((r) => ({ ...r, outcome: outcomeOf(r.action, r.bucket) }))
    .sort((a, b) => (a.sessionId === b.sessionId ? a.turn - b.turn : a.sessionId < b.sessionId ? -1 : 1));
}

export async function getAggregate(): Promise<Aggregate> {
  const rows = await getAllRows();
  const perSession = new Map<string, number>();
  let missed = 0;
  for (const row of rows) {
    perSession.set(row.sessionId, (perSession.get(row.sessionId) ?? 0) + 1);
    if (isMiss(row.outcome)) missed += 1;
  }
  let conversations = 0;
  for (const count of perSession.values()) if (count >= MIN_MESSAGES) conversations += 1;
  return { conversations, messages: rows.length, missed };
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: TurnRow[]): string {
  const head = COLUMNS.join(',');
  const body = rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(',')).join('\n');
  return `${head}\n${body}\n`;
}

export function downloadCsv(rows: TurnRow[], filename: string): void {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
