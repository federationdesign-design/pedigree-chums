import CardRail from "../CardRail/CardRail";
import LabPop from "./LabPop";
import ParallaxShape from "../Parallax/ParallaxShape";
import Triangles, { type Tri } from "../Parallax/Triangles";
import styles from "./PitchPanel.module.css";

const pitchTriangles: Tri[] = [
  { size: 64, top: "12%", left: "30%", speed: 0.18, spin: 0.25 },
  { size: 40, top: "46%", left: "8%", speed: 0.3, spin: -0.4 },
  { size: 82, bottom: "20%", right: "12%", speed: 0.14, spin: 0.18 },
];

export default function PitchPanel() {
  return (
    <div className={styles.outer}>
      <ParallaxShape className={styles.yellowCircle} speed={0.25} />
      <section className={styles.panel}>
        <div className={styles.glowLayer} aria-hidden="true">
          <span className={`${styles.glowCircle} ${styles.glowTop}`} />
          <span className={`${styles.glowCircle} ${styles.glowBottom}`} />
        </div>
        <div className={styles.pitch}>
          <Triangles items={pitchTriangles} z={0} />
          <div className={styles.photoCol}>
            <LabPop />
          </div>
          <div className={styles.content}>
            <h1 className="display">
              The Ultimate <span className="display-yellow">On-the-Go</span> Dog Spotting Game
            </h1>
            <p className="lead">Fun. Educational. Addictive.</p>
            <p className="subLead">Perfect for Families, Tourists &amp; Dog Lovers.</p>
            <ul className="points">
              <li className="point">54 hand-illustrated breed cards</li>
              <li className="point">Compact, durable, pocket-friendly</li>
              <li className="point">Made in the UK. Built for play.</li>
            </ul>
          </div>
        </div>

        <CardRail />
      </section>
    </div>
  );
}
