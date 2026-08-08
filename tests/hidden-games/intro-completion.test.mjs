// Hidden Games Stage 1: introduction seen-flag and completion assertions
// (D10, D11, BRIEF 7). Run: npm run test:hidden-games
//
// The engine-level rules are tested here. The intro timing (ten seconds, first
// interaction) and the completion animation are DOM behaviours verified by
// manual QA per NEEDS_OWNER Q05.

import test from "node:test";
import assert from "node:assert/strict";

import {
  freshRecord,
  readRecord,
  applyReport,
} from "../../lib/hiddenGames/record.ts";
import { createEngine } from "../../lib/hiddenGames/engine.ts";
import { STORAGE_KEY, GAME_IDS } from "../../lib/hiddenGames/registry.ts";
import {
  CAMPAIGN_INTRO,
  CAMPAIGN_INTRO_EMPHASIS,
  COMPLETION_HEADING,
  COMPLETION_BODY,
} from "../../lib/hiddenGames/copy.ts";

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

function makeEngine(store, { throwOnSet = false } = {}) {
  return createEngine({
    getItem: (k) => store.getItem(k),
    setItem: (k, v) => {
      if (throwOnSet) throw new Error("blocked write");
      store.setItem(k, v);
    },
    now: () => NOW,
    warn: () => {},
    status: "OPEN",
  });
}

test("HG-INTRO-01 intro_seen defaults to false on a fresh record and on a record written before the field existed", () => {
  assert.equal(freshRecord(NOW).intro_seen, false);
  assert.equal(freshRecord(NOW).completion_seen, false);

  const legacy = JSON.stringify({
    record_schema: 3,
    campaign_version: "HIDDEN_GAMES_2026_01",
    total_at_last_seen: 2,
    completed_game_ids: ["G01"],
    count: 1,
    updated_at: new Date(NOW).toISOString(),
    // no intro_seen or completion_seen field
  });
  assert.equal(readRecord(legacy, NOW).record.intro_seen, false);
  assert.equal(readRecord(legacy, NOW).record.completion_seen, false);

  const seen = JSON.stringify({
    record_schema: 3,
    campaign_version: "HIDDEN_GAMES_2026_01",
    total_at_last_seen: 2,
    completed_game_ids: [],
    count: 0,
    updated_at: new Date(NOW).toISOString(),
    intro_seen: true,
  });
  assert.equal(readRecord(seen, NOW).record.intro_seen, true);
});

test("HG-INTRO-02 markIntroSeen sets the flag, persists it in the record, and is idempotent", () => {
  const store = makeStore();
  const engine = makeEngine(store);
  assert.equal(engine.getState().introSeen, false);

  engine.markIntroSeen();
  assert.equal(engine.getState().introSeen, true);
  assert.deepEqual(store.setKeys, [STORAGE_KEY]);
  assert.equal(JSON.parse(store.map.get(STORAGE_KEY)).intro_seen, true);

  engine.markIntroSeen(); // already seen
  assert.deepEqual(store.setKeys, [STORAGE_KEY], "no second write once seen");
});

test("HG-INTRO-03 a find never resets the intro flag", () => {
  const seen = readRecord(
    JSON.stringify({
      record_schema: 3,
      campaign_version: "HIDDEN_GAMES_2026_01",
      total_at_last_seen: 2,
      completed_game_ids: [],
      count: 0,
      updated_at: new Date(NOW).toISOString(),
      intro_seen: true,
    }),
    NOW
  ).record;
  assert.equal(applyReport(seen, "G01", NOW).record.intro_seen, true);
});

test("HG-INTRO-04 a refused intro write does not throw and does not raise storage-blocked", () => {
  const store = makeStore();
  const engine = makeEngine(store, { throwOnSet: true });
  assert.doesNotThrow(() => engine.markIntroSeen());
  assert.equal(engine.getState().introSeen, true, "flag holds in memory this session");
  assert.equal(
    engine.getState().storageBlocked,
    false,
    "intro persistence is not the finds-cannot-be-saved condition"
  );
});

test("HG-COMPLETE-01 completion is derived: false until the LAST of the GAME_IDS is found", () => {
  // Task 165: driven off GAME_IDS, so "complete" is the final find whatever the campaign size (was 2/2).
  const store = makeStore();
  const engine = makeEngine(store);
  assert.equal(engine.getState().completed, false);
  GAME_IDS.forEach((id, i) => {
    engine.reportHiddenGame(id);
    assert.equal(engine.getState().count, i + 1);
    assert.equal(engine.getState().completed, i === GAME_IDS.length - 1);
  });
});

test("HG-COMPLETE-02 markCompletionSeen sets the flag, persists it, and is idempotent", () => {
  const store = makeStore();
  const engine = makeEngine(store);
  for (const id of GAME_IDS) engine.reportHiddenGame(id); // complete the whole campaign (Task 165)
  assert.equal(engine.getState().completed, true);
  assert.equal(engine.getState().completionSeen, false);

  const writesBefore = store.setKeys.length;
  engine.markCompletionSeen();
  assert.equal(engine.getState().completionSeen, true);
  assert.equal(JSON.parse(store.map.get(STORAGE_KEY)).completion_seen, true);
  assert.equal(store.setKeys.length, writesBefore + 1);

  engine.markCompletionSeen(); // already seen
  assert.equal(store.setKeys.length, writesBefore + 1, "no second write once seen");
});

test("HG-COMPLETE-03 a find preserves an existing completion_seen flag", () => {
  const rec = readRecord(
    JSON.stringify({
      record_schema: 3,
      campaign_version: "HIDDEN_GAMES_2026_01",
      total_at_last_seen: 2,
      completed_game_ids: ["G01"],
      count: 1,
      updated_at: new Date(NOW).toISOString(),
      intro_seen: true,
      completion_seen: true,
    }),
    NOW
  ).record;
  assert.equal(applyReport(rec, "G02", NOW).record.completion_seen, true);
});

test("HG-COPY-03 the intro and completion copy is the current approved text", () => {
  // Task 165: the intro copy was reworded and split into the sentence + an emphasis span; assertion updated
  // to the current strings (FLAGGED for owner confirmation that this wording is the approved one).
  assert.equal(CAMPAIGN_INTRO, "There are hidden games across the website");
  assert.equal(CAMPAIGN_INTRO_EMPHASIS, "Find them all");
  assert.equal(COMPLETION_HEADING, "You found every hidden game!");
  assert.equal(
    COMPLETION_BODY,
    "You completed the first Pedigree Chums Hidden Games challenge."
  );
});
