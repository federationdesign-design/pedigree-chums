// Pick a Chum sync store (Postgres, via Neon serverless HTTP).
//
// This replaces the abandoned Google Apps Script / Sheet forward (Task 171). The client still posts a
// completed, non-protected session as { turns: [...], sessions: [...] } to /api/pc-sync; that route now
// writes the rows here instead of forwarding them off-platform. The column set mirrors the recorder's own
// COLUMNS / SESSION_COLUMNS (the same lists the local CSV export uses) so a Postgres export and a local
// export line up exactly. A DB-default received_at is added; the client `timestamp` field is not stored
// (gapAfter already carries the only time signal the export keeps).
//
// The turns table stores ONLY the fields the client actually sends (TurnRow minus route/outcome/protected/
// lastTurn, which SheetSync trims before posting). Protected sessions never reach this module: the client
// drops them in the sync buffer before anything leaves the browser.

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { TurnRow, SessionRow } from "../../app/pick-a-chum/dev/recorder-store";

// ---- Column definitions (single source: field -> db column, mirroring the recorder) ---------------------
// Each entry is [ incoming camelCase key, snake_case db column, type ]. The turn keys are exactly the CSV
// COLUMNS (recorder-store.ts) so a Postgres CSV export matches the local one; the session keys are
// SESSION_COLUMNS. Any field the payload omits defaults to '' (text) or 0 (integer).
type ColType = "text" | "int";
type ColDef<T> = readonly [keyof T, string, ColType];

export const TURN_COLUMNS: readonly ColDef<TurnRow>[] = [
  ["sessionId", "session_id", "text"],
  ["turn", "turn", "int"],
  ["gapAfter", "gap_after", "text"],
  ["activeDog", "active_dog", "text"],
  ["trigger", "trigger", "text"],
  ["input", "input", "text"],
  ["action", "action", "text"],
  ["bucket", "bucket", "text"],
  ["responseId", "response_id", "text"],
  ["responseText", "response_text", "text"],
  ["media", "media", "text"],
  ["transferTo", "transfer_to", "text"],
  ["gameActive", "game_active", "text"],
  ["rephrase", "rephrase", "text"],
] as const;

export const SESSION_COLUMNS_DB: readonly ColDef<SessionRow>[] = [
  ["sessionId", "session_id", "text"],
  ["firstInput", "first_input", "text"],
  ["turnCount", "turn_count", "int"],
  ["dogsUsed", "dogs_used", "text"],
  ["dogSwitched", "dog_switched", "text"],
  ["linkFollowed", "link_followed", "text"],
  ["gamesStarted", "games_started", "int"],
  ["gamesFinished", "games_finished", "int"],
  ["hatsFound", "hats_found", "int"],
  ["laughCount", "laugh_count", "int"],
  ["laughedAt", "laughed_at", "text"],
  ["hadAppearance", "had_appearance", "text"],
  ["endReason", "end_reason", "text"],
] as const;

// ---- Connection --------------------------------------------------------------------------------------
// Vercel's Neon-backed Postgres integration injects several connection strings; any of these works with the
// HTTP driver. Prefer the pooled URL. Returns null when no store is connected, so the caller can no-op.
function conn(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  );
}

export function hasStore(): boolean {
  return conn() !== "";
}

let client: NeonQueryFunction<false, false> | null = null;
function getSql(): NeonQueryFunction<false, false> | null {
  const c = conn();
  if (!c) return null;
  if (!client) client = neon(c);
  return client;
}

// ---- Schema (idempotent, memoised per instance) ------------------------------------------------------
let ensured: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!ensured) ensured = createTables();
  return ensured;
}

async function createTables(): Promise<void> {
  const sql = getSql();
  if (!sql) throw new Error("pc-sync: no Postgres store connected");
  await sql`
    CREATE TABLE IF NOT EXISTS pc_turns (
      id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      received_at    timestamptz NOT NULL DEFAULT now(),
      session_id     text    NOT NULL DEFAULT '',
      turn           integer NOT NULL DEFAULT 0,
      gap_after      text    NOT NULL DEFAULT '',
      active_dog     text    NOT NULL DEFAULT '',
      trigger        text    NOT NULL DEFAULT '',
      input          text    NOT NULL DEFAULT '',
      action         text    NOT NULL DEFAULT '',
      bucket         text    NOT NULL DEFAULT '',
      response_id    text    NOT NULL DEFAULT '',
      response_text  text    NOT NULL DEFAULT '',
      media          text    NOT NULL DEFAULT '',
      transfer_to    text    NOT NULL DEFAULT '',
      game_active    text    NOT NULL DEFAULT '',
      rephrase       text    NOT NULL DEFAULT ''
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS pc_sessions (
      id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      received_at    timestamptz NOT NULL DEFAULT now(),
      session_id     text    NOT NULL DEFAULT '',
      first_input    text    NOT NULL DEFAULT '',
      turn_count     integer NOT NULL DEFAULT 0,
      dogs_used      text    NOT NULL DEFAULT '',
      dog_switched   text    NOT NULL DEFAULT '',
      link_followed  text    NOT NULL DEFAULT '',
      games_started  integer NOT NULL DEFAULT 0,
      games_finished integer NOT NULL DEFAULT 0,
      hats_found     integer NOT NULL DEFAULT 0,
      laugh_count    integer NOT NULL DEFAULT 0,
      laughed_at     text    NOT NULL DEFAULT '',
      had_appearance text    NOT NULL DEFAULT '',
      end_reason     text    NOT NULL DEFAULT ''
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS pc_turns_session_idx ON pc_turns (session_id, turn)`;
  await sql`CREATE INDEX IF NOT EXISTS pc_sessions_session_idx ON pc_sessions (session_id)`;
}

