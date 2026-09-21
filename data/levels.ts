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
