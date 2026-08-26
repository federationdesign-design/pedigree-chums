import styles from "./CompetitionTerms.module.css";
import type { Term } from "./spotYourChumTerms";

/* Presentational "Full Competition Terms" section for the Spot your Chum
   competition pages (/findpug, /findbeagle and so on). This component holds no
   copy: the terms array is passed in (spotYourChumTerms(breed) from
   ./spotYourChumTerms), so the shared wording lives in one module and every breed
   page renders the same list. Rendering only:
   - a body containing " | " is split into an ordered list, otherwise a paragraph
   - cards alternate yellow/white by index. */

type Props = {
  /** The competition terms to render, in display order. */
  terms: Term[];
};

export default function CompetitionTerms({ terms }: Props) {
  return (
    <section className={styles.termsSection}>
      <div className={styles.inner}>
        <h2 id="terms" className={styles.termsSectionTitle}>
          Spot your Chum:<br />
          <span className={styles.termsSectionTitleWhite}>Full Competition Terms</span>
        </h2>
        <div className={styles.termsGrid}>
          {terms.map((t, i) => (
            <div
              key={t.num}
              className={`${styles.termCard} ${i % 2 === 0 ? styles.termCardYellow : styles.termCardWhite}`}
            >
              <span className={styles.termNum}>{t.num}</span>
              <h3 className={styles.termTitle}>{t.title}</h3>
              {t.body.includes(" | ") ? (
                <ol className={styles.termList}>
                  {t.body.split(" | ").map((item, j) => (
                    <li key={j} className={styles.termBody}>{item}</li>
                  ))}
                </ol>
              ) : (
                <p className={styles.termBody}>{t.body}</p>
              )}
            </div>
          ))}
        </div>
        <p className={styles.contactNote}>
          Questions about the Spot your Chum competition can be sent to{" "}
          <strong>
            <a href="mailto:hello@Pedigree-Chums.co.uk" className={styles.contactLink}>hello@Pedigree-Chums.co.uk</a>
          </strong>
          . Please do not send bank details, card details or other unnecessary financial information.
        </p>
      </div>
    </section>
  );
}
