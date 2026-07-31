import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import { SECTIONS } from "./sections";
import { ERA_INTRO } from "../../data/eraIntros";
import ScrubVideo from "./ScrubVideo";
import TimelineRun from "./TimelineRun";
import IntroButtons from "./IntroButtons";
import styles from "./history2.module.css";

export const metadata: Metadata = {
  title: "Britain's Dog History",
  description:
    "How Britain became a nation of dog lovers: from working dogs and war mascots to Greyfriars Bobby, Crufts and the Victorian pet boom, right up to today's designer crossbreeds.",
  // Version 2 is a working draft alongside the live page. It must not be
  // indexed while both exist, or the two compete for the same queries.
  robots: "noindex",
};

/* Version 2 of /britains-dog-history, rebuilt as the horizontal carousel used
   on /good-dog-bad-dog. The live page is untouched.

   THE CAROUSEL SHELL IS PORTED VERBATIM from good-dog-bad-dog. The markup,
   the CSS and the inline script all carry fixes that were expensive to find
   the first time, in particular the scroll-snap-type off/on dance that iOS
   Safari needs before it will honour a programmatic scroll. Do not rewrite
   the script.

   Slides are built from a FLAT LIST rather than nested inside the section
   loop. The finished page is around 48 slides: one intro, nine section
   slides and thirty-eight bullet slides, and a flat list keeps the counter,
   the progress bar and the snap index reading the same single sequence. */

type Panel =
  /* `lead` is the section's opening paragraph, which gets the larger face.
     The two paragraphs used to share one slide. They are now a slide each,
     because on a phone the pair ran well past a screenful. */
  | { kind: "text"; text: string; lead: boolean }
  | { kind: "bullet"; text: string; title?: string }
  | { kind: "fact"; text: string; image: string };

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
    ...s.facts.map((f) => ({ kind: "fact" as const, text: f.text, image: f.image || s.image })),
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

/* The first era screen, which is the head of the first vertical run. Read out
   of the laid-out sequence rather than counted by hand, so inserting a slide
   ahead of it cannot leave the button pointing at the wrong screen. */
const FIRST_ERA_PANEL = LAID_OUT.find((l) => l.entry.type === "timeline")?.first ?? 1;

