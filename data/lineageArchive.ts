// Reverse lineage index, built once from the pack and the lineage trees: for any
// ancestor breed, which of the 54 pack dogs descend from it. Every level sources
// its "related pack dogs" rail from here, so the lookup lives in one place.
import { breeds, type Breed } from "./breeds";
import { getLineage, LINEAGE_ROOTS, type LineageNode } from "./lineage";
import { resolveLineageName } from "./lineageNames";

const index = new Map<string, Set<string>>();

function collectNames(node: LineageNode | null, out: Set<string>): void {
  if (!node) return;
  out.add(node.name);
  node.children?.forEach((c) => collectNames(c, out));
}

for (const b of breeds) {
  const names = new Set<string>();
  collectNames(getLineage(b.name), names);
  names.delete(b.name); // a breed is not its own ancestor
  for (const anc of names) {
    let set = index.get(anc);
    if (!set) { set = new Set<string>(); index.set(anc, set); }
    set.add(b.name);
  }
}

// WHY A DEEP ANCESTOR CAN SHOW ZERO CHUMS, so the next reader does not chase the
// depth cap alone. Two causes compound:
//   1. The cap. getLineage stops at MAX_LINEAGE_DEPTH, so an ancestor sitting
//      further than that from every modern pack dog never appears in a tree
//      above and never enters this index. REVISED 14 September 2026: the cap was
//      raised from 5 to 7, and across the 54 pack trees the leaves cut off with
//      children behind them fell from 226 to 138. The worked example below no
//      longer holds: "Ancient Molossers" now expands and is no longer a childless
//      leaf. The 138 that remain are stopped by two different things: the cap
//      itself, and the `visited` cycle guard in expandNode. At cap 10 the figure
//      was 39, and every one of those was the cycle guard, so raising the cap
//      again would never reach them all.
//   2. Missing ancestry. Some nodes still have NO lineage children of their own.
//      Measured at cap 7: 69 distinct leaf names across the pack trees have no
//      record behind them, led by St Hubert Hound, Old scenting hounds and Old
//      hunting dogs of the Celts. Those carry the largest shares in the game, so
//      authoring them is what moves the numbers most.
// So a zero-chum deep ancestor is honest, not a bug here. Do NOT inherit a
// parent's chums downward to fill the gap: it would fabricate connections.
// Authoring the real ancestry is the Tudor job (tudor-trail-brief-v3.md).

// Dataset-wide rarity: how many distinct lineage TREES each dog appears in,
// across ALL roots (the whole dataset), not just the current level. An ancient
// ancestor threaded through many trees is COMMON; a modern terminal breed in one
// is EXTREMELY RARE. Built once, the same walk as the index above.
const treeAppearances = new Map<string, number>();
for (const root of LINEAGE_ROOTS) {
  const seen = new Set<string>();
  collectNames(getLineage(root), seen);
  for (const nm of seen) treeAppearances.set(nm, (treeAppearances.get(nm) ?? 0) + 1);
}
// How many distinct trees this dog appears in across the whole dataset.
export function treesContaining(name: string): number {
  return treeAppearances.get(name) ?? 0;
}

// Pack dogs descending from any of the given ancestor names, in pack order.
export function descendantPackBreeds(ancestorNames: string[]): Breed[] {
  const out = new Set<string>();
  for (const anc of ancestorNames) index.get(anc)?.forEach((n) => out.add(n));
  return breeds.filter((b) => out.has(b.name));
}

// Pack dogs related to a level, via the ancestors in the level dog's own tree.
export function relativesForLevel(rootName: string): Breed[] {
  const tree = getLineage(rootName);
  if (!tree) return [];
  const ancestors: string[] = [];
  const walk = (n: LineageNode) => { ancestors.push(n.name); n.children?.forEach(walk); };
  tree.children?.forEach(walk); // everything below the root is one of its ancestors
  return descendantPackBreeds(ancestors).filter((b) => b.name !== rootName);
}
// Top ancestor breeds for a pack breed as name + rounded %, the same breakdown
// the breed's own page shows. Reused by the mini pit learn rail.
function sumLeaves(n: LineageNode): number {
  if (!n.children?.length) return n.value ?? 1;
  return n.children.reduce((s, c) => s + sumLeaves(c), 0);
}

