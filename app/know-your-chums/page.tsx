import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import PopHeading from "../../components/PopHeading/PopHeading";
import BreedStats from "./BreedStats";
import ChumExplorer from "./ChumExplorer";
import styles from "./know.module.css";

export const metadata: Metadata = {
  title: "Know Your Chums — Britain's Best-Loved Dog Breeds",
  description:
    "Your field guide to Britain's favourite dogs: the facts, the most popular breeds, and the chums in the pack — what they look like, how they behave, and how to spot them.",
};

// Verified facts. Sources: PDSA PAW Report, UK Pet Food, RVC VetCompass,
// Guinness World Records. Population estimates vary by source, so the
// headline figure is given as a range.
const FACTS: { hero: string; label: string }[] = [
  { hero: "11–13m", label: "dogs in the UK today — and the number keeps rising" },
  { hero: "8.2m", label: "dogs back in 2011; ownership has climbed ever since" },
  { hero: "99%", label: "of owners say their dog is one of the family" },
  { hero: "3.2m", label: "households welcomed a new pet during the pandemic" },
  { hero: "24", label: "puppies in Britain's record-breaking litter, born in 2004" },
  { hero: "22,742", label: "dogs at the world's largest dog walk, in South Shields" },
  { hero: "1859", label: "the year Britain held its first ever dog show, in Newcastle" },
  { hero: "Dash", label: "Queen Victoria's spaniel, who helped make pet dogs the fashion" },
  { hero: "Law", label: "microchipping has been a legal requirement for UK dogs since 2016" },
];

export default function KnowYourChums() {
  return (
    <>
      <Nav />
      <main>
        {/* Intro */}
        <section className={styles.intro}>
          <PopHeading className={`display ${styles.title}`}>
            Know your <span className="display-yellow">chums</span>
          </PopHeading>
          <p className={styles.lead}>
            Britain is a nation of dog lovers, and the pack celebrates our
            favourites. Here are the facts, the most popular breeds of the moment,
            and every chum in the pack — what they look like, how they behave, and
            how to spot them in the wild.
          </p>
        </section>

        {/* Britain's dog facts — 3x3 panel */}
        <section className={styles.factsPanel}>
          <h2 className={`display ${styles.panelTitle}`}>
            Britain&apos;s <span className="display-yellow">dog facts</span>
          </h2>
          <div className={styles.factGrid}>
            {FACTS.map((f, i) => (
              <div key={i} className={styles.fact}>
                <span className={styles.factHero}>{f.hero}</span>
                <span className={styles.factLabel}>{f.label}</span>
              </div>
            ))}
          </div>
          <p className={styles.source}>
            Sources: PDSA, UK Pet Food, RVC VetCompass and Guinness World Records.
            Population figures are estimates and vary by source.
          </p>
        </section>

        {/* Animated breed-popularity bars */}
        <BreedStats />

        {/* Search + themed rows */}
        <ChumExplorer />
      </main>
      <Footer />
    </>
  );
}
