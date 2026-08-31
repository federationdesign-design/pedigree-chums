/* ============================================================================
   THE VERTICAL FORK. Created 31 August 2026, stage 1 of the vertical rebuild.

   WHY THIS EXISTS. /britains-dog-history-2 was believed to be a spare route.
   It is not. HistoryCarousel.tsx, history2.module.css, TimelineRun.tsx,
   IntroButtons.tsx and ScrubVideo.tsx all live in the -2 folder and are ALL
   rendered by the live /britains-dog-history page under 721px. Editing any of
   them in place ships straight to production mobile.

   So the vertical rebuild happens on a copy. This folder is that copy. Nothing
   in here is imported by the live page, which keeps importing HistoryCarousel
   from the folder above. /britains-dog-history-2 renders this instead.

   STAGE 1 IS A COPY AND NOTHING ELSE. The only differences from the originals
   are the import paths, the exported component names, and the element ids
   (mobile-carousel became vertical-carousel, mobile-progress became
   vertical-progress) so the two scrollers can never find each other. Behaviour
   is identical on purpose: it is the control the later stages are measured
   against.

   THIS DUPLICATION IS TEMPORARY AND MUST BE DELETED. The final stage repoints
   the live page at the vertical component and removes the horizontal one. Do
   not treat this folder as a permanent second copy: the original header on
   HistoryCarousel.tsx warns that one component rendered by both routes is the
   only thing stopping them drifting, and that warning is correct.
   ========================================================================= */

import { SECTIONS } from "../sections";
import { ERA_INTRO } from "../../../data/eraIntros";
import ScrubVideo from "./ScrubVideoV";
import TimelineRun from "./TimelineRunV";
import IntroButtons from "./IntroButtonsV";
import styles from "./vertical.module.css";

/* The horizontal carousel for Britain's dog history, extracted verbatim from
   the version-2 page so ONE component is rendered both by /britains-dog-history-2
   and by the merged /britains-dog-history under 721px. While both routes exist
   they cannot drift, because there is now only one copy of the markup, the
   script and the slide-sequencing logic.

   THE CAROUSEL SHELL IS PORTED VERBATIM from good-dog-bad-dog. The markup, the
   CSS and the inline script all carry fixes that were expensive to find the
   first time, in particular the scroll-snap-type off/on dance that iOS Safari
   needs before it will honour a programmatic scroll. Do not rewrite the script.

   Slides are built from a FLAT LIST rather than nested inside the section loop.
   The finished page is around 48 slides: one intro, nine section slides and
   thirty-eight bullet slides, and a flat list keeps the counter, the progress
   bar and the snap index reading the same single sequence. */

type Panel =
  /* `lead` is the section's opening paragraph, which gets the larger face.
     The two paragraphs used to share one slide. They are now a slide each,
     because on a phone the pair ran well past a screenful. */
  | { kind: "text"; text: string; lead: boolean }
  | { kind: "bullet"; text: string; title?: string }
  | { kind: "fact"; text: string; image: string; imageAlt?: string; imagePos?: string };

/* TEN panels per section: the opening paragraph, the second paragraph, then
   the four bullets and the four facts. Shared with the counter script and the
   video scrub, both of which convert a global panel index into a section and a
   position within it, so this is the only place the figure is written.
   It was nine until the text panel was split in two. */
const PANELS_PER_SECTION = 10;

/* How far the fact circle rides above where it is laid out, so it breaks the
   top edge of the blue panel.
   THIS IS THE AUTHORITATIVE VALUE. The roll script rewrites the circle's
   transform on every scroll frame, so a figure changed only in the CSS is
   overwritten before anyone sees it. That is exactly what happened when this
   went from 50 to 60. The CSS carries the same number as the pre-script
   starting state and points here. */
const FACT_LIFT_PX = 60;

