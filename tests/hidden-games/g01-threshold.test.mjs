// Hidden Games Stage 1: G01 threshold assertions (CHANGE-LIST C01).
// Run: npm run test:hidden-games
//
// Replaces the four HG-ROUTE assertions, which tested the superseded
// navigation-based G01 (RouteWatcher / routeWatch.ts, now dead code pending
// removal; see NEEDS_OWNER Q06). G01 now awards on the first deliberate pointer
// interaction with the Main Pit, wired in PackPit.tsx. That pointer wiring is a
// DOM behaviour proven by the Playwright journeys; here we assert the registry
// rename/threshold and the award-once engine behaviour that backs repeated pit
// presses.

import test from "node:test";
import assert from "node:assert/strict";

import { REGISTRY } from "../../lib/hiddenGames/registry.ts";
import { createEngine } from "../../lib/hiddenGames/engine.ts";

const NOW = Date.parse("2026-07-29T12:00:00Z");
const g01 = () => REGISTRY.games.find((g) => g.id === "G01");

function makeEngine() {
  const map = new Map();
  return createEngine({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    now: () => NOW,
    warn: () => {},
    status: "OPEN",
  });
}

test("HG-G01-01 G01 is renamed from 'Off Exploring' to a pit-describing name", () => {
  assert.equal(g01().name, "The Main Pit");
  assert.notEqual(g01().name, "Off Exploring");
});

test("HG-G01-02 G01's threshold is the Main Pit pointer interaction, not a route change", () => {
  const t = g01().threshold.toLowerCase();
  assert.ok(t.includes("pointer"), "threshold mentions a pointer interaction");
  assert.ok(t.includes("main pit"), "threshold names the Main Pit");
  assert.ok(!t.includes("route change"), "threshold no longer mentions a route change");
});

test("HG-G01-03 the first G01 report awards once (what a first pit pointer triggers)", () => {
  const engine = makeEngine();
  assert.equal(engine.reportHiddenGame("G01"), "awarded");
  assert.equal(engine.getState().count, 1);
  assert.equal(engine.getState().label, "1/2 games found");
});

test("HG-G01-04 further G01 reports dedup, so repeated pit pointers never double-count", () => {
  const engine = makeEngine();
  engine.reportHiddenGame("G01");
  assert.equal(engine.reportHiddenGame("G01"), "duplicate");
  assert.equal(engine.getState().count, 1);
});
