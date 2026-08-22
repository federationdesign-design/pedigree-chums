// Hidden Games: page_views persistence assertions (per-page card reveal).
// Run: npm run test:hidden-games
//
// The prelude and introduction cards are spread one per page across the first
// visit: page 1 counter only, page 2 the prelude, page 3 the introduction. That
// per-page decision rides on a persisted page tally. The 5s DOM reveal itself is
// proven by the Playwright journey; here we assert the additive tally persists
// and increments like the other record fields.

import test from "node:test";
import assert from "node:assert/strict";

import {
  freshRecord,
  readRecord,
  applyReport,
} from "../../lib/hiddenGames/record.ts";
import { createEngine } from "../../lib/hiddenGames/engine.ts";
import { STORAGE_KEY } from "../../lib/hiddenGames/registry.ts";

const NOW = Date.parse("2026-08-17T12:00:00Z");

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

test("HG-PAGEVIEWS-01 page_views defaults to 0; absent in a legacy record reads 0; a stored value reads through", () => {
  assert.equal(freshRecord(NOW).page_views, 0);

  const legacy = JSON.stringify({
    record_schema: 3,
    campaign_version: "HIDDEN_GAMES_2026_01",
    total_at_last_seen: 2,
    completed_game_ids: [],
    count: 0,
    updated_at: new Date(NOW).toISOString(),
    // no page_views: a record predating the field is not invalidated
  });
  const legacyRead = readRecord(legacy, NOW);
  assert.equal(legacyRead.note, "restored");
  assert.equal(legacyRead.record.record_schema, 3, "schema stays 3");
  assert.equal(legacyRead.record.page_views, 0);

  const seeded = JSON.stringify({
    record_schema: 3,
    campaign_version: "HIDDEN_GAMES_2026_01",
    total_at_last_seen: 2,
    completed_game_ids: [],
    count: 0,
    updated_at: new Date(NOW).toISOString(),
    page_views: 5,
  });
  assert.equal(readRecord(seeded, NOW).record.page_views, 5);
});

test("HG-PAGEVIEWS-02 a garbage page_views value reads as 0 rather than invalidating the record", () => {
  for (const bad of ["3", -1, NaN, Infinity, null, {}]) {
    const raw = JSON.stringify({
      record_schema: 3,
      campaign_version: "HIDDEN_GAMES_2026_01",
      total_at_last_seen: 2,
      completed_game_ids: [],
      count: 0,
      updated_at: new Date(NOW).toISOString(),
      page_views: bad,
    });
    const { record, note } = readRecord(raw, NOW);
    assert.equal(note, "restored");
    assert.equal(record.page_views, 0);
  }
});

test("HG-PAGEVIEWS-03 registerPageView returns the new 1-indexed page number and persists it", () => {
  const { engine, map } = makeEngine();
  assert.equal(engine.registerPageView(), 1);
  assert.equal(engine.registerPageView(), 2);
  assert.equal(engine.registerPageView(), 3);
  assert.equal(JSON.parse(map.get(STORAGE_KEY)).page_views, 3);
});

test("HG-PAGEVIEWS-04 a find preserves the page tally", () => {
  const rec = readRecord(
    JSON.stringify({
      record_schema: 3,
      campaign_version: "HIDDEN_GAMES_2026_01",
      total_at_last_seen: 2,
      completed_game_ids: [],
      count: 0,
      updated_at: new Date(NOW).toISOString(),
      page_views: 4,
    }),
    NOW
  ).record;
  assert.equal(applyReport(rec, "G01", NOW).record.page_views, 4);
});
