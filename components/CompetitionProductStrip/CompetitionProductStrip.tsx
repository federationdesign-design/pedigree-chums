import Image from "next/image";
import styles from "./CompetitionProductStrip.module.css";

/* Product image strip for the Spot your Chum competition pages (brief 4d),
   desktop layout: a hand holding the figurine bleeding off the left edge, then
   three white rounded cards with the product shots. All paths and alt text come
   from the per-breed config, so a new breed is a config + image change only.

   Desktop-first (stage 4). The mobile peeking carousel (brief 4d mobile / THE
   PRIZE) is a separate treatment and lands in the mobile pass.

   next/image is used (not <img>) to keep the eslint no-img-element count at
   baseline; the intrinsic sizes below are the optimised asset dimensions. */

type Img = { src: string; alt: string };

type Props = {
  /** The hand-holding-figurine shot that bleeds off the left edge. */
  hand: Img;
  /** The three white-background product shots, left to right. */
  shots: Img[];
};

export default function CompetitionProductStrip({ hand, shots }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.strip}>
        <Image
          className={styles.hand}
          src={hand.src}
          alt={hand.alt}
          width={700}
          height={673}
          sizes="(min-width: 1024px) 26vw, 60vw"
        />
        <div className={styles.cards}>
          {shots.map((shot) => (
            <div key={shot.src} className={styles.card}>
              <Image
                className={styles.cardImg}
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="(min-width: 1024px) 25vw, 90vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
