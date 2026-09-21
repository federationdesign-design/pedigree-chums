import Link from "next/link";
import Image from "next/image";
import { levelsWithin, levelSlug } from "../../data/levels";
import styles from "./LevelSlider.module.css";

/* A ROW OF THE LEVELS THAT MADE THIS DOG, 20 September 2026 (owner).

   A SERVER COMPONENT, deliberately. The list is fixed per chum, so it is rendered
   into the HTML with no script: every card is a real link a search engine can
   follow into /britains-dog-history/dog/[slug], which is half the point of those
   pages. The sideways scroll is plain CSS overflow with scroll snapping.

   NOTHING AT ALL for a chum with no British ancestry recorded, rather than an empty
   heading over an empty row. 13 of the 54 are like that.

   `mobile` only adds room at the foot, because the phone page pins its icon rail
   over the bottom of the screen and the last row of cards would sit under it. */
export default function LevelSlider({ chum, mobile = false }: { chum: string; mobile?: boolean }) {
  const levels = levelsWithin(chum);
  if (!levels.length) return null;
  return (
    <section className={`${styles.wrap} ${mobile ? styles.mobile : ""}`.trim()} aria-labelledby="level-slider-h">
      <h2 id="level-slider-h" className={styles.heading}>
        Play the dogs that made the {chum}
      </h2>
      <ul className={styles.row}>
        {levels.map((b) => (
          <li key={b.name} className={styles.item}>
            <Link href={`/britains-dog-history/dog/${levelSlug(b.name)}`} className={styles.card}>
              {/* next/image, so the archive paintings are resized for a 170px card
                  rather than shipped full size to a row of thumbnails. The alt is
                  empty because the name is printed right beneath it. */}
              {/* Every level has an image today (measured, 98 of 98), but the type
                  allows none, so a missing one draws the navy card with just the name
                  rather than failing the whole row. */}
              {b.image ? <Image className={styles.img} src={b.image} alt="" width={340} height={340} sizes="170px" /> : <span className={styles.img} aria-hidden="true" />}
              <span className={styles.name}>{b.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
