"use client";

// The Dogs at Work desktop mechanic (brief v3.0, section 6, checkpoint 3).
//
// Three stacked regions. The introduction is persistent and never animates.
// The blue panel and the article panel change together on navigation, but move
// in opposite directions: the blue panel slides one way, the article panel the
// other. That counter-motion is the signature of the design.
//
// The page scrolls normally: there is no fixed-height deck and no internal
// panel scroll. The blue container sizes to its copy (with a generous minimum
// height) so nothing is ever clipped, and the article panel sizes to its
// content with the headline always at full size.
//
// Both panels are single-frame viewports over a filmstrip. The blue filmstrip
// runs in natural order and translates left as the index grows. The article
// filmstrip is rendered in reverse order and translates the opposite way, so the
// two tracks cross. Only the current frame of each is interactive; the rest are
// marked `inert`, which removes them from tab order and the accessibility tree.
//
// The blue container reuses the signed-off floating-panel shell via the shared
// GlowPanel component (extracted from the homepage pitch panel), rather than a
// hand-rolled style. Reduced motion is honoured in CSS: the transitions drop out
// under prefers-reduced-motion and the panels simply change. Dots are the
// primary navigation and the only route backwards, because the artwork gives a
// forward chevron only. Left and right arrow keys page while the deck is focused.
//
// Desktop only: gated by min-width in the module CSS. Narrower viewports fall
// back to the mobile stack (built at checkpoint 4; currently the legacy carousel).

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
// checkpoint 3 report rather than invented here.
const INTRO =
  'Dogs do not know they have jobs. They follow scent, movement, instinct, training and reward. The "work" begins when humans turn those natural abilities into value: safer airports, faster searches, healthier people, protected livestock, better science. Dogs are an invisible workforce whose contribution is felt emotionally but rarely counted economically.';

// Reused parallax triangles (the same shared component the pitch panel uses),
// echoing the yellow triangles in the concept artwork.
const blueTriangles: Tri[] = [
  { size: 34, top: "9%", left: "15%", speed: 0.18, spin: 0.25 },
  { size: 42, bottom: "12%", right: "9%", speed: 0.14, spin: -0.2 },
];

// The concept colours the tail of a subheading yellow, from the first `;` or `,`
// onward ("To the dog;" white, "it's a game." yellow). Panels 2 to 4 carry no
// delimiter, so they render in a single colour. Presentation only, derived from
// the string, never stored on the record.
function splitSubheading(text: string): [string, string] {
  const match = text.match(/^(.*?[;,])(.*)$/);
  if (!match) return [text, ""];
  return [match[1], match[2]];
}

// A blue panel body may carry blank-line-separated paragraphs (panels 2 and 3).
function paragraphs(body: string): string[] {
  return body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

export default function WorkDeck({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const count = slides.length;

  // Drive the two filmstrip transforms from a single index custom property.
  // Setting it via the ref keeps all visual rules in the CSS module rather than
  // inline styles.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty("--i", String(index));
    el.style.setProperty("--n", String(count));
  }, [index, count]);

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

  const atEnd = index >= count - 1;

  return (
    <section
      ref={rootRef}
      className={styles.deck}
      role="region"
      aria-roledescription="carousel"
      aria-label="Dogs at Work"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* Persistent introduction. Identical on every slide, never animates. */}
      <header className={styles.intro}>
        <h1 className={styles.title}>
          Dogs <span className={styles.titleAccent}>at</span> Work
        </h1>
        <p className={styles.introText}>{INTRO}</p>
      </header>

      {/* Blue panel: the signed-off GlowPanel shell holding a filmstrip that
          translates left as the index grows. It sizes to its copy above a
          generous minimum, so nothing is clipped and nothing scrolls internally. */}
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
                  <div className={styles.blueSections}>
                    {slide.panel.sections.map((section, si) => {
                      const thumb = slide.panel.thumbnails?.[si];
                      const [head, tail] = section.subheading
                        ? splitSubheading(section.subheading)
                        : ["", ""];
                      return (
                        <div className={styles.blueSection} key={si}>
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              className={styles.thumb}
                              src={thumb.src}
                              alt={thumb.alt}
                              loading="lazy"
                            />
                          ) : null}
                          <div className={styles.blueSectionText}>
                            {section.subheading ? (
                              <h2 className={styles.blueSubheading}>
                                {head}
                                {tail ? (
                                  <span className={styles.blueSubheadingAccent}>{tail}</span>
                                ) : null}
                              </h2>
                            ) : null}
                            {section.body
                              ? paragraphs(section.body).map((p, pi) => (
                                  <p className={styles.blueBody} key={pi}>
                                    {p}
                                  </p>
                                ))
                              : null}
                            {section.bullets ? (
                              <ul className={styles.blueBullets}>
                                {section.bullets.map((b, bi) => (
                                  <li key={bi}>{b}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </GlowPanel>

        {/* Forward chevron. The artwork provides no back chevron; dots do that. */}
        <button
          type="button"
          className={styles.chevron}
          onClick={() => go(index + 1)}
          disabled={atEnd}
          aria-label="Next dog"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M8 4l8 8-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Pager: dots are the primary navigation and the only route back. Sits in
          its own bar so it never collides with the blue panel copy. */}
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

      {/* Article panel: full-width, split 50/50 image and text, sized to its
          content. The frames are rendered in reverse order over a normal-row
          filmstrip, so the track translates opposite to the blue panel:
          advancing slides the blue panel left and the article panel right. */}
      <div className={styles.articleViewport}>
        <div className={styles.articleTrack}>
          {slides.map((_, revI) => {
            // DOM slot 0 holds the last slide; slot n-1 holds the first. The
            // transform then lands frame `index` in view moving rightward.
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={styles.articleImg}
                    src={a.image}
                    alt={a.imageAlt}
                    loading={current ? "eager" : "lazy"}
                  />
                </div>
                <div className={styles.articleText}>
                  <p className={styles.learnAbout}>
                    Learn <span className={styles.learnAboutAccent}>about&hellip;</span>
                  </p>
                  <div className={styles.articleMeta}>
                    {/* Real per-family pill colours land at checkpoint 5; this is
                        the neutral placeholder pill. */}
                    <span className={styles.pill}>{FAMILY_PILL_LABEL[a.family]}</span>
                    <span className={styles.subLabel}>{a.subLabel}</span>
                  </div>
                  <h2 className={styles.headline}>{a.headline}</h2>
                  <p className={styles.dek}>{a.dek}</p>
                  <Link
                    href={a.href}
                    className={styles.cta}
                    tabIndex={current ? undefined : -1}
                  >
                    {a.ctaLabel}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Announce the change for assistive tech without moving focus. */}
      <p className={styles.srStatus} aria-live="polite">
        {slides[index].article.subLabel}, {index + 1} of {count}
      </p>
    </section>
  );
}
