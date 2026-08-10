"use client";

// The Dogs at Work desktop mechanic (brief v3.0, section 6, checkpoint 3).
//
// Three stacked regions. The introduction is persistent and never animates.
// The blue panel and the article panel change together on navigation, but move
// in opposite directions: the blue panel slides one way, the article panel the
// other. That counter-motion is the signature of the design.
//
// Both panels are single-frame viewports over a filmstrip. The blue filmstrip
// runs in natural order and translates left as the index grows. The article
// filmstrip is laid out row-reverse and translates the opposite way, so the two
// tracks cross. Only the current frame of each is interactive; the rest are
// marked `inert`, which removes them from tab order and the accessibility tree.
//
// Reduced motion is honoured in CSS: the transitions drop out under
// prefers-reduced-motion and the panels simply change. Dots are the primary
// navigation and the only route backwards, because the artwork gives a forward
// chevron only. Left and right arrow keys page while the deck is focused.
//
// This component is desktop only. It is gated by min-width and min-height in the
// module CSS; below 700px of viewport height the page falls back to the mobile
// stack (built at checkpoint 4; currently the legacy carousel).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Slide } from "./data/types";
import { FAMILY_PILL_LABEL } from "./data/types";
import styles from "./deck.module.css";

// Persistent introduction. Transcribed from the concept artwork
// (dogs_at_work_main_page_concept). Appendix A supplies the blue panels only,
// not this standing intro, so it is flagged for Steve's confirmation in the
// checkpoint 3 report rather than invented here.
const INTRO =
  'Dogs do not know they have jobs. They follow scent, movement, instinct, training and reward. The "work" begins when humans turn those natural abilities into value: safer airports, faster searches, healthier people, protected livestock, better science. Dogs are an invisible workforce whose contribution is felt emotionally but rarely counted economically.';

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
  const blueViewportRef = useRef<HTMLDivElement>(null);
  // The blue panel is the one region allowed to scroll internally (step 4 of the
  // checkpoint 3 fit resolution). The page never scrolls and the article panel
  // stays pinned. A bottom fade appears while the current panel has more below.
  const [showFade, setShowFade] = useState(false);
  const count = slides.length;

  function currentBlueEl(): HTMLElement | null {
    const vp = blueViewportRef.current;
    return vp ? vp.querySelector<HTMLElement>('[data-current="true"]') : null;
  }
  function computeFade(el: HTMLElement | null) {
    if (!el) {
      setShowFade(false);
      return;
    }
    const canScroll = el.scrollHeight - el.clientHeight > 2;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    setShowFade(canScroll && !atBottom);
  }
  function onBlueScroll(e: React.UIEvent<HTMLDivElement>) {
    computeFade(e.currentTarget);
  }

  // On slide change, return the incoming panel to the top and re-evaluate the
  // fade. On resize the available height changes, so re-evaluate then too.
  useEffect(() => {
    const el = currentBlueEl();
    if (el) el.scrollTop = 0;
    computeFade(el);
  }, [index]);
  useEffect(() => {
    const onResize = () => computeFade(currentBlueEl());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

      {/* Blue panel: a filmstrip that translates left as the index grows. The
          current frame scrolls internally when its copy is taller than the panel. */}
      <div className={styles.blueViewport} ref={blueViewportRef}>
        <div className={styles.blueTrack}>
          {slides.map((slide, i) => (
            <article
              key={slide.id}
              className={styles.blueSlide}
              data-current={i === index ? "true" : undefined}
              onScroll={onBlueScroll}
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

        {/* Cue that the panel has more below. Shown only while the current frame
            can scroll and is not at the bottom. Decorative, so aria-hidden. */}
        <div
          className={styles.fade}
          aria-hidden="true"
          data-show={showFade ? "true" : "false"}
        />
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

      {/* Article panel: fixed to the bottom, split 50/50 image and text. The
          frames are rendered in reverse order over a normal-row filmstrip, so
          the track translates opposite to the blue panel: advancing slides the
          blue panel left and the article panel right. */}
      <div className={styles.articleViewport}>
        <div className={styles.articleTrack}>
          {slides.map((_, revI) => {
            // DOM slot 0 holds the last slide; slot n-1 holds the first. The
            // transform below then lands frame `index` in view moving rightward.
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
