"use client";

// The Dogs at Work mechanic (brief v3.0, section 6, checkpoints 3 and 4).
//
// One component, two layouts driven by a single position:
//
// Desktop (>=769px): three stacked regions. The introduction is persistent. The
// blue panel and the article panel change together on navigation but move in
// opposite directions (counter-motion): the blue filmstrip translates left, the
// article filmstrip, rendered in reverse order, translates right, so the tracks
// cross. The page scrolls normally; the blue container sizes to its copy above a
// generous minimum, so nothing is clipped. The blue container reuses the shared
// GlowPanel shell (extracted from the homepage pitch panel).
//
// Mobile (<=768px): a single vertical stack that scrolls normally, with no
// counter-motion. Order: intro, blue panel carrying all its supporting points in
// one container (no thumbnails), pager (dots and a forward chevron), full-width
// image, dark article block. Because the pager sits above the image, advancing
// scrolls the new blue panel to the top so its copy is not left off-screen above.
//
// The deck LOOPS end to end: advancing past the last frame returns to the first
// and going back from the first goes to the last, in both directions, without a
// rewind. The counter-motion tracks are single translate strips, so a naive wrap
// (index n-1 -> 0) would animate the whole strip backwards across every frame. To
// keep the wrap moving the same way as an ordinary step, each strip carries a clone
// of the first frame appended and the last frame prepended: a wrap animates INTO
// the clone (continuous motion), then, on transitionend, the position snaps without
// transition to the identical real frame. The clone and the real frame show the
// same content, so the snap is invisible. A timer backstops the snap where
// transitionend never fires (the hidden track on mobile, reduced motion).
//
// Only the current frame is interactive; off-screen frames and both clones are
// `inert`. Dots are the primary navigation and the only route back. Left and right
// arrow keys page the desktop deck while it is focused. Reduced motion is honoured
// in CSS (no transition) and here (an instant wrap, skipping the clone animation).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import GlowPanel from "../../components/GlowPanel/GlowPanel";
import WorkChevron from "../../components/WorkChevron/WorkChevron";
import Triangles, { type Tri } from "../../components/Parallax/Triangles";
import type { Slide } from "./data/types";
import { FAMILY_PILL_LABEL } from "./data/types";
import styles from "./deck.module.css";

// Persistent introduction. Transcribed from the concept artwork
// (dogs_at_work_main_page_concept). Appendix A supplies the blue panels only,
// not this standing intro, so it is flagged for Steve's confirmation in the
// checkpoint report rather than invented here.
const INTRO =
  'Dogs do not know they have jobs. They follow scent, movement, instinct, training and reward. The "work" begins when humans turn those natural abilities into value: safer airports, faster searches, healthier people, protected livestock, better science. Dogs are an invisible workforce whose contribution is felt emotionally but rarely counted economically.';

// Reused parallax triangles (the same shared component the pitch panel uses),
// echoing the yellow triangles in the concept artwork.
const blueTriangles: Tri[] = [
  { size: 34, top: "9%", left: "15%", speed: 0.18, spin: 0.25 },
  { size: 42, bottom: "12%", right: "9%", speed: 0.14, spin: -0.2 },
];

