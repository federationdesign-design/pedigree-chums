"use client";

/* The intro slide's two ways in.

   FIRST DOG opens level one. It cannot be a scroll: the levels are owned by
   BreedStrip, which holds the modal, the lives, the streak and the campaign
   score that carries across all nine eras. So the button IS a BreedStrip, given
   nothing to draw but itself. Nothing about the game is written here, which is
   the same bargain TimelineRun makes.

   FIRST ERA replaced the old DOG HISTORY scroll button on 22 September 2026
   (owner): it is a plain link to the first era page, Ancient
   (Medieval until 22 September 2026, corrected same day). The nextPanel prop is
   gone with it, so the caller no longer passes one.

   Under the two buttons sits the rolling breed picker, a scrolling column of
   every dog in every era slider. */

import Link from "next/link";
import BreedStrip, { stripMatches } from "../../britains-dog-history/BreedStrip";
import BreedRoller from "../../../components/BreedRoller/BreedRoller";
import { ukBreeds } from "../../../data/uk-breeds";
import styles from "./vertical.module.css";

/* The first era of the sequence, and inside it the lowest anchor: the same
   sort BreedStrip itself runs, so "the first dog" here is the first dog there
   and cannot drift if the data is reordered. */
const FIRST_ERA = "ancient-medieval";

export default function IntroButtonsV() {
  const firstBreed = ukBreeds
    .filter((b) => stripMatches(b.strip, FIRST_ERA))
    .sort((a, b) => a.anchor - b.anchor)[0];

  return (
    <>
    <div className={styles.introBtnRow}>
      <BreedStrip
        era={FIRST_ERA}
        renderLevels={(open) => {
          // undefined for a dog with its own page rather than a level. The
          // first dog has a level, but the button says so rather than assuming.
          const go = firstBreed ? open(firstBreed) : undefined;
          return (
            <button
              type="button"
              className={styles.introBtn}
              onClick={go}
              disabled={!go}
              aria-label={firstBreed ? `Play the ${firstBreed.name} level` : "First dog"}
            >
              First dog
            </button>
          );
        }}
      />
      <Link href="/britains-dog-history/ancient" className={`${styles.introBtn} ${styles.introBtnAlt}`}>
        First era
      </Link>
    </div>
    <BreedRoller />
    </>
  );
}
