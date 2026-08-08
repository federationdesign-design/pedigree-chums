// DEV ONLY (stripped for production). IndexedDB-backed store for the conversation
// recorder. Persists one row per turn so a whole test session survives reloads and
// accumulates across sessions until exported. Nothing here runs on the production
// host (the caller is gated by recorderEnabled()).
//
// Task 159 (recorder v2): 24 tuning columns down to 18 diagnostic ones. The classifier-
// scoring fields (topScore/runnerUp/matchedSignals/gapType/clusterKey/topIntent) and
// normalised/layer/layerName/confidence/verdict/candidate are gone -- they were never
// read; faults are found by READING conversations, not scoring them. New columns carry
// the signals that actually surfaced faults: rephrase, route, trigger, media, gameActive,
// gapAfter, lastTurn, protected. gapAfter/rephrase/lastTurn are computed on read from the
// stored rows (timestamp is kept internally to drive gapAfter but is not itself a column).
//
// PROTECTED SESSIONS ARE NOT RECORDED (owner decision, brief section 9). A protected
// session is a child in distress; logging it puts a disclosure in a CSV, and nothing in
// that file would improve the product. We record ONLY that a session became protected and
// at which turn (the fact, no input, no response), then nothing more from that session.

import type { TurnEvent } from '../lib/turn-tap';

export interface TurnRow {
  sessionId: string;
  turn: number;
  timestamp: string; // ISO -- internal only (drives gapAfter); NOT an exported column
  gapAfter: string; // seconds since the previous turn in this session (computed on read)
  activeDog: string;
  route: string; // the page the visitor was on
  trigger: string; // reply | appearance | sequence | listener -- why this turn happened
  input: string; // raw; blank on a protected-marker row
  outcome: string; // transfer | refusal | unmatched | cutoff | answered
  action: string;
  bucket: string;
  responseId: string;
  responseText: string;
  media: string; // the clip filename, if one served
  transferTo: string;
  gameActive: string; // the game running this turn, if any
  rephrase: string; // TRUE if this turn covers the same subject as the previous one (computed on read)
  protected: string; // TRUE only on the turn a session became protected; that session logs nothing else
  lastTurn: string; // TRUE on the final logged turn of the session (computed on read)
}

export interface Aggregate {
  conversations: number; // sessions with >= 3 messages
  messages: number; // total turns logged
  missed: number; // turns that were unmatched or a refusal
}

// Column order for export (kept in one place so CSV and any future xlsx agree). `timestamp`
// is deliberately excluded -- gapAfter replaces it (a relative gap reads without arithmetic).
export const COLUMNS: (keyof TurnRow)[] = [
  'sessionId', 'turn', 'gapAfter', 'activeDog', 'route', 'trigger', 'input', 'outcome',
  'action', 'bucket', 'responseId', 'responseText', 'media', 'transferTo', 'gameActive',
  'rephrase', 'protected', 'lastTurn',
];

const MIN_MESSAGES = 3; // a conversation counts only at three turns or more

// Catch-all / fallback buckets: a hit here is a miss (a generic deflection), not an answer.
const FALLBACK_BUCKETS = new Set(['B13', 'B14']);
// Weak FAQ matches below this strength are misses, not answers (Task 10B).
const FAQ_MATCH_THRESHOLD = 1;

// Outcome is a function of the action, the bucket AND (for FAQ) the match strength.
function outcomeOf(action: string, bucket: string, faqStrength?: number): string {
  if (action === 'transfer') return 'transfer';
  if (action === 'safety_signpost' || action === 'safety_boundary') return 'refusal';
  if (action === 'gibberish' || action === 'gk_unknown' || action === 'emoji_only') return 'unmatched';
  if (action === 'faq_answer' && faqStrength !== undefined && faqStrength < FAQ_MATCH_THRESHOLD) return 'unmatched';
  if (FALLBACK_BUCKETS.has(bucket)) return 'unmatched';
  if (action === 'boxer_cutoff') return 'cutoff';
  return 'answered';
}
const isMiss = (outcome: string) => outcome === 'unmatched' || outcome === 'refusal';

// ---- Rephrase detection (brief section 5: the strongest fault signal) --------------------
// TRUE when a turn covers the same subject as the previous one. Multi-signal so it catches
// both "what breed are you" -> "yeah but what breed are you" (same bucket) and "do you like
// xmas" -> "I mean christmas time" (a retry marker + a shared word).
const REPHRASE_MARKERS = ['i mean', 'i meant', 'no i mean', 'what i mean', 'yeah but', 'actually', 'i said', 'no i said'];
const REPHRASE_STOP = new Set([
  'the', 'a', 'an', 'of', 'is', 'are', 'do', 'does', 'you', 'your', 'to', 'in', 'it', 'this', 'that',
  'can', 'on', 'and', 'for', 'with', 'me', 'my', 'i', 'what', 'how', 'where', 'when', 'who', 'why', 'which',
  'like', 'yes', 'no', 'but', 'so', 'im', 'not', 'have', 'get', 'about',
]);
function words(s: string): Set<string> {
  return new Set(
    (s || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3 && !REPHRASE_STOP.has(w))
  );
}
export function detectRephrase(prev: TurnRow, cur: TurnRow): boolean {
  const inp = (cur.input || '').toLowerCase().trim();
  if (!inp) return false; // no input to compare (a protected marker, or an appearance)
  // (a) same non-empty bucket as the previous turn.
  if (cur.bucket && prev.bucket && cur.bucket === prev.bucket) return true;
  // (b) a retry-marker opener ("i mean ...", "yeah but ...").
  if (REPHRASE_MARKERS.some((m) => inp === m || inp.startsWith(m + ' ') || inp.includes(' ' + m + ' '))) return true;
  // (c) a shared significant content word with the previous input.
  const pw = words(prev.input);
  for (const w of words(cur.input)) if (pw.has(w)) return true;
  return false;
}

