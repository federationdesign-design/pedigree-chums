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

/* Outbound references on the back of a card, top to bottom.
   The utm_source=chatgpt.com parameter has been stripped from the two new
   links: it is an artefact of where they were found and would send a false
   referrer. Say if you want it kept. */
const OUTBOUND: { href: string; tone: "blue" | "green" | "black" }[] = [
  { href: "https://penelope.uchicago.edu/Thayer/e/roman/texts/strabo/4e%2A.html", tone: "blue" },
  { href: "https://www.gutenberg.org/cache/epub/78013/pg78013-images.html", tone: "green" },
  { href: "https://en.wikipedia.org/wiki/List_of_extinct_dog_breeds", tone: "black" },
];

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
  /* True once the reader has moved at all. Turns the head of the rail green. */
  const [moved, setMoved] = useState(false);
  /* The outbound link awaiting confirmation, or null. */
  const [leaving, setLeaving] = useState<string | null>(null);
  const runRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<HTMLSpanElement | null>(null);

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
      if (run.scrollTop > 4) setMoved(true);
      /* The line is drawn by the scroll rather than faded in. Full length by
         the time one screen has passed, which is where the next leg takes
         over. */
      const bar = startRef.current;
      if (bar) {
        /* Complete after HALF a screen, not a whole one. At a full screen the
           line was still part drawn when the next screen's leg arrived, which
           read as two lines with a gap between them. */
        const p = Math.min(1, Math.max(0, run.scrollTop / ((run.clientHeight || 1) * 0.5)));
        bar.style.setProperty("--pc-grow", p.toFixed(3));
      }
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
      {/* Our own leave notice. The browser's confirm cannot be branded, and a
          panel inside the card would sit in a rotated, backface-hidden box.
          This is fixed to the viewport instead, clear of all of that. */}
      {leaving && (
        <div className={styles.leaveWrap} role="dialog" aria-modal="true">
          <div className={styles.leaveCard}>
            <p className={styles.leaveText}>
              You are about to be linked to another site (and dogs), and we can&apos;t
              control anything from this point. Remember to come back and carry on
              exploring
            </p>
            <div className={styles.leaveRow}>
              <button
                type="button"
                className={styles.leaveGo}
                onClick={() => {
                  window.open(leaving, "_blank", "noopener,noreferrer");
                  setLeaving(null);
                }}
              >
                Off we go
              </button>
              <button type="button" className={styles.leaveStay} onClick={() => setLeaving(null)}>
                Stay here
              </button>
            </div>
          </div>
        </div>
      )}
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
          {/* Disc and line sit IN THE FLOW, under the text, inside a wrapper
              that takes whatever height is left. That is what stops the disc
              landing on the paragraph: it can no longer be placed anywhere the
              words already are. The wrapper is not scaled, so the disc keeps its
              shape while the line draws itself. */}
          <span className={styles.railHead} aria-hidden="true">
            <span className={`${styles.railDot} ${moved ? styles.railDotGo : ""}`} />
            <span ref={startRef} className={styles.railStart} />
          </span>
        </div>

        {breeds.map((b) => {
          const isFlipped = flipped === b.name;
          return (
            <div key={b.name} className={styles.dogScreen}>
              {/* The rail arrives, stops at the card, and begins again below
                  the marker. Both legs are flex children that take the
                  leftover space, so they meet the card and the row exactly
                  with nothing measured. */}
              <span className={styles.railLeg} aria-hidden="true" />
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
                    <span className={`${styles.dogFront} ${isFlipped ? styles.dogFrontOff : ""}`}>
                      {b.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={b.image} alt={b.name} className={styles.dogThumb} draggable={false} />
                      ) : (
                        <span className={styles.dogThumb} />
                      )}
                      {/* The family tree glyph, copied from .lineageBadge */}
                      {/* Turns the card over. Replaces the tree glyph that
                          used to sit here, which did nothing. */}
                      <span
                        className={styles.frontFlip}
                        role="button"
                        tabIndex={0}
                        aria-label={`About ${b.name}`}
                        onClick={(e) => { e.stopPropagation(); setFlipped(b.name); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFlipped(b.name); }
                        }}
                      />
                      {/* The name sits ON the picture, above the status bar. */}
                      <span className={styles.dogNameOver}>{b.name}</span>
                      {b.tag && (
                        <span className={`${styles.dogTag} ${styles[`dogTag_${b.tag.replace("-", "")}`] ?? ""}`}>
                          {TAG_LABEL[b.tag] ?? b.tag}
                        </span>
                      )}
                    </span>
                    <span className={styles.dogBack}>
                      <span className={styles.dogHint}>
                        Tap to learn about this dog
                      </span>
                      <span className={styles.dogNote}>{b.note}</span>
                      {/* Top left: back to the picture. */}
                      <span
                        className={styles.backFlip}
                        role="button"
                        tabIndex={0}
                        aria-label="Turn the card back"
                        onClick={(e) => { e.stopPropagation(); setFlipped(null); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFlipped(null); }
                        }}
                      >
                      </span>
                      {/* Top right: away to other sites, each with a warning
                          first. A native confirm rather than a panel of our
                          own: it cannot be missed and it cannot be clipped by
                          the card's 3D transform. */}
                      <span className={styles.backLinks}>
                        {OUTBOUND.map((o) => (
                          <span
                            key={o.href}
                            className={`${styles.backLink} ${styles[`backLink_${o.tone}`]}`}
                            role="button"
                            tabIndex={0}
                            aria-label="Read more on another site"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLeaving(o.href);
                            }}
                          >
                            i
                          </span>
                        ))}
                      </span>
                      <span className={styles.dogSub}>
                        There dogs you know today came from this lineage route,
                        discover them here
                      </span>
                    </span>
                  </span>
                </button>


              </div>
              <div className={styles.markerRow}>
                {/* Opens the level. NOT WIRED YET: LineageModal and the lives,
                    streak and campaign score it needs still live inside
                    BreedStrip. */}
                <button
                  type="button"
                  className={styles.markerTree}
                  aria-label={`Open the ${b.name} family tree`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="5" r="2.4" />
                    <circle cx="6" cy="18" r="2.4" />
                    <circle cx="18" cy="18" r="2.4" />
                    <path d="M12 7v3.2M6 15.6V12h12v3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>
                <span className={styles.markerDot} aria-hidden="true" />
                {/* Turns the card over. Nothing else. */}
                <span
                  className={styles.markerInfo}
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
              </div>
              <span className={styles.railLeg} aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