export function ancestryBreakdown(breedName: string): { name: string; pct: number }[] {
  const lineage = getLineage(resolveLineageName(breedName));
  if (!lineage) return [];
  const rootLeaves = sumLeaves(lineage);
  if (!rootLeaves) return [];
  const results: { name: string; pct: number }[] = [];
  const walk = (n: LineageNode) => {
    if (!n.children?.length) return;
    n.children.forEach((c) => {
      // A child sharing its parent's name is the Celtic Heeler pattern's
      // self-duplicate: the remainder of the SAME stock, drawn again so an
      // ancestor can nest inside it. Counting it would add the stock to its
      // own total, so it is skipped; its parent already carries the share.
      if (c.name !== n.name) {
        const pct = Math.round((sumLeaves(c) / rootLeaves) * 100);
        if (pct > 0) results.push({ name: c.name, pct });
      }
      walk(c);
    });
  };
  walk(lineage);
  const merged = new Map<string, number>();
  results.forEach(({ name, pct }) => merged.set(name, (merged.get(name) ?? 0) + pct));
  return [...merged.entries()]
    .map(([name, pct]) => ({ name, pct }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8);
}

/* THE ANCESTRY CARD'S OWN LIST, added 16 September 2026 (owner: the card shows 8
   and the pack shows 50, and they should be the same).

   TWO THINGS WERE DIFFERENT, not one. ancestryBreakdown above cuts to the top 8,
   AND its figures are raw shares of the whole dog, which overlap because
   ancestors nest inside one another. On the Jackapoo its eight rows already add
   to 295% while the full list has 51 entries. The ancestor pack moved onto
   ancestralInfluence the same morning, where every ancestor carries one figure
   and the set adds to exactly 100.

   So this is simply ancestralInfluence, uncut. One measure, one length, and the
   card's own total is now 100 like the pack's. ancestryBreakdown is left in place
   for anything still calling it.

   Figures come through as tenths, so a trace reads 0.4 rather than rounding to
   nothing. The card formats them. */
export function ancestryFullList(breedName: string): { name: string; pct: number }[] {
  return ancestralInfluence(resolveLineageName(breedName)).map((r) => ({ name: r.name, pct: r.pct }));
}

// A single breed's share of ONE named ancestor, however deep in its tree.
// Same per-node rounding and merge as ancestryBreakdown, but no top-8 cut, so
// a distant descendant (e.g. Bull Terrier under a Celtic-level circle) still
// resolves. Returns null when the ancestor is not in the breed's lineage.
export function ancestorShareOf(
  breedName: string,
  ancestorName: string,
): number | null {
  const lineage = getLineage(resolveLineageName(breedName));
  if (!lineage) return null;
  const rootLeaves = sumLeaves(lineage);
  if (!rootLeaves) return null;
  /* SUM RAW, ROUND ONCE, corrected 9 Sept 2026.
     This used to round EVERY appearance and then add the rounded figures up.
     With ten appearances that drifts by up to five points, and it produced a
     real 101% on screen: Yorkshire Terrier under Earth Dog has ten appearances
     whose exact shares total 100.000%, but two of them are 7.5% each and round
     up to 8, inventing a point out of nothing.
     A share of an ancestor cannot exceed 100%, so any figure above it was proof
     of an arithmetic fault rather than a data one. Nothing here needed
     "adjusting" or normalising; the order of operations was simply wrong. */
  let frac = 0;
  let found = false;
  const walk = (n: LineageNode) => {
    if (!n.children?.length) return;
    n.children.forEach((c) => {
      // Same self-duplicate rule as ancestryBreakdown: a child named after
      // its parent is the same stock's remainder, not a second helping.
      if (c.name === ancestorName && c.name !== n.name) {
        frac += sumLeaves(c) / rootLeaves;
        found = true;
      }
      walk(c);
    });
  };
  walk(lineage);
  return found ? Math.round(frac * 100) : null;
}

/* THE SAME WALK, KEEPING THE WORKING (9 Sept 2026).
   ancestorShareOf above sums a breed's appearances and throws the detail away.
   The learn box now shows that working, so this returns the appearances
   themselves: one entry per time the ancestor turns up in the breed's tree,
   with how far back it sits and what that appearance is worth.

   IT IS DELIBERATELY THE SAME WALK, SAME RULES, SAME ROUNDING as
   ancestorShareOf, including the self-duplicate rule where a child named after
   its parent is the same stock's remainder rather than a second helping. That
   is what guarantees these lines add up to the figure already on screen. If one
   is ever changed, change both, or the box will show a sum that contradicts its
   own headline.

   `depth` counts generations back from the breed itself, so the root's own
   children are 1. That is the number genLabel turns into "parent",
   "grandparent" and so on. */
/* EACH APPEARANCE REMEMBERS WHICH SIDE OF THE FAMILY IT CAME DOWN, 16 September
   2026 (owner: this information area should make it easier to understand, not
   harder). The box printed one line per appearance, every one labelled only by
   generation, so a dog reached forty times gave forty lines of
   "As great-great-great-great-grandparent: <1%". That says how far back it was
   and never which dog it came through, which is the thing the picture cannot
   show. `branch` is the DEPTH-1 ancestor the path descends from, so a caller can
   group by it: "from Rache: 14%", "from Talbot: 8%". The same change was made to
   the main pit's own copy on 15 September. */
export function ancestorAppearancesOf(
  breedName: string,
  ancestorName: string,
): { depth: number; pct: number; branch: string }[] {
  const lineage = getLineage(resolveLineageName(breedName));
  if (!lineage) return [];
  const rootLeaves = sumLeaves(lineage);
  if (!rootLeaves) return [];
  const raw: { depth: number; exact: number; branch: string }[] = [];
  const walk = (n: LineageNode, depth: number, branch: string) => {
    if (!n.children?.length) return;
    n.children.forEach((c) => {
      // at depth 1 the child IS the branch; deeper down it inherits it
      const br = depth === 1 ? c.name : branch;
      if (c.name === ancestorName && c.name !== n.name) {
        raw.push({ depth, exact: (sumLeaves(c) / rootLeaves) * 100, branch: br });
      }
      walk(c, depth + 1, br);
    });
  };
  walk(lineage, 1, "");
  if (!raw.length) return [];

  /* LARGEST REMAINDER, added 9 Sept 2026 with the round-once fix above.
     Rounding each line on its own is what produced the 101%. But simply rounding
     the TOTAL once is not enough on its own either: the box prints the parts and
     then prints their sum, so if the parts are rounded independently they can
     still visibly fail to add up, which looks worse than a wrong total.
     So the parts are apportioned to the total instead. Everyone takes their
     floor, then the points left over go to whoever was robbed most by that
     floor. The printed lines therefore add up to the printed total exactly, by
     construction, on every dog.
     The total here is computed the same way as ancestorShareOf so the two agree;
     if that rounding is ever changed, change this with it. */
  const total = Math.round(raw.reduce((t, r) => t + r.exact, 0));
  const floors = raw.map((r) => Math.floor(r.exact));
  let left = total - floors.reduce((t, f) => t + f, 0);
  const order = raw
    .map((r, i) => ({ i, rem: r.exact - Math.floor(r.exact) }))
    .sort((a, b) => b.rem - a.rem);
  const pcts = floors.slice();
  for (const o of order) {
    if (left <= 0) break;
    pcts[o.i] += 1;
    left -= 1;
  }
  return raw
    .map((r, i) => ({ depth: r.depth, pct: pcts[i], branch: r.branch }))
    .sort((a, b) => a.depth - b.depth);
}

/* ANCESTRAL INFLUENCE: every ancestor, one figure each, adding to exactly 100.
   Added 16 September 2026 (owner: "I need a way that the total is an even 100%
   and each dog has a percentage amount that is relatively accurate", and "as each
   level of ancestors gets deeper the % effect that progenitor has diminishes").

   THE PROBLEM IT SOLVES. Listing every ancestor with its raw share of the whole
   dog gives a total of 300% to 509%, a median of 300 across the game. That is not
   a rounding error: EACH GENERATION already sums to 100% on its own, and the list
   stacks four to six generations on top of each other. The Staffordshire Bull
   Terrier came to 415% over 47 appearances.

   THE MODEL. Give each generation a slice of the 100 that HALVES as you go back,
   then split that generation's slice between its dogs in proportion to their own
   shares. On a six-generation dog the slices are 50.8, 25.4, 12.7, 6.3, 3.2, 1.6.
   Halving is the pedigree convention: each generation back is half as close. It
   is the one judgement call in here and it is a single constant.

   A DOG REACHED SEVERAL WAYS ACCUMULATES. Each appearance is weighted by its own
   generation first, then appearances of the same name are ADDED. On the Staffie,
   Ancient Celtic earth dogs appears four times at generation 4 and merges to
   2.00%; Alaunt war dogs appears five times across generations 3 and 5, the
   shallow one worth 1.68% and the deep ones 0.17% to 0.62%, merging to 3.26%.

   THE PRINTED FIGURES TOTAL 100 TOO. Largest-remainder apportionment, the same
   method ancestorShareOf and ancestorAppearancesOf already use, so the numbers on
   screen add up rather than only the ones behind them.

   APPORTIONED IN TENTHS, NOT WHOLE PERCENT, 16 September 2026 (owner: below 1% we
   need to show the trace, like 0.5%). Whole percent buried every trace at 0: on
   the Staffie, Dogs of the Alan horsemen, Ancient Chinese toy dogs and Eastern
   lion and lap dogs are 0.8, 0.6 and 0.4. Rounding only those three to a decimal
   and leaving the rest whole was measured and rejected: the printed column came
   to 101.8%, because fifteen values would each round independently while three
   kept their precision. One decimal for everything is the only form that shows a
   trace AND still totals exactly 100.0, so the headline figures carry a decimal
   too: the Bulldog reads 27.9 rather than 28.

   SELF-CHILDREN ARE SKIPPED, as everywhere else: a node carrying a child of its
   own name is a display device for a stock that continues alongside what came out
   of it, not a separate ancestor.

   WHAT THIS IS NOT. It is INFLUENCE, not blood. The Bulldog is 55% of a Staffie's
   raw share and 27.9% of its influence, and both are true of different questions.
   Label it as influence. Do not print it as "is 28% Bulldog". */
const INFLUENCE_DECAY = 0.5; // each generation back counts half the one before it

export function ancestralInfluence(
  breedName: string,
): { name: string; pct: number; exact: number }[] {
  const lineage = getLineage(breedName);
  if (!lineage) return [];
  const rootLeaves = sumLeaves(lineage);
  if (rootLeaves <= 0) return [];

  const apps: { name: string; depth: number; raw: number }[] = [];
  const walk = (n: LineageNode, depth: number) => {
    n.children?.forEach((c) => {
      if (c.name !== n.name) {
        apps.push({ name: c.name, depth, raw: (sumLeaves(c) / rootLeaves) * 100 });
      }
      walk(c, depth + 1);
    });
  };
  walk(lineage, 1);
  if (!apps.length) return [];

  const maxDepth = apps.reduce((m, a) => Math.max(m, a.depth), 1);
  const weights: number[] = [];
  for (let d = 1; d <= maxDepth; d += 1) weights.push(Math.pow(INFLUENCE_DECAY, d - 1));
  const weightSum = weights.reduce((s, v) => s + v, 0);

  const exact = new Map<string, number>();
  for (let d = 1; d <= maxDepth; d += 1) {
    const gen = apps.filter((a) => a.depth === d);
    const genTotal = gen.reduce((s, a) => s + a.raw, 0);
    if (genTotal <= 0) continue; // a generation with no weight gives up its slice
    const slice = (weights[d - 1] / weightSum) * 100;
    for (const a of gen) {
      exact.set(a.name, (exact.get(a.name) ?? 0) + (a.raw / genTotal) * slice);
    }
  }

  /* A generation that gave up its slice would leave the total under 100, so the
     slices are re-normalised over the generations that actually carried weight. */
  const rawTotal = [...exact.values()].reduce((s, v) => s + v, 0);
  if (rawTotal > 0 && Math.abs(rawTotal - 100) > 1e-9) {
    for (const [k, v] of exact) exact.set(k, (v / rawTotal) * 100);
  }

  // Apportioned in TENTHS (1000 of them) so the rounded set totals exactly 100.0.
  const rows = [...exact.entries()].sort((a, b) => b[1] - a[1]);
  const tenths = rows.map(([, v]) => v * 10);
  const floors = tenths.map((v) => Math.floor(v));
  let left = 1000 - floors.reduce((s, v) => s + v, 0);
  const order = tenths
    .map((v, i) => ({ i, rem: v - Math.floor(v) }))
    .sort((a, b) => b.rem - a.rem);
  const parts = floors.slice();
  for (const o of order) {
    if (left <= 0) break;
    parts[o.i] += 1;
    left -= 1;
  }
  return rows.map(([name, v], i) => ({ name, pct: parts[i] / 10, exact: v }));
}
