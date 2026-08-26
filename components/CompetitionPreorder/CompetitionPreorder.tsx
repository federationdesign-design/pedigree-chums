import Image from "next/image";
import styles from "./CompetitionPreorder.module.css";

/* Pre-order block for the Spot your Chum competition pages (brief 4e). Full-bleed
   photographic band below the product strip: the supplied artwork carries the
   PRE-ORDER NOW badge, the price (6.99, RRP 9.99), the blue circle, and the card
   and box render, all baked in. So this is the image alone, no overlaid figures.

   NOTE (Steve): the card in this artwork prints stale height/length/weight, being
   corrected in a separate task and logged in PLACEHOLDERS.md. Deliberately no live
   figures are rendered next to it here, so nothing on the page contradicts the
   baked ones. The alt text likewise does not repeat the printed measurements. */

type Props = {
  /** Pre-order artwork (full composed scene). */
  src: string;
  /** Alt describing the scene, without citing the card's stale measurements. */
  alt: string;
};

export default function CompetitionPreorder({ src, alt }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.frame}>
        <Image className={styles.media} src={src} alt={alt} fill sizes="100vw" />
      </div>
    </section>
  );
}
