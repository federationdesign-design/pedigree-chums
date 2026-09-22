import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BreedStrip from "../BreedStrip";
import Nav from "../../../components/Nav/Nav";
import Footer from "../../../components/Footer/Footer";
import ArticleTextToggle from "../../../components/ArticleTextToggle/ArticleTextToggle";
import SeaLevelMap from "../../../components/SeaLevelMap/SeaLevelMap";
import DomesdayMap from "../../../components/DomesdayMap/DomesdayMap";
import DogTimeline from "../../../components/DogTimeline/DogTimeline";
import AncientFacts, { MEDIEVAL_FACTS } from "../../../components/AncientFacts/AncientFacts";
import PedigreeBoom from "../../../components/PedigreeBoom/PedigreeBoom";
import HistorySection from "../../../components/HistorySection/HistorySection";
import { ERA_INTRO } from "../../../data/eraIntros";
import { SECTIONS } from "../../../data/historySections";
import { ERA_PAGES, eraPageBySlug } from "./eraConfig";
import styles from "./era.module.css";
import hist from "../history.module.css";
import PopHeading from "../../../components/PopHeading/PopHeading";

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

  /* Site header, footer and the text colour toggle added 22 Sept 2026 at the
     owner's request, reversing the original "no Nav or Footer" call recorded in
     docs/social-pages/DECISIONS.md. The toggle sets data-pc-textinvert on this
     <main>, which the history page's text-toggle rules (history.module.css) use
     to flip the strip headings, breed names and write-up text to navy. */
  const cut = page.title.lastIndexOf(" ");
  const titleHead = cut > 0 ? page.title.slice(0, cut) : "";
  const titleTail = cut > 0 ? page.title.slice(cut + 1) : page.title;

  return (
    <>
      <Nav showLogo />
      <main className={styles.page}>
      {/* Visible h1 at the top. Replaces the visually hidden h1; on single-strip
          pages the matching label above the rail is hidden (owner request,
          22 Sept 2026). The 1800s page keeps its four sub-labels. */}
      {/* Matches the history index h1 (22 Sept 2026, owner request): same
          PopHeading, global .display (Luckiest Guy, drop shadow) and history
          .title size, with the last word in the lemon yellow as "history" is. */}
      <PopHeading as="h1" className={`display ${hist.title} ${styles.pageTitle}`}>
        {titleHead}
        {titleHead ? " " : ""}
        <span className="display-yellow">{titleTail}</span>
      </PopHeading>

      {/* Optional lead under the h1, in the history page's .lead style so the
          text toggle flips it (22 Sept 2026). Only Ancient has one so far. */}
      {page.intro && <p className={`${hist.lead} ${styles.pageLead}`}>{page.intro}</p>}

      <ArticleTextToggle centered />

      {/* Back link moved below the toggle so it no longer crowds the h1 (owner
          request, 22 Sept 2026; was the first item on the page). */}
      <div className={styles.backRow}>
        <Link href="/britains-dog-history" className={styles.back}>
          Back to Britain&apos;s dog history
        </Link>
      </div>

      {/* Ancient page only: map and timeline side by side on desktop, stacked
          below 1024px, at the top of the page above the strip (owner request,
          22 Sept 2026). */}
      {/* Medieval page only: Domesday land map at the top (22 Sept 2026). The
          forest-growth map is to follow alongside it. */}
      {page.slug === "medieval" && (
        <div className={`${styles.sectionHolder} ${styles.ancientBlock}`}>
          <DomesdayMap />
        </div>
      )}

      {page.slug === "ancient" && (
        <div className={`${styles.sectionHolder} ${styles.ancientBlock}`}>
          <div className={styles.pair}>
            <SeaLevelMap />
            <DogTimeline />
          </div>
        </div>
      )}

      {page.strips.map((strip) => {
        const section = sectionForStrip(strip);
        return (
          <div key={strip}>
            <BreedStrip era={strip} hideLabel={page.strips.length === 1} />
            {/* Ancient era only: the three fact boxes, above the Ancient Dogs write-up
                panel (owner request, 22 Sept 2026). The map and timeline moved to
                the top of the page, see above. */}
            {strip === "ancient" && (
              <div className={`${styles.sectionHolder} ${styles.ancientBlock}`}>
                {/* Three boxed facts from the social slides (22 Sept 2026). */}
                <AncientFacts />
              </div>
            )}
            {/* Medieval page: the same "Did you know?" boxes, medieval facts, above
                the write-up panel (owner request, 22 Sept 2026). */}
            {strip === "medieval" && (
              <div className={`${styles.sectionHolder} ${styles.ancientBlock}`}>
                <AncientFacts facts={MEDIEVAL_FACTS} />
              </div>
            )}
            {section && (
              <div className={styles.sectionHolder}>
                <HistorySection section={section} />
              </div>
            )}
            {/* 1800s page only, after the late-1800s strip: dog show boom chart and
                milestones (22 Sept 2026). */}
            {strip === "late1800" && (
              <div className={styles.sectionHolder}>
                <PedigreeBoom />
              </div>
            )}
          </div>
        );
      })}
      </main>
      <Footer />
    </>
  );
}
