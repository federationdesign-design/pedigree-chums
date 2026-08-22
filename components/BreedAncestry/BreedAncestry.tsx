import styles from "./BreedAncestry.module.css";

// Extracted verbatim from the /chums/[slug] desktop page (BreedClient) so that page
// and the Chum Calculator pop-out render the ancestry block from one source, no
// drift (the computeRunningCost pattern). Markup and CSS are unchanged, so /chums
// renders identically. (Job B stage 6, 22 Aug 2026.)

type Props = {
  breakdown: { name: string; pct: number }[];
};

export default function BreedAncestry({ breakdown }: Props) {
  return (
    <>
      <p className={styles.infoHeading}>Historical influence</p>
      {breakdown.map((a) => (
        <div key={a.name}>
          <div className={styles.ancestryRow}>
            <span className={styles.ancestryName}>{a.name}</span>
            <span className={styles.ancestryPct}>{a.pct}%</span>
          </div>
          <div className={styles.ancestryBar} style={{ width: `calc(${a.pct}% - 40px)` }} />
        </div>
      ))}
      <p className={styles.ancestryDisclaimer}>
        Our best guess, not hard science. These figures come from history and old breeding records, our viewpoint, not proven fact.
      </p>
    </>
  );
}
