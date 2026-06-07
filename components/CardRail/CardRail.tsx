import Image from "next/image";
import { cards } from "../../content/cards";
import styles from "./CardRail.module.css";

export default function CardRail() {
  return (
    <section className={`${styles.section} paw-bg`}>
      <div className={styles.head}>
        <h2 className="display">
          Meet the <span className="display-yellow">Pack</span>
        </h2>
        <p className={styles.sub}>
          Hand-illustrated cards for 54 breeds. Swipe through to see them all.
        </p>
      </div>

      <div className={styles.rail} role="list" aria-label="Breed cards">
        {cards.map((src, i) => (
          <div className={styles.item} role="listitem" key={src}>
            <Image
              src={src}
              alt={`Breed card ${i + 1}`}
              width={300}
              height={430}
              className={styles.card}
              sizes="(max-width: 700px) 64vw, 300px"
            />
          </div>
        ))}
      </div>

      <p className={styles.hint}>Scroll or swipe to see all 54 &rarr;</p>
    </section>
  );
}
