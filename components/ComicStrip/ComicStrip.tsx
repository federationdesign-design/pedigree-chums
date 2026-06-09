import styles from "./ComicStrip.module.css";

const STEPS = ["/step1.png", "/step2.png", "/step3.png", "/step4.png", "/step5.png"];

// Individual "how to play" step images, stacked below the corgi section so the
// information reads clearly at any width instead of one large strip image.
export default function ComicStrip() {
  return (
    <section className={`${styles.section} paw-bg`}>
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
