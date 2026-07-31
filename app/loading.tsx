/* THE GAP BETWEEN TAPPING AND ARRIVING.

   Without a loading boundary the App Router holds the screen you are on until
   the whole destination is ready. The menu closes on tap, so you are left
   looking at the page you just left, with nothing to say anything is happening.
   On a heavy page that reads as three seconds of nothing.

   With this here, the navigation commits at once and this shows while the page
   arrives. No dark background, and it animates from a visible resting state, so
   if the animation never runs the mark is still on screen. */

import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.sr}>Loading</span>
      <span className={styles.dots} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
    </div>
  );
}
