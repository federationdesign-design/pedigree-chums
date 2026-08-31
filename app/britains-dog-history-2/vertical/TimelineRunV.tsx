"use client";

import { useEffect, useRef, useState } from "react";
import { ukBreeds } from "../../../data/uk-breeds";
/* THE GAME IS BORROWED, NOT COPIED. BreedStrip owns lives, streak, campaign
   score, the running order across all nine eras and the level window itself.
   Passing it our own markup means the slider and the live page can never hold
   two versions of those rules. Nothing about the game is written in this file.
   See the renderLevels note in BreedStrip.tsx. */
import BreedStrip, { breedCardKind, stripMatches } from "../../britains-dog-history/BreedStrip";
import { useLeaveDialog } from "../../../components/OutboundLink/LeaveDialogProvider";
import styles from "./vertical.module.css";
import { sourcesFor } from "../../../data/breedSources";

/*
  The vertical run. One dog per screen, scrolled downwards, inside a carousel
  that otherwise moves sideways.

  31 AUGUST 2026, STAGE 2: THIS RUN IS PARKED. READ THIS BEFORE EDITING.

  The description below is the HISTORY, not the current behaviour.

  It used to be a vertical scroller inside a horizontal page, which was safe:
  two axes never compete for a finger. It needed two things to hold that,
  touch-action pan-y on itself and a data-pc-vlock handshake with the page
  script, because the page converted vertical drags into sideways travel.

  The page scrolls DOWN now. That made this a vertical scroller inside a
  vertical one, with mandatory snapping on both, which traps the reader: a drag
  cannot be attributed to one scroller or the other. So its own scrolling is
  switched off in the stylesheet and only the era title screen shows this
  stage. The lock is gone with the translator it spoke to.

  STAGE 3 REBUILDS THIS AS A HORIZONTAL RAIL in the know-your-chums style,
  which puts it back on the opposite axis to the page and needs no lock at all.
  Tap to flip and tap to open a level are card state and are unaffected either
  way. Do not restore vertical scrolling here.
*/

/* Outbound references on the back of a card, top to bottom.
   PER DOG NOW (data/breedSources.ts, owner instruction 4 August): each extinct
   dog names its own sources, so there is no era gate here any more. A dog with
   no sources of its own simply shows no links. */

