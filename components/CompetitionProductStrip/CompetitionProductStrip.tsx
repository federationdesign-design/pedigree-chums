import Image from "next/image";
import styles from "./CompetitionProductStrip.module.css";

/* Product image strip for the Spot your Chum competition pages (brief 4d),
   desktop layout: a hand holding the figurine bleeding off the left edge, then
   three white rounded cards with the product shots. All paths and alt text come
   from the per-breed config, so a new breed is a config + image change only.

   Desktop shows the hand + three cards; below 768px that is hidden and THE PRIZE
   peeking carousel (brief 4d mobile) shows instead, both fed by the same `shots`
   plus the `prize` copy. Native CSS scroll-snap, no JS.

   next/image is used (not <img>) to keep the eslint no-img-element count at
   baseline; the intrinsic sizes below are the optimised asset dimensions. */

type Img = { src: string; alt: string };

type Props = {
  /** The hand-holding-figurine shot that bleeds off the left edge. */
  hand: Img;
  /** The three white-background product shots, left to right (desktop cards and
      the mobile THE PRIZE carousel both use these). */
  shots: Img[];
  /** THE PRIZE copy beneath the mobile carousel (brief 4d). */
  prize: { receives: string; lines: string[] };
};

export default function CompetitionProductStrip({ hand, shots, prize }: Props) {
  return (
    <section className={styles.section}>
      {/* Desktop: hand + three cards. Hidden below 768px. */}
      <div className={styles.strip}>
        <Image
          className={styles.hand}
          src={hand.src}
          alt={hand.alt}
          width={700}
          height={673}
          sizes="(min-width: 1024px) 26vw, 60vw"
        />
        {/* Three cards; the rail bleeds off the right edge so the third card is
            cropped by the section edge, mirroring the hand on the left (brief 4d). */}
        <div className={styles.cards}>
          {shots.map((shot) => (
            <div key={shot.src} className={styles.card}>
              <Image
                className={styles.cardImg}
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="(min-width: 1024px) 28vw, 90vw"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: THE PRIZE peeking carousel of the same shots, prize copy beneath.
          Hidden at/above 769px. */}
      <div className={styles.prize}>
        <h2 className={styles.prizeHeading}>The Prize</h2>
        <div className={styles.carousel} role="group" aria-label="Prize photos" tabIndex={0}>
          {shots.map((shot) => (
            <div key={shot.src} className={styles.slide}>
              <Image className={styles.slideImg} src={shot.src} alt={shot.alt} fill sizes="70vw" />
            </div>
          ))}
        </div>
        <p className={styles.prizeReceives}>{prize.receives}</p>
        {prize.lines.map((line) => (
          <p key={line} className={styles.prizeLine}>{line}</p>
        ))}
      </div>
    </section>
  );
}
