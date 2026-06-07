import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.videoWrap} aria-hidden="true">
        <iframe
          className={styles.video}
          src="https://player.vimeo.com/video/1199216471?autoplay=1&loop=0&muted=1&controls=0&title=0&byline=0&portrait=0&autopause=0"
          title="Pedigree Chums"
          allow="autoplay; fullscreen; picture-in-picture"
          frameBorder="0"
        />
        <div className={styles.poster} />
        <div className={styles.tint} />
      </div>
    </section>
  );
}
