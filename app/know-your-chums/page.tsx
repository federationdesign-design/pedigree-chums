import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import PopHeading from "../../components/PopHeading/PopHeading";
import Triangles, { type Tri } from "../../components/Parallax/Triangles";
import ParallaxShape from "../../components/Parallax/ParallaxShape";
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
const FACTS: { hero: string; label: string; icon: string }[] = [
  { hero: "11\u201313m", label: "dogs in the UK today, and the number keeps rising", icon: "/uk-icon.svg" },
  { hero: "8.2m", label: "dogs back in 2011; ownership has climbed ever since", icon: "/trend-icon.svg" },
  { hero: "99%", label: "of owners say their dog is one of the family", icon: "/famil-icon.svg" },
  { hero: "3.2m", label: "households welcomed a new pet during the pandemic", icon: "/pandemic-icon.svg" },
  { hero: "24", label: "puppies in Britain's record-breaking litter, born in 2004", icon: "/puppy-icon.svg" },
  { hero: "22,742", label: "dogs at the world's largest dog walk, in South Shields", icon: "/dog-walk-icon.svg" },
  { hero: "1859", label: "the year Britain held its first ever dog show, in Newcastle", icon: "/dog-show-icon.svg" },
  { hero: "Dash", label: "Queen Victoria's spaniel, who helped make pet dogs the fashion", icon: "/queen-icon.svg" },
  { hero: "Law", label: "microchipping has been a legal requirement for UK dogs since 2016", icon: "/microchipped-icon.svg" },
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
          <ParallaxShape className={styles.heroBadge} speed={0.2} />
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
                <span
                  className={styles.factIcon}
                  style={{
                    WebkitMaskImage: `url(${f.icon})`,
                    maskImage: `url(${f.icon})`,
                  }}
                  aria-hidden="true"
                />
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
