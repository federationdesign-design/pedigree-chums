import { type CSSProperties } from "react";
import styles from "./MilestoneMessage.module.css";

// The centre-screen score-milestone celebration: a one-shot confetti splash
// wrapped around a card of the yellow label over the big white score. Purely
// presentational, a function of value + label; the caller owns the state, the
// remount key (pass key={id} so the CSS pop replays each time) and the auto-clear
// timer. Extracted verbatim from PackPit on 14 August 2026 so the main pit and the
// mini pit (LineageModal) share one treatment and cannot drift.
export default function MilestoneMessage({ value, label }: { value: number; label: string }) {
  return (
    <div className={styles.milestone} aria-hidden="true">
      {Array.from({ length: 30 }).map((_, i) => {
        const ang = (i / 30) * Math.PI * 2 + (i % 3) * 0.35;
        const dist = 150 + ((i * 53) % 120);
        const dx = Math.cos(ang) * dist;
        const dy = Math.sin(ang) * dist + 50; // a touch of gravity in the splash
        const colors = ["#1497d6", "#2bb4ee", "#ffd23e", "#fff8e6", "#ff5d97", "#ffffff"];
        const st = {
          background: colors[i % colors.length],
          borderRadius: i % 4 === 0 ? "50%" : "2px",
          animationDelay: `${(i % 6) * 0.03}s`,
          "--dx": `${dx.toFixed(0)}px`,
          "--dy": `${dy.toFixed(0)}px`,
          "--rot": `${(i % 2 ? 1 : -1) * (180 + ((i * 47) % 360))}deg`,
        } as CSSProperties;
        return <span key={i} className={styles.milestoneConf} style={st} />;
      })}
      <div className={styles.milestoneCard}>
        <span className={styles.milestoneLabel}>{label}</span>
        <span className={styles.milestoneValue}>{value.toLocaleString("en-GB")}</span>
      </div>
    </div>
  );
}
