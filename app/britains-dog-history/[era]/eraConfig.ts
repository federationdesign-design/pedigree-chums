/* Per-era social pages: the six share-only routes under
   /britains-dog-history/[era]. Additive only, the history index page is not
   touched. See docs/social-pages/BRIEF.md and docs/social-pages/DECISIONS.md.

   Each page is a thin wrapper that reuses the existing BreedStrip slider and the
   existing era intro copy (data/eraIntros.ts). No new copywriting: titles are
   derived from the era name, descriptions from the strips' existing notes.

   `strips` are the uk-breeds `strip` keys, in the order they appear on the
   history page today. Five pages carry one strip; the 1800s page stacks all
   four of its 1800s-region strips (early1800, spaniels, mid1800, late1800),
   per Steve's call on 13 August 2026. */

export type EraPage = {
  slug: string;
  title: string; // page <title> and displayed heading, derived from the era name
  strips: string[]; // uk-breeds strip keys, in history-page order
};

export const ERA_PAGES: EraPage[] = [
  { slug: "ancient", title: "Ancient Times", strips: ["ancient"] },
  { slug: "medieval", title: "Medieval Times", strips: ["medieval"] },
  { slug: "tudor", title: "Tudor Times", strips: ["c1500"] },
  { slug: "1700s", title: "The 1700s", strips: ["c1700"] },
  {
    slug: "1800s",
    title: "The 1800s",
    strips: ["early1800", "spaniels", "mid1800", "late1800"],
  },
  { slug: "1900s", title: "The 1900s", strips: ["c1900"] },
];

export function eraPageBySlug(slug: string): EraPage | undefined {
  return ERA_PAGES.find((p) => p.slug === slug);
}
