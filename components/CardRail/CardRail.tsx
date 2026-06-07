import Image from "next/image";
import { cards } from "../../content/cards";
import styles from "./CardRail.module.css";

export default function CardRail() {
  return (
    <section className={`${styles.section} paw-bg`}>
      <div className={styles.head}>
        <h2 className="display">
          54 Unique <span className="display-yellow">Dog Cards</span>
        </h2>
        <p className={styles.sub}>
          40 of the most popular UK breeds, plus 10 designer crossbreeds. Swipe through the pack.
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
