// Hidden Games: discovery toast assertions (CHANGE-LIST C02).
// Run: npm run test:hidden-games
//
// The engine fires a discovery (with the remaining count) on a non-final award
// only. The toast rendering above the modal is a DOM behaviour proven by the
// Playwright journey; here we assert the award-only rule and the derived count.

import test from "node:test";
import assert from "node:assert/strict";

import { createEngine } from "../../lib/hiddenGames/engine.ts";
import { discoveryToast } from "../../lib/hiddenGames/copy.ts";
import { TARGET, GAME_IDS } from "../../lib/hiddenGames/registry.ts";

const NOW = Date.parse("2026-07-29T12:00:00Z");

function makeEngine() {
  const map = new Map();
  const discoveries = [];
  const engine = createEngine({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    now: () => NOW,
    warn: () => {},
    status: "OPEN",
  });
  engine.subscribeDiscovery((remaining) => discoveries.push(remaining));
  return { engine, discoveries };
}

test("HG-TOAST-01 a non-final award fires a discovery with the target-derived remaining", () => {
  const { engine, discoveries } = makeEngine();
  engine.reportHiddenGame(GAME_IDS[0]); // 1 found -> remaining is the fixed target minus 1
  assert.deepEqual(discoveries, [TARGET - 1]);
});

test("HG-TOAST-02 a duplicate fires no discovery", () => {
  const { engine, discoveries } = makeEngine();
  engine.reportHiddenGame(GAME_IDS[0]);
  engine.reportHiddenGame(GAME_IDS[0]); // duplicate
  assert.deepEqual(discoveries, [TARGET - 1]);
});

test("HG-TOAST-03 an unknown id fires no discovery", () => {
  const { engine, discoveries } = makeEngine();
  engine.reportHiddenGame("G99");
  assert.deepEqual(discoveries, []);
});

test("HG-TOAST-04 discoveries count down to the target, and the completing and beyond-target finds fire none", () => {
  // The first TARGET-1 finds each fire a countdown discovery (TARGET-1, ... 1);
  // the TARGET-th find completes (the completion card shows instead, no
  // discovery), and every find beyond the target is inert (no discovery). With
  // GAME_IDS longer than TARGET, the tail past completion adds nothing.
  const { engine, discoveries } = makeEngine();
  for (const id of GAME_IDS) engine.reportHiddenGame(id);
  assert.deepEqual(discoveries, Array.from({ length: TARGET - 1 }, (_, i) => TARGET - 1 - i));
});

test("HG-TOAST-05 the copy is verbatim and carries the derived remaining, with no hardcoded number", () => {
  assert.equal(discoveryToast(1), "Nice one! You found a hidden game. 1 more to find.");
  // Stays correct as games are added (nine planned): remaining is interpolated.
  assert.equal(discoveryToast(8), "Nice one! You found a hidden game. 8 more to find.");
});