/* CARD_INSET was 125, the depth the card sat at down a dog screen, with the
   vertical timeline line drawn to exactly that figure so the two met.
   REMOVED at stage 3 (31 Aug 2026): there is no downward travel and no line,
   and an unused constant is an eslint error against a clean baseline. Recorded
   here rather than deleted silently, because a horizontal timeline will need
   its own equivalent and this is the number the old one used. */

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
  const { confirmLeave } = useLeaveDialog();
  const runRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLSpanElement | null>(null);
  const dotRef = useRef<HTMLSpanElement | null>(null);
  /* The yellow drag thumb under the rail. Same three refs, same names, as
     BreedStrip's own strip scrollbar, so the two read alike. */
  const railRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
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
  /* See the stage 3 note in sync: marks every card arrived exactly once. */
  const allArrived = useRef(false);

  useEffect(() => {
    const carousel = document.getElementById("vertical-carousel");
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
      /* 31 Aug 2026, STAGE 2: THE SIDEWAYS LOCK IS GONE.

         It existed to stop the reader sliding horizontally out of a run before
         the last dog. It did that by setting `data-pc-vlock`, which the drag
         translator read, and by clamping `overflowX` and writing `scrollLeft`
         back. All three are meaningless now: the translator is deleted, and
         the page has no horizontal scroll to clamp. Writing an x axis value at
         a y axis scroller could only cause harm, so none of it is written.

         The run itself is parked this stage, see .timelineRun in the
         stylesheet. Stage 3 rebuilds it as a horizontal rail, which puts it
         back on the opposite axis to the page and needs no lock at all.

         0.02 of a panel is the same tolerance the roll script uses to decide a
         panel has arrived. Keep the two in step. */
      const at = (window as unknown as { __pcPanelAt?: () => number }).__pcPanelAt;
      if (!at) return;
      const onThisPanel = Math.abs(at() - panelIndex) < 0.02;
      // Not our panel and never was: touch nothing, measure nothing.
      if (!onThisPanel && !owns) return;
      owns = onThisPanel;
      if (run.scrollTop > 4) setMoved(true);
      /* A node goes green once the reader has moved past its own row, which is
         the same rule as the head of the timeline: yellow on arrival, green
         once you are on your way again. */
      /* STAGE 3: EVERY CARD COUNTS AS ARRIVED, ONCE.

         The test below asks whether a row has come up into the bottom of a
         vertically scrolling run. There is no such scroll any more, so it can
         never be true, and the marker row and corner flash would stay hidden
         behind an animation that cannot fire. Decoration must not gate
         content, so they are all marked arrived instead.

         Guarded by a ref so it runs once rather than on every scroll frame.
         Whether the flash should replay as a card is pushed into view along the
         rail is a stage 3b question. */
      if (!allArrived.current) {
        allArrived.current = true;
        const every: Record<string, boolean> = {};
        for (const key of Object.keys(rowRefs.current)) every[key] = true;
        if (Object.keys(every).length) setArrived(every);
      }
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
      /* STAGE 3: nothing drawn. The line was a function of this run's own
         vertical scroll position, which is always zero now, and both it and the
         disc are display:none in the stylesheet. Left as a comment rather than
         deleted because a horizontal timeline may want to draw something here.
         lineRef and dotRef stay for the same reason; CARD_INSET did not, see
         the note at the top of this file. */
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
      /* Nothing to release: this run no longer writes to the carousel. Kept as
         a comment rather than deleted so it is clear the cleanup was not
         forgotten. See the stage 2 note in sync above. */
    };
  }, [panelIndex]);

  /* THE YELLOW DRAG THUMB. Lifted from BreedStrip's strip scrollbar
     (BreedStrip.tsx, the "Yellow draggable scrollbar thumb" effect) rather than
     written again, so this rail and the ones on the live page and in
     know-your-chums behave identically. Same maths, same pointer capture, same
     ResizeObserver.

     ONE ADDITION, and it is the only difference. .dogRail is
     `scroll-snap-type: x mandatory` and .stripRail is not, so dragging the
     thumb would fight the snap the whole way and land somewhere other than
     where the finger let go. Snapping is switched off for the duration of a
     thumb drag and restored on release, so the rail still snaps to a card the
     moment you let go. */
  useEffect(() => {
    const el = railRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!el || !track || !thumb) return;

    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) {
        track.style.opacity = "0";
        return;
      }
      track.style.opacity = "1";
      thumb.style.width = `${(el.clientWidth / el.scrollWidth) * 100}%`;
      thumb.style.left = `${(el.scrollLeft / el.scrollWidth) * 100}%`;
    };

    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.style.scrollSnapType = "none"; // see the note above
      thumb.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const trackW = track.clientWidth || 1;
      const max = el.scrollWidth - el.clientWidth;
      const next = startScroll + ((e.clientX - startX) / trackW) * el.scrollWidth;
      el.scrollLeft = Math.max(0, Math.min(next, max));
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      el.style.scrollSnapType = ""; // back to the stylesheet's x mandatory
    };

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    thumb.addEventListener("pointerdown", onDown);
    thumb.addEventListener("pointermove", onMove);
    thumb.addEventListener("pointerup", onUp);
    thumb.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(sync);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      thumb.removeEventListener("pointerdown", onDown);
      thumb.removeEventListener("pointermove", onMove);
      thumb.removeEventListener("pointerup", onUp);
      thumb.removeEventListener("pointercancel", onUp);
      ro.disconnect();
    };
  }, []);

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

        {/* STAGE 3: the cards go on a horizontal rail.

            The note that used to sit here said a wrapper would collapse every
            screen, because they were height: 100% of the scroller. They size to
            their own content now, so the wrapper is not only safe, it is the
            whole mechanism: .dogRail is touch-action pan-x, which is what puts
            the dogs back on the opposite axis to the page.

            The rail wraps only the CARDS. BreedStrip's own modal, lives and
            score come back alongside them and stay outside it. */}
        <BreedStrip era={era} renderLevels={(open) => (
          <>
          <div ref={railRef} className={styles.dogRail}>{breeds.map((b, bi) => {
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
                          THE SOURCE MAP IS THE GATE: a dog only shows links it
                          owns, so nothing here can end up sitting on a
                          Cockapoo. Add a dog to data/breedSources.ts to give
                          it links. */}
                      {sourcesFor(b.name).length > 0 && (
                        <span className={styles.backLinks}>
                          {sourcesFor(b.name).map((o) => (
                            <span
                              key={o.href}
                              className={`${styles.backLink} ${styles[`backLink_${o.tone}`]}`}
                              role="button"
                              tabIndex={0}
                              aria-label="Read more on another site"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmLeave(o.href);
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
        })}</div>
          {/* The only cue that the dogs move sideways. A sibling of the rail,
              not a child, exactly as .stripScrollbar is a sibling of
              .stripRail. renderLevels returns a fragment, so both land as flex
              children of .timelineRun. */}
          <div ref={trackRef} className={styles.railScrollbar} aria-hidden="true">
            <div ref={thumbRef} className={styles.railThumb} />
          </div>
          </>
        )} />
      </div>
    </div>
  );
}
