/* THE CAMPAIGN'S LEVELS, as plain data, 20 September 2026.

   WHY THIS FILE EXISTS. BreedStrip decides what counts as a level and in what
   order, but BreedStrip is a "use client" module, so a server page cannot import
   a function from it: the import becomes a client reference, not a function. The
   per-level pages under /britains-dog-history/dog/[slug] need the same answer at
   build time, for generateStaticParams and the page title.

   ONE SOURCE OF TRUTH, NOT TWO. BreedStrip's breedCardKind now delegates to
   levelCardKind below and imports STRIP_ORDER from here, so the strip, the
   campaign order and the level pages cannot disagree about which dogs are levels
   or where they sit. */
import { ukBreeds, type UKBreed } from "./uk-breeds";
import { breeds as packBreeds } from "./breeds";
import { getLineage, type LineageNode } from "./lineage";
import { isEchoName } from "./lineageShape";
import { ERA_YEARS, eraYear } from "./eraYears";
import { resolveLineageName } from "./lineageNames";

export type BreedCardKind = "learn" | "play";

/* A breed with its own chum page is a "learn" card and goes to /chums2. One with an
   ancestored lineage is a "play" card, which is a level. Anything else only flips. */
export function levelCardKind(name: string): BreedCardKind | null {
  const packName = resolveLineageName(name);
  if (packBreeds.find((x) => x.name === packName)?.slug) return "learn";
  const lineage = getLineage(packName);
  return lineage?.children?.length ? "play" : null;
}

// Timeline order across every era. Moved here from BreedStrip, unchanged.
export const STRIP_ORDER = ["ancient", "medieval", "c1500", "c1700", "early1800", "spaniels", "mid1800", "late1800", "c1900", "crosses"];

// Every level, in campaign order. The same sort and filter BreedStrip uses.
export function levelBreeds(): UKBreed[] {
  return ukBreeds
    .slice()
    .sort((a, b) => (STRIP_ORDER.indexOf(a.strip) - STRIP_ORDER.indexOf(b.strip)) || (a.anchor - b.anchor))
    .filter((b) => levelCardKind(b.name) === "play");
}

/* The URL slug for a level. Lower case, accents folded, apostrophes DROPPED rather
   than hyphenated so "Drover's Dog" is drovers-dog, not drover-s-dog. Measured on
   20 September 2026 across all 98 levels: no two collide. */
export function levelSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function levelBySlug(slug: string): UKBreed | undefined {
  return levelBreeds().find((b) => levelSlug(b.name) === slug);
}

/* THE LEVELS INSIDE ONE CHUM'S FAMILY TREE, 20 September 2026 (owner: a slider at
   the bottom of every chum page holding only the dogs that went into making it).

   A level counts if its name appears anywhere below the chum in the chum's own
   lineage.

   OLDEST ERA FIRST, 20 September 2026 (owner: the dogs from the older eras come
   first, moving in order to the modern eras). This was nearest-ancestor first,
   which put a Victorian parent ahead of the Roman mastiff behind it. It is now the
   campaign's own order, era by STRIP_ORDER then the dog's anchor within its era,
   which is exactly the order levelBreeds() already returns, so the strip reads as
   a timeline and matches the order the game plays the levels in.

   MEASURED on the 54 chums: median 6 levels, most 23, and 13 chums have NONE, the
   breeds that arrived from outside Britain with no British ancestry recorded, Pug,
   Chihuahua, German Shepherd and so on. The caller shows nothing for those. */
export function levelsWithin(chumName: string): UKBreed[] {
  const root = getLineage(resolveLineageName(chumName));
  if (!root) return [];
  const order = levelBreeds();
  const byLineageName = new Map(order.map((b) => [resolveLineageName(b.name), b]));
  const depth = new Map<string, number>();
  const walk = (n: { name: string; children?: { name: string }[] }, d: number) => {
    if (d > 0) {
      const lv = byLineageName.get(n.name);
      if (lv && !depth.has(lv.name)) depth.set(lv.name, d);
      else if (lv) depth.set(lv.name, Math.min(depth.get(lv.name) as number, d));
    }
    for (const c of (n.children ?? []) as { name: string; children?: { name: string }[] }[]) walk(c, d + 1);
  };
  walk(root, 0);
  // levelBreeds() is already in campaign order, oldest era first; keep it.
  return order.filter((b) => depth.has(b.name));
}

/* A STRIP CARD FOR ANY NAMED DOG. The strip's own entry when the dog has one, so it
   looks like its neighbours; otherwise one built from the chum record, with the card
   art and "Today" as its era, parked at the end of the timeline. Moved here from
   LevelSlider, 21 September 2026, so chum ancestors and the page's own dog share it. */
export function stripCardFor(name: string): UKBreed {
  const uk = ukBreeds.find((u) => u.name === name);
  if (uk) return uk;
  const pack = packBreeds.find((b) => b.name === name);
  /* The researched round date, not "Today", 21 September 2026: see data/eraYears.ts.
     Its year is the anchor too, so the card sorts into the timeline where it belongs. */
  const label = ERA_YEARS[name];
  return { name, strip: "c1900", era: label ?? "", anchor: eraYear(label) ?? 9999, note: pack?.character ?? "", image: pack?.image };
}

