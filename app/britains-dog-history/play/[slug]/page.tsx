import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BreedStrip from "../../BreedStrip";
import { levelBreeds, levelBySlug, levelSlug } from "../../../../data/levels";
import styles from "../../[era]/era.module.css";

/* STRAIGHT INTO THE GAME, 23 September 2026 (owner). The A to Z roller on the
   history page sends readers here rather than to /britains-dog-history/dog/<slug>.

   THE DIFFERENCE. That page opens a level's START SCREEN and waits. Readers
   arriving from the roller did not realise a game was on offer at all and read
   the screen as more learning, so this route plays the time tunnel and then drops
   them into a running round. Closing it returns to the history page they came
   from, not to the era page.

   Everything else matches the per-level page: no header, footer, strip or text,
   a fresh run, and the heading kept for screen readers and search engines.
   Statically generated for the 98 known levels; anything else 404s. */

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams(): { slug: string }[] {
  return levelBreeds().map((b) => ({ slug: levelSlug(b.name) }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const b = levelBySlug(slug);
  if (!b) return { title: "Level Not Found" };
  const title = `Play ${b.name} | Britain's Dog History`;
  const description = b.note ? b.note : `Play the ${b.name} level of Pedigree Chums and trace its ancestry.`;
  return {
    title,
    description,
    alternates: { canonical: `/britains-dog-history/dog/${slug}` },
    openGraph: { title, description },
  };
}

export default async function PlayLevelPage({ params }: Props) {
  const { slug } = await params;
  const b = levelBySlug(slug);
  if (!b) notFound();
  return (
    <main>
      <h1 className={styles.srOnly}>{b.name}</h1>
      <BreedStrip era={b.strip} initialLevel={b.name} autoPlay closeHref="/britains-dog-history" />
    </main>
  );
}
