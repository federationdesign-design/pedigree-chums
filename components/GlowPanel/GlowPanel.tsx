import type { ReactNode } from "react";
import styles from "./GlowPanel.module.css";

// The signed-off "floating panel" shell, extracted from the homepage pitch
// panel (components/PitchPanel/PitchPanel.tsx) so it can be reused without
// copying the CSS by hand. It is the rounded, drop-shadowed card with the brand
// blue gradient and two screen-blend glow circles, and nothing else: no negative
// margins, no two-column grid, no hero overlap. Those belong to a particular
// consumer's layout, not to the shell.
//
// There are, as of this commit, three copies of this style in the tree:
//   1. components/PitchPanel/PitchPanel.module.css  (the original)
//   2. app/britains-dog-history/history.module.css  (an inline copy, ".panel")
//   3. this component
// PitchPanel and the history page are intentionally left untouched here. A later
// refactor to move them onto this shell should start from those two files.

export default function GlowPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.panel} ${className ?? ""}`}>
      <div className={styles.glowLayer} aria-hidden="true">
        <span className={`${styles.glowCircle} ${styles.glowTop}`} />
        <span className={`${styles.glowCircle} ${styles.glowBottom}`} />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
