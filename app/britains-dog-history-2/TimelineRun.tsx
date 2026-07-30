"use client";

import { useEffect, useRef, useState } from "react";
import { ukBreeds } from "../../data/uk-breeds";
import styles from "./history2.module.css";

/*
  The vertical run. One dog per screen, scrolled downwards, inside a carousel
  that otherwise moves sideways.

  THE HARD PART IS NOT THE LAYOUT, IT IS THE TOUCH HANDLING. The carousel sets
  `touch-action: pan-x` and its script deliberately converts a vertical drag
  into horizontal movement at a gain of 1.6, so a downward swipe normally
  advances a slide. Two things undo that here, and both are needed:

    1. `touch-action: pan-y` on the scrolling element, so the browser gives
       vertical panning back for touches that start inside it.
    2. `data-pc-vlock` on the carousel, which the script checks before it
       converts anything. CSS alone is not enough: the script's listener is on
       the carousel and still fires for touches that began in here.

  The lock is released the moment the run reaches its own bottom, so the next
  flick carries the reader onwards horizontally rather than trapping them.
  Released from scroll POSITION, not a timer, for the same reason the circle
  roll is: a timer fires at the wrong moment on a slow swipe.
*/

const TAG_LABEL: Record<string, string> = {
  extinct: "Extinct",
  trending: "Trending",
  popular: "Popular",
  "in-decline": "In decline",
  endangered: "Endangered",
};

export default function TimelineRun({
  era,
  panelIndex,
  words,
  note,
}: {
  era: string;
  panelIndex: number;
  /* The line that sits between the title and the head of the timeline. */
  note: string;
  /* The era title, one word per line. It is the first SCREEN OF THIS RUN, not
     a horizontal slide of its own, so the reader scrolls down from it into
     the dogs rather than swiping sideways. */
  words: string[];
}) {
  const breeds = ukBreeds.filter((b) => b.strip === era).sort((a, b) => a.anchor - b.anchor);
  const [flipped, setFlipped] = useState<string | null>(null);
  const runRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const carousel = document.getElementById("mobile-carousel");
    const run = runRef.current;
    if (!carousel || !run) return;
    let queued = false;

    const sync = () => {
      queued = false;
      const w = carousel.clientWidth;
      if (!w) return;
      const here = Math.round(carousel.scrollLeft / w);
      const onThisPanel = here === panelIndex;
      // 2px of slack: sub-pixel scroll positions never land exactly on the end.
      const atBottom = run.scrollTop >= run.scrollHeight - run.clientHeight - 2;
      carousel.setAttribute("data-pc-vlock", onThisPanel && !atBottom ? "1" : "0");
    };

    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sync);
    };

    carousel.addEventListener("scroll", queue, { passive: true });
    run.addEventListener("scroll", queue, { passive: true });
    sync();
    return () => {
      carousel.removeEventListener("scroll", queue);
      run.removeEventListener("scroll", queue);
      // Never leave the rest of the page locked if this unmounts mid-scroll.
      carousel.setAttribute("data-pc-vlock", "0");
    };
  }, [panelIndex]);

  return (
    <div className={styles.timelinePanel} data-pc-panel={panelIndex}>
      <div ref={runRef} className={styles.timelineRun}>
        {/* Screen one: the era title, then the line that introduces the
            timeline below it. */}
        <div className={styles.eraScreen}>
          {words.map((w, wi) => (
            <span key={wi} className={styles.eraWord}>
              {w}
            </span>
          ))}
          <p className={styles.eraNote}>{note}</p>
          {/* The head of the timeline sits on THIS screen, under the text, as
              in the concept. Its line reaches the foot of the screen and the
              rail below continues from exactly that edge. */}
          <span className={styles.railStart} aria-hidden="true">
            <span className={styles.railDot} />
          </span>
        </div>

        {/* Everything from here down carries the timeline. The rail is a child
            of this wrapper rather than of the scroller, so it spans exactly
            the dogs and starts where the title screen ends: the wrapper's own
            height is the line's length, with no measuring involved. */}
        <div className={styles.railWrap}>
          <span className={styles.rail} aria-hidden="true" />
        {breeds.map((b) => {
          const isFlipped = flipped === b.name;
          return (
            <div key={b.name} className={styles.dogScreen}>
              <div className={styles.dogCard}>
                {/* The whole card is the target: tapping anywhere opens the
                    level. The information icon sits OUTSIDE this button rather
                    than inside it, because a button inside a button is invalid
                    and browsers resolve it unpredictably. */}
                <button
                  type="button"
                  className={styles.dogFlipCard}
                  aria-label={`View ${b.name} family tree`}
                >
                  <span
                    className={styles.dogFlipInner}
                    style={isFlipped ? { transform: "rotateY(180deg)" } : undefined}
                  >
                    <span className={styles.dogFront}>
                      {b.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={b.image} alt={b.name} className={styles.dogThumb} draggable={false} />
                      ) : (
                        <span className={styles.dogThumb} />
                      )}
                      {/* The family tree glyph, copied from .lineageBadge */}
                      <span className={styles.dogBadge} aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="2.4" />
                          <circle cx="6" cy="18" r="2.4" />
                          <circle cx="18" cy="18" r="2.4" />
                          <path d="M12 7v3.2M6 15.6V12h12v3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                        </svg>
                      </span>
                      {b.tag && (
                        <span className={`${styles.dogTag} ${styles[`dogTag_${b.tag.replace("-", "")}`] ?? ""}`}>
                          {TAG_LABEL[b.tag] ?? b.tag}
                        </span>
                      )}
                    </span>
                    <span className={styles.dogBack}>
                      <span className={styles.dogNote}>{b.note}</span>
                      <span className={styles.dogHint}>Tap to see the family tree</span>
                    </span>
                  </span>
                </button>

                {/* The information "i". Its only job is to turn the card over.
                    On the desktop page the flip is on hover, which a phone
                    does not have, so without this the back face is
                    unreachable on mobile. */}
                <span
                  className={styles.dogInfo}
                  role="button"
                  tabIndex={0}
                  aria-label={`About ${b.name}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlipped(isFlipped ? null : b.name);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setFlipped(isFlipped ? null : b.name);
                    }
                  }}
                >
                  i
                </span>
              </div>
              <span className={styles.dogName}>{b.name}</span>

              {/* The same words that are on the back of the card. */}
              <p className={styles.dogNoteUnder}>{b.note}</p>

              <div className={styles.dogActions}>
                {/* Turns the card over. Nothing else. */}
                <span
                  className={styles.actionInfo}
                  role="button"
                  tabIndex={0}
                  aria-label={`About ${b.name}`}
                  onClick={() => setFlipped(isFlipped ? null : b.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setFlipped(isFlipped ? null : b.name);
                    }
                  }}
                >
                  i
                </span>
                {/* Opens the level. NOT WIRED YET: LineageModal and the lives,
                    streak and campaign score it needs still live inside
                    BreedStrip. That is the next stage. */}
                <button
                  type="button"
                  className={styles.actionTree}
                  aria-label={`Open the ${b.name} family tree`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="5" r="2.4" />
                    <circle cx="6" cy="18" r="2.4" />
                    <circle cx="18" cy="18" r="2.4" />
                    <path d="M12 7v3.2M6 15.6V12h12v3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
