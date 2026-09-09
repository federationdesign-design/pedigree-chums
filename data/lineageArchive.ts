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
//   1. The cap. getLineage stops at MAX_LINEAGE_DEPTH = 5, so an ancestor sitting
//      more than 5 steps from every modern pack dog never appears in a tree above
//      and never enters this index. Measured: "Ancient Molossers" is a childless
//      LEAF at the depth-5 edge in all 12 of its chum trees.
//   2. Missing ancestry. Some of these nodes have NO lineage children of their
//      own: getLineage("Ancient Molossers") is childless. Its apparent children
//      ("Old mastiffs of the ancient East", "Alaunt war dogs", "Dogs of the Alan
//      horsemen") exist only inline in the Ancient Mastiff LEVEL's authored tree,
//      not as reusable ancestry, so no pack dog can reach them by any path.
// So a zero-chum deep ancestor is honest, not a bug here. Do NOT inherit a
// parent's chums downward to fill the gap: measured, 0 of Ancient Molossers' 12
// descend through that child or any sibling, so it would fabricate connections.
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
export function ancestorAppearancesOf(
  breedName: string,
  ancestorName: string,
): { depth: number; pct: number }[] {
  const lineage = getLineage(resolveLineageName(breedName));
  if (!lineage) return [];
  const rootLeaves = sumLeaves(lineage);
  if (!rootLeaves) return [];
  const raw: { depth: number; exact: number }[] = [];
  const walk = (n: LineageNode, depth: number) => {
    if (!n.children?.length) return;
    n.children.forEach((c) => {
      if (c.name === ancestorName && c.name !== n.name) {
        raw.push({ depth, exact: (sumLeaves(c) / rootLeaves) * 100 });
      }
      walk(c, depth + 1);
    });
  };
  walk(lineage, 1);
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
    .map((r, i) => ({ depth: r.depth, pct: pcts[i] }))
    .sort((a, b) => a.depth - b.depth);
}
