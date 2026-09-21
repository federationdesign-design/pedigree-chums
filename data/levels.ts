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
import { getLineage } from "./lineage";
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
