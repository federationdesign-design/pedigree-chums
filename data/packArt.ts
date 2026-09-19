/* THE 54 PACK DOGS AND THEIR CARD ART, in one place (owner, 19 September 2026).

   WHY THIS FILE EXISTS. This lookup lived inside LineageMap.tsx, so only the
   layers LineageMap draws ever ran it. BreedTree.tsx does not import data/breeds
   at all and painted every circle from the lineage record's own `img`, which is a
   historical painting or photograph. The result was that sixteen of the pack's
   fifty-four dogs showed a photograph in the pit, the mini pit, the start screen,
   the learn area and on the lifted card, while the same dog showed its cartoon on
   the diagram. Greyhound in twenty-nine trees, Bloodhound in eighteen, Mastiff in
   twelve, Bulldog in ten, Whippet in nine.

   THE OVERRIDE BELONGS AT THE DRAW, NOT IN THE DATA. The lineage records keep
   their historical pictures on purpose: a node named for a living pack breed is
   still being used there as an ancestor, and the painting is the right thing for
   the archive to hold. What is wrong is only what the GAME shows, so the game
   swaps it at the moment it paints and the data is untouched.

   THE LOOKUP HAS TO RUN THE ALIAS. PACK_IMG is keyed on the pack's own spelling
   and was once asked with the RAW node name, so a dog written under an alias
   missed its card art and kept a nineteenth-century oil of a LIVING pack breed.
   "West Highland White Terrier" resolved correctly for ancestry, through
   resolveLineageName, and then fell through to the painting. One dog when it was
   found, and it would have been the next one silently. */
import { breeds } from "./breeds";
import { resolveLineageName } from "./lineageNames";

// pack breed -> its square cartoon card art
export const PACK_IMG = new Map(breeds.map((b) => [b.name, b.image]));

/* The card art for a node, or undefined when the node is not one of the 54.
   Callers read it as `packArt(name) ?? node.img`, so a dog the pack does not hold
   keeps whatever the archive gave it. */
export const packArt = (name: string): string | undefined =>
  PACK_IMG.get(name) ?? PACK_IMG.get(resolveLineageName(name));
