// Hidden Games: prelude_seen persistence assertions (CHANGE-LIST C03).
// Run: npm run test:hidden-games
//
// The timed reveal (0/5/8/12s) is a DOM behaviour proven by the Playwright
// journey; here we assert the additive flag persists like intro_seen.

import test from "node:test";
import assert from "node:assert/strict";

import {
  freshRecord,
  readRecord,
  applyReport,
} from "../../lib/hiddenGames/record.ts";
import { createEngine } from "../../lib/hiddenGames/engine.ts";
import { STORAGE_KEY } from "../../lib/hiddenGames/registry.ts";

const NOW = Date.parse("2026-07-30T12:00:00Z");

function makeEngine(seed = {}) {
  const map = new Map(Object.entries(seed));
  const setKeys = [];
  const engine = createEngine({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      setKeys.push(k);
      map.set(k, v);
    },
    now: () => NOW,
    warn: () => {},
    status: "OPEN",
  });
  return { engine, map, setKeys };
}

test("HG-PRELUDE-01 prelude_seen defaults to false; absent in a legacy record reads false; true reads true", () => {
  assert.equal(freshRecord(NOW).prelude_seen, false);

  const legacy = JSON.stringify({
    record_schema: 3,
    campaign_version: "HIDDEN_GAMES_2026_01",
    total_at_last_seen: 2,
    completed_game_ids: [],
    count: 0,
    updated_at: new Date(NOW).toISOString(),
    // no prelude_seen
  });
  assert.equal(readRecord(legacy, NOW).record.prelude_seen, false);

  const seen = JSON.stringify({
    record_schema: 3,
    campaign_version: "HIDDEN_GAMES_2026_01",
    total_at_last_seen: 2,
    completed_game_ids: [],
    count: 0,
    updated_at: new Date(NOW).toISOString(),
    prelude_seen: true,
  });
  assert.equal(readRecord(seen, NOW).record.prelude_seen, true);
});

test("HG-PRELUDE-02 markPreludeSeen sets the flag, persists it, and is idempotent", () => {
  const { engine, map, setKeys } = makeEngine();
  assert.equal(engine.getState().preludeSeen, false);
  engine.markPreludeSeen();
  assert.equal(engine.getState().preludeSeen, true);
  assert.equal(JSON.parse(map.get(STORAGE_KEY)).prelude_seen, true);
  const writes = setKeys.length;
  engine.markPreludeSeen(); // already seen
  assert.equal(setKeys.length, writes, "no second write once seen");
});

test("HG-PRELUDE-03 a find preserves an existing prelude_seen flag", () => {
  const rec = readRecord(
    JSON.stringify({
      record_schema: 3,
      campaign_version: "HIDDEN_GAMES_2026_01",
      total_at_last_seen: 2,
      completed_game_ids: [],
      count: 0,
      updated_at: new Date(NOW).toISOString(),
      prelude_seen: true,
    }),
    NOW
  ).record;
  assert.equal(applyReport(rec, "G01", NOW).record.prelude_seen, true);
});
