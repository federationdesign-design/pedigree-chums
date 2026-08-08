// DEV / OPT-IN ONLY -- flag OFF by default (gapLogEnabled, an explicit ?gaplog=1). Task 163.
//
// Logs the UNANSWERABLE inputs (the no-subject "im a dog" B40 fallback, per-dog included) to build a
// content backlog of gaps to fill, holding nothing about any one child. Safety wins above the fallback, so
// a disclosure never reaches "im a dog" -- it goes to safeguarding, which is never logged here.
//
// !!! CAVEAT THAT MUST NOT BE ASSUMED AWAY BY WHOEVER READS THIS NEXT !!!
// The frequency threshold is the real privacy control: an input is kept ONLY once it has been seen FIVE
// times from DIFFERENT SESSIONS (a thing many strangers type independently is not personal, by definition).
// But this store is CLIENT-SIDE (IndexedDB): on a single browser it counts THAT BROWSER'S sessions -- NOT
// five different strangers. So the threshold is NOT doing its real job until there is a SERVER ENDPOINT
// aggregating across users. Do not switch this on in production, and do not read the counts as "5 people",
// until that endpoint exists AND proper advice (ICO Children's Code + UK GDPR) has been taken. Redaction is
// a leaky BACKSTOP, never the control, and must not be used to justify lowering the threshold.

import type { TurnEvent } from '../lib/turn-tap';

export const THRESHOLD = 5; // sightings, from different sessions, before the text is ever kept
export const MAX_LEN = 80; // inputs longer than this are dropped -- more length, more incidental detail

// QUALIFYING: only the no-subject fallback family (B40 "im a dog" and the per-dog equivalents like
// LAB-B40-01), identified by the served responseId. Diversions (B46), LOOP repeats/offers (they carry a
// subject), answers, games and greetings are all excluded; safety never reaches the fallback.
export function isNoSubjectFallback(responseId: string): boolean {
  return /(?:^|-)B40(?:-|$)/.test(responseId || '');
}

