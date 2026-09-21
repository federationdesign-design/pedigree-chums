import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BreedStrip from "../../BreedStrip";
import { ERA_PAGES } from "../../[era]/eraConfig";
import { levelBreeds, levelBySlug, levelSlug } from "../../../../data/levels";
import styles from "../../[era]/era.module.css";

/* ONE PAGE PER LEVEL, 20 September 2026 (owner: a URL to share for each level).
   /britains-dog-history/dog/turnspit-dog and so on, 98 of them.

   WHAT A VISITOR SEES. The level's START SCREEN and nothing else: no site header
   or footer, no strip, no text. The tunnel is skipped and the round is not
   started. Closing the level goes to that dog's era page.

   A FRESH RUN. Score, lives and the chum tally live in BreedStrip and begin at
   zero here, which is right for a shared link.

   STAGE 1 ONLY. The title and description are built from data already held. The
   embellished copy, the sitemap entry and the URL following in-game navigation
   are later stages.

   Statically generated for the 98 known levels; anything else 404s. */

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams(): { slug: string }[] {
  return levelBreeds().map((b) => ({ slug: levelSlug(b.name) }));
}

export const dynamicParams = false;

// The era page whose strips include this level's strip, for the back link.
function eraPageFor(strip: string) {
  return ERA_PAGES.find((p) => p.strips.includes(strip));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const b = levelBySlug(slug);
  if (!b) return { title: "Level Not Found" };
  const era = eraPageFor(b.strip);
  const title = `${b.name} | Britain's Dog History`;
  const description = b.note
    ? b.note
    : `Play the ${b.name} level of Pedigree Chums and trace its ancestry${era ? ` through ${era.title}` : ""}.`;
  return {
    title,
    description,
    alternates: { canonical: `/britains-dog-history/dog/${slug}` },
    openGraph: { title, description },
  };
}

export default async function LevelPage({ params }: Props) {
  const { slug } = await params;
  const b = levelBySlug(slug);
  if (!b) notFound();
  const era = eraPageFor(b.strip);

  /* THE GAME AND NOTHING ELSE (owner, 20 September 2026). No back link and no era
     strip underneath. Closing the level goes to this dog's era page, which is
     where the back link would have taken them.

     THE HEADING STAYS, visually hidden. It costs nothing on screen and it is what
     tells a screen reader, and a search engine, which dog this page is. */
  const back = era ? `/britains-dog-history/${era.slug}` : "/britains-dog-history";
  return (
    <main>
      <h1 className={styles.srOnly}>{b.name}</h1>
      <BreedStrip era={b.strip} initialLevel={b.name} closeHref={back} />
    </main>
  );
}
