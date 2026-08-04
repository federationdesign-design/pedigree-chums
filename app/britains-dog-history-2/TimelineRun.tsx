"use client";

import { useEffect, useRef, useState } from "react";
import { ukBreeds } from "../../data/uk-breeds";
/* THE GAME IS BORROWED, NOT COPIED. BreedStrip owns lives, streak, campaign
   score, the running order across all nine eras and the level window itself.
   Passing it our own markup means the slider and the live page can never hold
   two versions of those rules. Nothing about the game is written in this file.
   See the renderLevels note in BreedStrip.tsx. */
import BreedStrip, { breedCardKind, stripMatches } from "../britains-dog-history/BreedStrip";
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

/* Which runs show the three links above. They are ancient-medieval sources, so
   they show on ancient-medieval and nowhere else until the other eras have
   links of their own. Add an era to this list, do not widen OUTBOUND. */
const OUTBOUND_ERAS = ["ancient-medieval", "ancient", "medieval"];

/* How far down a dog screen the card sits. The line is drawn to exactly this
   depth, so the two meet. */
const CARD_INSET = 125;

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
  const breeds = ukBreeds.filter((b) => stripMatches(b.strip, era)).sort((a, b) => a.anchor - b.anchor);
  const [flipped, setFlipped] = useState<string | null>(null);
  /* Bumped every time a card turns. The marker row's hop animation is keyed off
     whether this is odd or even, which is what restarts it: re-applying the
     same class does not replay a CSS animation, and alternating between two
     identical ones does, without remounting the row and losing its ref.
     A dog with no entry here has never been flipped, so it never hops on load. */
  const [hop, setHop] = useState<Record<string, number>>({});
  /* THE ONLY WAY TO TURN A CARD. Six call sites used to set the flip state
     directly, so any new one would silently miss the hop. */
  const turnCard = (name: string, to: string | null) => {
    setFlipped(to);
    setHop((h) => ({ ...h, [name]: (h[name] ?? 0) + 1 }));
  };
  /* True once the reader has moved at all. Turns the head of the rail green. */
  const [moved, setMoved] = useState(false);
  /* The outbound link awaiting confirmation, or null. */
  const [leaving, setLeaving] = useState<string | null>(null);
  const runRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLSpanElement | null>(null);
  const dotRef = useRef<HTMLSpanElement | null>(null);
  /* Marker rows that have arrived on screen, so their three icons pop in as
     the reader reaches them rather than all at once on load.

     DRIVEN BY SCROLL POSITION, NOT AN INTERSECTION OBSERVER. The observer
     version never fired and the icons stayed at opacity 0, which read as the
     marker row being missing entirely. `passed` below has always worked off
     scrollTop, so arrival now uses the same proven measure a few lines away
     rather than a second mechanism that can fail on its own. */
  const [arrived, setArrived] = useState<Record<string, boolean>>({});
  /* Rows the reader has scrolled on from. Their node turns green, exactly as
     the one at the head of the timeline does. */
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const carousel = document.getElementById("mobile-carousel");
    const run = runRef.current;
    if (!carousel || !run) return;
    let queued = false;
    /* ONE OWNER AT A TIME. Every run on the page listens to the same carousel
       and writes the same attribute and the same overflow. With nine of them
       the last listener to fire wins, which is whichever mounted last, so
       eight runs would have their lock stamped out by a run that is nowhere
       near the screen.

       A run touches the carousel only while it is the live panel, plus the one
       frame it takes to hand back. Everything else returns immediately, which
       also keeps ninety marker rows from being measured on every scroll. */
    let owns = false;

    const sync = () => {
      queued = false;
      const w = carousel.clientWidth;
      if (!w) return;
      /* SETTLED, NOT MERELY NEAREST. This was Math.round, which reports THIS
         panel from the moment a sideways swipe is half done. The lock then
         engaged mid-move, clamped overflowX and wrote scrollLeft back, which
         pinned the carousel exactly halfway between two panels. It could not
         recover: releasing needs either a different panel or the run scrolled
         to its last dog, and neither can happen while it is pinned.

         0.02 of a panel is the same tolerance the roll script in page.tsx
         uses to decide a panel has arrived. Keep the two in step. */
      const pos = carousel.scrollLeft / w;
      const onThisPanel = Math.abs(pos - panelIndex) < 0.02;
      // Not our panel and never was: touch nothing, measure nothing.
      if (!onThisPanel && !owns) return;
      // 2px of slack: sub-pixel scroll positions never land exactly on the end.
      const atBottom = run.scrollTop >= run.scrollHeight - run.clientHeight - 2;
      const lock = onThisPanel && !atBottom;
      owns = onThisPanel;
      carousel.setAttribute("data-pc-vlock", lock ? "1" : "0");
      /* The attribute alone only stops TOUCH: the script reads it in its
         touchmove handler. A trackpad, a mouse wheel or a keyboard scrolls the
         carousel natively and never reaches that handler, which is how the
         reader could slide sideways out of the run before reaching the last
         dog. Clamping overflow is what actually holds them. scrollLeft is
         written back because changing overflow can reset it.

         Locking pins to the panel's EXACT position rather than to wherever it
         had reached. Within the tolerance above that is a correction of a few
         pixels at most, and it means a lock can never freeze the carousel
         part way between two panels however it was entered. */
      const keep = lock ? panelIndex * w : carousel.scrollLeft;
      const want = lock ? "hidden" : "";
      if (carousel.style.overflowX !== want || (lock && carousel.scrollLeft !== keep)) {
        carousel.style.overflowX = want;
        carousel.scrollLeft = keep;
      }
      if (run.scrollTop > 4) setMoved(true);
      /* A node goes green once the reader has moved past its own row, which is
         the same rule as the head of the timeline: yellow on arrival, green
         once you are on your way again. */
      const rows = rowRefs.current;
      for (const key of Object.keys(rows)) {
        const el = rows[key];
        if (!el) continue;
        /* Arrived: the row's top has come up into the bottom of the view. The
           icons pop from here. */
        if (el.offsetTop < run.scrollTop + run.clientHeight * 0.92) {
          setArrived((av) => (av[key] ? av : { ...av, [key]: true }));
        }
        if (run.scrollTop > el.offsetTop - run.clientHeight * 0.35) {
          setPassed((pv) => (pv[key] ? pv : { ...pv, [key]: true }));
        }
      }
      /* ONE line for the whole run. Its top is pinned to the disc and its
         length is simply how far you have scrolled plus the card's own inset,
         so its end always sits exactly where the next card's top edge is.
         That is what makes it touch the card at the moment the scroll settles,
         and it cannot read as two lines because there is only one. */
      const line = lineRef.current;
      const dot = dotRef.current;
      if (line && dot) {
        const top = dot.offsetTop + dot.offsetHeight;
        line.style.top = `${top}px`;
        line.style.height = `${Math.max(0, run.scrollTop + CARD_INSET - top)}px`;
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
      /* Never leave the rest of the page locked if this unmounts mid-scroll.
         Guarded by ownership: a run unmounting while a different one holds the
         lock must not release it on that run's behalf. */
      if (owns) {
        carousel.setAttribute("data-pc-vlock", "0");
        carousel.style.overflowX = "";
      }
    };
  }, [panelIndex]);

  /* How many of this run's dogs open a level. breedCardKind is pure, so it is
     safe to call here, and it is the same answer the card itself uses. */
  const playable = breeds.filter((b) => breedCardKind(b.name) === "play").length;
  /* Written once and drawn twice, by the outline copy and the solid one. Two
     hand-kept copies of the same markup would drift, and the halo would stop
     lining up with the letters it is meant to sit behind. */
  const countLockup = (
    <>
      <span className={`${styles.eraCountCol} ${styles.eraCountSmall}`}>
        <span className={styles.eraCountNum}>{playable}</span>
        <span className={styles.eraCountWord}>Playable</span>
      </span>
      <span className={styles.eraCountSlash}>/</span>
      <span className={styles.eraCountCol}>
        <span className={styles.eraCountNum}>{breeds.length}</span>
        <span className={styles.eraCountWord}>Dogs</span>
      </span>
    </>
  );

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
        <span ref={lineRef} className={styles.runLine} aria-hidden="true" />
        {/* Screen one: the era title, then the line that introduces the
            timeline below it. */}
        <div className={styles.eraScreen}>
          {/* Held in a band exactly as deep as a section's photograph, and
              bottom aligned inside it, so this title lands where the section
              titles land instead of at a fixed distance from the top. */}
          <span className={styles.eraTitleBand}>
            {words.map((w, wi) => (
              <span key={wi} className={styles.eraWord}>
                {w}
              </span>
            ))}
          </span>
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
            <span ref={dotRef} className={`${styles.railDot} ${moved ? styles.railDotGo : ""}`} />
            {/* The scroll-down cue. ERA SCREEN ONLY, and it goes the moment the
                reader moves. It has to: .runLine grows from this same disc down
                the middle of the screen, so a cue that stayed would sit beside
                it and read as two lines, which is the exact fault the per-screen
                legs caused before. */}
            <span className={`${styles.railCue} ${moved ? styles.railCueOff : ""}`} />
            </span>

          {/* TWO FIGURES: how many of this run's dogs open a level, and how
              many there are in total. Both read from the data, so neither can go
              stale when a breed is added, and the playable one asks
              breedCardKind, the same answer the card itself uses, so the count
              and the cards can never disagree. Era screen only. */}
          <span
            className={styles.eraCount}
            aria-label={`${playable} playable of ${breeds.length} dogs`}
          >
            {/* The outline is a second copy sitting behind the solid one.
                -webkit-text-stroke on its own draws the stroke CENTRED on the
                letter edge, which eats half the black away. Two copies keep the
                letterform at full weight with the white entirely outside it.
                Both copies carry the SAME markup, or the halo drifts off the
                letters it is meant to sit behind. */}
            <span className={styles.eraCountOutline} aria-hidden="true">{countLockup}</span>
            <span className={styles.eraCountFill} aria-hidden="true">{countLockup}</span>
          </span>
        </div>

        {/* A fragment comes back from BreedStrip, so these screens stay DIRECT
            children of the scroller. They are height: 100% of it and a wrapper
            here would collapse every one of them. */}
        <BreedStrip era={era} renderLevels={(open) => breeds.map((b, bi) => {
          const isFlipped = flipped === b.name;
          /* undefined for a dog with no level. 62 of the 97 open one, 28 go to
             their own breed page, and 7 flip only, which is the live page's
             rule and not something decided here. */
          const openLevel = open(b);
          /* Learn, play or neither. The flash and the tap read the same answer,
             so a card cannot advertise a level it will not open. */
          const kind = breedCardKind(b.name);
          /* The foot of the run. Its node stops meaning "carry on down" and
             starts meaning "carry on sideways", so it moves to the right edge
             and turns to face that way. */
          const isLast = bi === breeds.length - 1;
          /* THE FLASH ONLY ANIMATES ON A CHANGE. Running the slide and pop on
             every card made it wallpaper: seven play cards in a row all did the
             same thing and it stopped meaning anything. It now fires only when
             this card's badge differs from the one above it, so the movement
             marks the moment the answer changes from "learn and play" to
             "learn" or back.
             The first card of a run always animates: there is nothing above it
             to be the same as. */
          const flashChanged = bi === 0 || breedCardKind(breeds[bi - 1].name) !== kind;
          const flashIn = arrived[b.name] && flashChanged;
          return (
            <div key={b.name} className={styles.dogScreen}>
              {/* The rail arrives, stops at the card, and begins again below
                  the marker. Both legs are flex children that take the
                  leftover space, so they meet the card and the row exactly
                  with nothing measured. */}
              <div className={styles.dogCard}>
                {/* The whole card is the target: tapping anywhere opens the
                    level. The information icon sits OUTSIDE this button rather
                    than inside it, because a button inside a button is invalid
                    and browsers resolve it unpredictably.
                    The photograph, the name and the green pill are all inside
                    this one button, so all three open the level with a single
                    handler. The flip controls and the three outbound circles
                    each stop the event, so they still do only their own job. */}
                <button
                  type="button"
                  className={styles.dogFlipCard}
                  onClick={openLevel}
                  aria-label={openLevel ? `Open the ${b.name} level` : undefined}
                >
                  <span
                    className={styles.dogFlipInner}
                    style={isFlipped ? { transform: "rotateY(180deg)" } : undefined}
                  >
                    <span className={`${styles.dogFront} ${isFlipped ? styles.dogFrontOff : ""}`}>
                      {b.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={b.image}
                          alt={b.name}
                          className={styles.dogThumb}
                          draggable={false}
                          /* Ninety of these across the nine runs. Without this
                             every one downloads on page open, whether or not
                             the reader ever swipes to that era. */
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className={styles.dogThumb} />
                      )}
                      {/* The corner flash. The supplied SVGs are the LETTERING
                          ONLY, white paths with no ground, so the yellow wedge
                          is drawn here and the words are laid over it. They are
                          separate elements on purpose: the words overhang the
                          diagonal onto the photograph, so clipping them to the
                          wedge would cut them off.
                          Inside the photo face, so the card's rounded corner
                          clips the wedge and the whole thing turns away with
                          the picture. */}
                      {/* The yellow ground. STAYS INSIDE the photo face, so
                          .dogFront's overflow and radius clip it to the card's
                          rounded corner. The lettering does NOT live here, see
                          .dogFlash further down: it breaks out past the card
                          edges and would be sliced by that same clip. */}
                      {kind && (
                        <span
                          className={`${styles.dogFlashWedge} ${flashIn ? styles.dogFlashWedgeIn : ""}`}
                          aria-hidden="true"
                        />
                      )}
                      {/* The family tree glyph, copied from .lineageBadge */}
                      {/* Turns the card over. Replaces the tree glyph that
                          used to sit here, which did nothing. */}
                      <span
                        className={styles.frontFlip}
                        role="button"
                        tabIndex={0}
                        aria-label={`About ${b.name}`}
                        onClick={(e) => { e.stopPropagation(); turnCard(b.name, b.name); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); turnCard(b.name, b.name); }
                        }}
                      />
                      {/* The name sits ON the picture, above the status bar. */}
                      <span className={styles.dogNameOver}>{b.name}</span>
                      {/* The last dog of the era, and only that one. It sits in
                          the band between the name and the status bar. */}
                      {isLast && (
                        <span className={styles.dogEraEnd} aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element -- a small fixed-height SVG, next/image buys nothing */}
                          <img src="/endofanera-icon.svg" alt="" className={styles.dogEraEndImg} />
                        </span>
                      )}
                      {b.tag && (
                        <span className={`${styles.dogTag} ${styles[`dogTag_${b.tag.replace("-", "")}`] ?? ""}`}>
                          {TAG_LABEL[b.tag] ?? b.tag}
                        </span>
                      )}
                    </span>
                    <span
                      className={`${styles.dogBack} ${isFlipped ? "" : styles.dogBackFolded}`}
                    >
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
                        onClick={(e) => { e.stopPropagation(); turnCard(b.name, null); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); turnCard(b.name, null); }
                        }}
                      >
                      </span>
                      {/* Top right: away to other sites, each with a warning
                          first. A native confirm rather than a panel of our
                          own: it cannot be missed and it cannot be clipped by
                          the card's 3D transform.
                          ANCIENT-MEDIEVAL ONLY. Strabo, Gutenberg and a list of
                          extinct breeds are that era's sources. On the other
                          eight runs they would be sitting on a Cockapoo. Add an
                          era here once it has links of its own. */}
                      {/* Ancient-medieval only, and only on a dog that has a level.
                          A dog that sends you to its own breed page has no
                          lineage to read around. */}
                      {kind === "play" && OUTBOUND_ERAS.includes(era) && (
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
                              <span className={styles.backLinkIcon} aria-hidden="true" />
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    {/* THE FLASH LETTERING, a third layer in the same grid cell
                        as the two faces. It sits here rather than inside the
                        photo face because it deliberately breaks out past the
                        card's top and left edges, and .dogFront clips anything
                        inside it to the rounded corner.
                        Being a child of .dogFlipInner it still turns away with
                        the card, which a layer parked on .dogCard would not. */}
                    {kind && (
                      <span
                        className={`${styles.dogFlash} ${flashIn ? styles.dogFlashPop : ""}`}
                        aria-hidden="true"
                      >
                        <span
                          className={kind === "play" ? styles.dogFlashPlay : styles.dogFlashLearn}
                        />
                      </span>
                    )}
                  </span>
                </button>


              </div>
              <div
                className={[
                  styles.markerRow,
                  arrived[b.name] ? styles.markerIn : "",
                  /* Alternating classes, so the same animation replays on every
                     turn. No class at all until the card has been flipped once,
                     or all eleven would hop on page load. */
                  hop[b.name] ? (hop[b.name] % 2 ? styles.markerHopA : styles.markerHopB) : "",
                ].filter(Boolean).join(" ")}
                data-dog={b.name}
                ref={(el) => { rowRefs.current[b.name] = el; }}
              >
                {/* Opens the level at its start screen, the same handler the
                    card itself uses.
                    A dog with no level KEEPS ITS BOX and is hidden rather than
                    removed. The row is centred, so dropping a 40px button would
                    shift the yellow disc 30px off the timeline line that runs
                    down the middle of the screen. */}
                <button
                  type="button"
                  className={`${styles.markerTree} ${kind === "play" ? "" : styles.markerTreeOff}`}
                  onClick={kind === "play" ? openLevel : undefined}
                  aria-hidden={kind === "play" ? undefined : true}
                  tabIndex={kind === "play" ? undefined : -1}
                  aria-label={kind === "play" ? `Open the ${b.name} level` : undefined}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="5" r="2.4" />
                    <circle cx="6" cy="18" r="2.4" />
                    <circle cx="18" cy="18" r="2.4" />
                    <path d="M12 7v3.2M6 15.6V12h12v3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>
                {/* HIDDEN, NOT REMOVED, on the last dog. The row is centred, so
                    dropping the disc out of the flow would close the gap and
                    slide the tree and information icons inward, breaking the
                    column they hold down the whole run. It keeps its box, and
                    the end node is drawn separately at the right edge. */}
                <span
                  className={`${styles.markerDot} ${passed[b.name] ? styles.markerDotGo : ""} ${isLast ? styles.markerDotOff : ""}`}
                  aria-hidden="true"
                />
                {isLast && (
                  <span
                    className={`${styles.markerDot} ${styles.markerDotEnd}`}
                    aria-label="Swipe on to the next section"
                  />
                )}
                {/* Turns the card over. Nothing else. */}
                <span
                  className={styles.markerInfo}
                  role="button"
                  tabIndex={0}
                  aria-label={`About ${b.name}`}
                  onClick={() => turnCard(b.name, isFlipped ? null : b.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      turnCard(b.name, isFlipped ? null : b.name);
                    }
                  }}
                >
                  i
                </span>
              </div>
            </div>
          );
        })} />
      </div>
    </div>
  );
}