/* THE SEQUENCE OF SLIDES.

   Panels used to be addressed with arithmetic: section k started at
   1 + k * 9. That only held while every entry in the carousel was either the
   single intro slide or a nine-panel section. The era title slide breaks it,
   and so will every one after it.

   So the running index is computed here once, at render, and written onto each
   panel as `data-pc-panel`. The counter reads that attribute instead of
   recalculating, which means adding a slide anywhere can no longer silently
   put every counter after it out by one. */
type Entry =
  | { type: "intro" }
  | { type: "timeline"; era: string; words: string[]; note: string }
  | { type: "section"; si: number };

/* The era screen at the head of each vertical run. The copy itself lives in
   data/eraIntros.ts, because the pit needs the same words for the screen it
   shows between one era and the next. */

/* Each section, then its own run. Written as a loop rather than nine listed
   pairs so inserting or reordering a section cannot leave a run behind on the
   wrong one. The running index below is computed from this, not from
   arithmetic, so the count stays right whatever this produces. */
const SEQUENCE: Entry[] = [
  { type: "intro" },
  ...SECTIONS.flatMap((s, si): Entry[] => {
    if (s.title === "Dogs in the armed forces") return [];
    const copy = s.era ? ERA_INTRO[s.era] : undefined;
    return copy && s.era
      ? [{ type: "section", si }, { type: "timeline", era: s.era, ...copy }]
      : [{ type: "section", si }];
  }),
];

function panelsFor(s: (typeof SECTIONS)[number]): Panel[] {
  return [
    { kind: "text", text: s.intro, lead: true },
    { kind: "text", text: s.detail, lead: false },
    ...s.bullets.map((b, i) => ({ kind: "bullet" as const, text: b, title: s.bulletTitles?.[i] })),
    ...s.facts.map((f) => ({ kind: "fact" as const, text: f.text, image: f.image || s.image, imageAlt: f.imageAlt, imagePos: f.imagePos })),
  ];
}

/* The sequence laid out with its running panel index. Module scope, not inside
   the component: the sequence never changes, so this is computed once at
   import rather than on every render. It also keeps a mutable accumulator out
   of render, which the compiler correctly refuses. */
const LAID_OUT = (() => {
  let cursor = 0;
  return SEQUENCE.map((entry) => {
    const count = entry.type === "section" ? PANELS_PER_SECTION : 1;
    const first = cursor;
    cursor += count;
    return { entry, first, count };
  });
})();

/* The slide straight after the intro, which is where the blue button goes.
   Read out of the laid-out sequence rather than typed as 1, so inserting a
   slide ahead of it cannot leave the button pointing at the wrong screen. */
const NEXT_PANEL = LAID_OUT.find((l) => l.entry.type !== "intro")?.first ?? 1;

