// Hidden Games Stage 1: measurement assertions (BRIEF 8).
// Run: npm run test:hidden-games
//
// The engine emits aggregate events through an injected `track` sink. These
// tests inject a spy and assert the correct event fires for each engine
// outcome. The consent gate and the gtag('event') call itself are browser-only
// (browserEngine.emitHiddenGamesEvent) and are covered by the manual-QA pass
// per NEEDS_OWNER Q05.

import test from "node:test";
import assert from "node:assert/strict";

import { createEngine } from "../../lib/hiddenGames/engine.ts";
import { HG_EVENTS } from "../../lib/hiddenGames/measure.ts";
import { STORAGE_KEY, GAME_IDS } from "../../lib/hiddenGames/registry.ts";
import { serializeRecord } from "../../lib/hiddenGames/record.ts";

const NOW = Date.parse("2026-07-29T12:00:00Z");

function makeStore(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  };
}

function makeEngine({ status, throwOnSet = false, seed = {} } = {}) {
  const store = makeStore(seed);
  const events = [];
  const engine = createEngine({
    getItem: (k) => store.getItem(k),
    setItem: (k, v) => {
      if (throwOnSet) throw new Error("blocked write");
      store.setItem(k, v);
    },
    now: () => NOW,
    warn: () => {},
    status,
    track: (e) => events.push(e),
  });
  return { engine, events, store };
}

const names = (events) => events.map((e) => e.name);

test("HG-MEASURE-01 a G01 award emits one award event carrying game_id G01", () => {
  const { engine, events } = makeEngine();
  engine.reportHiddenGame("G01");
  assert.deepEqual(names(events), [HG_EVENTS.award]);
  assert.deepEqual(events[0].params, { game_id: "G01" });
});

test("HG-MEASURE-02 a duplicate emits the duplicate event and no award", () => {
  const { engine, events } = makeEngine();
  engine.reportHiddenGame("G01");
  engine.reportHiddenGame("G01"); // duplicate
  assert.deepEqual(names(events), [HG_EVENTS.award, HG_EVENTS.duplicate]);
  assert.deepEqual(events[1].params, { game_id: "G01" });
});

test("HG-MEASURE-03 an unknown id emits the unknown-id event with no raw id in the params", () => {
  const { engine, events } = makeEngine();
  engine.reportHiddenGame("G99");
  assert.deepEqual(names(events), [HG_EVENTS.unknownId]);
  assert.equal(events[0].params, undefined, "the raw unknown id is never sent");
});

test("HG-MEASURE-04 completing the campaign emits an award per game then the completion event", () => {
  // Task 165: drive off GAME_IDS so completion is the LAST find, whatever the campaign size (was G01+G02).
  const { engine, events } = makeEngine();
  for (const id of GAME_IDS) engine.reportHiddenGame(id);
  assert.deepEqual(names(events), [
    ...GAME_IDS.map(() => HG_EVENTS.award),
    HG_EVENTS.completion,
  ]);
  assert.deepEqual(events[GAME_IDS.length - 1].params, { game_id: GAME_IDS[GAME_IDS.length - 1] });
});

test("HG-MEASURE-05 a refused write emits storage_blocked once, alongside the awards", () => {
  const { engine, events } = makeEngine({ throwOnSet: true });
  for (const id of GAME_IDS) engine.reportHiddenGame(id); // every write fails; the last find completes
  assert.deepEqual(names(events), [
    HG_EVENTS.storageBlocked, // once, on the first refusal
    ...GAME_IDS.map(() => HG_EVENTS.award),
    HG_EVENTS.completion,
  ]);
  assert.equal(
    names(events).filter((n) => n === HG_EVENTS.storageBlocked).length,
    1,
    "storage_blocked fires only once"
  );
});

test("HG-MEASURE-06 a frozen campaign emits nothing on a report", () => {
  const { engine, events } = makeEngine({ status: "SUSPENDED" });
  assert.equal(engine.reportHiddenGame("G01"), "frozen");
  assert.deepEqual(events, []);
});

test("HG-MEASURE-07 the event names are the fixed BRIEF 8 vocabulary and award is the only event carrying a param", () => {
  assert.deepEqual(HG_EVENTS, {
    visible: "hidden_games_visible",
    award: "hidden_games_award",
    completion: "hidden_games_completion",
    duplicate: "hidden_games_duplicate",
    unknownId: "hidden_games_unknown_id",
    storageBlocked: "hidden_games_storage_blocked",
  });
});
