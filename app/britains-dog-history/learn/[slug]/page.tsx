import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BreedStrip from "../../BreedStrip";
import { levelBreeds, levelBySlug, levelSlug } from "../../../../data/levels";
import styles from "../../[era]/era.module.css";

/* STRAIGHT INTO THE LEARN AREA, 24 September 2026 (owner). This is where the A
   to Z roller on the history page sends readers.

   WHAT THE READER SHOULD SEE: the chum rail down the right, the blue write-up
   about the dog, and the play and close controls. Not a running round, and not
   the per-level page with its dog counter and arrows. Both of those were tried
   first and both were wrong.

   THE OTHER TWO ROUTES ARE UNCHANGED and still exist. /play/<slug> runs the
   tunnel and drops into a round; /dog/<slug> is the shareable per-level page.
   Neither is what the roller links to.

   Below is the note from the /play route it was copied from, kept because the
   mechanics are identical apart from which flag is passed. */
/* STRAIGHT INTO THE GAME, 23 September 2026 (owner).

   THE DIFFERENCE. That page opens a level's START SCREEN and waits. Readers
   arriving from the roller did not realise a game was on offer at all and read
   the screen as more learning, so this route plays the time tunnel and then drops
   them into a running round. Closing it returns to the history page they came
   from, not to the era page.

   Everything else matches the per-level page: no header, footer, strip or text,
   a fresh run, and the heading kept for screen readers and search engines.
   Statically generated for the 98 known levels; anything else 404s. */

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

export default async function PlayLevelPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const b = levelBySlug(slug);
  if (!b) notFound();
  /* ?play (owner, 24 September 2026): skip the learn area and start the round a
     second after arrival, with no time tunnel. Any value, or none, counts.
     READING searchParams MAKES THIS PAGE RENDER PER REQUEST instead of being
     built ahead of time. The 98 slugs are still the only ones allowed. */
  const play = (await searchParams).play !== undefined;
  return (
    <main>
      <h1 className={styles.srOnly}>{b.name}</h1>
      <BreedStrip era={b.strip} initialLevel={b.name} autoLearn={!play} playOnArrival={play} closeHref="/britains-dog-history" />
    </main>
  );
}
