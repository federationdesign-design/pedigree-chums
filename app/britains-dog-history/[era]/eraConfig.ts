/* Per-era social pages: the seven share-only routes under
   /britains-dog-history/[era]. Additive only, the history index page is not
   touched. See docs/social-pages/BRIEF.md and docs/social-pages/DECISIONS.md.

   Each page is a thin wrapper that reuses the existing BreedStrip slider and the
   existing era intro copy (data/eraIntros.ts). No new copywriting: titles are
   derived from the era name, descriptions from the strips' existing notes.

   `strips` are the uk-breeds `strip` keys, in the order they appear on the
   history page today. Six pages carry one strip; the 1800s page stacks all
   four of its 1800s-region strips (early1800, spaniels, mid1800, late1800),
   per Steve's call on 13 August 2026. The crosses page was added on
   14 August 2026. */

export type EraPage = {
  slug: string;
  title: string; // page <title> and displayed heading, derived from the era name
  strips: string[]; // uk-breeds strip keys, in history-page order
  intro?: string; // optional lead paragraph under the h1 (added 22 Sept 2026)
};

export const ERA_PAGES: EraPage[] = [
  {
    slug: "ancient",
    title: "Ancient Times",
    strips: ["ancient"],
    /* Owner request, 22 Sept 2026. Dogger Bank is named after doggers, medieval
       Dutch cod-fishing boats (Wikipedia: Dogger Bank; Dogger (boat)). */
    intro:
      "In ancient times, Britain was not an island. It was connected to mainland Europe by Doggerland. But we are sorry to report that Doggerland has nothing to do with dogs! It is named after the Dogger Bank in the North Sea, which got its name from doggers, the medieval Dutch fishing boats that sailed there to catch cod.",
  },
  {
    slug: "medieval",
    title: "Medieval Times",
    strips: ["medieval"],
    /* Owner request, 22 Sept 2026 (option A: the accurate 1066 story; the 1688
       "invitation" story belongs to William III, not the Conqueror). Sources:
       English Heritage and History.com on 1066; forest-law restrictions per
       History Hit and encyclopedia.com "forest laws". */
    intro:
      "In 1066 William, Duke of Normandy, sailed to England, saying the old king had promised him the crown. He won the Battle of Hastings, took the throne and became known as William the Conqueror. He also turned huge areas into royal forests for his own hunting, so families who had always gathered firewood, found food and grazed their animals there were suddenly breaking the law.",
  },
  /* Renamed from "Tudor Times" (owner, 22 Sept 2026): the strip covers the 1500s
     AND 1600s. Slug kept as "tudor" so shared links still work. */
  { slug: "tudor", title: "Tudor 'n' Stuart Times", strips: ["c1500"] },
  { slug: "1700s", title: "The 1700s", strips: ["c1700"] },
  {
    slug: "1800s",
    title: "The 1800s",
    strips: ["early1800", "spaniels", "mid1800", "late1800"],
  },
  { slug: "1900s", title: "The 1900s", strips: ["c1900"] },
  { slug: "crosses", title: "Today's Crossbreeds", strips: ["crosses"] },
];

export function eraPageBySlug(slug: string): EraPage | undefined {
  return ERA_PAGES.find((p) => p.slug === slug);
}