export default function HistoryV2Page() {
  return (
    <>
      <Nav showLogo />
      <main className={styles.page}>

        <div className={styles.carouselWrap} id="carousel-wrap">
          <div className={styles.carousel} id="mobile-carousel">

            {/* Slide 0: intro. The hero photograph carries the whole slide
                rather than the blue gradient good-dog-bad-dog uses. A tint
                sits over it because the source image is light in the upper
                half and white display type was unreadable on it. */}
            <div className={styles.slide} data-pc-panel="0">
              <div className={styles.introSlide}>
                <div className={styles.introImg} aria-hidden="true" />
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
                  <IntroButtons historyPanel={FIRST_ERA_PANEL} />
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
                              alt=""
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
          <div className={styles.progress} id="mobile-progress" />
        </div>

        {/* Carousel script -- progress bar, intro button, vertical-flick advance.
            No preventDefault, no scroll hijack: touch-action pan-x in CSS lets the
            browser own horizontal panning; vertical flicks are read passively. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){
          var carousel = document.getElementById('mobile-carousel');
          var bar = document.getElementById('mobile-progress');
          if(!carousel || !bar) return;
          function update() {
            var max = carousel.scrollWidth - carousel.clientWidth;
            bar.style.width = (max > 0 ? (carousel.scrollLeft / max) * 100 : 0) + '%';
          }
          /* Sub-slide counter. It reads the settled panel's own attributes
             rather than deriving them from a modulus. The modulus was only
             correct while every carousel child was one slide or nine, which
             stopped being true the moment an era title was inserted. Panels
             that are not part of a section carry no data-pc-sec, so the
             counters are left alone on those. */
          var counters = document.querySelectorAll('[data-pc-count]');
          function updateCount() {
            var w = carousel.clientWidth;
            if (!w) return;
            var g = Math.round(carousel.scrollLeft / w);
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

          function updateRoll() {
            var w = carousel.clientWidth;
            if (!w) return;
            var here = carousel.scrollLeft / w;
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
            update(); updateCount();
            /* The roll writes styles on up to 36 elements, so it is thrown onto
               the next frame rather than run inside the scroll event. */
            if (!rollQueued) {
              rollQueued = true;
              requestAnimationFrame(function(){ rollQueued = false; updateRoll(); });
            }
          }, { passive: true });
          update();
          updateCount();
          updateRoll();

          function goTo(idx) {
            /* Re-queried each time so the handler still works if React has
               replaced these nodes during hydration. */
            var c = document.getElementById('mobile-carousel');
            if (!c) return;
            /* Panels, not sections: a top-level child is now a whole section
               group nine panels wide, so counting children under-counted by
               nine and clamped every jump into the first section. */
            var count = Math.round(c.scrollWidth / c.clientWidth);
            if (idx < 0) idx = 0;
            if (idx > count - 1) idx = count - 1;
            var from = c.scrollLeft;
            var target = idx * c.clientWidth;
            /* scroll-snap-type: x mandatory blocks programmatic smooth scrolling
               on iOS Safari, which is why this button did nothing while native
               swiping worked. The touchend handler below already relies on the
               same off/on trick -- that is the only reason it succeeds. */
            c.style.scrollSnapType = 'none';
            c.scrollTo({ left: target, behavior: 'smooth' });
            /* If smooth scrolling was ignored outright, jump there instead. */
            setTimeout(function(){
              if (Math.abs(c.scrollLeft - from) < 2) c.scrollLeft = target;
            }, 400);
            setTimeout(function(){ c.style.scrollSnapType = ''; }, 700);
          }

          /* Delegated rather than bound directly, so the button keeps working
             even if its node is re-created after this script has run. */
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

          /* Continuous vertical drag -> horizontal movement.
             touch-action: pan-x means the browser has no default action for
             vertical touches, so passive listeners are safe: no preventDefault,
             no interference with native horizontal swiping. */
          var GAIN = 1.6;           /* px of horizontal travel per px of vertical drag */
          var startX = 0, startY = 0, startLeft = 0, lastY = 0, lastT = 0, vel = 0;
          var axis = null;          /* null | 'v' | 'h' */

          carousel.addEventListener('touchstart', function(e){
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startLeft = carousel.scrollLeft;
            lastY = startY; lastT = Date.now(); vel = 0;
            axis = null;
          }, { passive: true });

          carousel.addEventListener('touchmove', function(e){
            var t = e.touches[0];
            if (!axis) {
              var adx = Math.abs(t.clientX - startX);
              var ady = Math.abs(t.clientY - startY);
              if (adx < 6 && ady < 6) return;           /* not decided yet */
              axis = ady > adx ? 'v' : 'h';
              if (axis === 'v') carousel.style.scrollSnapType = 'none';
            }
            if (axis !== 'v') return;                    /* horizontal: native handles it */
            /* The vertical run has the wheel. Without this the drag would be
               converted to horizontal movement and the dogs could not be
               scrolled at all: touch-action alone does not stop this listener,
               because it is bound to the carousel and the touch bubbles. */
            if (carousel.getAttribute('data-pc-vlock') === '1') return;
            var now = Date.now();
            if (now > lastT) vel = (lastY - t.clientY) / (now - lastT);
            lastY = t.clientY; lastT = now;
            carousel.scrollLeft = startLeft + (startY - t.clientY) * GAIN;
          }, { passive: true });

          carousel.addEventListener('touchend', function(){
            if (axis !== 'v') return;
            if (carousel.getAttribute('data-pc-vlock') === '1') { axis = null; return; }
            axis = null;
            var w = carousel.clientWidth;
            var idx;
            if (Math.abs(vel) > 0.35) {
              /* decisive flick at release: continue one slide in that direction */
              idx = (vel > 0 ? Math.ceil : Math.floor)(carousel.scrollLeft / w);
            } else {
              idx = Math.round(carousel.scrollLeft / w);
            }
            var count = Math.round(carousel.scrollWidth / carousel.clientWidth);
            if (idx < 0) idx = 0;
            if (idx > count - 1) idx = count - 1;
            carousel.scrollTo({ left: idx * w, behavior: 'smooth' });
            setTimeout(function(){ carousel.style.scrollSnapType = ''; }, 450);
          }, { passive: true });
        })();` }} />

      </main>
      {/* Kept in the markup, taken out of the layout. See .footerOff: it was
          the only element adding height below the 100dvh wrap, which made the
          document a second vertical scroller and let a drag inside the dog run
          chain out to it. */}
      <div className={styles.footerOff}>
        <Footer />
      </div>
    </>
  );
}
