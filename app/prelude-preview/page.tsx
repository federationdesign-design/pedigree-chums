"use client";

import styles from "../../components/HiddenGamesCounter/HiddenGamesCounter.module.css";
import { PRELUDE_WARNING, PRELUDE_HEADING, CAMPAIGN_INTRO, CAMPAIGN_INTRO_EMPHASIS } from "../../lib/hiddenGames/copy";

/* Design-review page only. Renders the Hidden Games prelude in isolation with
   no timers, no engine and no auto-dismiss, so it can be styled at leisure.
   Not linked from anywhere. */
export default function PreludePreview() {
  return (
    <main style={{ minHeight: "100svh", padding: 40, background: "linear-gradient(to top right, #00e2ff, #008eff)" }}>
      <p style={{ fontFamily: "system-ui", color: "#fff", fontWeight: 700 }}>
        Prelude preview. This page has no timers, so the panel stays put.
      </p>

      <div className={styles.prelude} role="status">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.preludeIcon} src="/prelude-icon-redux.svg" alt="" />
        <div className={styles.preludeText}>
          <p className={styles.preludeWarning}>{PRELUDE_WARNING}</p>
          <p className={styles.preludeHeading} style={{ whiteSpace: "pre-line" }} data-hg-aa-exception>{PRELUDE_HEADING}</p>
        </div>
        <button type="button" className={styles.preludeClose} aria-label="Close">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.redIcon} src="/red-icon.svg" alt="" />
        </button>
      </div>

      <div className={styles.intro} role="status" aria-live="polite" style={{ position: "static", transform: "none", marginTop: 60 }}>
        <span className={styles.introScore}><span className={styles.introScoreNum}>0/5</span><span className={styles.introScoreWord}>games found</span></span>
        <p className={styles.introLine}>{CAMPAIGN_INTRO}<br /><span className={styles.introEmphasis}>{CAMPAIGN_INTRO_EMPHASIS}</span></p>
        <button type="button" className={styles.preludeClose}  aria-label="Close">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.redIcon} src="/red-icon.svg" alt="" />
        </button>
      </div>
    </main>
  );
}
