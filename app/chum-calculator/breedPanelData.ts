import { getLineage } from "../../data/lineage";
import { resolveLineageName } from "../../data/lineageNames";

// Ancestry share breakdown, kept identical to the walk on /chums/[slug]
// (BreedClient ancestryBreakdown) so the two surfaces agree for the same dog.
// Pure function of the lineage tree: collect the leaf nodes, normalise their
// share, merge duplicates and sort descending. (Job B stage 6, 22 Aug 2026.)
export function ancestryBreakdown(name: string): { name: string; pct: number }[] {
  let lineage: unknown = null;
  try { lineage = getLineage(resolveLineageName(name)); } catch { lineage = null; }
  if (!lineage) return [];

  const sumLeaves = (n: any): number => {
    const kids = n.children as any[] | undefined;
    if (!kids || kids.length === 0) return n.value ?? 1;
    return kids.reduce((s: number, k: any) => s + sumLeaves(k), 0);
  };
  const root = lineage as any;
  const rootLeaves = sumLeaves(root);
  const results: { name: string; pct: number }[] = [];
  const walk = (n: any) => {
    const kids = n.children as any[] | undefined;
    if (!kids || kids.length === 0) {
      const pct = Math.round((sumLeaves(n) / rootLeaves) * 100);
      if (pct > 0) results.push({ name: n.name, pct });
    } else {
      kids.forEach(walk);
    }
  };
  (root.children as any[] | undefined)?.forEach(walk);

  const merged = new Map<string, number>();
  results.forEach(({ name, pct }) => merged.set(name, (merged.get(name) ?? 0) + pct));
  return [...merged.entries()].sort((a, b) => b[1] - a[1]).map(([n, pct]) => ({ name: n, pct }));
}
