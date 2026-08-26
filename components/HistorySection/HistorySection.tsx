import Image from "next/image";
import FactHatImage from "../../app/britains-dog-history/FactHatImage";
import type { Section } from "../../data/historySections";
import styles from "../../app/britains-dog-history/history.module.css";

/* The era write-up panel: the blue glow `.section` from the history page, lifted
   verbatim so the desktop history page and the per-era social pages
   (app/britains-dog-history/[era]) render the identical panel from one place.
   The copy comes from data/historySections.ts. Extracted 13 August 2026; see
   that file's note. Markup and classes are unchanged from the old inline version
   in the history page, so the desktop page renders exactly as before. */
export default function HistorySection({ section: s }: { section: Section }) {
  const prefix = s.title.slice(0, s.title.length - s.accent.length);
  return (
    <section className={styles.section}>
      <div className={styles.glowLayer} aria-hidden="true">
        <div className={`${styles.glowCircle} ${styles.glowTop}`} />
        <div className={`${styles.glowCircle} ${styles.glowBottom}`} />
      </div>
      <h2 className={`display ${styles.sectionTitle}`}>
        {prefix}
        <span className="display-yellow">{s.accent}</span>
      </h2>
      <div className={styles.colLeft}>
        <div className={styles.imageSlot}>
          <Image
            src={s.image}
            alt={s.imageAlt}
            width={600}
            height={600}
            className={styles.sectionImg}
            unoptimized
          />
        </div>
        <p className={styles.sectionIntro}>{s.intro}</p>
        <p className={styles.detail}>{s.detail}</p>
      </div>
      <div className={styles.colRight}>
        <ul className={styles.bullets}>
          {s.bullets.map((b, j) => (
            <li key={j}>{b}</li>
          ))}
        </ul>
        {s.facts.map((f, k) => (
          <div className={styles.fact} key={k}>
            <span className={styles.factLabel}>Did you know?</span>
            <div className={styles.factRow}>
              <div className={styles.factImg}>
                <FactHatImage src={f.image || s.image} alt={f.imageAlt} width={120} height={120} objectPosition={f.imagePos} />
              </div>
              <div className={styles.factBody}>
                <span className={styles.factText}>{f.text}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
