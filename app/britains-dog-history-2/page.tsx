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

type Slide =
  | { kind: "section"; title: string; accent: string; image: string; imageAlt: string; intro: string; detail: string };

const SLIDES: Slide[] = SECTIONS.map((s) => ({
  kind: "section" as const,
  title: s.title,
  accent: s.accent,
  image: s.image,
  imageAlt: s.imageAlt,
  intro: s.intro,
  detail: s.detail,
}));

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

            {/* Section slides: image top, text below, matching the
                good-dog-bad-dog slide split. */}
            {SLIDES.map((s, i) => {
              const prefix = s.title.slice(0, s.title.length - s.accent.length);
              return (
                <div key={i} className={styles.slide}>
                  <div className={styles.slideImg}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.image}
                      alt={s.imageAlt}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <div className={styles.slideCount}>{i + 1} / {SLIDES.length}</div>
                  </div>
                  <div className={styles.slideInfo}>
                    <h2 className={styles.slideTitle}>
                      {prefix}
                      <span className={styles.titleAccent}>{s.accent}</span>
                    </h2>
                    <p className={styles.slideIntro}>{s.intro}</p>
                    <p className={styles.slideDetail}>{s.detail}</p>
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
          carousel.addEventListener('scroll', update, { passive: true });
          update();

          function goTo(idx) {
            /* Re-queried each time so the handler still works if React has
               replaced these nodes during hydration. */
            var c = document.getElementById('mobile-carousel');
            if (!c) return;
            var count = c.children.length;
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
            var count = carousel.children.length;
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
