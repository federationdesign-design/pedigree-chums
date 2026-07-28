// Hidden Games Stage 1: pure record logic.
//
// Everything here is a pure function of its inputs plus an injected "now" in
// milliseconds. No DOM, no localStorage, no Date.now, so every rule below is
// unit testable under node:test without a browser. The browser wiring lives in
// engine.ts and browserEngine.ts.

import {
  type GameId,
  REGISTRY,
  RECORD_SCHEMA,
  EXPIRY_MS,
  isKnownId,
} from "./registry";

export interface HiddenGamesRecord {
  record_schema: typeof RECORD_SCHEMA;
  campaign_version: string;
  total_at_last_seen: number;
  completed_game_ids: GameId[];
  count: number;
  updated_at: string; // ISO 8601
}

// Why a record read differed from a clean restore. Used only for the
// development warning; the visitor never sees a note (BRIEF 4.3).
export type RecordNote =
  | "fresh" // nothing stored
  | "restored" // a valid schema-3 record for this version
  | "malformed" // present but unparseable or wrong shape
  | "schema-mismatch" // record_schema is not 3 (a schema 1 or 2 record)
  | "version-mismatch" // a record from a different campaign version
  | "expired"; // older than 90 days from updated_at

export type ReportOutcome = "awarded" | "duplicate" | "unknown";

// A brand new zero record for the active campaign version.
export function freshRecord(nowMs: number): HiddenGamesRecord {
  return {
    record_schema: RECORD_SCHEMA,
    campaign_version: REGISTRY.campaign_version,
    total_at_last_seen: REGISTRY.games.length,
    completed_game_ids: [],
    count: 0,
    updated_at: new Date(nowMs).toISOString(),
  };
}

// Order completed ids by their position in the registry, so the stored order
// is stable and display friendly regardless of the order finds happened in.
function inRegistryOrder(ids: GameId[]): GameId[] {
  return REGISTRY.games.map((g) => g.id).filter((id) => ids.includes(id));
}

// Interpret whatever is in storage. Never throws. Anything that is not a valid,
// unexpired, same-version schema-3 record fails soft to a fresh zero record and
// reports why through the note. The caller decides whether to persist: a fresh
// result from a schema-mismatch is NOT written back, so a schema 1 or 2 record
// is left untouched (BRIEF 4.3, "It is not overwritten").
export function readRecord(
  raw: string | null,
  nowMs: number
): { record: HiddenGamesRecord; note: RecordNote } {
  if (raw == null || raw === "") {
    return { record: freshRecord(nowMs), note: "fresh" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { record: freshRecord(nowMs), note: "malformed" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { record: freshRecord(nowMs), note: "malformed" };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.record_schema !== RECORD_SCHEMA) {
    // Schema numbers are never reused. A schema 1 or 2 record is not valid
    // Stage 1 progress and is not overwritten here.
    return { record: freshRecord(nowMs), note: "schema-mismatch" };
  }

  if (obj.campaign_version !== REGISTRY.campaign_version) {
    // Version isolation: imports no Game ID from an earlier campaign.
    return { record: freshRecord(nowMs), note: "version-mismatch" };
  }

  const updatedAt = typeof obj.updated_at === "string" ? obj.updated_at : "";
  const updatedMs = Date.parse(updatedAt);
  if (Number.isNaN(updatedMs) || nowMs - updatedMs > EXPIRY_MS) {
    // Not shown, not counted, replaced (BRIEF 4.3, "Expiry").
    return { record: freshRecord(nowMs), note: "expired" };
  }

  // Keep only ids the active registry still knows, de-duplicated, in registry
  // order. count is always derived from that list so it can never disagree.
  const rawIds = Array.isArray(obj.completed_game_ids)
    ? obj.completed_game_ids.filter(
        (id): id is GameId => typeof id === "string" && isKnownId(id)
      )
    : [];
  const completed = inRegistryOrder(Array.from(new Set(rawIds)));

  const totalAtLastSeen =
    typeof obj.total_at_last_seen === "number"
      ? obj.total_at_last_seen
      : REGISTRY.games.length;

  return {
    record: {
      record_schema: RECORD_SCHEMA,
      campaign_version: REGISTRY.campaign_version,
      total_at_last_seen: totalAtLastSeen,
      completed_game_ids: completed,
      count: completed.length,
      updated_at: updatedAt,
    },
    note: "restored",
  };
}

// Apply a report to a record. Deduplication and unknown-id handling live here,
// not in the games (BRIEF 3, "Rules the engine owns"). Returns the same record
// unchanged for a duplicate or an unknown id.
export function applyReport(
  record: HiddenGamesRecord,
  id: string,
  nowMs: number
): { record: HiddenGamesRecord; outcome: ReportOutcome } {
  if (!isKnownId(id)) {
    return { record, outcome: "unknown" };
  }
  if (record.completed_game_ids.includes(id)) {
    return { record, outcome: "duplicate" };
  }
  const completed = inRegistryOrder([...record.completed_game_ids, id]);
  return {
    record: {
      record_schema: RECORD_SCHEMA,
      campaign_version: REGISTRY.campaign_version,
      total_at_last_seen: REGISTRY.games.length,
      completed_game_ids: completed,
      count: completed.length,
      updated_at: new Date(nowMs).toISOString(),
    },
    outcome: "awarded",
  };
}

export function serializeRecord(record: HiddenGamesRecord): string {
  return JSON.stringify(record);
}

// The only visitor-facing string this module produces. Both forms are
// owner-approved copy from BRIEF section 7 ("0/2 games found", "1/2 games
// found"), so the wording is not invented here.
export function counterLabel(count: number, total: number): string {
  return `${count}/${total} games found`;
}
