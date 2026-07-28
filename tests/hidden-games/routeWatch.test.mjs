// Hidden Games Stage 1: G01 award-rule assertions (BRIEF 2.1).
// Run: npm run test:hidden-games
//
// Covers the pure rule behind RouteWatcher. The firing of the rule on a real
// navigation is a DOM behaviour that node:test cannot exercise; that is proven
// by the browser journey suite once a browser harness exists (NEEDS_OWNER Q05).

import test from "node:test";
import assert from "node:assert/strict";

import { shouldAwardOnRouteChange } from "../../lib/hiddenGames/routeWatch.ts";

test("HG-ROUTE-01 the initial load does not award (same path, not yet awarded)", () => {
  assert.equal(shouldAwardOnRouteChange("/", "/", false), false);
  assert.equal(shouldAwardOnRouteChange("/chums/beagle", "/chums/beagle", false), false);
});

test("HG-ROUTE-02 the first completed route change awards, from any starting page", () => {
  assert.equal(shouldAwardOnRouteChange("/", "/about", false), true);
  assert.equal(shouldAwardOnRouteChange("/chums/beagle", "/", false), true);
});

test("HG-ROUTE-03 once awarded, no further change awards again", () => {
  assert.equal(shouldAwardOnRouteChange("/", "/about", true), false);
  assert.equal(shouldAwardOnRouteChange("/", "/name-generator", true), false);
});

test("HG-ROUTE-04 a deep-link visitor (start off /) still earns on their first change", () => {
  // Arrive on /britains-dog-history, navigate anywhere: awards.
  assert.equal(
    shouldAwardOnRouteChange("/britains-dog-history", "/chums/collie", false),
    true
  );
});
