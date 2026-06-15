import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import PopHeading from "../../components/PopHeading/PopHeading";
import BreedStats from "./BreedStats";
import ChumExplorer from "./ChumExplorer";
import styles from "./know.module.css";

export const metadata: Metadata = {
  title: "Know Your Chums: Britain's Best-Loved Dog Breeds",
  description:
    "Your field guide to Britain's favourite dogs: the facts, the most popular breeds, and the chums in the pack: what they look like, how they behave, and how to spot them.",
};

// Verified facts. Sources: PDSA PAW Report, UK Pet Food, RVC VetCompass,
// Guinness World Records. Population estimates vary by source, so the
// headline figure is given as a range.
type IconKey = "crown" | "family" | "microchip" | "tent";

const ICONS: Record<IconKey, React.ReactNode> = {
  crown: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7l4.5 3.4L12 3.6l4.5 6.8L21 7l-1.9 11H4.9L3 7zm1.9 12.4h14.2V22H4.9z" />
    </svg>
  ),
  family: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.3 2.8a2.3 2.3 0 110 4.6 2.3 2.3 0 010-4.6zm9.4 0a2.3 2.3 0 110 4.6 2.3 2.3 0 010-4.6zM4 21.2v-7.4a3.3 3.3 0 016.6 0v7.4H8.7v-5.2H7.9v5.2H4zm9.4 0v-7.4a3.3 3.3 0 016.6 0v7.4h-1.9v-5.2h-.8v5.2h-3.9z" />
    </svg>
  ),
  microchip: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M6 6h12v12H6V6zm3 3v6h6V9H9z" />
      <path d="M9 1.5h2v3H9zM13 1.5h2v3h-2zM9 19.5h2v3H9zM13 19.5h2v3h-2zM1.5 9h3v2h-3zM1.5 13h3v2h-3zM19.5 9h3v2h-3zM19.5 13h3v2h-3z" />
    </svg>
  ),
  tent: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 1.5h2V4l3 1-3 1V4h-2z" />
      <path d="M12 5C7.3 5 3.4 7.6 2 11.3h20C20.6 7.6 16.7 5 12 5z" />
      <path d="M2 11.3l2.8 10.2H9l1-8.2h4l1 8.2h4.2L22 11.3l-5 1-5-1-5 1z" />
    </svg>
  ),
};

const FACTS: { hero: string; label: string; icon?: IconKey }[] = [
  { hero: "11\u201313m", label: "dogs in the UK today, and the number keeps rising" },
  { hero: "8.2m", label: "dogs back in 2011; ownership has climbed ever since" },
  { hero: "99%", label: "of owners say their dog is one of the family", icon: "family" },
  { hero: "3.2m", label: "households welcomed a new pet during the pandemic" },
  { hero: "24", label: "puppies in Britain's record-breaking litter, born in 2004" },
  { hero: "22,742", label: "dogs at the world's largest dog walk, in South Shields" },
  { hero: "1859", label: "the year Britain held its first ever dog show, in Newcastle", icon: "tent" },
  { hero: "Dash", label: "Queen Victoria's spaniel, who helped make pet dogs the fashion", icon: "crown" },
  { hero: "Law", label: "microchipping has been a legal requirement for UK dogs since 2016", icon: "microchip" },
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
            and every chum in the pack: what they look like, how they behave, and
            how to spot them in the wild.
          </p>
        </section>

        {/* Britain's dog facts: 3x3 panel */}
        <section className={styles.factsPanel}>
          <h2 className={`display ${styles.panelTitle}`}>
            Britain&apos;s <span className="display-yellow">dog facts</span>
          </h2>
          <div className={styles.factGrid}>
            {FACTS.map((f, i) => (
              <div key={i} className={styles.fact}>
                {f.icon && <span className={styles.factIcon}>{ICONS[f.icon]}</span>}
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
