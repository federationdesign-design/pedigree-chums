"use client";

/* The intro slide's two ways in.

   FIRST DOG opens level one. It cannot be a scroll: the levels are owned by
   BreedStrip, which holds the modal, the lives, the streak and the campaign
   score that carries across all nine eras. So the button IS a BreedStrip, given
   nothing to draw but itself. Nothing about the game is written here, which is
   the same bargain TimelineRun makes.

   DOG HISTORY is a plain scroll. It carries a data-goto index that the page's
   own carousel script reads, so the two buttons stay side by side in one row
   without one of them needing a second mechanism. */

import BreedStrip from "../britains-dog-history/BreedStrip";
import { ukBreeds } from "../../data/uk-breeds";
import styles from "./history2.module.css";

/* The first era of the sequence, and inside it the lowest anchor: the same
   sort BreedStrip itself runs, so "the first dog" here is the first dog there
   and cannot drift if the data is reordered. */
const FIRST_ERA = "ancient-medieval";

export default function IntroButtons({ historyPanel }: { historyPanel: number }) {
  const firstBreed = ukBreeds
    .filter((b) => b.strip === FIRST_ERA)
    .sort((a, b) => a.anchor - b.anchor)[0];

  return (
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
      <button
        type="button"
        className={`${styles.introBtn} ${styles.introBtnAlt}`}
        data-goto={historyPanel}
      >
        Dog history
      </button>
    </div>
  );
}
