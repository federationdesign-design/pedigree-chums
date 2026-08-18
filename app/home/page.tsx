import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import HomeClient from "./HomeClient";
import VideoSection from "./VideoSection";
import FAQ from "../../components/FAQ/FAQ";
import HowItPlays from "../../components/HowItPlays/HowItPlays";
import Footer from "../../components/Footer/Footer";
import styles from "./home.module.css";

export const metadata: Metadata = {
  /* THIS IS THE HOMEPAGE, whatever the address says. `/` is the splash: the pit
     tipping out, with almost no text on it. Everything a stranger needs to read
     is here, so this page carries the title that describes the product.

     `absolute` bypasses the site template. Without it this would render as
     "The Dog Spotting Card Game | Pedigree Chums™ The Dog Bingo Game", which
     says the same thing twice and pushes the useful half off the end of a
     search result. */
  title: { absolute: "Pedigree Chums™ | The Dog Spotting Card Game" },
  description:
    "Find your favourite dog breed and discover their family tree, history and personality. 54 illustrated breed cards for the on-the-go dog spotting game.",
};

export default function HomePage() {
  return (
    <main className={styles.page}>
      <Nav />
      <HomeClient />

      {/* FAQ sits directly below the product area */}
      <div className={styles.divider} />
      <FAQ />

      {/* Video + 54 cards section - text left, video right */}
      <section className={styles.videoSection}>
        <div className={styles.textCol}>
          <h2 className={styles.cardsHeading}>
            54 Unique <span className={styles.cardsHeadingYellow}>Dog Cards</span>
          </h2>
          <p className={styles.cardsLead}>Each card includes:</p>
          <ul className={styles.cardsList}>
            <li className={styles.cardsPoint}>Breed traits</li>
            <li className={styles.cardsPoint}>Temperament examples</li>
            <li className={styles.cardsPoint}>Coat colours and markings</li>
            <li className={styles.cardsPoint}>Size and build</li>
            <li className={styles.cardsPoint}>Tell-tale identifiers</li>
            <li className={styles.cardsPoint}>Cute yet accurate illustrations</li>
            <li className={styles.cardsPoint}>Quick-reference stats</li>
          </ul>
        </div>
        <VideoSection />
      </section>

      {/* Video-gated "How it plays" scroll sequence with the bento at its foot */}
      <HowItPlays />

      <Footer />
    </main>
  );
}