/* EVERY DOG IN A CHUM'S TREE THAT CAN BE PLAYED, 21 September 2026 (owner: the Bulldog
   is missing from the French Bulldog page). levelsWithin returns LEVELS only, and a
   level is by definition not one of the 54 chums, so a chum ancestor such as the
   Bulldog never appeared. This adds them.

   MEASURED: 27 of the 54 chum pages have chum ancestors, 71 cards in all; the Bull
   Terrier alone has five. 24 of those have no strip entry and take the built card.

   The page's own dog is left out, including the self-named copies of it inside its
   tree; LevelSlider appends it last. Oldest era first, then each dog's anchor, the
   campaign's order, so the chums slot into the timeline beside the levels. */
export function ancestorCardsWithin(chumName: string): UKBreed[] {
  const root = getLineage(resolveLineageName(chumName));
  if (!root) return [];
  const chums = new Set<string>();
  const walk = (n: { name: string; children?: { name: string }[] }, d: number) => {
    if (d > 0 && n.name !== chumName && levelCardKind(n.name) === "learn") chums.add(n.name);
    for (const c of (n.children ?? []) as { name: string; children?: { name: string }[] }[]) walk(c, d + 1);
  };
  walk(root, 0);
  const all = [...levelsWithin(chumName), ...[...chums].map(stripCardFor)];
  const seen = new Set<string>();
  return all
    .filter((b) => (seen.has(b.name) ? false : (seen.add(b.name), true)))
    .sort((a, b) => (STRIP_ORDER.indexOf(a.strip) - STRIP_ORDER.indexOf(b.strip)) || (a.anchor - b.anchor));
}

/* ---- FOREIGN PROGENITORS IN A CHUM'S SLIDER, 21 September 2026 (owner) -----------------
   Ancestors that are neither a level nor a chum, and are not British, such as the Pug's
   Ancient Chinese toy dogs and Eastern Lion dogs. Measured: 58 such names across the 54
   chum trees, and NONE has a family tree of its own as a root. Two rules, the owner's:

     NO DEEPER ANCESTORS in the chum's tree: a FLIP-ONLY card, picture and note.
     ANCESTORS RECORDED beneath it in the chum's tree: the same card, and a tap opens a
       play start screen built from THAT subtree, since the dog has no root tree to open.

   "Deeper" ignores a child that merely repeats the dog's own name, the echo rule, or a
   dog whose only child is a copy of itself would count as explorable. */

/* THE BRITISH DOGS WITH NO ERA, so they are not treated as foreign. The owner chose this
   shape, a short British list with everything else era-less counted as foreign, on 21
   September 2026. These are the ten sent to him as confident. Nine more were put to him
   as unclear and are NOT on this list yet, so they count as foreign until he rules:
   Early Badger hunting dogs, Early Boar hunting dogs, Old hunting dogs of the Celts, Norse
   settlers dogs, Dalmatian, Carriage guard dogs, Fishermen's water dogs, Rough water dogs,
   Shaggy upland herders. Adding a name here is the whole change. */
export const BRITISH_NO_ERA = new Set<string>([
  "Ancient Celtic earth dogs",
  "Anglo-Saxon herding dogs",
  "English Mastiff",
  "Labrador",
  "Medieval British Mastiff",
  "Old Border Terriers",
  "Old Scottish working Terriers",
  "Old earth Terriers",
  "Working hunt Terriers",
  "Wavy-Coated Retriever",
]);

const ukNames = new Set(ukBreeds.map((u) => u.name));

// Neither a level nor a chum, not on an era strip, and not on the British list.
export function isForeignAncestor(name: string): boolean {
  return !levelCardKind(name) && !ukNames.has(name) && !BRITISH_NO_ERA.has(name);
}

// A strip card that may carry its own subtree to play. See BreedStrip's `only`.
export type StripCard = UKBreed & { lineage?: LineageNode };

/* THE FOREIGN CARDS FOR ONE CHUM. Deepest first, since further back in the tree is
   further back in time and these have no era to sort by; LevelSlider puts them ahead of
   the era-sorted levels. A name met more than once keeps its deepest, and an explorable
   copy wins over a leaf. The era is left BLANK, not "Today": none of them is modern. */
export function foreignCardsWithin(chumName: string): StripCard[] {
  const root = getLineage(resolveLineageName(chumName));
  if (!root) return [];
  const best = new Map<string, { node: LineageNode; depth: number; deeper: boolean }>();
  const walk = (n: LineageNode, d: number) => {
    if (d > 0 && n.name !== chumName && isForeignAncestor(n.name)) {
      const deeper = (n.children ?? []).some((c) => !isEchoName(c.name, n.name));
      const had = best.get(n.name);
      if (!had || (deeper && !had.deeper) || (deeper === had.deeper && d > had.depth)) best.set(n.name, { node: n, depth: d, deeper });
    }
    for (const c of n.children ?? []) walk(c, d + 1);
  };
  walk(root, 0);
  return [...best.values()]
    .sort((a, b) => b.depth - a.depth)
    .map(({ node, deeper }) => ({
      name: node.name,
      strip: "ancient",
      // The researched round date: see data/eraYears.ts. Blank only if one is missing.
      era: ERA_YEARS[node.name] ?? "",
      anchor: eraYear(ERA_YEARS[node.name]) ?? -1,
      note: node.note,
      image: node.img,
      ...(deeper ? { lineage: node } : null),
    }));
}
