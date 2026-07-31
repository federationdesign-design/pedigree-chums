import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import HistoryCarousel from "./HistoryCarousel";
import styles from "./history2.module.css";

export const metadata: Metadata = {
  title: "Britain's Dog History",
  description:
    "How Britain became a nation of dog lovers: from working dogs and war mascots to Greyfriars Bobby, Crufts and the Victorian pet boom, right up to today's designer crossbreeds.",
  // Version 2 is a working draft alongside the live page. It must not be
  // indexed while both exist, or the two compete for the same queries.
  robots: "noindex",
};

/* Version 2 of /britains-dog-history, the horizontal carousel. The carousel
   itself, its slide-sequencing logic and its inline script now live in
   HistoryCarousel, which is ALSO rendered by the merged /britains-dog-history
   page under 721px, so the two routes cannot drift while both exist. */

export default function HistoryV2Page() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.page}>
        <HistoryCarousel />
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
