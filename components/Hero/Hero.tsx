import Image from "next/image";
import { heroCard } from "../../content/cards";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.videoWrap} aria-hidden="true">
        <iframe
          className={styles.video}
          src="https://player.vimeo.com/video/1199216471?background=1&autoplay=1&loop=1&muted=1"
          title="Pedigree Chums"
          allow="autoplay; fullscreen; picture-in-picture"
          frameBorder="0"
        />
        <div className={styles.tint} />
      </div>

      <div className={styles.cardFloat}>
        <Image
          src={heroCard}
          alt="Pedigree Chums breed card"
          width={360}
          height={520}
          className={styles.card}
          priority
        />
      </div>
    </section>
  );
}
