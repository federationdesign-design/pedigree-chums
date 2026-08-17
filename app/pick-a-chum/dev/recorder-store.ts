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
// Task 174: route, outcome, protected and lastTurn are TRIMMED from the export (owner request). The TurnRow
// still carries them -- buildSessions/getAggregate read outcome, protected and route to compute endReason,
// linkFollowed and the miss count -- they are just omitted from the exported columns here (and from the sheet
// payload, see SheetSync).
export const COLUMNS: (keyof TurnRow)[] = [
  'sessionId', 'turn', 'gapAfter', 'activeDog', 'trigger', 'input',
  'action', 'bucket', 'responseId', 'responseText', 'media', 'transferTo', 'gameActive',
  'rephrase',
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

// A full REPLY turn (the visitor typed; the engine resolved). resolution/response are always present here.
export function buildRow(e: TurnEvent, now: string): TurnRow {
  const r = e.resolution!;
  const resp = e.response!;
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

// An UNBIDDEN appearance turn (trigger = appearance | sequence | listener): a dog spoke `line` without
// the visitor typing. No input, no bucket/outcome -- just who spoke, what, where, and why (the trigger).
export function buildAppearanceRow(e: TurnEvent, now: string): TurnRow {
  return {
    ...EMPTY_ROW,
    sessionId: e.sessionId,
    turn: e.turn,
    timestamp: now,
    activeDog: e.activeDog,
    route: e.route ?? '',
    trigger: e.trigger ?? 'appearance',
    // A link-follow, a hat-find and a deliberate CLOSE ride the same no-input channel but carry their own
    // action so the per-session sheet can count them; the line holds the target (href) / the hat id.
    // Task 164 fix: 'closed' marks a deliberate close (X / Escape), which endReason reads as "left" (not
    // "abandoned"). It is NOT an appearance, so hadAppearance / dogsUsed / firstInput all ignore it.
    action: e.trigger === 'link' ? 'link_followed' : e.trigger === 'hat' ? 'hat_found' : e.trigger === 'closed' ? 'closed' : 'appearance',
    responseText: e.line ?? '',
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
  const row = e.trigger && e.trigger !== 'reply' ? buildAppearanceRow(e, now) : buildRow(e, now);
  await tx('readwrite', (s) => s.add(row));
}

// SYNCHRONOUS write path for unload-risky turns. An external link navigates the page away before an
// async IndexedDB write could land, so an external-link click would be silently lost -- worse than no
// data, since the linkFollowed column would look complete while under-counting exactly the click-throughs
// you cannot infer anywhere else. localStorage.setItem is synchronous, so the row is safe before the
// navigation; flushPending() moves the buffer into IndexedDB on the next recorder init / export.
const PENDING_KEY = 'chum-recorder-pending';
function readPending(): TurnRow[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]') as TurnRow[];
  } catch {
    return [];
  }
}
export function recordPendingSync(e: TurnEvent, now: string): void {
  if (e.protectedState) return; // never buffer a protected turn (it is not recorded at all)
  try {
    const row = e.trigger && e.trigger !== 'reply' ? buildAppearanceRow(e, now) : buildRow(e, now);
    localStorage.setItem(PENDING_KEY, JSON.stringify([...readPending(), row]));
  } catch {}
}
export async function flushPending(): Promise<void> {
  const pending = readPending();
  if (!pending.length) return;
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {}
  for (const row of pending) {
    try {
      await tx('readwrite', (s) => s.add(row));
    } catch {}
  }
}

// Task 164 fix: rows written before the Task 159 schema (trigger / activeDog / input) carry no `trigger`,
// so they blank out the per-session summary -- turnCount and gamesStarted survive (they key on turn /
// action), but everything keyed on trigger / input / activeDog (firstInput, dogsUsed, laughCount,
// hadAppearance) and on the no-input actions (hatsFound, linkFollowed) comes out empty. Dropped on load so
// stale data cannot keep producing empty summaries. Targeted: ONLY rows missing `trigger` go; every valid
// current row (buildRow / buildAppearanceRow / buildProtectedMarker always set a non-empty trigger) stays.
export async function purgeLegacyRows(): Promise<number> {
  const all = (await tx<(TurnRow & { id?: number })[]>('readonly', (s) => s.getAll())) ?? [];
  const legacyIds = all.filter((r) => !r.trigger).map((r) => r.id).filter((id): id is number => typeof id === 'number');
  if (!legacyIds.length) return 0;
  await tx('readwrite', (s) => {
    for (const id of legacyIds) s.delete(id);
    return s.count(); // resolves the tx after the deletes queue; they commit together
  });
  return legacyIds.length;
}

export async function getAllRows(): Promise<TurnRow[]> {
  const idb = (await tx<TurnRow[]>('readonly', (s) => s.getAll())) ?? [];
  const rows = [...idb, ...readPending()]; // include sync-captured rows not yet flushed to IndexedDB
  // Recompute outcome from action+bucket so a classification change applies retroactively. Only REPLY
  // turns have an outcome; appearance / link / hat / protected-marker rows keep a blank one. Session order
  // (first-seen, sessionId is time-prefixed so lexical == chronological) then turn order, then enrich.
  const sorted = rows
    .map((r) => ({ ...r, outcome: r.trigger && r.trigger !== 'reply' ? '' : r.action ? outcomeOf(r.action, r.bucket) : '' }))
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
  triggerDownload(toCsv(rows), filename);
}

function triggerDownload(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  // Defer cleanup: revoking the object URL synchronously can cancel the download before it starts. (This
  // was one reason the two-file export dropped a sheet.) Give the browser a beat.
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1500);
}

