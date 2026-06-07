import Image from "next/image";
import CardRail from "../CardRail/CardRail";
import styles from "./PitchPanel.module.css";

export default function PitchPanel() {
  return (
    <section className={styles.panel}>
      <div className={styles.pitch}>
        <div className={styles.photoCol}>
          <Image
            src="/lab.png"
            alt="A Labrador being spotted in the park"
            width={520}
            height={520}
            className={styles.photo}
            priority
          />
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
  );
}
