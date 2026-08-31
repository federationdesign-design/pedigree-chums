import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import HistoryVertical from "./vertical/HistoryVertical";
import styles from "./vertical/vertical.module.css";

export const metadata: Metadata = {
  title: "Britain's Dog History (Carousel)",
  description:
    "How Britain became a nation of dog lovers: from working dogs and war mascots to Greyfriars Bobby, Crufts and the Victorian pet boom, right up to today's designer crossbreeds.",
  // Version 2 is a working draft alongside the live page. It must not be
  // indexed while both exist, or the two compete for the same queries.
  robots: "noindex",
};

/* Version 2 of /britains-dog-history. THE TEST BED FOR THE VERTICAL REBUILD.

   31 August 2026: this route was repointed from ../HistoryCarousel to the
   forked ./vertical copy. The reason is in the banner on vertical/
   HistoryVertical.tsx: HistoryCarousel and history2.module.css are rendered by
   the LIVE page under 721px, so they cannot be edited while the vertical
   layout is being built and tested on a phone.

   Stage 1 changed nothing but the copy, so this page should look and behave
   exactly as it did. The axis flip is stage 2.

   Still noindex, still linked from nowhere. When the rebuild lands, the live
   page moves onto HistoryVertical and the horizontal component is deleted, so
   the two routes go back to sharing one component and cannot drift. */

export default function HistoryV2Page() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.page}>
        <HistoryVertical />
      </main>
      {/* Kept in the markup, taken out of the layout. See .footerOff: it was
          the only element adding height below the 100dvh wrap, which made the
          document a second vertical scroller and let a drag inside the dog run
          chain out to it. */}
      <div className={styles.footerOff}>
        <Footer />
      </div>
    </>
  );
}
