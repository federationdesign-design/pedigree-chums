import styles from "./CompetitionTitles.module.css";

/* Titles + intro block for the Spot your Chum competition pages (brief 4c).
   Shared across every breed: only the breed name in the question and the intro
   body lines vary, and those come in as props from the per-breed config.

   The two title lines are one heading ("Spot your Chum Photo Competition"), so
   the outline is done with -webkit-text-stroke + paint-order (the site's
   established technique, see app/britains-dog-history-2) on single elements
   rather than duplicated stacked copies. That keeps it a single accessible h1.

   Desktop-first (brief stage 3). Mobile tuning lands at stage 5. */

type Props = {
  /** Breed name, as printed in "Have you spotted <breed>?". */
  breed: string;
  /** The intro body lines beneath the question. */
  introLines: string[];
};

export default function CompetitionTitles({ breed, introLines }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {/* The explicit {" "} between the two block lines guarantees a space in
            the text content, so the accessible name reads "Spot your Chum Photo
            Competition" and any inline fallback does not run the words together
            ("ChumPhoto"). The lines stack via display: block in the CSS. */}
        <h1 className={styles.title}>
          <span className={styles.line1}>Spot your Chum</span>{" "}
          <span className={styles.line2}>Photo Competition</span>
        </h1>
        <p className={styles.question}>Have you spotted {breed}?</p>
        {introLines.map((line, i) => (
          <p key={i} className={styles.introBody}>{line}</p>
        ))}
      </div>
    </section>
  );
}
