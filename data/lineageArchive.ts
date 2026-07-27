// Reverse lineage index, built once from the pack and the lineage trees: for any
// ancestor breed, which of the 54 pack dogs descend from it. Every level sources
// its "related pack dogs" rail from here, so the lookup lives in one place.
import { breeds, type Breed } from "./breeds";
import { getLineage, type LineageNode } from "./lineage";

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
