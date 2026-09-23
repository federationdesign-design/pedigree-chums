"use client";

import Link from "next/link";
import BreedRoller from "../../components/BreedRoller/BreedRoller";
import styles from "./know.module.css";

/* THE MOBILE HERO, 23 September 2026 (owner). The same shape the history page's
   hero took: the title moves up into the photograph, two buttons sit under it,
   and the A to Z roller runs along the foot of the screen so a reader can pick
   any of the 54 chums without scrolling the whole page.

   The buttons are plain in-page anchors, so they jump down to the two sections
   below rather than loading anything. Desktop is untouched: this block is hidden
   above 768px and the ordinary title and lead show instead. */

export default function ChumHeroMobile() {
  return (
    <div className={styles.mHero}>
      <div className={styles.mHeroBody}>
        <h1 className={`display ${styles.mTitle}`}>
          Know your <span className="display-yellow">chums</span>
        </h1>
        <p className={styles.mLead}>
          Every dog in the pack: what they look like, how they behave, and how to spot them in the wild.
        </p>
        <div className={styles.mBtnRow}>
          <Link href="#chum-stats" className={styles.mBtn}>
            Stats
          </Link>
          <Link href="#chum-top-dogs" className={`${styles.mBtn} ${styles.mBtnAlt}`}>
            Top dogs
          </Link>
        </div>
        <BreedRoller mode="chums" />
      </div>
    </div>
  );
}