// REDACTION (the backstop). Five reasons -- name, location, age, contact, school (gender dropped: it
// over-redacted legitimate questions like "the girl dog" and missed pronouns; the threshold covers it).
// A typed marker keeps the SHAPE of the question. Automated redaction on children's free text is leaky by
// nature; the honest misses are documented per rule.
export function redact(input: string): string {
  let s = input;
  // contact: emails, "call me on/at <digits>", any run of 5+ digits (phone). MISSES: spelled-out or
  // obfuscated numbers ("oh seven seven ...").
  s = s.replace(/\b[\w.+-]+@[\w-]+\.\w{2,}\b/gi, '[redacted: contact]');
  s = s.replace(/\bcall me (?:on|at)\b[\s\d]+/gi, 'call me on [redacted: contact]');
  s = s.replace(/\b\d[\d\s]{3,}\d\b/g, '[redacted: contact]');
  // age: DIGITS ONLY, right after "im" / "i am" (owner ruling: no spelled numbers, which over-fire on
  // "im one of those" / "i am ten minutes away"). MISSES: "nearly nine", any age not stated as a digit.
  s = s.replace(/\b(i(?:'?m| am))\s+\d{1,2}\b/gi, '$1 [redacted: age]');
  // school: "i go to <up to 3 words>", "st marys". MISSES: a school named with no trigger.
  s = s.replace(/\b(i go to)\b(?:\s+[\w'-]+){1,3}/gi, '$1 [redacted: school]');
  s = s.replace(/\bst\.?\s+[a-z]+(?:'?s)?\b/gi, '[redacted: school]');
  // location: "i live in/near/at/by <up to 3 words>", "im from <up to 3 words>". MISSES: a place buried
  // in a sentence ("near the big tesco in windsor").
  s = s.replace(/\b(i live (?:in|near|at|by))\b(?:\s+[\w'-]+){1,3}/gi, '$1 [redacted: location]');
  s = s.replace(/\b(i(?:'?m| am) from)\b(?:\s+[\w'-]+){1,3}/gi, '$1 [redacted: location]');
  // name: a Capitalised token right after im / called / my name is / call me / names. MISSES: lowercase
  // names ("phil here"), and any name with no trigger word.
  s = s.replace(/\b(i(?:'?m| am)|called|my name is|call me|names)\s+([A-Z][a-z]+)\b/g, '$1 [redacted: name]');
  return s.replace(/\s{2,}/g, ' ').trim();
}

// The threshold KEY: a hash of the redacted, normalised text, so PII variants collapse and we can count a
// question toward the threshold WITHOUT storing the text while it is below it. cyrb53, a synchronous 53-bit
// hash. Collision risk with K distinct questions is ~ K^2 / 2^54 (K=10,000 -> ~5e-9): negligible, and a
// collision only merges two rare questions' counts, never exposes any text.
function normaliseForHash(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}
export function gapHash(text: string): string {
  const s = normaliseForHash(text);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const n = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return n.toString(36);
}

// The store: counts (with the bucket) for every seen hash, and the redacted text ONLY for hashes at or over
// the threshold. The stored record is: the redacted input, the count, and the bucket -- nothing else. NO
// session id, NO timestamp, nothing that reconstructs a conversation or links two inputs to one person.
export interface GapStore {
  counts: Record<string, { count: number; bucket: string }>;
  texts: Record<string, string>; // hash -> redacted text, present only once count >= THRESHOLD
}
export function emptyStore(): GapStore {
  return { counts: {}, texts: {} };
}
// Per-session, in-memory only: which hashes this session has already counted (dedup, so one child typing a
// thing five times is one sighting) and which texts it has written (to discard on protection). `over` latches
// once the session became -- or is found ever to have been -- protected: it then logs nothing further.
export interface SessionState {
  counted: Set<string>;
  written: Set<string>;
  over: boolean;
}
export function newSessionState(): SessionState {
  return { counted: new Set(), written: new Set(), over: false };
}

// Count one qualifying turn. Never stores the text until the count reaches the threshold.
export function ingest(store: GapStore, sess: SessionState, input: string): void {
  if (sess.over) return; // this session became protected: log nothing more
  if (input.length > MAX_LEN) return; // length cap: drop, do not truncate (truncation splits a redaction)
  const redacted = redact(input);
  const key = gapHash(redacted);
  if (!sess.counted.has(key)) {
    sess.counted.add(key);
    const entry = store.counts[key] ?? { count: 0, bucket: 'B40' };
    entry.count += 1;
    store.counts[key] = entry;
  }
  if (store.counts[key].count >= THRESHOLD && !store.texts[key]) {
    store.texts[key] = redacted; // the fifth different session supplies the text
    sess.written.add(key);
  }
}

// The session became protected. Discard the TEXT this session wrote (a child's earlier words are theirs),
// but KEEP the counts so the volume of unanswered turns stays accurate. Latch so nothing more is logged.
export function onProtected(store: GapStore, sess: SessionState): void {
  for (const key of sess.written) delete store.texts[key];
  sess.written.clear();
  sess.over = true;
}

// The output: a ranked backlog -- redacted input, count, bucket -- highest count first. Only hashes that
// reached the threshold have text, so only those become backlog items (a gap you cannot read is not one).
export function rankedItems(store: GapStore): { input: string; count: number; bucket: string }[] {
  return Object.keys(store.texts)
    .map((h) => ({ input: store.texts[h], count: store.counts[h]?.count ?? 0, bucket: store.counts[h]?.bucket ?? 'B40' }))
    .sort((a, b) => b.count - a.count);
}

// ---- IndexedDB persistence (dev only; a single-key store holding the whole GapStore) ----
const DB_NAME = 'chum-gap-log';
const STORE = 'gap';
const KEY = 'store';
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function loadStore(): Promise<GapStore> {
  try {
    const db = await openDb();
    return await new Promise<GapStore>((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as GapStore) ?? emptyStore());
      };
      req.onerror = () => {
        db.close();
        resolve(emptyStore());
      };
    });
  } catch {
    return emptyStore();
  }
}
export async function saveStore(store: GapStore): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const t = db.transaction(STORE, 'readwrite');
      t.objectStore(STORE).put(store, KEY);
      t.oncomplete = () => {
        db.close();
        resolve();
      };
      t.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {}
}
