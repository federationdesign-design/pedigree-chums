// Hidden Games Stage 1: registry module assertions.
// Run: node --test tests/hidden-games/
//
// Proves the one-registry contract of BRIEF section 3: the campaign version,
// mode and games list are defined here and the total is derived, not stored.

import test from "node:test";
import assert from "node:assert/strict";

import {
  REGISTRY,
  GAME_IDS,
  TOTAL,
  RECORD_SCHEMA,
  STORAGE_KEY,
  EXPIRY_DAYS,
  isKnownId,
} from "../../lib/hiddenGames/registry.ts";

test("HG-REG-01 mode is ACHIEVEMENT_ONLY and version is set", () => {
  assert.equal(REGISTRY.mode, "ACHIEVEMENT_ONLY");
  assert.equal(REGISTRY.campaign_version, "HIDDEN_GAMES_2026_01");
});

test("HG-REG-02 the registry lists exactly G01 and G02, each with a written threshold", () => {
  assert.deepEqual(
    REGISTRY.games.map((g) => g.id),
    ["G01", "G02"]
  );
  for (const g of REGISTRY.games) {
    assert.equal(typeof g.name, "string");
    assert.ok(g.name.length > 0, `${g.id} has a name`);
    assert.equal(typeof g.threshold, "string");
    assert.ok(g.threshold.length > 0, `${g.id} has a written threshold`);
  }
});

test("HG-REG-03 the total is derived from games.length and is not a stored field", () => {
  assert.equal(TOTAL, REGISTRY.games.length);
  assert.equal(TOTAL, 2);
  assert.equal(
    Object.prototype.hasOwnProperty.call(REGISTRY, "total"),
    false,
    "REGISTRY must not carry a stored total"
  );
});

test("HG-REG-04 the storage key is version-keyed", () => {
  assert.equal(STORAGE_KEY, "pedigree_hidden_games:HIDDEN_GAMES_2026_01");
  assert.ok(STORAGE_KEY.includes(REGISTRY.campaign_version));
});

test("HG-REG-05 record schema is 3 and expiry is 90 days", () => {
  assert.equal(RECORD_SCHEMA, 3);
  assert.equal(EXPIRY_DAYS, 90);
});

test("HG-VAL-01 isKnownId accepts registered ids", () => {
  assert.equal(isKnownId("G01"), true);
  assert.equal(isKnownId("G02"), true);
  assert.deepEqual([...GAME_IDS], ["G01", "G02"]);
});

test("HG-VAL-02 isKnownId rejects an unknown id", () => {
  assert.equal(isKnownId("G99"), false);
  assert.equal(isKnownId(""), false);
  assert.equal(isKnownId("g01"), false);
});