// ---- Task 159 stage 3: the SECOND SHEET -- one row per session (the creative half) ------
// Diagnostic insight is per turn; creative insight is per session: what someone arrived wanting, what
// they did with it, and where they left. Computed entirely from the per-turn rows (no extra capture).
export interface SessionRow {
  sessionId: string;
  firstInput: string; // what they arrived wanting, before anything prompted them
  turnCount: number;
  dogsUsed: string; // the dogs they spoke to, e.g. collie|labrador
  dogSwitched: string; // TRUE if more than one dog
  linkFollowed: string; // the page(s) they clicked through to (the whole point of the chat), or '' if none
  gamesStarted: number;
  gamesFinished: number; // started is not the same as completed
  hatsFound: number; // distinct hidden-games hats revealed this session
  laughCount: number; // how many of the dog's lines got a laugh
  laughedAt: string; // the responseIds that got one -- after N sessions, a ranked list of what works
  hadAppearance: string; // TRUE if a dog appeared unbidden this session
  endReason: string; // ceiling | protected | abandoned
}

export const SESSION_COLUMNS: (keyof SessionRow)[] = [
  'sessionId', 'firstInput', 'turnCount', 'dogsUsed', 'dogSwitched', 'linkFollowed',
  'gamesStarted', 'gamesFinished', 'hatsFound', 'laughCount', 'laughedAt', 'hadAppearance', 'endReason',
];

