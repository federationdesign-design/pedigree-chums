/* WHICH CIRCLES ARE COPIES, AND SO ARE NOT DRAWN
   ==============================================
   One home for a rule both BreedTree and LineageMap have to agree on, because
   five separate faults in one day came from it living in only one of them:

     the pale blue discs painted onto hidden circles
     the word tile on the lifted layer
     the shallow-lineage audit counting echoes as dead ends
     the empty rings in the Turnspit diagram
     two identical Ancient Molossers in the learn area

   Every one of those was something that knew about copies talking to something
   that did not. BreedTree has known since the Celtic Heeler level; LineageMap has
   never known at all.

   TWO KINDS OF COPY, AND THEY ARE DIFFERENT RELATIONSHIPS:

     AN ECHO repeats its PARENT's name. "A circle whose name repeats its parent's
     is not a second animal. It is the same dog carrying on." That is the Celtic
     Heeler rule, written in BreedTree and quoted here so the two cannot drift.

     A DUPLICATE SIBLING repeats an EARLIER SIBLING. Ancient Molossers' two
     `Old Mastiffs of the East` are this: same name, same picture, 50% and 50%.

   ONLY AN IDENTICAL DUPLICATE IS A COPY. Same name AND the same subtree, values
   included. Two of the archive's twenty duplicate patterns carry copies whose
   values differ; those are two contributions of different weight that happen to
   share a name, and hiding one would lose its share. They stay drawn, and
   subtreeSig is what tells them apart.

   HIDE, NEVER STRIP, AND THE ORDER IS WHY. LineageMap's tree builder collapses any
   valueless node down to its only child. Removing a copy from the DATA turns a
   two-child node into a one-child node and the parent is then deleted outright:
   measured at minus 20% of nodes, minus 129 frames and shares moving up to 37
   points. Hiding runs afterwards, on the built tree, so the collapse still sees two
   children, every parent survives and NO SHARE MOVES ANYWHERE. */
import type { LineageNode } from "./lineage";

/* The signature is cached on the raw node in a WeakMap, because this is asked
   inside render and physics loops. Each LineageNode is walked once, ever. */
/* KEPT DELIBERATELY, AND UNUSED FOR NOW (19 September 2026). Nothing calls this
   since the duplicate-sibling rule was withdrawn. It stays because it is the test
   that tells a true byte copy from two contributions that merely share a name, and
   the 19 August device removal needs exactly that to know which 19 of the 20
   duplicate patterns to merge and which one to leave alone. */
const sigCache = new WeakMap<LineageNode, string>();
export function subtreeSig(n: LineageNode): string {
  const hit = sigCache.get(n);
  if (hit !== undefined) return hit;
  const s = `${n.name}:${n.value ?? ""}(${(n.children ?? []).map(subtreeSig).join(",")})`;
  sigCache.set(n, s);
  return s;
}

/* The Celtic Heeler rule, by name alone. */
export function isEchoName(childName: string, parentName: string): boolean {
  return childName === parentName;
}

/* The composed rule, for a caller holding the sibling list.

   THE DUPLICATE-SIBLING HALF IS WITHDRAWN (owner, 19 September 2026). It hid a child
   whose name and whole subtree repeated an earlier sibling; it reached further than
   the pit diagram it was written for and it hid a node without its descendants. The
   duplicates are the 19 August display device and the answer is to take them out of
   the DATA, not to hide them at render time. `earlier` is kept in the signature so
   re-introducing a sibling rule needs no change at any call site.

   ONLY THE ECHO RULE IS LIVE, which is the Celtic Heeler fix and predates all of
   this. */
export function isHiddenCopyOf(child: LineageNode, _earlier: readonly LineageNode[], parentName: string): boolean {
  return isEchoName(child.name, parentName);
}
