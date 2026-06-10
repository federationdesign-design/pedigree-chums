"use client";
import styles from "./trade.module.css";
import Triangles, { type Tri } from "../../components/Parallax/Triangles";

// Same visual treatment as the B2C Hero (full-width 16:9 background video,
// poster fade, tint, drifting triangles) but with a trade announcement that
// scrolls to the enquiry form rather than opening the consumer discount modal.
const heroTriangles: Tri[] = [
  { size: 70, top: "14%", left: "16%", speed: 0.12, spin: 0.2 },
  { size: 44, top: "30%", right: "22%", speed: 0.22, spin: -0.32 },
  { size: 92, bottom: "16%", left: "42%", speed: 0.16, spin: 0.14 },
];

export default function TradeHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroVideoWrap} aria-hidden="true">
        {/* Swap this Vimeo id for the family play clip once it's shot. */}
        <iframe
          className={styles.heroVideo}
          src="https://player.vimeo.com/video/1199216471?background=1&autoplay=1&loop=1&muted=1&controls=0&title=0&byline=0&portrait=0&autopause=0"
          title="Pedigree Chums being played"
          allow="autoplay; fullscreen; picture-in-picture"
          frameBorder="0"
        />
        <div className={styles.heroPoster} />
        <div className={styles.heroTint} />
      </div>
      <a href="#enquire" className={styles.heroAnnounce}>
        <strong>Now open to founding stockists.</strong> Wholesale the on-the-go
        dog spotting game — enquire below.
      </a>
      <div className={styles.heroTris}>
        <Triangles items={heroTriangles} z={1} />
      </div>
    </section>
  );
}