// Two inline markers, working identically anywhere panel text appears
// (subheadings, body paragraphs, bullets). Appendix A is plain, so the markers
// live in the data per the concept artwork:
//   *text*  -> emphasis, the --emphasis yellow (a whole yellow line is the line
//              wrapped in *...*).
//   **text** -> bold.
// No third marker and no per-section style field: if the concept needs something
// these two cannot express, it is flagged rather than invented.
function renderMarked(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("**")) {
      return (
        <strong key={i} className={styles.blueBold}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*")) {
      return (
        <span key={i} className={styles.emph}>
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

// A blue panel body may carry blank-line-separated paragraphs (panels 2 and 3).
function paragraphs(body: string): string[] {
  return body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

// The bullets panel ("Working dogs do not know they have jobs") gets the extra
// 20px indent (deck.module.css .blueIndent). It is the only panel with bullets,
// so key the indent on that, not on a slide order: the deck has been reordered
// once already and the styling must follow the copy, not its position.
function panelIsIndented(slide: Slide): boolean {
  return slide.panel.sections.some((s) => s.bullets && s.bullets.length > 0);
}

// One blue panel's sections. Thumbnails are desktop, panel 1 only; mobile never
// shows them, so `withThumbnails` gates them.
function Sections({ slide, withThumbnails, indent }: { slide: Slide; withThumbnails: boolean; indent?: boolean }) {
  return (
    <div className={styles.blueSections}>
      {slide.panel.sections.map((section, si) => {
        const thumb = withThumbnails ? section.thumbnail : undefined;
        return (
          <div
            className={thumb ? `${styles.blueSection} ${styles.withThumb}` : styles.blueSection}
            key={si}
          >
            {thumb ? (
              thumb.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.thumb} src={thumb.src} alt={thumb.alt ?? ""} loading="lazy" />
              ) : (
                // Pending: reserve the space, render nothing visible.
                <span className={styles.thumbPending} aria-hidden="true" />
              )
            ) : null}
            <div className={styles.blueSectionMain}>
              {section.subheading ? (
                <h2 className={styles.blueSubheading}>
                  {renderMarked(section.subheading)}
                </h2>
              ) : null}
              <div className={styles.blueSectionBody}>
                {section.body
                  ? paragraphs(section.body).map((p, pi) => (
                      <p className={indent ? `${styles.blueBody} ${styles.blueIndent}` : styles.blueBody} key={pi}>
                        {renderMarked(p)}
                      </p>
                    ))
                  : null}
                {section.bullets ? (
                  <ul className={indent ? `${styles.blueBullets} ${styles.blueIndent}` : styles.blueBullets}>
                    {section.bullets.map((b, bi) => (
                      <li key={bi}>{renderMarked(b)}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Swipe tuning. A gesture must travel at least SWIPE_THRESHOLD px horizontally to
// change slide; any travel past DRAG_SLOP marks it a drag and cancels the click it
// would otherwise fire (so a tap still opens a link or fires the CTA, a drag never
// does).
const SWIPE_THRESHOLD = 50;
const DRAG_SLOP = 10;
// Accumulated horizontal wheel distance (a trackpad two-finger swipe) needed to
// page. The pointer-drag path above never sees a trackpad swipe: macOS Safari
// delivers it as a horizontal wheel and turns it into back/forward navigation.
const WHEEL_THRESHOLD = 60;
// Must match the .blueTrack / .articleTrack transition duration in the CSS module.
// Used to backstop the wrap snap where transitionend cannot fire (a display:none
// track on mobile, or reduced motion). A small buffer past the transition.
const TRANSITION_MS = 620;

export default function WorkDeck({ slides }: { slides: Slide[] }) {
  const count = slides.length;

  // The deck position. In steady state `pos` is 0..count-1. During a wrap it
  // takes a transient out-of-range value (count for a forward wrap, -1 for a
  // backward wrap) so the strip animates into a clone frame; it is then snapped
  // back to the real frame. `current` is the real slide on screen, valid even
  // mid-wrap (count % count === 0, and -1 maps to count-1).
  const [pos, setPos] = useState(0);
  const current = ((pos % count) + count) % count;

  // True for the single frame after a wrap: the strip is repositioned from the
  // clone to the identical real frame with the transition suppressed, so the jump
  // is invisible. Cleared on the next frame to restore the transition.
  const [instant, setInstant] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const mBlueRef = useRef<HTMLDivElement>(null);
  const articleViewportRef = useRef<HTMLDivElement>(null);
  const mSwipeRef = useRef<HTMLDivElement>(null);
  const didMount = useRef(false);
  // The real frame a pending wrap snaps to (null when no wrap is in flight). Also
  // the input lock: while a wrap animates, further paging is ignored.
  const wrapTarget = useRef<number | null>(null);
  const snapTimer = useRef<number | undefined>(undefined);
  // A stable handle to the latest step(), so the once-attached wheel listener
  // always calls the current closure.
  const stepRef = useRef<(dir: number) => void>(() => {});

  function prefersReducedMotion() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  // End a wrap: snap (without transition) from the clone to the identical real
  // frame. Called by the track's transitionend and by the timer backstop; guarded
  // so the second caller is a no-op.
  function finishWrap() {
    const target = wrapTarget.current;
    if (target === null) return;
    wrapTarget.current = null;
    if (snapTimer.current) window.clearTimeout(snapTimer.current);
    setInstant(true);
    setPos(target);
  }

  // Page by one, wrapping at both ends. dir > 0 advances, dir < 0 goes back.
  function step(dir: number) {
    if (wrapTarget.current !== null) return; // a wrap is animating: ignore input
    const from = current;
    if (dir > 0 && from === count - 1) {
      if (prefersReducedMotion()) {
        setPos(0);
        return;
      }
      wrapTarget.current = 0;
      setPos(count); // animate forward into the appended clone (shows slide 0)
      snapTimer.current = window.setTimeout(finishWrap, TRANSITION_MS + 80);
    } else if (dir < 0 && from === 0) {
      if (prefersReducedMotion()) {
        setPos(count - 1);
        return;
      }
      wrapTarget.current = count - 1;
      setPos(-1); // animate back into the prepended clone (shows the last slide)
      snapTimer.current = window.setTimeout(finishWrap, TRANSITION_MS + 80);
    } else {
      setPos(from + dir);
    }
  }
  stepRef.current = step;

  // Jump straight to a slide (dots). Ignored mid-wrap so pos stays well-defined.
  function goTo(to: number) {
    if (wrapTarget.current !== null) return;
    setPos(to);
  }

  // Drive the desktop filmstrip transforms from the position custom property.
  // Setting it via the ref keeps all visual rules in the CSS module.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty("--i", String(pos));
    el.style.setProperty("--n", String(count));
  }, [pos, count]);

  // Restore the transition the frame after an instant snap. Two rAFs so the
  // no-transition position is painted before the transition is re-enabled.
  useEffect(() => {
    if (!instant) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setInstant(false));
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }, [instant]);

  // Mobile only: on navigation the pager sits above the image, so bring the new
  // blue panel to the top rather than leaving its copy scrolled off above. Skips
  // the initial mount so the page does not jump on load.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    const el = mBlueRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 84; // clear the nav
    window.scrollTo({ top, behavior: "smooth" });
  }, [current]);

  // Trackpad / horizontal-wheel paging. The pointer handler catches press-drags and
  // touchscreen swipes, but not a macOS trackpad two-finger swipe: Safari delivers
  // that as a horizontal wheel and turns it into history back/forward, so the deck
  // never sees it (confirmed in WebKit: a horizontal wheel produced no slide change).
  // Handle the wheel on the swipe zones directly: page on a predominantly-horizontal
  // delta and preventDefault so the browser cannot navigate. A non-passive listener
  // is required for preventDefault to take effect; React's onWheel is passive, so it
  // is attached natively. A short idle lock keeps one continuous swipe (including its
  // momentum tail) to a single slide change. It pages through step(), so it wraps.
  useEffect(() => {
    const zones = [articleViewportRef.current, mSwipeRef.current].filter(Boolean) as HTMLElement[];
    let locked = false;
    let accum = 0;
    let idle: number | undefined;
    function onWheel(e: WheelEvent) {
      if (e.ctrlKey) return; // trackpad pinch (ctrl+wheel): let the browser zoom
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical scroll: leave it to the page
      e.preventDefault(); // stop horizontal overscroll -> Safari's back/forward swipe
      if (idle) window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        locked = false;
        accum = 0;
      }, 200);
      if (locked) return;
      accum += e.deltaX;
      if (Math.abs(accum) < WHEEL_THRESHOLD) return;
      const dir = accum > 0 ? 1 : -1; // swipe left (deltaX > 0) advances, matching the drag
      locked = true;
      accum = 0;
      stepRef.current(dir);
    }
    for (const z of zones) z.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      if (idle) window.clearTimeout(idle);
      for (const z of zones) z.removeEventListener("wheel", onWheel);
    };
  }, [count]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  }

  // One pointer handler for touch, trackpad and mouse (Pointer Events unify them,
  // so there is no separate touch/mouse code). It pages via step(), exactly as the
  // dots, chevron, arrow keys and wheel do, so the desktop counter-motion, the loop
  // wrap and prefers-reduced-motion are all reused unchanged. The move/end listeners
  // live on window per-gesture, so a release that strays outside the panel is still
  // caught, and they are removed when it ends.
  const suppressClick = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Primary pointer only; ignore right/middle mouse buttons.
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const zone = e.currentTarget;
    const pointerId = e.pointerId;
    let dragged = false;
    // Suppress text selection / native image drag for the whole gesture.
    zone.classList.add(styles.dragging);

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      if (!dragged && Math.hypot(ev.clientX - startX, ev.clientY - startY) > DRAG_SLOP) {
        dragged = true;
      }
    };
    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      zone.classList.remove(styles.dragging);
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (dragged) {
        // A drag must not fire the click it would otherwise dispatch on a link,
        // the CTA or a dot. Cleared next frame in case no click follows (touch).
        suppressClick.current = true;
        requestAnimationFrame(() => {
          suppressClick.current = false;
        });
      }
      // Change slide only on a real release (not cancel) that is far enough and
      // more horizontal than vertical, so a nudge or a mostly-vertical scroll is
      // ignored. Left (dx < 0) advances; right goes back.
      if (
        ev.type === "pointerup" &&
        Math.abs(dx) >= SWIPE_THRESHOLD &&
        Math.abs(dx) > Math.abs(dy)
      ) {
        step(dx < 0 ? 1 : -1);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  // Capture phase, so it runs before the link/CTA/dot handlers and can stop a
  // drag's click reaching them, while a tap (no drag) passes straight through.
  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
  }

  // Blue track frames, plus a clone of the last slide prepended and the first
  // appended, so a wrap animates into a clone rather than rewinding. Real frame k
  // sits at DOM position k+1; the transform reads (--i + 1) to account for it.
  const blueFrames = [
    { key: "clone-pre", slide: slides[count - 1], i: count - 1, clone: true },
    ...slides.map((slide, i) => ({ key: slide.id, slide, i, clone: false })),
    { key: "clone-post", slide: slides[0], i: 0, clone: true },
  ];

  // Article track frames, rendered in reverse for the counter-motion, with the
  // mirrored clones: the first slide prepended and the last appended. The transform
  // reads (--i - --n) to account for the prepended clone.
  const reversed = slides.map((_, revI) => {
    const i = count - 1 - revI;
    return { slide: slides[i], i };
  });
  const articleFrames = [
    { key: "clone-pre", slide: slides[0], i: 0, clone: true },
    ...reversed.map((f) => ({ key: f.slide.id, slide: f.slide, i: f.i, clone: false })),
    { key: "clone-post", slide: slides[count - 1], i: count - 1, clone: true },
  ];

  // Shared controls: the pager (dots, one per panel) and the forward chevron.
  const dots = (
    <div className={styles.pager} role="group" aria-label="Choose a dog">
      {slides.map((slide, i) => (
        <button
          type="button"
          key={slide.id}
          className={styles.dot}
          aria-label={`${slide.article.subLabel}, ${i + 1} of ${count}`}
          aria-current={i === current ? "true" : undefined}
          onClick={() => goTo(i)}
        />
      ))}
    </div>
  );

  const chevronSvg = <WorkChevron />;

  const trackClass = (base: string) => (instant ? `${base} ${styles.instant}` : base);

  const mobileSlide = slides[current];
  const mA = mobileSlide.article;

  return (
    <>
      {/* ── Desktop mechanic (>=769px) ─────────────────────────────── */}
      <section
        ref={rootRef}
        className={styles.deck}
        role="region"
        aria-roledescription="carousel"
        aria-label="Dogs at Work"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <header className={styles.intro}>
          <h1 className={styles.title}>
            Dogs <span className={styles.titleAccent}>at</span> Work
          </h1>
          <p className={styles.introText}>{INTRO}</p>
        </header>

        <div className={styles.blueWrap}>
          <GlowPanel className={styles.blueGlow}>
            <Triangles items={blueTriangles} z={0} />
            <div className={styles.blueViewport}>
              <div
                className={trackClass(styles.blueTrack)}
                onTransitionEnd={(e) => {
                  if (e.target === e.currentTarget && e.propertyName === "transform") finishWrap();
                }}
              >
                {blueFrames.map((f) => {
                  const on = !f.clone && f.i === current;
                  return (
                    <article
                      key={f.key}
                      className={styles.blueSlide}
                      inert={!on}
                      aria-hidden={!on}
                    >
                      <Sections slide={f.slide} withThumbnails indent={panelIsIndented(f.slide)} />
                    </article>
                  );
                })}
              </div>
            </div>
          </GlowPanel>

          <button
            type="button"
            className={styles.chevron}
            onClick={() => step(1)}
            aria-label="Next dog"
          >
            {chevronSvg}
          </button>

          {/* Dots live inside the panel (bottom-left); the concept shows only the
              forward chevron, but dots are the required back route. */}
          <div className={styles.deckPager}>{dots}</div>
        </div>

        <div
          ref={articleViewportRef}
          className={styles.articleViewport}
          onPointerDown={onPointerDown}
          onClickCapture={onClickCapture}
        >
          <div className={trackClass(styles.articleTrack)}>
            {articleFrames.map((f) => {
              const a = f.slide.article;
              const on = !f.clone && f.i === current;
              return (
                <div
                  key={f.key}
                  className={styles.articleSlide}
                  inert={!on}
                  aria-hidden={!on}
                >
                  <div className={styles.articleImgWrap}>
                    {/* Item 10: image links to the article (same destination as the
                        green button), with its own accessible name, not the button's. */}
                    <Link
                      href={a.href}
                      className={styles.articleImgLink}
                      aria-label={`Read: ${a.headline}`}
                      tabIndex={on ? undefined : -1}
                      draggable={false}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.articleImg}
                        src={a.image}
                        alt={a.imageAlt}
                        loading={on ? "eager" : "lazy"}
                        draggable={false}
                      />
                    </Link>
                  </div>
                  <div className={styles.articleText}>
                    <p className={styles.learnAbout}>
                      Learn <span className={styles.learnAboutAccent}>about&hellip;</span>
                    </p>
                    <div className={styles.articleMeta}>
                      <span className={styles.pill} data-family={a.family}>
                        {FAMILY_PILL_LABEL[a.family]}
                      </span>
                      <span className={styles.subLabel}>{a.subLabel}</span>
                    </div>
                    <h2 className={styles.headline}>{a.headline}</h2>
                    <p className={styles.dek}>{a.dek}</p>
                    <Link
                      href={a.href}
                      className={styles.cta}
                      tabIndex={on ? undefined : -1}
                      draggable={false}
                    >
                      {a.ctaLabel}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className={styles.srStatus} aria-live="polite">
          {slides[current].article.subLabel}, {current + 1} of {count}
        </p>
      </section>

      {/* ── Mobile stack (<=768px) ─────────────────────────────────── */}
      <section
        className={styles.mobile}
        role="region"
        aria-roledescription="carousel"
        aria-label="Dogs at Work"
      >
        <header className={styles.mIntro}>
          <h1 className={styles.title}>
            Dogs <span className={styles.titleAccent}>at</span> Work
          </h1>
          <p className={styles.introText}>{INTRO}</p>
        </header>

        {/* Blue panel: all supporting points in one container, no thumbnails. */}
        <div className={styles.mBlueWrap} ref={mBlueRef}>
          <GlowPanel className={styles.mBlue}>
            <Sections slide={mobileSlide} withThumbnails={false} indent={panelIsIndented(mobileSlide)} />
          </GlowPanel>
        </div>

        {/* Pager: dots plus the forward chevron, above the image. */}
        <div className={styles.mPager}>
          {dots}
          <button
            type="button"
            className={styles.mChevron}
            onClick={() => step(1)}
            aria-label="Next dog"
          >
            {chevronSvg}
          </button>
        </div>

        {/* Image and article share one swipe zone (dots and chevron sit above it,
            so they are untouched). */}
        <div
          ref={mSwipeRef}
          className={styles.mSwipe}
          onPointerDown={onPointerDown}
          onClickCapture={onClickCapture}
        >
          <div className={styles.mImage}>
            {/* Item 10: image links to the article, own accessible name. */}
            <Link href={mA.href} className={styles.articleImgLink} aria-label={`Read: ${mA.headline}`} draggable={false}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mA.image} alt={mA.imageAlt} loading="lazy" draggable={false} />
            </Link>
          </div>

          <div className={styles.mArticle}>
            <p className={styles.learnAbout}>
              Learn <span className={styles.learnAboutAccent}>about&hellip;</span>
            </p>
            <div className={styles.articleMeta}>
              <span className={styles.pill} data-family={mA.family}>
                {FAMILY_PILL_LABEL[mA.family]}
              </span>
              <span className={styles.subLabel}>{mA.subLabel}</span>
            </div>
            <h2 className={styles.headline}>{mA.headline}</h2>
            <p className={styles.dek}>{mA.dek}</p>
            <Link href={mA.href} className={styles.cta} draggable={false}>
              {mA.ctaLabel}
            </Link>
          </div>
        </div>

        <p className={styles.srStatus} aria-live="polite">
          {mA.subLabel}, {current + 1} of {count}
        </p>
      </section>
    </>
  );
}
