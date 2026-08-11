"use client";

// The Dogs at Work mechanic (brief v3.0, section 6, checkpoints 3 and 4).
//
// One component, two layouts driven by a single slide index:
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
// Only the current frame is interactive; off-screen desktop frames are `inert`.
// Dots are the primary navigation and the only route back, because the artwork
// gives a forward chevron only. Left and right arrow keys page the desktop deck
// while it is focused. Reduced motion is honoured in CSS.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import GlowPanel from "../../components/GlowPanel/GlowPanel";
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

export default function WorkDeck({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const mBlueRef = useRef<HTMLDivElement>(null);
  const didMount = useRef(false);
  const count = slides.length;

  // Drive the desktop filmstrip transforms from a single index custom property.
  // Setting it via the ref keeps all visual rules in the CSS module.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty("--i", String(index));
    el.style.setProperty("--n", String(count));
  }, [index, count]);

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
  }, [index]);

  function go(to: number) {
    setIndex((i) => {
      const next = Math.max(0, Math.min(count - 1, to));
      return next === i ? i : next;
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    }
  }

  // One pointer handler for touch, trackpad and mouse (Pointer Events unify them,
  // so there is no separate touch/mouse code). It navigates via go(), exactly as
  // the dots, chevron and arrow keys do, so the desktop counter-motion and
  // prefers-reduced-motion (both expressed in the CSS track transitions) are reused
  // unchanged. The move/end listeners live on window per-gesture, so a release that
  // strays outside the panel is still caught, and they are removed when it ends.
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
        go(index + (dx < 0 ? 1 : -1));
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

  const atEnd = index >= count - 1;

  // Shared controls: the pager (dots) and the forward chevron.
  const dots = (
    <div className={styles.pager} role="group" aria-label="Choose a dog">
      {slides.map((slide, i) => (
        <button
          type="button"
          key={slide.id}
          className={styles.dot}
          aria-label={`${slide.article.subLabel}, ${i + 1} of ${count}`}
          aria-current={i === index ? "true" : undefined}
          onClick={() => go(i)}
        />
      ))}
    </div>
  );

  const chevronSvg = (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M8 4l8 8-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const mobileSlide = slides[index];
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
              <div className={styles.blueTrack}>
                {slides.map((slide, i) => (
                  <article
                    key={slide.id}
                    className={styles.blueSlide}
                    inert={i !== index}
                    aria-hidden={i !== index}
                  >
                    <Sections slide={slide} withThumbnails indent={slide.order === 4} />
                  </article>
                ))}
              </div>
            </div>
          </GlowPanel>

          <button
            type="button"
            className={styles.chevron}
            onClick={() => go(index + 1)}
            disabled={atEnd}
            aria-label="Next dog"
          >
            {chevronSvg}
          </button>

          {/* Dots live inside the panel (bottom-left); the concept shows only the
              forward chevron, but dots are the required back route. */}
          <div className={styles.deckPager}>{dots}</div>
        </div>

        <div
          className={styles.articleViewport}
          onPointerDown={onPointerDown}
          onClickCapture={onClickCapture}
        >
          <div className={styles.articleTrack}>
            {slides.map((_, revI) => {
              const i = count - 1 - revI;
              const slide = slides[i];
              const a = slide.article;
              const current = i === index;
              return (
                <div
                  key={slide.id}
                  className={styles.articleSlide}
                  inert={!current}
                  aria-hidden={!current}
                >
                  <div className={styles.articleImgWrap}>
                    {/* Item 10: image links to the article (same destination as the
                        green button), with its own accessible name, not the button's. */}
                    <Link
                      href={a.href}
                      className={styles.articleImgLink}
                      aria-label={`Read: ${a.headline}`}
                      tabIndex={current ? undefined : -1}
                      draggable={false}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.articleImg}
                        src={a.image}
                        alt={a.imageAlt}
                        loading={current ? "eager" : "lazy"}
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
                      tabIndex={current ? undefined : -1}
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
          {slides[index].article.subLabel}, {index + 1} of {count}
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
            <Sections slide={mobileSlide} withThumbnails={false} indent={mobileSlide.order === 4} />
          </GlowPanel>
        </div>

        {/* Pager: dots plus the forward chevron, above the image. */}
        <div className={styles.mPager}>
          {dots}
          <button
            type="button"
            className={styles.mChevron}
            onClick={() => go(index + 1)}
            disabled={atEnd}
            aria-label="Next dog"
          >
            {chevronSvg}
          </button>
        </div>

        {/* Image and article share one swipe zone (dots and chevron sit above it,
            so they are untouched). */}
        <div
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
          {mA.subLabel}, {index + 1} of {count}
        </p>
      </section>
    </>
  );
}
