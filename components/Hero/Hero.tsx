import styles from "./Hero.module.css";
import Triangles, { type Tri } from "../Parallax/Triangles";

const heroTriangles: Tri[] = [
  { size: 70, top: "14%", left: "16%", speed: 0.12, spin: 0.2 },
  { size: 44, top: "30%", right: "22%", speed: 0.22, spin: -0.32 },
  { size: 92, bottom: "16%", left: "42%", speed: 0.16, spin: 0.14 },
];

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
      <Triangles items={heroTriangles} z={1} />
    </section>
  );
}