export default function HistoryVertical() {
  return (
    <>
      <div className={styles.carouselWrap} id="vertical-wrap">
        <div className={styles.carousel} id="vertical-carousel">

          {/* Slide 0: intro. The hero photograph carries the whole slide
              rather than the blue gradient good-dog-bad-dog uses. A tint
              sits over it because the source image is light in the upper
              half and white display type was unreadable on it. */}
          <div className={styles.slide} data-pc-panel="0">
            <div className={styles.introSlide}>
              <div className={styles.introImg} role="img" aria-label="A black-and-white photograph of a large shepherd-type dog and a smaller sheltie nuzzling together in woodland." />
              <div className={styles.introTint} aria-hidden="true" />
              <div className={styles.introBody}>
                <h1 className={styles.introTitle}>
                  Britain&apos;s dog<br />
                  <span className={styles.titleAccent}>history</span>
                </h1>
                <p className={styles.introText}>
                  We are a nation of dog lovers now, but it was not always so. For
                  much of history Britain&apos;s dogs were worked hard, taxed, banned
                  from the streets and even maimed under harsh forest laws. This is the
                  story of how they went from tools and outcasts to the treasured
                  companions ruling our sofas today.
                </p>
                <IntroButtons nextPanel={NEXT_PANEL} />
              </div>
            </div>
          </div>

          {/* Everything after the intro, in order. A section renders as a
              sticky-topped group of nine panels; an era title renders as a
              single full-screen slide with no photograph. */}
          {LAID_OUT.map(({ entry, first }, ei) => {
            if (entry.type === "intro") return null;

            if (entry.type === "timeline") {
              return (
                <TimelineRun
                  key={`t${ei}`}
                  era={entry.era}
                  panelIndex={first}
                  words={entry.words}
                  note={entry.note}
                />
              );
            }

            const s = SECTIONS[entry.si];
            const si = entry.si;
            const prefix = s.title.slice(0, s.title.length - s.accent.length);
            const panels = panelsFor(s);
            return (
              <div key={`s${si}`} className={styles.sectionGroup}>
                <div className={styles.stickyTop}>
                  <div className={styles.slideImg}>
                    {s.video ? (
                      <ScrubVideo
                        src={s.video}
                        poster={s.image}
                        className={styles.topMedia}
                        firstPanel={first}
                        panelCount={PANELS_PER_SECTION}
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={s.image} alt={s.imageAlt} className={styles.topMedia} />
                    )}
                    {/* Sub-slide counter. The value is written by the script
                        below, because this element lives in the sticky header
                        and has to change as the panels beneath it scroll. The
                        markup carries a sensible first value so there is
                        nothing invented on screen before the script runs. */}
                    <div className={styles.slideCount} data-pc-count={si}>1 / 8</div>
                    {/* The title sits ON the photograph rather than at the top
                        of the text half. Last child so it paints over the image. */}
                    <div className={styles.slideTitleWrap}>
                      <h2 className={styles.slideTitle}>
                        {prefix}
                        <span className={styles.titleAccent}>{s.accent}</span>
                      </h2>
                    </div>
                  </div>
                </div>

                <div className={styles.panelRow}>
                  {panels.map((p, pi) => (
                    <div
                      key={pi}
                      data-pc-panel={first + pi}
                      data-pc-sec={si}
                      data-pc-sub={pi}
                      className={[
                        styles.panel,
                        p.kind === "fact" ? styles.panelFact : "",
                        p.kind !== "fact" ? styles.panelTop : "",
                      ].filter(Boolean).join(" ")}
                    >
                      {p.kind === "text" && (
                        <p className={p.lead ? styles.slideIntro : styles.slideDetail}>
                          {p.text}
                        </p>
                      )}
                      {p.kind === "bullet" && (
                        <>
                          {p.title && <p className={styles.bulletTitle}>{p.title}</p>}
                          <p className={styles.bulletText}>{p.text}</p>
                        </>
                      )}
                      {p.kind === "fact" && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className={styles.factImg}
                            src={p.image}
                            alt={p.imageAlt || ""}
                            style={p.imagePos ? { objectPosition: p.imagePos } : undefined}
                            data-pc-roll={first + pi}
                          />
                          <p className={styles.factLabel}>Did you know?</p>
                          <p className={styles.factText}>{p.text}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        </div>

        {/* Yellow progress bar */}
        <div className={styles.progress} id="vertical-progress" />
      </div>

      {/* Page script: progress bar, buttons, counter, circle roll.
          NO DRAG HANDLING AT ALL any more. touch-action: pan-y in CSS hands the
          gesture to the browser, which scrolls and snaps it natively. */}
      <script dangerouslySetInnerHTML={{ __html: `(function(){
        var carousel = document.getElementById('vertical-carousel');
        var bar = document.getElementById('vertical-progress');
        if(!carousel || !bar) return;

        /* Must match --pc-seam in the stylesheet. Change both together. */
        var SEAM = 0.52;

        /* SNAP POSITIONS ARE MEASURED, NOT CALCULATED.

           Sideways, every snap step was exactly one clientWidth, so a panel
           index was scrollLeft / width and five functions did that division.
           Downwards the step is NOT uniform: a section panel is a screen minus
           the seam, an intro or era screen is a whole screen. Dividing by
           clientHeight would drift further out of true with every section and
           put the counter, the bar and the video scrub on different panels.

           So each panel's own settled scroll position is measured once from the
           laid-out DOM and everything reads this table instead. Re-measured on
           resize and on load, because a late font or image changes heights. */
        var positions = [];
        function measure(){
          var h = carousel.clientHeight;
          if (!h) return;
          var base = carousel.getBoundingClientRect().top;
          var here = carousel.scrollTop;
          var els = carousel.querySelectorAll('[data-pc-panel]');
          var next = [];
          for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var n = parseInt(el.getAttribute('data-pc-panel'), 10);
            if (isNaN(n)) continue;
            /* Distance from the top of the scroller's content. */
            var top = el.getBoundingClientRect().top - base + here;
            /* A section panel settles with the photograph above it, so its
               scroll position is the seam higher than its own top edge. This
               is the script's half of scroll-margin-top in the CSS. */
            var off = el.getAttribute('data-pc-sec') !== null ? h * SEAM : 0;
            next[n] = top - off;
          }
          if (next.length) positions = next;
        }

        /* Fractional panel index. Whole numbers are settled panels, the
           fraction is how far through the move to the next one we are, which
           is what the circle roll and the video scrub need. */
        function panelAt(){
          var last = positions.length - 1;
          if (last < 1) return 0;
          var y = carousel.scrollTop;
          if (y <= positions[0]) return 0;
          for (var i = 0; i < last; i++) {
            var a = positions[i], b = positions[i + 1];
            if (a === undefined || b === undefined) continue;
            if (y < b) return b > a ? i + (y - a) / (b - a) : i;
          }
          return last;
        }
        /* Published so ScrubVideoV and TimelineRunV read the SAME index this
           script does, rather than each re-deriving it from the scroll offset
           and disagreeing at the edges. */
        window.__pcPanelAt = panelAt;

        function update() {
          var max = carousel.scrollHeight - carousel.clientHeight;
          bar.style.width = (max > 0 ? (carousel.scrollTop / max) * 100 : 0) + '%';
        }
        /* THE SEAM ONLY EXISTS ON SECTION SLIDES. A section is a photograph
           over blue text and the bar sits on the join. The intro, the era
           screens and the runs have no such join, so on those the bar drops
           back to the floor rather than ruling a line across open artwork.
           It reads the settled panel the same way the dog counter does: no
           data-pc-sec means the panel is not part of a section. */
        function placeBar() {
          var g = Math.round(panelAt());
          var panel = document.querySelector('[data-pc-panel="' + g + '"]');
          if (!panel) return;
          var onSeam = panel.getAttribute('data-pc-sec') !== null;
          bar.classList.toggle('${styles.progressFloor}', !onSeam);
        }
        /* Sub-slide counter. It reads the settled panel's own attributes
           rather than deriving them from a modulus. The modulus was only
           correct while every carousel child was one slide or nine, which
           stopped being true the moment an era title was inserted. Panels
           that are not part of a section carry no data-pc-sec, so the
           counters are left alone on those. */
        var counters = document.querySelectorAll('[data-pc-count]');
        function updateCount() {
          var g = Math.round(panelAt());
          var panel = document.querySelector('[data-pc-panel="' + g + '"]');
          if (!panel) return;
          var sec = panel.getAttribute('data-pc-sec');
          if (sec === null) return;
          var el = counters[parseInt(sec, 10)];
          if (!el) return;
          var sub = parseInt(panel.getAttribute('data-pc-sub'), 10);
          /* Subs 0 and 1 are the section's two text slides. The counter is
             about the EIGHT content cards after them, four bullets and four
             facts, so it stays hidden on both and starts at one on the first
             bullet. It tested sub against 0 while the text was one slide.
             NO BACKTICKS IN HERE: this whole script is a template literal
             and a backtick in a comment closes it. */
          if (sub <= 1) { el.style.visibility = 'hidden'; return; }
          el.style.visibility = '';
          el.textContent = (sub - 1) + ' / 8';
        }

        /* CIRCLE ROLL-IN, driven by scroll POSITION rather than by a timer.
           The old version waited for the carousel to settle and then ran a
           keyframe animation, which meant the circle arrived after the swipe
           had already finished, and it was cleared to nothing the moment the
           next swipe began, so it vanished rather than leaving with its own
           panel. Position-driven fixes both: the roll is a function of how
           far the panel is from centre, so it starts the instant the finger
           moves and is complete the instant the panel lands.

           It rolls IN from the left on approach, and once it has arrived it
           stays put and simply travels off with the rest of the panel. That
           is why the arrived flag exists: without it the roll would run
           on the way out, and the circle would slide the wrong way against
           the text beside it. */
        var ROLL_TURN_DEG = 229;   /* one panel of travel for a circle half a
                                      panel wide: 1 / (pi x 0.5) of a turn */
        var rollEls = document.querySelectorAll('[data-pc-roll]');

        /* The circle still rolls in from the LEFT even though the page now
           moves down. That is deliberate and unchanged: the panel is stationary
           on the x axis, so a circle rolling across it still reads as a circle
           rolling, and it arrives and leaves with its own panel exactly as
           before. Only the input changed, from a division to the table. */
        function updateRoll() {
          var w = carousel.clientWidth;
          if (!w) return;
          var here = panelAt();
          for (var i = 0; i < rollEls.length; i++) {
            var el = rollEls[i];
            var off = here - parseFloat(el.getAttribute('data-pc-roll'));
            var d = Math.abs(off);
            var t;
            if (d >= 1) {
              el.removeAttribute('data-pc-arrived');   /* off screen, re-arm */
              t = 0;
            } else if (el.hasAttribute('data-pc-arrived')) {
              t = 1;                                    /* riding with the panel */
            } else {
              t = 1 - d;
              if (d < 0.02) el.setAttribute('data-pc-arrived', '1');
            }
            var x = -(1 - t) * w;                       /* enters from the LEFT */
            var a = -(1 - t) * ROLL_TURN_DEG;           /* clockwise, ie rolling right */
            el.style.transform = 'translate(' + x.toFixed(1) + 'px, -${FACT_LIFT_PX}px) rotate(' + a.toFixed(1) + 'deg)';
            el.style.opacity = t.toFixed(3);
          }
        }

        var rollQueued = false;
        carousel.addEventListener('scroll', function(){
          update(); updateCount(); placeBar();
          /* The roll writes styles on up to 36 elements, so it is thrown onto
             the next frame rather than run inside the scroll event. */
          if (!rollQueued) {
            rollQueued = true;
            requestAnimationFrame(function(){ rollQueued = false; updateRoll(); });
          }
        }, { passive: true });
        function refresh(){ update(); updateCount(); placeBar(); updateRoll(); }
        measure();
        refresh();

        /* ================= REMOVE BEFORE STAGE 3 =================
           DIAGNOSTIC ONLY, and only on ?diag=1. The fact circles did not appear
           after the axis flip. The only thing that changed for them is the
           input to updateRoll, which went from a live division to a reading of
           the measured positions table, so this prints the table and what the
           circles are being told. Nothing here runs on a normal visit.
           ========================================================= */
        if (location.search.indexOf('diag=1') > -1) {
          var dg = document.createElement('div');
          dg.setAttribute('style', 'position:fixed;left:0;bottom:0;z-index:99;background:#000;color:#0f0;font:11px/1.4 monospace;padding:6px 8px;white-space:pre-wrap;pointer-events:none;max-width:100vw;');
          document.body.appendChild(dg);
          var nPanels = carousel.querySelectorAll('[data-pc-panel]').length;
          var diag = function(){
            var five = [];
            for (var k = 0; k < 5 && k < positions.length; k++) five.push(Math.round(positions[k]));
            dg.textContent =
              'clientH ' + carousel.clientHeight +
              ' | scrollTop ' + Math.round(carousel.scrollTop) +
              ' | scrollH ' + carousel.scrollHeight +
              ' | panels ' + nPanels +
              ' | pos.len ' + positions.length +
              ' | pos0-4 ' + five.join(',') +
              ' | panelAt ' + panelAt().toFixed(2) +
              ' | rollEls ' + rollEls.length +
              ' | roll0op ' + (rollEls[0] ? (rollEls[0].style.opacity || 'unset') : 'none');
          };
          carousel.addEventListener('scroll', diag, { passive: true });
          window.addEventListener('load', diag);
          window.addEventListener('resize', diag);
          diag();
        }
        /* Heights move after this script runs: web fonts land, the section
           photographs decode, the address bar settles. Each of those shifts
           every snap position below it, so the table is rebuilt. */
        window.addEventListener('resize', function(){ measure(); refresh(); });
        window.addEventListener('load', function(){ measure(); refresh(); });

        function goTo(idx) {
          /* Re-queried each time so the handler still works if React has
             replaced these nodes during hydration. */
          var c = document.getElementById('vertical-carousel');
          if (!c) return;
          /* Panels, not sections: a top-level child is now a whole section
             group nine panels wide, so counting children under-counted by
             nine and clamped every jump into the first section. */
          /* Measured fresh: a button can be pressed before the load handler
             has run, and a stale table would jump to the wrong screen. */
          measure();
          var last = positions.length - 1;
          if (idx < 0) idx = 0;
          if (idx > last) idx = last;
          var target = positions[idx];
          if (target === undefined) return;
          var from = c.scrollTop;
          /* scroll-snap-type mandatory blocks programmatic smooth scrolling on
             iOS Safari, which is why this button did nothing while native
             swiping worked. Still true on the y axis. */
          c.style.scrollSnapType = 'none';
          c.scrollTo({ top: target, behavior: 'smooth' });
          /* If smooth scrolling was ignored outright, jump there instead. */
          setTimeout(function(){
            if (Math.abs(c.scrollTop - from) < 2) c.scrollTop = target;
          }, 400);
          setTimeout(function(){ c.style.scrollSnapType = ''; }, 700);
        }

        /* Delegated rather than bound directly, so the button keeps working
           even if its node is re-created after this script has run. */
        /* Leaving the pit from its share screen comes back to the very first
           slide, the title and the two ways in, rather than to whatever panel
           the player happened to open the level from. LineageModal fires this as
           it closes; on any page without this carousel it is simply ignored. */
        window.addEventListener('pc:history-home', function(){ goTo(0); });

        document.addEventListener('click', function(e){
          var t = e.target;
          if (!t || !t.closest) return;
          if (t.closest('#intro-next-btn')) { goTo(1); return; }
          /* Any button carrying a target index scrolls to it. The index is
             worked out from the laid-out sequence, not typed in here. */
          var g = t.closest('[data-goto]');
          if (g) {
            var n = parseInt(g.getAttribute('data-goto'), 10);
            if (!isNaN(n)) goTo(n);
          }
        });

        /* THE DRAG TRANSLATOR WAS HERE AND IS GONE (31 August 2026, stage 2).

           It listened for a vertical drag and converted it into horizontal
           movement at a gain of 1.6, then hand-rolled its own flick velocity,
           its own snap arithmetic and the scroll-snap-type off/on dance needed
           to make a programmatic scroll stick on iOS. About sixty lines of it.

           All of that was a re-implementation of scrolling. The page moves the
           way the finger moves now, so touch-action pan-y hands the whole job
           back to the browser: real momentum, real snapping, real rubber
           banding, and nothing to keep in step.

           NO BACKTICKS IN HERE. This whole script is a template literal and a
           backtick in a comment closes it. Writing one is exactly how this
           broke while the note above was being added.

           DO NOT BRING IT BACK. If a drag feels wrong, the fix is in the CSS
           snap properties, not in a listener. */

      })();` }} />
    </>
  );
}
