"use client";

import * as React from "react";
import { usePinnedTrigger } from "./usePinnedTrigger";
import styles from "./ScrollScenes.module.css";

/*
  QuoteReveal -- the "Rule B" replacement for the old scroll-scrubbed
  QuoteBuild. The line/mark/text sequence now plays out on a fixed CSS
  transition timeline the instant the scene pins, instead of being mapped
  to scroll distance. The scene container only needs pin-height plus one
  short fixed reading pause, so there is no leftover "dead scroll" to
  create a gap -- that was the structural cause of the repeated complaint.

  Trade-off (agreed with Steve): the build no longer scrubs backward if the
  reader scrolls up mid-animation. It replays cleanly from the top each
  time the scene re-enters the pinned position instead.
*/
export function QuoteReveal({
  quote,
  pinned,
  blockClass,
  markClass,
}: {
  quote: string;
  pinned?: React.ReactNode;
  blockClass: string;
  markClass: string;
}) {
  const { sceneRef, active } = usePinnedTrigger();

  return (
    <div ref={sceneRef} className={styles.quoteScene}>
      <div className={styles.stage}>
        {pinned && <div className={styles.pinnedText}>{pinned}</div>}
        <div className={styles.quoteHolder}>
          <div className={styles.quoteLineTrack}>
            <div className={`${styles.quoteLine} ${active ? styles.quoteLineActive : ""}`} />
          </div>
          <blockquote className={blockClass} style={{ borderLeftColor: "transparent", margin: 0 }}>
            <span className={`${markClass} ${styles.quoteMarkFx} ${active ? styles.quoteMarkActive : ""}`}>
              {"\u201c"}
            </span>
            <span className={`${styles.quoteTextFx} ${active ? styles.quoteTextActive : ""}`}>
              {quote}
            </span>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
