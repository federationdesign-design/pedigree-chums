import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import PopHeading from "../../components/PopHeading/PopHeading";
import BreedDirectory from "./BreedDirectory";
import { breeds } from "../../data/breeds";
import styles from "./know.module.css";

export const metadata: Metadata = {
  title: "Know Your Chums — The 54 Dog Breeds in the Pack",
  description:
    "Your field guide to the 54 dog breeds in the pack: what they look like, how they behave, and the tell-tale features that help you spot each one in the wild.",
};

const crossbreeds = breeds.filter((b) => b.type === "designer-crossbreed").length;

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
            Britain is a nation of dog lovers, and the pack celebrates 54 of our
            favourites. This is your field guide: what each breed looks like, how
            they behave, and the tell-tale feature that helps you spot them on a
            walk. Get to know your chums, then go find them in the wild.
          </p>
        </section>

        {/* VetCompass data band */}
        <section className={styles.dataBand}>
          <h2 className={`display ${styles.dataTitle}`}>
            Britain&apos;s dogs <span className="display-yellow">by the numbers</span>
          </h2>
          <div className={styles.statRow}>
            <div className={styles.stat}>
              <span className={styles.statNum}>2.2m</span>
              <span className={styles.statLabel}>UK dogs studied in 2019</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>800</span>
              <span className={styles.statLabel}>distinct breeds recorded</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{crossbreeds}</span>
              <span className={styles.statLabel}>designer crossbreeds in the pack</span>
            </div>
          </div>
          <p className={styles.dataBody}>
            The most common dogs across all ages were the crossbreed, Labrador and
            Jack Russell. But look at the puppies: among dogs under one year, the
            French Bulldog and Cockapoo had surged into the top three, a sign of the
            designer-crossbreed boom. The pack has both the classics and the new
            favourites.
          </p>
          <p className={styles.source}>
            Source: RVC VetCompass, O&apos;Neill et al. (2023), UK canine demography.
          </p>
        </section>

        {/* Directory */}
        <section className={styles.directory}>
          <BreedDirectory />
        </section>
      </main>
      <Footer />
    </>
  );
}
