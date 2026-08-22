import styles from "./BreedTemperament.module.css";

// Extracted verbatim from the /chums/[slug] desktop page (BreedClient) so that page
// and the Chum Calculator pop-out render the temperament block from one source, no
// drift (the computeRunningCost pattern). Markup and CSS are unchanged, so /chums
// renders identically. (Job B stage 6, 22 Aug 2026.)

type Props = {
  info: { temperament: string[]; pros: string[]; cons: string[] };
};

export default function BreedTemperament({ info }: Props) {
  return (
    <>
      <p className={styles.infoHeading}>Temperament</p>
      <div className={styles.infoSection}>
        <div className={styles.temperamentTags}>
          {info.temperament.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.infoSection}>
        <div className={styles.prosConsGrid}>
          <div className={styles.prosCol}>
            <p className={`${styles.prosConsHead} ${styles.pros}`}>Pros</p>
            <ul className={styles.prosConsList}>{info.pros.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div className={styles.consCol}>
            <p className={`${styles.prosConsHead} ${styles.cons}`}>Cons</p>
            <ul className={styles.prosConsList}>{info.cons.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        </div>
      </div>
    </>
  );
}
