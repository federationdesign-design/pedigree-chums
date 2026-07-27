// Reverse lineage index, built once from the pack and the lineage trees: for any
// ancestor breed, which of the 54 pack dogs descend from it. Every level sources
// its "related pack dogs" rail from here, so the lookup lives in one place.
import { breeds, type Breed } from "./breeds";
import { getLineage, type LineageNode } from "./lineage";
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
      const pct = Math.round((sumLeaves(c) / rootLeaves) * 100);
      if (pct > 0) results.push({ name: c.name, pct });
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
  let pct = 0;
  let found = false;
  const walk = (n: LineageNode) => {
    if (!n.children?.length) return;
    n.children.forEach((c) => {
      if (c.name === ancestorName) {
        pct += Math.round((sumLeaves(c) / rootLeaves) * 100);
        found = true;
      }
      walk(c);
    });
  };
  walk(lineage);
  return found ? pct : null;
}
