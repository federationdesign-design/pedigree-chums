"use client";

import { useState } from "react";
import ScoreTable from "../ScoreTable/ScoreTable";
import ShareCard from "../ShareCard/ShareCard";
import css from "./PitEnd.module.css";

/**
 * The MAIN pit's end screen.
 *
 * It replaces a redirect. The old route was: stash three strings in
 * sessionStorage, navigate to /about?gameover=1, and let AboutClient read them
 * back and render GameOver over the about page. That is why it was poor: a full
 * page navigation destroys the pit, only what was serialised survives, and
 * closing the screen leaves you on /about with no way back to anything.
 *
 * This stays on the page and reads live state, which is what makes it
 * self-contained.
 *
 * WHAT IT DELIBERATELY DOES NOT HAVE: an icon row. The mini pit offers restart,
 * rewind and learn because it is a campaign with lives. Most people meeting this
 * pit are on the site for the first time and do not yet know what it is, so the
 * screen does not invite them to play again. It offers one way on, into the
 * site, and one way to share.
 */

export type PitEndProps = {
  score: number;
  /** cards collected, out of the 54 in the deck */
  chums: number;
  /** the whole deck, so the rate has a denominator */
  deckSize?: number;
  onExit: () => void;
};

export default function PitEnd({ score, chums, deckSize = 54, onExit }: PitEndProps) {
  const [sharing, setSharing] = useState(false);
  const rate = deckSize > 0 ? Math.min(100, Math.round((chums / deckSize) * 100)) : 0;

  return (
    <div className={css.overlay} role="alertdialog" aria-label="Game over">
      {/* SHARE, as a corner flash rather than a button in a row, matching the
          mini pit. The artwork is one SVG laid on a drawn triangle. */}
      <button
        type="button"
        className={css.flash}
        onClick={() => setSharing(true)}
        aria-label="Share your score"
        title="Share your score"
      >
        <span className={css.flashText} aria-hidden="true" />
      </button>

      <div className={css.flashWordWrap}>
        <div className={css.flashWord}>
          <span className={css.flashWordLine}>GAME</span>
          <span className={css.flashWordLine}>OVER</span>
        </div>

        <div className={css.rate}>
          <span className={css.rateTitle}>Chum rate:</span>
          <span className={css.rateValue}>{rate}%</span>
        </div>
        <p className={css.rateDetail}>
          {chums} found from {deckSize} chums
        </p>

        <ScoreTable score={score} dogs={3} />

        {/* One way on. The mini pit's X leaves to the history page; here it goes
            into the site, which is the whole point of this pit. */}
        <button type="button" className={css.enter} onClick={onExit}>
          Enter the site
        </button>
      </div>

      {sharing && (
        <ShareCard
          score={score}
          rate={rate}
          chums={chums}
          onClose={() => setSharing(false)}
          onExit={onExit}
        />
      )}
    </div>
  );
}
