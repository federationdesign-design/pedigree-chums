// Hidden Games Stage 1: pure record logic assertions.
// Run: node --test tests/hidden-games/
//
// Covers the record rules of BRIEF section 4.3 plus deduplication, unknown-id
// handling and the counter label. Every case injects "now" so nothing depends
// on the wall clock.

import test from "node:test";
import assert from "node:assert/strict";

import {
  freshRecord,
  readRecord,
  applyReport,
  serializeRecord,
  counterLabel,
} from "../../lib/hiddenGames/record.ts";
import { EXPIRY_MS } from "../../lib/hiddenGames/registry.ts";

const NOW = Date.parse("2026-07-28T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function validRecordRaw(overrides = {}) {
  return serializeRecord({
    record_schema: 3,
    campaign_version: "HIDDEN_GAMES_2026_01",
    total_at_last_seen: 2,
    completed_game_ids: ["G01"],
    count: 1,
    updated_at: new Date(NOW - DAY).toISOString(),
    ...overrides,
  });
}

test("HG-REC-01 freshRecord is a zero schema-3 record for the active version", () => {
  const r = freshRecord(NOW);
  assert.equal(r.record_schema, 3);
  assert.equal(r.campaign_version, "HIDDEN_GAMES_2026_01");
  assert.equal(r.count, 0);
  assert.deepEqual(r.completed_game_ids, []);
  assert.equal(r.total_at_last_seen, 2);
  assert.equal(r.updated_at, new Date(NOW).toISOString());
});

test("HG-FAILSOFT-01 null storage reads as a fresh zero record", () => {
  const { record, note } = readRecord(null, NOW);
  assert.equal(note, "fresh");
  assert.equal(record.count, 0);
});

test("HG-FAILSOFT-02 malformed JSON fails soft to zero and never throws", () => {
  assert.doesNotThrow(() => readRecord("{not json", NOW));
  const { record, note } = readRecord("{not json", NOW);
  assert.equal(note, "malformed");
  assert.equal(record.count, 0);
});

test("HG-RESTORE-01 a valid schema-3 record for this version is restored with its count", () => {
  const { record, note } = readRecord(validRecordRaw(), NOW);
  assert.equal(note, "restored");
  assert.equal(record.count, 1);
  assert.deepEqual(record.completed_game_ids, ["G01"]);
});

test("HG-SCHEMA-01 a schema 1 or 2 record is not counted (schema numbers never reused)", () => {
  for (const schema of [1, 2]) {
    const { record, note } = readRecord(
      validRecordRaw({ record_schema: schema }),
      NOW
    );
    assert.equal(note, "schema-mismatch");
    assert.equal(record.count, 0);
  }
});

test("HG-VERSION-01 a record from another campaign version reads as zero and imports no id", () => {
  const { record, note } = readRecord(
    validRecordRaw({ campaign_version: "HIDDEN_GAMES_2025_99" }),
    NOW
  );
  assert.equal(note, "version-mismatch");
  assert.equal(record.count, 0);
  assert.deepEqual(record.completed_game_ids, []);
});

test("HG-EXPIRY-01 a record older than 90 days is not counted and is replaced", () => {
  const raw = validRecordRaw({
    updated_at: new Date(NOW - EXPIRY_MS - DAY).toISOString(),
  });
  const { record, note } = readRecord(raw, NOW);
  assert.equal(note, "expired");
  assert.equal(record.count, 0);
});

test("HG-EXPIRY-02 a record within 90 days is restored", () => {
  const raw = validRecordRaw({
    updated_at: new Date(NOW - EXPIRY_MS + DAY).toISOString(),
  });
  const { record, note } = readRecord(raw, NOW);
  assert.equal(note, "restored");
  assert.equal(record.count, 1);
});

test("HG-REC-02 restore drops unknown completed ids and derives count from the survivors", () => {
  const raw = validRecordRaw({
    completed_game_ids: ["G01", "G99", "G01"],
    count: 3,
  });
  const { record } = readRecord(raw, NOW);
  assert.deepEqual(record.completed_game_ids, ["G01"]);
  assert.equal(record.count, 1);
});

test("HG-AWARD-01 a first valid report awards the game and increments to one", () => {
  const start = freshRecord(NOW);
  const { record, outcome } = applyReport(start, "G01", NOW);
  assert.equal(outcome, "awarded");
  assert.equal(record.count, 1);
  assert.deepEqual(record.completed_game_ids, ["G01"]);
  assert.equal(record.updated_at, new Date(NOW).toISOString());
});

test("HG-DEDUP-01 reporting an already-found game does not increment", () => {
  const one = applyReport(freshRecord(NOW), "G01", NOW).record;
  const { record, outcome } = applyReport(one, "G01", NOW + DAY);
  assert.equal(outcome, "duplicate");
  assert.equal(record.count, 1);
  assert.equal(record, one, "the record object is returned unchanged");
});

test("HG-UNKNOWN-01 reporting an unknown id is ignored and never counted", () => {
  const start = freshRecord(NOW);
  const { record, outcome } = applyReport(start, "G99", NOW);
  assert.equal(outcome, "unknown");
  assert.equal(record.count, 0);
  assert.equal(record, start);
});

test("HG-AWARD-02 two finds order completed ids by the registry, not by find order", () => {
  const afterG02 = applyReport(freshRecord(NOW), "G02", NOW).record;
  const afterBoth = applyReport(afterG02, "G01", NOW).record;
  assert.deepEqual(afterBoth.completed_game_ids, ["G01", "G02"]);
  assert.equal(afterBoth.count, 2);
});

test("HG-COUNTER-01 the counter label reads 0/2 games found at zero", () => {
  assert.equal(counterLabel(0, 2), "0/2 games found");
});

test("HG-COUNTER-02 the counter label reads 1/2 games found after one find", () => {
  assert.equal(counterLabel(1, 2), "1/2 games found");
});
