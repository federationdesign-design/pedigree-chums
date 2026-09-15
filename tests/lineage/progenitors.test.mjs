// The percentage model's two standing guards.
// Run: npm run test:lineage
//
// WHY THIS GOES IN FIRST. Item 7 of pedigree_chums_percentage_maths_brief_v2.md.
// Every percentage in the game is about to move onto one rule, and the whole
// plan rests on a property of the data: the PROGENITORS of any dog, meaning the
// leaves of its tree with nothing behind them, always total exactly 100%. That
// holds because a parent's weight is the sum of its children's. If a data edit
// ever breaks it, every screen goes wrong at once and quietly. These two
// assertions catch that the moment it happens, and they pass on today's data, so
// the test can guard the work rather than wait for it.
//
// WHAT THIS DOES NOT TEST. The shipped leaf walks in breedPanelData.ts,
// Chums2Client.tsx and Chums2Mobile.tsx round every leaf and then add the
// rounded figures, so 30 of the 54 pack dogs already print a list that does not
// total 100 (Bull Terrier 91, Border Collie 105). That is a fault in those
// copies, not in the data, and it is what the consolidation fixes. This file
// asserts the DATA property those copies are supposed to preserve.
//
// THE DEPTH CAP IS PART OF THE ANSWER. getLineage stops at MAX_LINEAGE_DEPTH,
// currently 7, so "progenitor" means "leaf of the tree as it is actually built".
// The 100% total holds at any cap, because it is leaf-sum arithmetic and not a
// property of where the tree is cut, which is exactly why this test stays valid
// when that number moves.

import test from "node:test";
import assert from "node:assert/strict";

import { getLineage, LINEAGE_ROOTS } from "../../data/lineage.ts";

// Floating point: shares are divisions, so exact equality is the wrong test.
// This tolerance is far tighter than any figure the game prints, which rounds to
// whole percent, so it cannot hide a real fault.
const EPS = 1e-9;

const sumLeaves = (n) =>
  n.children && n.children.length
    ? n.children.reduce((s, c) => s + sumLeaves(c), 0)
    : (n.value ?? 1);

// Every leaf, merged by name: a progenitor reached by two different paths is one
// entry carrying the sum of both, which is what a chum's list shows.
function progenitorShares(root) {
  const total = sumLeaves(root);
  const out = new Map();
  const walk = (n) => {
    if (!n.children || !n.children.length) {
      const pct = ((n.value ?? 1) / total) * 100;
      out.set(n.name, (out.get(n.name) ?? 0) + pct);
      return;
    }
    n.children.forEach(walk);
  };
  walk(root);
  return out;
}

test("every lineage's progenitor list totals exactly 100%", () => {
  const bad = [];
  for (const name of LINEAGE_ROOTS) {
    const root = getLineage(name);
    if (!root) continue;
    const total = [...progenitorShares(root).values()].reduce((s, v) => s + v, 0);
    if (Math.abs(total - 100) > EPS) bad.push(`${name}: ${total.toFixed(6)}%`);
  }
  assert.deepEqual(bad, [], `lists not totalling 100%:\n  ${bad.join("\n  ")}`);
});

test("no single ancestor's share exceeds 100%", () => {
  const bad = [];
  for (const name of LINEAGE_ROOTS) {
    const root = getLineage(name);
    if (!root) continue;
    const total = sumLeaves(root);
    const walk = (n, path) => {
      const share = (sumLeaves(n) / total) * 100;
      if (share > 100 + EPS) bad.push(`${name} > ${path}: ${share.toFixed(2)}%`);
      for (const c of n.children ?? []) walk(c, `${path} > ${c.name}`);
    };
    for (const c of root.children ?? []) walk(c, c.name);
  }
  assert.deepEqual(bad, [], `ancestors over 100%:\n  ${bad.join("\n  ")}`);
});

// A canary rather than an assertion about correctness: it records what the model
// currently produces for the brief's two worked examples, so a change that moves
// every number in the game cannot land unnoticed. Update the figures deliberately
// if the data or the depth cap changes, do not delete the test.
//
// IT HAS ALREADY EARNED ITS PLACE. On its first run it failed. The brief's table
// was measured at MAX_LINEAGE_DEPTH 5 and gives the Cavalier five progenitors
// with Old scenting hounds at 40.0%. At the current cap of 7 the Cavalier has
// EIGHT progenitors and Old scenting hounds is 41.4%, because Celtic Scent Hound
// now expands into the four tracking-hound stocks behind it instead of standing
// as a 40% leaf. So the brief's tables are correct for the data as it was on
// 9 September and are NOT the figures to build against. The Beagle is unchanged
// at seven progenitors, which is why both are pinned here rather than one.
test("the brief's worked examples still hold", () => {
  const cav = getLineage("Cavalier King Charles Spaniel");
  assert.ok(cav, "Cavalier King Charles Spaniel has a lineage");
  const shares = progenitorShares(cav);
  assert.equal(shares.size, 8, "the Cavalier has 8 progenitors at cap 7");
  assert.equal(
    Math.round((shares.get("Old scenting hounds") ?? 0) * 10) / 10,
    41.4,
    "Old scenting hounds is 41.4% of the Cavalier as a progenitor"
  );
  const beagle = getLineage("Beagle");
  assert.ok(beagle, "Beagle has a lineage");
  const bShares = progenitorShares(beagle);
  assert.equal(bShares.size, 7, "the Beagle has 7 progenitors");
  assert.equal(
    Math.round((bShares.get("St Hubert Hound") ?? 0) * 10) / 10,
    41.7,
    "St Hubert Hound is 41.7% of the Beagle as a progenitor"
  );
});
