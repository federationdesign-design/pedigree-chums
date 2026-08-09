// The two-line name wrap shared by the pit lift and the pit pills. A name up to
// 16 characters stays on one line; a longer one splits at the single space
// nearest its middle, giving at most two lines; a name with no space is left
// whole. Kept in one place so BreedTree's spawned pills and LineageMap's node
// and tag pills can never wrap the same name two different ways. The pill WIDTH
// formulas differ per caller (padding, floors) and stay local; only the split
// itself is shared.
export function splitName(nm: string): string[] {
  if (nm.length <= 16) return [nm];
  const mid = Math.floor(nm.length / 2);
  let best = -1;
  for (let i = 0; i < nm.length; i++) if (nm[i] === " " && (best === -1 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best === -1 ? [nm] : [nm.slice(0, best), nm.slice(best + 1)];
}