// A laugh: a visitor reply that is pure amusement, landing right after a dog line -- direct creative
// feedback, attributed to that line's responseId. Protected turns are never recorded, so a nervous laugh
// after a difficult exchange is already excluded (brief section 8).
const LAUGH_RE = /^\s*(?:(?:ha){2,}|(?:he){2,}|l(?:o)+l|lmf?ao|rofl|:\)|:-\)|:d|xd|😂|🤣|(?:that'?s|thats|so|too)\s+funny|good\s+one)\s*$/i;
export function isLaugh(input: string): boolean {
  return LAUGH_RE.test(input || '');
}

export function buildSessions(rows: TurnRow[]): SessionRow[] {
  const bySession = new Map<string, TurnRow[]>();
  for (const r of rows) {
    const arr = bySession.get(r.sessionId) ?? [];
    arr.push(r);
    bySession.set(r.sessionId, arr);
  }
  const out: SessionRow[] = [];
  for (const [sessionId, srows] of bySession) {
    const firstInput = srows.find((r) => r.trigger === 'reply' && r.input)?.input ?? '';
    const turnCount = srows.reduce((m, r) => Math.max(m, r.turn), 0);
    const dogs = new Set<string>();
    for (const r of srows) {
      if (r.trigger !== 'reply') continue; // dogsUsed = dogs the visitor actually conversed with (not merely appeared)
      if (r.activeDog) dogs.add(r.activeDog);
      if (r.transferTo) dogs.add(r.transferTo);
    }
    const gamesStarted = srows.filter((r) => r.action === 'game_start').length;
    let gamesFinished = 0;
    let laughCount = 0;
    let lastResponseId = ''; // the last dog line's responseId, skipping meta rows (link/hat, no responseId)
    const laughedAt: string[] = [];
    for (let i = 0; i < srows.length; i++) {
      const cur = srows[i];
      const prev = srows[i - 1];
      if (prev && prev.gameActive && !cur.gameActive) gamesFinished += 1; // a running game just cleared
      if (cur.trigger === 'reply' && isLaugh(cur.input) && lastResponseId) {
        laughCount += 1;
        laughedAt.push(lastResponseId); // attribute the laugh to the dog line BEFORE it
      }
      if (cur.responseId) lastResponseId = cur.responseId;
    }
    const endReason = srows.some((r) => r.action === 'boxer_cutoff')
      ? 'ceiling' // the 20-turn cutoff, NOT a real exit (brief section 8)
      : srows.some((r) => r.protected === 'TRUE')
        ? 'protected'
        // Task 164 fix: a deliberate close (X / Escape) leaves a 'closed' marker. "Left" is a different
        // outcome from "gave up": abandoned is now only a session that just stopped, with no close.
        : srows.some((r) => r.trigger === 'closed')
          ? 'closed'
          : 'abandoned';
    const linkTargets = [...new Set(srows.filter((r) => r.action === 'link_followed').map((r) => r.responseText).filter(Boolean))];
    const hatsFound = new Set(srows.filter((r) => r.action === 'hat_found').map((r) => r.responseText).filter(Boolean)).size;
    out.push({
      sessionId,
      firstInput,
      turnCount,
      dogsUsed: [...dogs].join('|'),
      dogSwitched: dogs.size > 1 ? 'TRUE' : '',
      linkFollowed: linkTargets.join('|'),
      gamesStarted,
      gamesFinished,
      hatsFound,
      laughCount,
      laughedAt: laughedAt.join('|'),
      // an appearance is a dog speaking unbidden -- NOT a link-follow or hat-find (those share the channel).
      hadAppearance: srows.some((r) => r.trigger === 'appearance' || r.trigger === 'sequence' || r.trigger === 'listener') ? 'TRUE' : '',
      endReason,
    });
  }
  return out;
}

export async function getSessions(): Promise<SessionRow[]> {
  return buildSessions(await getAllRows());
}

export function toSessionCsv(sessions: SessionRow[]): string {
  const head = SESSION_COLUMNS.join(',');
  const body = sessions.map((r) => SESSION_COLUMNS.map((c) => csvCell(r[c])).join(',')).join('\n');
  return `${head}\n${body}\n`;
}

// The PER-TURN sheet (the diagnostic half: sessionId, turn, activeDog, route, trigger, INPUT, outcome,
// action, bucket, responseId, ...). This is where the input column lives.
export async function downloadTurns(stamp: string): Promise<void> {
  triggerDownload(toCsv(await getAllRows()), `pick-a-chum-turns-${stamp}.csv`);
}
// The PER-SESSION summary sheet (the creative half: firstInput, dogsUsed, games, laughs, endReason, ...).
export async function downloadSessions(stamp: string): Promise<void> {
  triggerDownload(toSessionCsv(buildSessions(await getAllRows())), `pick-a-chum-sessions-${stamp}.csv`);
}
// Export both sheets. Kept for convenience, but each is now its own panel button (a single click == a
// single download) so browsers never suppress the second of two instantaneous downloads. The second is
// staggered so a "Download both" still delivers two files where the browser allows it.
export async function downloadBoth(stamp: string): Promise<void> {
  const rows = await getAllRows();
  triggerDownload(toCsv(rows), `pick-a-chum-turns-${stamp}.csv`);
  await new Promise((res) => setTimeout(res, 400));
  triggerDownload(toSessionCsv(buildSessions(rows)), `pick-a-chum-sessions-${stamp}.csv`);
}
