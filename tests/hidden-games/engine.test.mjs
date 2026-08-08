// Hidden Games Stage 1: engine assertions.
// Run: node --test tests/hidden-games/
//
// Drives createEngine with in-memory storage, a fake clock and a warning spy,
// so restore-before-render, deduplication, the unknown-id warning, fail-soft
// reads and writes, schema non-reuse and version isolation are all exercised
// without a browser (BRIEF section 3).

import test from "node:test";
import assert from "node:assert/strict";

import { createEngine } from "../../lib/hiddenGames/engine.ts";
import { STORAGE_KEY, TOTAL } from "../../lib/hiddenGames/registry.ts";
import { serializeRecord } from "../../lib/hiddenGames/record.ts";

const NOW = Date.parse("2026-07-28T12:00:00Z");

// A storage stub that records every write so we can prove restore never writes.
function makeStore(seed = {}) {
  const map = new Map(Object.entries(seed));
  const setKeys = [];
  return {
    map,
    setKeys,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      setKeys.push(k);
      map.set(k, v);
    },
  };
}

function makeEngine(store, { throwOnGet = false, throwOnSet = false } = {}) {
  const warnings = [];
  const engine = createEngine({
    getItem: (k) => {
      if (throwOnGet) throw new Error("blocked read");
      return store.getItem(k);
    },
    setItem: (k, v) => {
      if (throwOnSet) throw new Error("blocked write");
      store.setItem(k, v);
    },
    now: () => NOW,
    warn: (m) => warnings.push(m),
  });
  return { engine, warnings };
}

function seededRecord(overrides = {}) {
  return serializeRecord({
    record_schema: 3,
    campaign_version: "HIDDEN_GAMES_2026_01",
    total_at_last_seen: 2,
    completed_game_ids: ["G01"],
    count: 1,
    updated_at: new Date(NOW).toISOString(),
    ...overrides,
  });
}

test("HG-ENG-01 a fresh visitor restores to 0 of the live total", () => {
  const store = makeStore();
  const { engine } = makeEngine(store);
  const s = engine.getState();
  assert.equal(s.count, 0);
  assert.equal(s.total, TOTAL); // Task 165: the live registry total (was hardcoded 2)
  assert.equal(s.label, `0/${TOTAL} games found`);
});

test("HG-RESTORE-02 an existing valid record is reflected before any report or render", () => {
  const store = makeStore({ [STORAGE_KEY]: seededRecord() });
  const { engine } = makeEngine(store);
  assert.equal(engine.getState().count, 1);
  assert.equal(engine.getState().label, `1/${TOTAL} games found`); // count from the seeded record, total live (Task 165)
  assert.deepEqual(store.setKeys, [], "restore must not write to storage");
});

test("HG-DEDUP-02 a duplicate report through the engine does not move the count", () => {
  const store = makeStore();
  const { engine } = makeEngine(store);
  assert.equal(engine.reportHiddenGame("G01"), "awarded");
  assert.equal(engine.reportHiddenGame("G01"), "duplicate");
  assert.equal(engine.getState().count, 1);
});

test("HG-UNKNOWN-02 an unknown id is ignored, not counted, and logs one warning", () => {
  const store = makeStore();
  const { engine, warnings } = makeEngine(store);
  assert.equal(engine.reportHiddenGame("G99"), "unknown");
  assert.equal(engine.getState().count, 0);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /unknown game id ignored: G99/);
  assert.deepEqual(store.setKeys, [], "an unknown id writes nothing");
});

test("HG-PERSIST-01 an award writes exactly one schema-3 record under the version key", () => {
  const store = makeStore();
  const { engine } = makeEngine(store);
  engine.reportHiddenGame("G01");
  assert.deepEqual(store.setKeys, [STORAGE_KEY]);
  const written = JSON.parse(store.map.get(STORAGE_KEY));
  assert.equal(written.record_schema, 3);
  assert.equal(written.count, 1);
  assert.deepEqual(written.completed_game_ids, ["G01"]);
  assert.equal(written.updated_at, new Date(NOW).toISOString());
});

test("HG-FAILSOFT-03 a read that throws fails soft to zero without throwing", () => {
  const store = makeStore({ [STORAGE_KEY]: seededRecord() });
  let engine;
  assert.doesNotThrow(() => {
    engine = makeEngine(store, { throwOnGet: true }).engine;
  });
  assert.equal(engine.getState().count, 0);
});

test("HG-FAILSOFT-04 a write that throws does not throw and the in-memory count still moves", () => {
  const store = makeStore();
  const { engine } = makeEngine(store, { throwOnSet: true });
  assert.doesNotThrow(() => engine.reportHiddenGame("G01"));
  assert.equal(engine.getState().count, 1);
});

test("HG-SCHEMA-02 a schema 1 or 2 record restores as zero and is left untouched", () => {
  const legacy = seededRecord({ record_schema: 2 });
  const store = makeStore({ [STORAGE_KEY]: legacy });
  const { engine } = makeEngine(store);
  assert.equal(engine.getState().count, 0);
  assert.deepEqual(store.setKeys, [], "the legacy record is not overwritten on restore");
  assert.equal(store.map.get(STORAGE_KEY), legacy, "the legacy bytes are intact");
});

test("HG-VERSION-02 a record under an older campaign key is isolated: the engine starts at zero", () => {
  const store = makeStore({
    "pedigree_hidden_games:HIDDEN_GAMES_2025_99": seededRecord({
      campaign_version: "HIDDEN_GAMES_2025_99",
    }),
  });
  const { engine } = makeEngine(store);
  assert.equal(engine.getState().count, 0);
});

test("HG-STATE-01 subscribers are notified on an award and the snapshot reference changes", () => {
  const store = makeStore();
  const { engine } = makeEngine(store);
  let notified = 0;
  const before = engine.getState();
  const unsub = engine.subscribe(() => {
    notified += 1;
  });
  engine.reportHiddenGame("G01");
  const after = engine.getState();
  assert.equal(notified, 1);
  assert.notEqual(before, after, "a changed count yields a new snapshot object");
  unsub();
  engine.reportHiddenGame("G02");
  assert.equal(notified, 1, "an unsubscribed listener is not called again");
});

test("HG-STATE-02 a duplicate does not notify subscribers", () => {
  const store = makeStore();
  const { engine } = makeEngine(store);
  engine.reportHiddenGame("G01");
  let notified = 0;
  engine.subscribe(() => {
    notified += 1;
  });
  engine.reportHiddenGame("G01");
  assert.equal(notified, 0);
});
