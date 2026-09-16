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
import { ancestralInfluence } from "../../data/lineageArchive.ts";

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
// IT HAS EARNED ITS PLACE TWICE. First run, it caught that the brief's table was
// measured at MAX_LINEAGE_DEPTH 5 and the cap is now 7. Second, it caught the
// share-scaling fix of 15 September, which moved 152 of the game's 330
// direct-child shares. The brief's figures, and the cap-7 figures that replaced
// them, are both superseded by the ones below.
test("the brief's worked examples still hold", () => {
  const cav = getLineage("Cavalier King Charles Spaniel");
  assert.ok(cav, "Cavalier King Charles Spaniel has a lineage");
  const shares = progenitorShares(cav);
  assert.equal(shares.size, 8, "the Cavalier has 8 progenitors");
  assert.equal(
    Math.round((shares.get("St Hubert Hound") ?? 0) * 10) / 10,
    38,
    "St Hubert Hound is 38.0% of the Cavalier"
  );
  const beagle = getLineage("Beagle");
  assert.ok(beagle, "Beagle has a lineage");
  const bShares = progenitorShares(beagle);
  assert.equal(bShares.size, 7, "the Beagle has 7 progenitors");
  assert.equal(
    Math.round((bShares.get("St Hubert Hound") ?? 0) * 10) / 10,
    50.6,
    "St Hubert Hound is 50.6% of the Beagle"
  );
});

/* THE AUTHORED SHARE IS THE SHARE THAT IS DRAWN, added 15 September 2026.

   This is the guard for the fault the scaling fix cured, and it is the one that
   matters most: if the data says a dog is 40% of its parent, 40% is what must
   come out the other end. Until the fix, a child that carried its own inline
   children ignored its authored value and came through at whatever its subtree
   happened to weigh. The Cavachon, authored 50/50, was drawing 91.4/8.6.

   Scoped to roots where EVERY direct child carries a value, because that is the
   only case where the expected answer is unambiguous. Where a child has no value
   of its own, its weight is by design the sum of its subtree's leaves, and there
   is nothing authored to check it against. */
test("a direct child's drawn share equals its authored share", () => {
  const leafSum = (n) =>
    n.children && n.children.length
      ? n.children.reduce((s, c) => s + leafSum(c), 0)
      : (n.value ?? 1);
  const bad = [];
  let checked = 0;
  for (const name of LINEAGE_ROOTS) {
    const root = getLineage(name);
    const kids = root?.children ?? [];
    if (kids.length < 2) continue;
    // the authored values live on the raw record, which getLineage has already
    // expanded, so read them from a root whose children were never grafted
    const authored = kids.map((c) => c.value);
    if (authored.some((v) => v === undefined)) continue;
    const sum = authored.reduce((s, v) => s + v, 0);
    if (sum <= 0) continue;
    const total = leafSum(root);
    kids.forEach((c, i) => {
      checked += 1;
      const want = (authored[i] / sum) * 100;
      const got = (leafSum(c) / total) * 100;
      if (Math.abs(want - got) > 0.05) {
        bad.push(`${name} > ${c.name}: authored ${want.toFixed(1)}%, drawn ${got.toFixed(1)}%`);
      }
    });
  }
  assert.ok(checked > 0, "the check found some roots to test");
  assert.deepEqual(bad, [], `shares that do not match what the data authors:\n  ${bad.join("\n  ")}`);
});

/* THE INFLUENCE MODEL'S OWN GUARD, added 16 September 2026.

   ancestralInfluence exists to answer "every ancestor gets a figure and they add
   to an even 100". If that ever stops being true the screens printing it go wrong
   silently, so both the exact figures and the ROUNDED ones are checked: the
   rounded set is what a player sees, and largest-remainder apportionment is the
   only reason those add up rather than landing on 99 or 101. */
test("ancestral influence totals exactly 100 on every lineage", () => {
  const badExact = [];
  const badRounded = [];
  let checked = 0;
  for (const name of LINEAGE_ROOTS) {
    const rows = ancestralInfluence(name);
    if (!rows.length) continue;
    checked += 1;
    const exact = rows.reduce((s, r) => s + r.exact, 0);
    const rounded = rows.reduce((s, r) => s + r.pct, 0);
    if (Math.abs(exact - 100) > 1e-6) badExact.push(`${name}: ${exact.toFixed(4)}`);
    if (rounded !== 100) badRounded.push(`${name}: ${rounded}`);
  }
  assert.ok(checked > 100, `expected most lineages to produce an influence list, got ${checked}`);
  assert.deepEqual(badExact, [], `exact totals off 100:\n  ${badExact.join("\n  ")}`);
  assert.deepEqual(badRounded, [], `rounded totals off 100:\n  ${badRounded.join("\n  ")}`);
});

// Deeper ancestors must count for less than nearer ones, which is the whole point
// of the decay. Checked on the owner's worked example rather than asserted in the
// abstract: the Bulldog is a parent, Ancient Celtic earth dogs is four back.
test("influence diminishes with depth", () => {
  const rows = ancestralInfluence("Staffordshire Bull Terrier");
  const get = (n) => rows.find((r) => r.name === n)?.exact ?? 0;
  assert.ok(get("Bulldog") > get("Old English Bulldog"), "a parent outweighs a grandparent");
  assert.ok(get("Old English Bulldog") > get("Ancient Celtic earth dogs"), "a grandparent outweighs a great-great");
  assert.ok(get("Ancient Celtic earth dogs") > 0, "a deep ancestor still carries something");
});
