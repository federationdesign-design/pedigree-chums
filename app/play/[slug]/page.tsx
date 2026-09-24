import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BreedStrip from "../../britains-dog-history/BreedStrip";
import { breeds } from "../../../data/breeds";
import { stripCardFor } from "../../../data/levels";
import styles from "../../britains-dog-history/[era]/era.module.css";
import PlayIntro from "./PlayIntro";
import { INTRO_VIDEOS } from "../../../data/playIntros";

// The chums with an intro clip. See data/playIntros.ts.

/* A CHUM'S GAME ON ITS OWN PAGE, 24 September 2026 (owner).

   WHY IT EXISTS. /chums/<slug>?play opened the game over the chum page, and the
   desktop chum page makes the whole document 2244px wide for its sideways
   diagram. A phone, or a phone preview, widened its viewport to fit, so the pit
   measured a desktop and showed one corner of it. Suspending the rule while the
   game was open did not cure it. This page never loads the chum page at all, so
   there is nothing wide for the pit to measure.

   WHAT IT DOES. The same as /britains-dog-history/learn/<slug>?play: straight onto
   the play screen at the easiest difficulty, the circles falling a second later,
   no time tunnel. It always plays, so ?play on the end is welcome but not needed.
   Closing it goes to the dog's chum page.

   One page per chum in the pack, built ahead of time; any other slug is a 404. */

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams(): { slug: string }[] {
  return breeds.map((b) => ({ slug: b.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const b = breeds.find((x) => x.slug === slug);
  if (!b) return { title: "Chum Not Found" };
  const title = `Play ${b.name} | Pedigree Chums`;
  const description = `Play the ${b.name} and trace its ancestry.`;
  return {
    title,
    description,
    alternates: { canonical: `/chums/${slug}` },
    openGraph: { title, description },
  };
}

export default async function PlayChumPage({ params }: Props) {
  const { slug } = await params;
  const b = breeds.find((x) => x.slug === slug);
  if (!b) notFound();
  return (
    <main>
      <h1 className={styles.srOnly}>{b.name}</h1>
      <PlayIntro video={INTRO_VIDEOS[slug]}>
        <BreedStrip era={stripCardFor(b.name).strip} initialLevel={b.name} playOnArrival closeHref={`/chums/${slug}`} />
      </PlayIntro>
    </main>
  );
}
