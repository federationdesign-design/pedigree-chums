import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import CompetitionHero from "../../components/CompetitionHero/CompetitionHero";
import CompetitionIconRow from "../../components/CompetitionIconRow/CompetitionIconRow";
import CompetitionTitles from "../../components/CompetitionTitles/CompetitionTitles";
import CompetitionProductStrip from "../../components/CompetitionProductStrip/CompetitionProductStrip";
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
  /** Hero video (brief 4a): WIN ME badge and breed name are baked into it.
      `still` forces the poster and skips the video (see the note on PUG.hero). */
  hero: { video: string; poster: string; alt: string; still?: boolean };
  /** The two intro body lines beneath the "Have you spotted ..." question. */
  introLines: string[];
  /** Product image strip (brief 4d): the hand shot plus three product shots. */
  productStrip: {
    hand: { src: string; alt: string };
    shots: { src: string; alt: string }[];
  };
};

const PUG: CompetitionConfig = {
  breed: "Pug",
  seoTitle: "Spot your Chum Photo Competition: Pug",
  seoDescription:
    "Have you spotted a Pug? Get a photo or selfie and share it on Instagram or TikTok to win an exclusive 3D printed Chum figurine.",
  hero: {
    video: "/competitions/pug/video-start.mp4",
    poster: "/competitions/pug/video-start.jpg",
    alt: "Win me: a blue 3D printed Pug figurine on a yellow podium labelled Pug, against blue and cream arches",
    /* Poster only for now. The supplied video-start.mp4 export is the wrong cut:
       the clean hero holds for ~1.8s, then it runs into behind-the-scenes studio
       footage (a presenter, softbox lights, the set edge) before a pre-order
       reveal, none of which is a hero. The file and path stay wired; when the
       correct hero export replaces video-start.mp4, set still to false (or drop
       this line) and motion returns with no code change (Steve, 26 Aug 2026). */
    still: true,
  },
  introLines: [
    "Get a photo or selfie and share it on Instagram or TikTok.",
    "This month, we will collect all submitted images and do a tombola raffle.",
  ],
  productStrip: {
    hand: {
      src: "/competitions/pug/hand.png",
      alt: "A hand holding the small blue 3D printed Pug figurine, showing how it fits in the palm",
    },
    shots: [
      {
        src: "/competitions/pug/blue-orig1.jpg",
        alt: "The blue 3D printed Pug figurine facing forward, sitting",
      },
      {
        src: "/competitions/pug/blue-orig2.jpg",
        alt: "The blue 3D printed Pug figurine from a three-quarter angle",
      },
      {
        src: "/competitions/pug/blue-orig3.jpg",
        alt: "The blue 3D printed Pug figurine turned slightly to one side",
      },
    ],
  },
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
        {/* Stage 6: hero video (WIN ME and breed name baked in). */}
        <CompetitionHero
          video={PUG.hero.video}
          poster={PUG.hero.poster}
          alt={PUG.hero.alt}
          still={PUG.hero.still}
        />
        {/* Icon row (4b): spot, Snap, logo, TikTok, Instagram. Sits on the same
            yellow field as the titles below. */}
        <CompetitionIconRow />
        {/* Stage 3 added the titles + intro (4c). */}
        <CompetitionTitles breed={PUG.breed} introLines={PUG.introLines} />
        {/* Stage 4: desktop product image strip. */}
        <CompetitionProductStrip hand={PUG.productStrip.hand} shots={PUG.productStrip.shots} />
        {/* THE PRIZE and PRE-ORDER land in later stages. */}
        <CompetitionTerms />
      </main>
      <Footer />
    </>
  );
}
