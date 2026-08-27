import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import CompetitionHero from "../../components/CompetitionHero/CompetitionHero";
import CompetitionIconRow from "../../components/CompetitionIconRow/CompetitionIconRow";
import CompetitionTitles from "../../components/CompetitionTitles/CompetitionTitles";
import CompetitionProductStrip from "../../components/CompetitionProductStrip/CompetitionProductStrip";
import CompetitionPreorder from "../../components/CompetitionPreorder/CompetitionPreorder";
import CompetitionVideoRow from "../../components/CompetitionVideoRow/CompetitionVideoRow";
import CompetitionTerms from "../../components/CompetitionTerms/CompetitionTerms";
import { spotYourChumTerms } from "../../components/CompetitionTerms/spotYourChumTerms";

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
  /** Internal link to this breed's page, for the icon-row spot mark (from config
      so next month is /chums/beagle, not hardcoded). */
  breedHref: string;
  /** <title> for the page. */
  seoTitle: string;
  /** Meta description. */
  seoDescription: string;
  /** Open Graph share image (1200x630): path + alt from config, so a new breed is
      a new image at a new path with no code change. */
  og: { src: string; alt: string };
  /** Hero (brief 4a): a landscape video/poster on desktop and a portrait pair on
      mobile, WIN ME and the breed name baked into the footage. Only one video is
      mounted at a time (see CompetitionHero). `still` forces poster-only. */
  hero: {
    desktop: { video: string; poster: string };
    mobile: { video: string; poster: string };
    alt: string;
    still?: boolean;
  };
  /** The two intro body lines beneath the "Have you spotted ..." question. */
  introLines: string[];
  /** Product image strip (brief 4d): the hand shot plus three product shots. */
  productStrip: {
    hand: { src: string; alt: string };
    shots: { src: string; alt: string }[];
  };
  /** Pre-order block (brief 4e): the full composed pre-order artwork. */
  preorder: { src: string; alt: string };
  /** THE PRIZE block (brief 4d, mobile): the winner-receives copy shown beneath
      the peeking carousel of product shots. */
  prize: { receives: string; lines: string[] };
  /** Vimeo IDs for the three-video row (after pre-order): from config so next
      month is three new IDs, nothing hardcoded in the component. */
  videos: string[];
};

const PUG: CompetitionConfig = {
  breed: "Pug",
  breedHref: "/chums/pug",
  seoTitle: "Spot your Chum Photo Competition: Pug",
  seoDescription:
    "Have you spotted a Pug? Get a photo or selfie and share it on Instagram or TikTok to win an exclusive 3D printed Chum figurine.",
  og: {
    src: "/competitions/pug/findpug-og.jpg",
    alt: "Win me: a blue 3D printed Pug figurine on a yellow podium labelled Pug, against blue and cream arches, with a WIN ME badge",
  },
  hero: {
    /* Desktop landscape pair and mobile portrait pair, both breed-specific, so a
       new breed is a new folder with the same filenames. video-start.mp4 is the
       ~3.6MB landscape re-encode (audio kept); portrait-advert.mp4 is the 1.9MB
       720p portrait (audio kept). Only one is downloaded per session; the poster
       shows at once and the chosen video autoplays after a 3s beat, holding on its
       final frame. `still` is the kill switch (Steve, 26 Aug 2026). */
    desktop: {
      video: "/competitions/pug/video-start.mp4",
      poster: "/competitions/pug/video-start.jpg",
    },
    mobile: {
      video: "/competitions/pug/portrait-advert.mp4",
      poster: "/competitions/pug/portrait-advert.jpg",
    },
    alt: "Win me: a blue 3D printed Pug figurine on a yellow podium labelled Pug, against blue and cream arches",
    still: false,
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
  preorder: {
    src: "/competitions/pug/pug-preorder.jpg",
    /* No printed measurements in the alt: the card's height/length/weight are
       stale (PLACEHOLDERS.md), so they are not repeated here. */
    alt: "Pre-order now: the Pedigree Chums Pug collectible pack at 6.99 pounds, RRP 9.99 pounds, showing the printed Pug character card and the boxed set on a yellow and blue set",
  },
  prize: {
    receives: "The winner receives:",
    lines: [
      "1 exclusive 3D printed Chum Figurine*",
      "Free delivery to one UK address",
    ],
  },
  videos: ["1221597431", "1221597430", "1221597429"],
};

export const metadata: Metadata = {
  title: PUG.seoTitle,
  description: PUG.seoDescription,
  /* Per-page OG image (1200x630) overriding the site-wide default in layout.tsx.
     Path and alt come from the config, so next month's breed is a new image with
     no code change. */
  openGraph: {
    images: [{ url: PUG.og.src, width: 1200, height: 630, alt: PUG.og.alt }],
  },
};

export default function FindPugPage() {
  return (
    <>
      {/* contrastKeyline: white ring around the accessibility toolbar so it stays
          legible over the hero video (findpug only; gated in Nav). */}
      <Nav contrastKeyline />
      <main>
        {/* Stage 6: hero video (WIN ME and breed name baked in). */}
        <CompetitionHero
          desktop={PUG.hero.desktop}
          mobile={PUG.hero.mobile}
          alt={PUG.hero.alt}
          still={PUG.hero.still}
        />
        {/* Icon row (4b): spot, Snap, logo, TikTok, Instagram. Sits on the same
            yellow field as the titles below. */}
        <CompetitionIconRow breedHref={PUG.breedHref} breedName={PUG.breed} />
        {/* Stage 3 added the titles + intro (4c). */}
        <CompetitionTitles breed={PUG.breed} introLines={PUG.introLines} />
        {/* Stage 4: desktop product image strip. */}
        <CompetitionProductStrip hand={PUG.productStrip.hand} shots={PUG.productStrip.shots} prize={PUG.prize} />
        {/* Pre-order block (4e): full-width composed artwork. */}
        <CompetitionPreorder src={PUG.preorder.src} alt={PUG.preorder.alt} />
        {/* Three Vimeo clips between the pre-order block and the terms. */}
        <CompetitionVideoRow videos={PUG.videos} />
        <CompetitionTerms terms={spotYourChumTerms(PUG.breed)} />
      </main>
      <Footer />
    </>
  );
}
