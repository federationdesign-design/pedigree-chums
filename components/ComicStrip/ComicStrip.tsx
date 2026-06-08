import Image from "next/image";
import styles from "./ComicStrip.module.css";

// Full-width "how to play" comic strip. Uses contain inside an aspect-ratio
// frame so the artwork never distorts (the ratio is an estimate; adjust the
// frame aspect-ratio if the real image differs).
export default function ComicStrip() {
  return (
    <section className={`${styles.section} paw-bg`}>
      <div className={styles.frame}>
        <Image
          src="/how-to-play-comic-strip.png"
          alt="How to play, step by step"
          fill
          className={styles.strip}
          sizes="100vw"
        />
      </div>
    </section>
  );
}