// ---- Coercion --------------------------------------------------------------------------------------
function asText(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}
function asInt(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

// ---- Insert ----------------------------------------------------------------------------------------
// One non-interactive transaction for the whole posted session (its turns + its session summary). Values
// are always passed as tagged-template parameters, so the raw client payload is never interpolated. Fixed
// column lists (no dynamic SQL) mean a stray key in the payload is ignored, not written.
export async function insertBatch(turns: unknown[], sessions: unknown[]): Promise<void> {
  const sql = getSql();
  if (!sql) return; // no store connected: silently no-op (matches the fire-and-forget contract)
  await ensureSchema();

  const queries = [];
  for (const raw of turns) {
    const r = (raw ?? {}) as Record<string, unknown>;
    queries.push(sql`
      INSERT INTO pc_turns
        (session_id, turn, gap_after, active_dog, trigger, input, action, bucket,
         response_id, response_text, media, transfer_to, game_active, rephrase)
      VALUES
        (${asText(r.sessionId)}, ${asInt(r.turn)}, ${asText(r.gapAfter)}, ${asText(r.activeDog)},
         ${asText(r.trigger)}, ${asText(r.input)}, ${asText(r.action)}, ${asText(r.bucket)},
         ${asText(r.responseId)}, ${asText(r.responseText)}, ${asText(r.media)}, ${asText(r.transferTo)},
         ${asText(r.gameActive)}, ${asText(r.rephrase)})
    `);
  }
  for (const raw of sessions) {
    const s = (raw ?? {}) as Record<string, unknown>;
    queries.push(sql`
      INSERT INTO pc_sessions
        (session_id, first_input, turn_count, dogs_used, dog_switched, link_followed,
         games_started, games_finished, hats_found, laugh_count, laughed_at, had_appearance, end_reason)
      VALUES
        (${asText(s.sessionId)}, ${asText(s.firstInput)}, ${asInt(s.turnCount)}, ${asText(s.dogsUsed)},
         ${asText(s.dogSwitched)}, ${asText(s.linkFollowed)}, ${asInt(s.gamesStarted)}, ${asInt(s.gamesFinished)},
         ${asInt(s.hatsFound)}, ${asInt(s.laughCount)}, ${asText(s.laughedAt)}, ${asText(s.hadAppearance)},
         ${asText(s.endReason)})
    `);
  }
  if (queries.length) await sql.transaction(queries);
}

// ---- Reads (admin) ---------------------------------------------------------------------------------
export interface Counts {
  turns: number;
  sessions: number;
  latestReceivedAt: string | null;
}

export async function getCounts(): Promise<Counts> {
  const sql = getSql();
  if (!sql) return { turns: 0, sessions: 0, latestReceivedAt: null };
  await ensureSchema();
  const [t] = await sql`SELECT count(*)::int AS n, max(received_at) AS latest FROM pc_turns`;
  const [s] = await sql`SELECT count(*)::int AS n FROM pc_sessions`;
  return {
    turns: (t?.n as number) ?? 0,
    sessions: (s?.n as number) ?? 0,
    latestReceivedAt: (t?.latest as string) ?? null,
  };
}

// Recent rows for the on-screen table (newest first). CSV export uses the *ordered* readers below.
export async function getRecentTurns(limit: number): Promise<Record<string, unknown>[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureSchema();
  return sql`SELECT * FROM pc_turns ORDER BY id DESC LIMIT ${limit}` as Promise<Record<string, unknown>[]>;
}

export async function getRecentSessions(limit: number): Promise<Record<string, unknown>[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureSchema();
  return sql`SELECT * FROM pc_sessions ORDER BY id DESC LIMIT ${limit}` as Promise<Record<string, unknown>[]>;
}

// Full-table readers for CSV export. Turns are ordered session-then-turn (matching the local export's sort);
// sessions by first receipt.
export async function getAllTurns(): Promise<Record<string, unknown>[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureSchema();
  return sql`SELECT * FROM pc_turns ORDER BY session_id ASC, turn ASC, id ASC` as Promise<Record<string, unknown>[]>;
}

export async function getAllSessions(): Promise<Record<string, unknown>[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureSchema();
  return sql`SELECT * FROM pc_sessions ORDER BY session_id ASC, id ASC` as Promise<Record<string, unknown>[]>;
}
