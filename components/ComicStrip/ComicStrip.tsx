import styles from "./ComicStrip.module.css";

const STEPS = ["/step1.png", "/step2.png", "/step3.png", "/step4.png", "/step5.png"];

// Desktop shows the single wide comic strip; mobile stacks the individual step
// images instead (toggled via CSS in the module).
export default function ComicStrip() {
  return (
    <section className={`${styles.section} paw-bg`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/stacked-comicstrip.png"
        alt="How to play, step by step"
        className={styles.stripDesktop}
      />
      <div className={styles.steps}>
        {STEPS.map((src, i) => {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={`How to play, step ${i + 1}`}
              className={styles.step}
            />
          );
        })}
      </div>
    </section>
  );
}
