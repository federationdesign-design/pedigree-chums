import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import { SECTIONS } from "./sections";
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
  | { kind: "text"; intro: string; detail: string }
  | { kind: "bullet"; text: string; title?: string }
  | { kind: "fact"; text: string; image: string };

/* Nine panels per section: the text panel, then the four bullets, then the
   four facts. */
function panelsFor(s: (typeof SECTIONS)[number]): Panel[] {
  return [
    { kind: "text", intro: s.intro, detail: s.detail },
    ...s.bullets.map((b, i) => ({ kind: "bullet" as const, text: b, title: s.bulletTitles?.[i] })),
    ...s.facts.map((f) => ({ kind: "fact" as const, text: f.text, image: f.image || s.image })),
  ];
}

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
            <div className={styles.slide}>
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
                  <button type="button" id="intro-next-btn" className={styles.introBtn}>
                    Go to first dog
                  </button>
                </div>
              </div>
            </div>

            {/* One group per section. The image and title are STICKY at the
                left edge, so they hold their position while the group's nine
                panels scroll past beneath them, then slide out when the next
                section's group arrives. This is why there is no second scroll
                container: the whole page is still one horizontal scroller and
                a swipe anywhere moves it. */}
            {SECTIONS.map((s, si) => {
              const prefix = s.title.slice(0, s.title.length - s.accent.length);
              const panels = panelsFor(s);
              return (
                <div key={si} className={styles.sectionGroup}>
                  <div className={styles.stickyTop}>
                    <div className={styles.slideImg}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.image}
                        alt={s.imageAlt}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
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
                        className={p.kind === "fact" ? `${styles.panel} ${styles.panelFact}` : styles.panel}
                      >
                        {p.kind === "text" && (
                          <>
                            <p className={styles.slideIntro}>{p.intro}</p>
                            <p className={styles.slideDetail}>{p.detail}</p>
                          </>
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
                            <img className={styles.factImg} src={p.image} alt="" />
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
          /* Sub-slide counter. Nine panels per section: index 0 is the
             section's own text panel and is not a sub-slide, so it shows
             nothing there, then 1 to 8 across the four bullets and the four
             facts. Only the current section's counter is touched, so a
             neighbouring one cannot flash the wrong figure mid-transition. */
          var PANELS_PER_SECTION = 9;
          var counters = document.querySelectorAll('[data-pc-count]');
          function updateCount() {
            var w = carousel.clientWidth;
            if (!w) return;
            var g = Math.round(carousel.scrollLeft / w);
            if (g < 1) return;                       /* the intro slide */
            var si = Math.floor((g - 1) / PANELS_PER_SECTION);
            var sub = (g - 1) % PANELS_PER_SECTION;
            var el = counters[si];
            if (!el) return;
            if (sub === 0) { el.style.visibility = 'hidden'; return; }
            el.style.visibility = '';
            el.textContent = sub + ' / 8';
          }

          carousel.addEventListener('scroll', function(){ update(); updateCount(); }, { passive: true });
          update();
          updateCount();

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
            if (t && t.closest && t.closest('#intro-next-btn')) goTo(1);
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
            var now = Date.now();
            if (now > lastT) vel = (lastY - t.clientY) / (now - lastT);
            lastY = t.clientY; lastT = now;
            carousel.scrollLeft = startLeft + (startY - t.clientY) * GAIN;
          }, { passive: true });

          carousel.addEventListener('touchend', function(){
            if (axis !== 'v') return;
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
      <Footer />
    </>
  );
}