// ---- Read-time enrichment: gapAfter, rephrase, lastTurn --------------------------------
// Computed across the session-then-turn sorted rows rather than at capture, so buildRow
// stays a pure single-turn function and these never need prior-turn state at write time.
export function enrichRows(rows: TurnRow[]): TurnRow[] {
  const lastTurnBySession = new Map<string, number>();
  for (const r of rows) lastTurnBySession.set(r.sessionId, Math.max(lastTurnBySession.get(r.sessionId) ?? 0, r.turn));
  let prev: TurnRow | null = null;
  return rows.map((r) => {
    const sameSession = !!prev && prev.sessionId === r.sessionId;
    const gapAfter = sameSession
      ? String(Math.max(0, Math.round((Date.parse(r.timestamp) - Date.parse(prev!.timestamp)) / 1000)))
      : '';
    const rephrase = sameSession && detectRephrase(prev!, r) ? 'TRUE' : '';
    const lastTurn = r.turn === lastTurnBySession.get(r.sessionId) ? 'TRUE' : '';
    prev = r;
    return { ...r, gapAfter, rephrase, lastTurn };
  });
}

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

const EMPTY_ROW: Omit<TurnRow, 'sessionId' | 'turn' | 'timestamp' | 'activeDog' | 'route' | 'trigger'> = {
  gapAfter: '', input: '', outcome: '', action: '', bucket: '', responseId: '', responseText: '',
  media: '', transferTo: '', gameActive: '', rephrase: '', protected: '', lastTurn: '',
};

// A full (non-protected) turn.
export function buildRow(e: TurnEvent, now: string): TurnRow {
  const r = e.resolution;
  const resp = e.response;
  const outcome = outcomeOf(r.action, r.bucket ?? '', r.faqMatchStrength);
  const text = resp.followUp ? `${resp.text}\n${resp.followUp}` : resp.text;
  return {
    ...EMPTY_ROW,
    sessionId: e.sessionId,
    turn: e.turn,
    timestamp: now,
    activeDog: e.activeDog,
    route: e.route ?? '',
    trigger: e.trigger ?? 'reply',
    input: e.input,
    outcome,
    action: r.action,
    bucket: r.bucket ?? '',
    responseId: resp.responseId,
    responseText: text,
    media: resp.media?.src ?? '',
    transferTo: e.transferTo ?? '',
    gameActive: e.gameActive ?? '',
  };
}

// The one row a protected session leaves: the FACT that it became protected, and at which
// turn. No input, no response, no category -- nothing that reconstructs the disclosure.
export function buildProtectedMarker(e: TurnEvent, now: string): TurnRow {
  return {
    ...EMPTY_ROW,
    sessionId: e.sessionId,
    turn: e.turn,
    timestamp: now,
    activeDog: e.activeDog,
    route: e.route ?? '',
    trigger: e.trigger ?? 'reply',
    protected: 'TRUE',
  };
}

// Sessions already recorded as protected -- module state (single dev tab; protected sessions
// are never persisted, so they get a fresh id per load and this Set matches their lifetime).
const protectedSessions = new Set<string>();

export async function record(e: TurnEvent, now: string): Promise<void> {
  if (e.protectedState) {
    if (protectedSessions.has(e.sessionId)) return; // already protected: record NOTHING more
    protectedSessions.add(e.sessionId);
    await tx('readwrite', (s) => s.add(buildProtectedMarker(e, now))); // the became-protected fact only
    return;
  }
  await tx('readwrite', (s) => s.add(buildRow(e, now)));
}

export async function getAllRows(): Promise<TurnRow[]> {
  const rows = (await tx<TurnRow[]>('readonly', (s) => s.getAll())) ?? [];
  // Recompute outcome from action+bucket so a classification change applies retroactively
  // (marker rows have a blank action and keep a blank outcome). Session order (first-seen,
  // sessionId is time-prefixed so lexical == chronological) then turn order, then enrich.
  const sorted = rows
    .map((r) => ({ ...r, outcome: r.action ? outcomeOf(r.action, r.bucket) : '' }))
    .sort((a, b) => (a.sessionId === b.sessionId ? a.turn - b.turn : a.sessionId < b.sessionId ? -1 : 1));
  return enrichRows(sorted);
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
