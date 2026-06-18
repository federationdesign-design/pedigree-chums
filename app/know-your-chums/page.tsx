import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import PopHeading from "../../components/PopHeading/PopHeading";
import Triangles, { type Tri } from "../../components/Parallax/Triangles";
import Announce from "../../components/Announce/Announce";
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
type IconKey = "crown" | "home" | "microchip" | "tent" | "uk" | "trend" | "virus" | "bottle";

const ICONS: Record<IconKey, React.ReactNode> = {
  crown: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7l4.5 3.4L12 3.6l4.5 6.8L21 7l-1.9 11H4.9L3 7zm1.9 12.4h14.2V22H4.9z" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.6L1.8 11l1.5 1.8L4 12.3V21h6v-5h4v5h6v-8.7l.7.5L22.2 11 12 2.6z" />
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
  uk: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 2l-1.2 2.4 1.6 1.7-2.3.6-1 2.2-1.6-1.3-2 .7.4-2.4-1.7-1.2 2.3-.9.3-2 1.9 1.1L11 2.4l1.5 1.3L14.5 2zM6.2 9.6l2 .6-.4 2.3 1.9 1.4-.7 2.2 2.3.2.6 2.3 1.8-1.5 2.2.8-.2-2.4 1.9-1.4-1.6-1.7 2-1.2-2.1-1.1.2-2.3-2.2.7-1.5-1.8-1.4 1.9-2.3-.3-.7 2-2 .6.3 2.4z" />
    </svg>
  ),
  trend: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 17.5l6-6 4 4 6-6V5h-5l2.3 2.3-3.3 3.3-4-4L2 14.5z" />
    </svg>
  ),
  virus: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 1h2v3.1a7 7 0 012.5 1l2.2-2.2 1.4 1.4-2.2 2.2a7 7 0 011 2.5H21v2h-3.1a7 7 0 01-1 2.5l2.2 2.2-1.4 1.4-2.2-2.2a7 7 0 01-2.5 1V23h-2v-3.1a7 7 0 01-2.5-1l-2.2 2.2-1.4-1.4 2.2-2.2a7 7 0 01-1-2.5H1v-2h3.1a7 7 0 011-2.5L2.9 6.3l1.4-1.4 2.2 2.2a7 7 0 012.5-1V1zm1 6a5 5 0 100 10 5 5 0 000-10z" />
    </svg>
  ),
  bottle: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 1h6v2l-1 1v2.2c1.8.9 3 2.7 3 4.8v9a2 2 0 01-2 2H9a2 2 0 01-2-2v-9c0-2.1 1.2-3.9 3-4.8V4L9 3V1zm-1 12h8v-1H8v1zm0 3h8v-1H8v1z" />
    </svg>
  ),
};

const FACTS: { hero: string; label: string; icon?: IconKey }[] = [
  { hero: "11\u201313m", label: "dogs in the UK today, and the number keeps rising" },
  { hero: "8.2m", label: "dogs back in 2011; ownership has climbed ever since", icon: "trend" },
  { hero: "99%", label: "of owners say their dog is one of the family", icon: "home" },
  { hero: "3.2m", label: "households welcomed a new pet during the pandemic", icon: "virus" },
  { hero: "24", label: "puppies in Britain's record-breaking litter, born in 2004", icon: "bottle" },
  { hero: "22,742", label: "dogs at the world's largest dog walk, in South Shields" },
  { hero: "1859", label: "the year Britain held its first ever dog show, in Newcastle", icon: "tent" },
  { hero: "Dash", label: "Queen Victoria's spaniel, who helped make pet dogs the fashion", icon: "crown" },
  { hero: "Law", label: "microchipping has been a legal requirement for UK dogs since 2016", icon: "microchip" },
];

const heroTriangles: Tri[] = [
  { size: 70, top: "14%", left: "16%", speed: 0.12, spin: 0.2 },
  { size: 44, top: "30%", right: "22%", speed: 0.22, spin: -0.32 },
  { size: 92, bottom: "16%", left: "42%", speed: 0.16, spin: 0.14 },
];

export default function KnowYourChums() {
  return (
    <>
      <Nav />
      <main className={styles.page}>
        {/* Hero banner, matching the other pages */}
        <section className={styles.hero} aria-label="Know your chums">
          <div className={styles.heroImg} aria-hidden="true" />
          <div className={styles.heroTint} aria-hidden="true" />
          <Announce />
          <span className={styles.heroBadge} aria-hidden="true" />
          <div className={styles.heroTris}>
            <Triangles items={heroTriangles} z={2} />
          </div>
        </section>

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
