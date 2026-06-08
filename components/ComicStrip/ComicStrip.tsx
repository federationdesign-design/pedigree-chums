import styles from "./ComicStrip.module.css";

// Full-width stacked "how to play" comic strip below the corgi section.
// Rendered at its natural ratio so the cells are never distorted.
export default function ComicStrip() {
  return (
    <section className={`${styles.section} paw-bg`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/stacked-comicstrip.png"
        alt="How to play, step by step"
        className={styles.strip}
      />
    </section>
  );
}
