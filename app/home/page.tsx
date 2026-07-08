import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import HomeClient from "./HomeClient";
import StepCards from "../../components/StepCards/StepCards";
import VideoSection from "./VideoSection";
import Footer from "../../components/Footer/Footer";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Pedigree Chums | The Dog Bingo Game",
  description:
    "Find your favourite dog breed and discover their family tree, history and personality. 54 illustrated breed cards for the on-the-go dog spotting game.",
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Nav />
      <HomeClient />

      {/* Video + 54 cards section - text left, video right */}
      <section className={styles.videoSection}>
        <div className={styles.textCol}>
          <h2 className={styles.cardsHeading}>
            54 Unique <span className={styles.cardsHeadingYellow}>Dog Cards</span>
          </h2>
          <p className={styles.cardsLead}>Each card includes:</p>
          <ul className={styles.cardsList}>
            <li className={styles.cardsPoint}>Breed traits and temperament</li>
            <li className={styles.cardsPoint}>Coat colours and markings</li>
            <li className={styles.cardsPoint}>Size and build</li>
            <li className={styles.cardsPoint}>Tell-tale identifiers</li>
            <li className={styles.cardsPoint}>Cute yet accurate illustrations</li>
            <li className={styles.cardsPoint}>Quick-reference stats</li>
          </ul>
        </div>
        <VideoSection />
      </section>

      <StepCards />

      <Footer />
    </div>
  );
}
