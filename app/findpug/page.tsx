import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
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
};

const PUG: CompetitionConfig = {
  breed: "Pug",
  seoTitle: "Spot your Chum Photo Competition: Pug",
  seoDescription:
    "Have you spotted a Pug? Get a photo or selfie and share it on Instagram or TikTok to win an exclusive 3D printed Chum figurine.",
};

export const metadata: Metadata = {
  title: PUG.seoTitle,
  description: PUG.seoDescription,
};

export default function FindPugPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero, titles and intro, product strip, THE PRIZE and PRE-ORDER
            land in later stages. Stage 2 proves the route and the terms. */}
        <CompetitionTerms />
      </main>
      <Footer />
    </>
  );
}
