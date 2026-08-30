import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import PressCarousel from "./PressCarousel";
import styles from "./page.module.css";

/* Press pack, /press. Shell only (29 August 2026): the light-themed click-through
   carousel with previous/next, keyboard arrows and a position indicator, filled
   with PLACEHOLDER slides so the pacing can be felt on a phone before content
   lands. Same full-viewport, footer-suppressed shape as the superpower and
   britains-dog-history-2 carousels, but on the light page gradient rather than a
   dark ground.

   robots is index:false while this is a placeholder shell; flip to indexed when
   the real content lands (a press pack should be indexed, per the brief). */

export const metadata: Metadata = {
  title: "Press pack: Pug has escaped",
  description:
    "A click-through press pack for the Pedigree Chums Find Pug campaign.",
  robots: { index: false, follow: false },
};

export default function PressPage() {
  return (
    <>
      {/* showLogo: the logo shows on every screen, not only on scroll (owner round 2). */}
      <Nav showLogo />
      <main className={styles.page}>
        <PressCarousel />
      </main>
      {/* Footer hidden, not removed: a footer below a 100dvh carousel makes the
          document a second vertical scroller, which breaks 100dvh on mobile
          Safari as the bars collapse. Kept in the markup for crawlers and for a
          later desktop layout. Same fix as superpower and history-2. */}
      <div className={styles.footerOff}>
        <Footer />
      </div>
    </>
  );
}
