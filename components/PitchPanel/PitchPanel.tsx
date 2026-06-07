import CardRail from "../CardRail/CardRail";
import LabPop from "./LabPop";
import YellowCircle from "./YellowCircle";
import styles from "./PitchPanel.module.css";

export default function PitchPanel() {
  return (
    <div className={styles.outer}>
      <YellowCircle />
      <section className={styles.panel}>
        <div className={styles.pitch}>
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
