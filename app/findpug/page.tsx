import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import CompetitionTitles from "../../components/CompetitionTitles/CompetitionTitles";
import CompetitionTerms from "../../components/CompetitionTerms/CompetitionTerms";

/* Spot your Chum competition page, first of the per-breed series (/findpug,
   /findbeagle and so on). Every breed-specific value lives in the config object
   below, the same pattern as the HERO/ARTICLES objects on the Dogs at Work
   pages. A new breed next month is a new route folder with a new config object
   and its own images: nothing else.

   Stage 2 (25 Aug 2026): route shell and terms only. No hero imagery yet. The
   visual sections (hero, titles and intro, product strip, THE PRIZE, PRE-ORDER)
   land in later stages, at which point the shared layout will be lifted into a
   CompetitionPage shell fed by this config. CONFIG grows one field group per
   stage; it holds only real, supplied values (never invented copy, prices or
   asset paths). */

type CompetitionConfig = {
  /** Breed name, as printed in copy, titles and the podium. */
  breed: string;
  /** <title> for the page. */
  seoTitle: string;
  /** Meta description. */
  seoDescription: string;
  /** The two intro body lines beneath the "Have you spotted ..." question. */
  introLines: string[];
};

const PUG: CompetitionConfig = {
  breed: "Pug",
  seoTitle: "Spot your Chum Photo Competition: Pug",
  seoDescription:
    "Have you spotted a Pug? Get a photo or selfie and share it on Instagram or TikTok to win an exclusive 3D printed Chum figurine.",
  introLines: [
    "Get a photo or selfie and share it on Instagram or TikTok.",
    "This month, we will collect all submitted images and do a tombola raffle.",
  ],
};

export const metadata: Metadata = {
  title: PUG.seoTitle,
  description: PUG.seoDescription,
  /* Noindex while the page is half-built (terms only, no prize or entry info).
     Lifted, along with the sitemap listing, only after the accessibility pass
     when the page is finished (Steve, 25 Aug 2026). */
  robots: { index: false, follow: false },
};

export default function FindPugPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero (4a) and the icon row (4b) land in later stages, once the
            supplied assets arrive. Stage 3 adds the titles + intro (4c). */}
        <CompetitionTitles breed={PUG.breed} introLines={PUG.introLines} />
        {/* Product strip, THE PRIZE and PRE-ORDER land in later stages. */}
        <CompetitionTerms />
      </main>
      <Footer />
    </>
  );
}
