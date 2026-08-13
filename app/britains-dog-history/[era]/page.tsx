import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BreedStrip from "../BreedStrip";
import HistorySection from "../../../components/HistorySection/HistorySection";
import { ERA_INTRO } from "../../../data/eraIntros";
import { SECTIONS } from "../../../data/historySections";
import { ERA_PAGES, eraPageBySlug } from "./eraConfig";
import styles from "./era.module.css";

/* The write-up panel for a strip: the same section that sits above this strip on
   the history page, matched by era. "Dogs in the armed forces" shares era c1500
   with "Tudor Britain" and is the one the history page itself filters out, so it
   is excluded here too. */
const sectionForStrip = (strip: string) =>
  SECTIONS.find((s) => s.era === strip && s.title !== "Dogs in the armed forces");

/* The six per-era social pages: /britains-dog-history/[era]. Share-only and
   unlisted, one era each, purely additive. The history index page is untouched.
   See docs/social-pages/BRIEF.md and docs/social-pages/DECISIONS.md.

   Each page is a back link plus the era's slider(s). The slider is the exact
   BreedStrip the history page uses, including its own era heading (stripLabel),
   so the heading treatment matches the history page with nothing reinterpreted.
   The 1800s page stacks its four 1800s-region strips.

   Statically generated for the six known slugs only; anything else 404s. */

type Props = { params: Promise<{ era: string }> };

export function generateStaticParams(): { era: string }[] {
  return ERA_PAGES.map((p) => ({ era: p.slug }));
}

export const dynamicParams = false;

/* Metadata derived from the era name (title) and the strips' existing intro
   notes (description), for SEO only; the notes are not shown on the page. No new
   copywriting: a page whose strips carry no note falls back to the era title. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { era } = await params;
  const page = eraPageBySlug(era);
  if (!page) return { title: "Era Not Found" };
  const desc = page.strips
    .map((s) => ERA_INTRO[s]?.note)
    .filter(Boolean)
    .join(" ");
  return {
    title: page.title,
    description: desc || page.title,
  };
}

export default async function EraPage({ params }: Props) {
  const { era } = await params;
  const page = eraPageBySlug(era);
  if (!page) notFound();

  return (
    <main className={styles.page}>
      <Link href="/britains-dog-history" className={styles.back}>
        Back to Britain&apos;s dog history
      </Link>

      {/* The visible era heading is BreedStrip's own stripLabel, a <span>, to
          match the history page exactly. This visually hidden h1 gives the page
          a real heading for screen readers and search, without altering the
          visual match. */}
      <h1 className={styles.srOnly}>{page.title}</h1>

      {page.strips.map((strip) => {
        const section = sectionForStrip(strip);
        return (
          <div key={strip}>
            <BreedStrip era={strip} />
            {section && (
              <div className={styles.sectionHolder}>
                <HistorySection section={section} />
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}
