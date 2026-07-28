// Hidden Games Stage 1: engine lifecycle and storage-blocked assertions
// (BRIEF 4.2, 5). Run: npm run test:hidden-games
//
// Drives createEngine with an injected status, so each lifecycle state is
// exercised without a browser. The Batch 1 engine tests cover the OPEN path in
// depth; these cover the gated states and storage-blocked detection.

import test from "node:test";
import assert from "node:assert/strict";

import { createEngine } from "../../lib/hiddenGames/engine.ts";
import { STORAGE_KEY } from "../../lib/hiddenGames/registry.ts";
import { serializeRecord } from "../../lib/hiddenGames/record.ts";

const NOW = Date.parse("2026-07-28T12:00:00Z");

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

function makeEngine(store, { status, throwOnSet = false } = {}) {
  const warnings = [];
  const engine = createEngine({
    getItem: (k) => store.getItem(k),
    setItem: (k, v) => {
      if (throwOnSet) throw new Error("blocked write");
      store.setItem(k, v);
    },
    now: () => NOW,
    warn: (m) => warnings.push(m),
    status,
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

test("HG-FROZEN-01 SUSPENDED freezes finds and writes nothing, and shows the suspended view", () => {
  const store = makeStore();
  const { engine } = makeEngine(store, { status: "SUSPENDED" });
  assert.equal(engine.reportHiddenGame("G01"), "frozen");
  assert.equal(engine.getState().count, 0);
  assert.equal(engine.getState().view, "suspended");
  assert.equal(engine.getState().render, true);
  assert.deepEqual(store.setKeys, [], "a frozen find writes nothing");
});

test("HG-FROZEN-02 CLOSED stops finds, keeps the record, and shows the closed view with the final count", () => {
  const store = makeStore({ [STORAGE_KEY]: seededRecord() });
  const { engine } = makeEngine(store, { status: "CLOSED" });
  assert.equal(engine.getState().view, "closed");
  assert.equal(engine.getState().count, 1);
  assert.equal(engine.reportHiddenGame("G02"), "frozen");
  assert.equal(engine.getState().count, 1, "no new find registers");
  assert.deepEqual(store.setKeys, [], "nothing is written, nothing deleted");
  assert.equal(store.map.get(STORAGE_KEY), seededRecord(), "the stored record is intact");
});

test("HG-FROZEN-03 ARCHIVED renders nothing and freezes finds", () => {
  const store = makeStore();
  const { engine } = makeEngine(store, { status: "ARCHIVED" });
  assert.equal(engine.getState().render, false);
  assert.equal(engine.getState().view, "hidden");
  assert.equal(engine.reportHiddenGame("G01"), "frozen");
  assert.equal(engine.getState().count, 0);
});

test("HG-DRAFT-01 DRAFT hides the interface but still accepts test finds", () => {
  const store = makeStore();
  const { engine } = makeEngine(store, { status: "DRAFT" });
  assert.equal(engine.getState().render, false);
  assert.equal(engine.getState().view, "hidden");
  assert.equal(engine.reportHiddenGame("G01"), "awarded");
  assert.equal(engine.getState().count, 1, "finds count in DRAFT (test only)");
});

test("HG-STORAGE-01 OPEN with a refused write keeps the find, flags storage-blocked, and never throws", () => {
  const store = makeStore();
  const { engine } = makeEngine(store, { status: "OPEN", throwOnSet: true });
  assert.doesNotThrow(() => engine.reportHiddenGame("G01"));
  assert.equal(engine.getState().count, 1, "the find is kept in memory so play continues");
  assert.equal(engine.getState().storageBlocked, true);
});

test("HG-STORAGE-02 OPEN with a working write does not flag storage-blocked", () => {
  const store = makeStore();
  const { engine } = makeEngine(store, { status: "OPEN" });
  engine.reportHiddenGame("G01");
  assert.equal(engine.getState().storageBlocked, false);
  assert.deepEqual(store.setKeys, [STORAGE_KEY]);
});

test("HG-VIEW-01 the default status is OPEN: counter view, rendering, not blocked", () => {
  const store = makeStore();
  const { engine } = makeEngine(store, {}); // no status -> OPEN
  const s = engine.getState();
  assert.equal(s.status, "OPEN");
  assert.equal(s.view, "counter");
  assert.equal(s.render, true);
  assert.equal(s.storageBlocked, false);
});
