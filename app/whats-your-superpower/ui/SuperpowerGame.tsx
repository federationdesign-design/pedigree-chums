"use client";

// What's Your Superpower: self-contained game component.
//
// All classification is deterministic local code: no external API calls, no
// lookups, nothing at runtime beyond this bundle. Answers exist in React
// state only. Nothing is written to the URL, document title, cookies,
// local storage, session storage or DOM data attributes, and no answer or
// score is transmitted anywhere (spec section 13).
//
// LAYOUT. One horizontal scroller, the same mechanism as
// britains-dog-history-2: native CSS scroll-snap, touch-action pan-x, no
// hijacking and no preventDefault. Slide 0 is the intro, then one slide per
// question (driven by config.questions.length), then the result slide. The
// result slide is only rendered once every question is answered, so it cannot
// be swiped to early.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import configJson from "../data/config.mvp-4.3.json";
import {
  resolveResult,
  type AnswerLetter,
  type GameConfig,
  type Power,
} from "../lib/engine";
import { trackEvent } from "./analytics";
import RadarChart from "./RadarChart";
import styles from "./SuperpowerGame.module.css";

const config = configJson as unknown as GameConfig;
const QUESTION_COUNT = config.questions.length;

/** Question images. Slots exist whether or not the files do. Keyed off the
 * question id, not the array position: q01.jpg to q15.jpg are numbered against
 * the original fifteen-question set, so M03 always pairs with q03 even after
 * MVP-4.3 dropped M02, M08, M10, M13 and M14. Deriving from the index would
 * shift every image onto the wrong (or a dropped) question. */
const questionImage = (id: string) =>
  `/superpower/q${id.replace(/^M/, "").padStart(2, "0")}.jpg`;

/** Desktop question size, chosen by copy length so the whole question always
 * fits without ever clamping (see SuperpowerGame.module.css). Short questions
 * stay at the large ~3x size; longer ones step down a tier so every word shows
 * above the buttons. Consumed only by the desktop media query, via --q-size;
 * mobile keeps its own font-size and ignores the variable. */
const desktopQuestionSize = (len: number) =>
  len > 84
    ? "clamp(2rem, 3.3vw, 2.9rem)"
    : len > 66
      ? "clamp(2.5rem, 4.1vw, 3.6rem)"
      : "clamp(3rem, 5vw, 4.6rem)";

/** Desktop tint strength, the alpha of the flat --navy wash over the question
 * photo (see SuperpowerGame.module.css). Data, not a hardcoded pair of ids in
 * the CSS: most photos take 0.1 (10%), but the two high-key ones, M05 (pale
 * kitchen Labrador) and M12 (terrier on pale sand), wash out the white text at
 * 10% and need a stronger 0.5 to lift it off. Consumed via --q-tint; mobile
 * keeps its gradient tint and ignores this. */
const STRONG_TINT_IDS = new Set(["M05", "M12"]);
const desktopQuestionTint = (id: string) =>
  STRONG_TINT_IDS.has(id) ? "0.5" : "0.1";

interface GameState {
  answersByQuestion: (AnswerLetter | null)[];
  started: boolean;
}

const freshState = (): GameState => ({
  answersByQuestion: config.questions.map(() => null),
  started: false,
});

function CompactBlock({ power, bodyText }: { power: Power; bodyText: string }) {
  return (
    <div className={styles.compactBlock}>
      <h3 className={styles.compactPower}>{power}</h3>
      <p className={styles.blockBody}>{bodyText}</p>
    </div>
  );
}

export default function SuperpowerGame() {
  const [state, setState] = useState<GameState>(freshState);
  const [slide, setSlide] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const { answersByQuestion, started } = state;

  // Slide 0 cover video. Plays once, muted, no loop: collie-wet.jpg is the
  // poster shown before playback and collie-super.jpg holds after it ends.
  // Under prefers-reduced-motion the video never plays; the held still is
  // shown straight away instead (spec section 12, same policy as the scroll).
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const [introEnded, setIntroEnded] = useState(false);
  const [introReducedMotion, setIntroReducedMotion] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setIntroReducedMotion(reduced);
    if (reduced) return;
    const video = introVideoRef.current;
    if (!video) return;
    // muted set imperatively too: the attribute alone is unreliable for
    // programmatic autoplay in some engines.
    video.muted = true;
    void video.play().catch(() => {
      // Autoplay refused despite muted: leave the poster in place rather than
      // forcing anything. The slide is still usable; Start sits over it.
    });
  }, []);

  const complete = answersByQuestion.every((a) => a !== null);
  const resultSlide = QUESTION_COUNT + 1;

  // Scroll the rail to a slide. Honours prefers-reduced-motion by jumping
  // rather than animating (spec section 12).
  const goTo = useCallback((index: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({
      left: index * rail.clientWidth,
      behavior: reduced ? "auto" : "smooth",
    });
  }, []);

  // The settled slide is read back from scroll position, so a swipe and a
  // button press feed the same counter.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const index = Math.round(rail.scrollLeft / rail.clientWidth);
        setSlide((prev) => (prev === index ? prev : index));
      });
    };
    rail.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
    };
  }, []);

  // One question_view per question arrived at, whether by button or swipe.
  useEffect(() => {
    if (slide >= 1 && slide <= QUESTION_COUNT) trackEvent("question_view");
  }, [slide]);

  // All scores are recalculated from the stored answer array on every
  // change; a button click never permanently increments a score.
  const result = useMemo(() => {
    if (!complete) return null;
    return resolveResult(answersByQuestion as AnswerLetter[], config);
  }, [complete, answersByQuestion]);

  // The result slide does not exist until every question is answered, so the
  // scroll to it must wait for the render that adds it to the rail.
  const settledRef = useRef(false);
  useEffect(() => {
    if (!complete) {
      settledRef.current = false;
      return;
    }
    if (settledRef.current) return;
    settledRef.current = true;
    goTo(resultSlide);
  }, [complete, goTo, resultSlide]);

  const start = () => {
    trackEvent("game_start");
    setState((prev) => ({ ...prev, started: true }));
    goTo(1);
  };

  const restart = () => {
    trackEvent("game_restart");
    setState(freshState());
    goTo(0);
  };

  // Selection stores one current answer for this question and advances.
  const answer = (index: number, letter: AnswerLetter) => {
    setState((prev) => {
      const answers = [...prev.answersByQuestion];
      answers[index] = letter;
      const wasIncomplete = prev.answersByQuestion.some((a) => a === null);
      if (wasIncomplete && answers.every((a) => a !== null)) {
        trackEvent("game_complete");
      }
      return { ...prev, answersByQuestion: answers };
    });
    // Every question but the last. The last is handled by the effect above,
    // once the result slide exists.
    if (index < QUESTION_COUNT - 1) goTo(index + 2);
  };

  const progressPct = (100 * Math.min(slide, resultSlide)) / resultSlide;

  return (
    <div className={styles.rail} ref={railRef} aria-label={config.copy.gameTitle}>
      {/* ---- Slide 0: the intro ------------------------------------------ */}
      <section className={styles.slide} aria-label="Start">
        {/* Cover video at z-0. The intro text and Start button (.introBody,
            z-2) sit over it unchanged. Decorative: aria-hidden, and the slide
            is fully usable from the poster or still alone. */}
        <div className={styles.introCover}>
          <video
            ref={introVideoRef}
            className={styles.introVideo}
            src="/superpower/supercolie.mp4"
            poster="/superpower/collie-wet.jpg"
            muted
            playsInline
            preload="auto"
            onEnded={() => setIntroEnded(true)}
            aria-hidden="true"
          />
          {introEnded || introReducedMotion ? (
            <img
              className={styles.introStill}
              src="/superpower/collie-super.jpg"
              alt=""
              aria-hidden="true"
            />
          ) : null}
        </div>
        <div className={styles.introBody}>
          <h1 className={styles.introTitle}>
            What&apos;s Your
            <br />
            <span className={styles.titleAccent}>Superpower?</span>
          </h1>
          <p className={styles.introText}>{config.copy.promise}</p>
          <p className={styles.introTime}>{config.copy.completionTime}</p>
          <div className={styles.introBtnRow}>
            <button type="button" className={styles.introBtn} onClick={start}>
              Start
            </button>
          </div>
        </div>
      </section>

      {/* ---- One slide per question --------------------------------------- */}
      {config.questions.map((q, index) => {
        const stored = answersByQuestion[index];
        return (
          <section
            key={q.id}
            className={styles.slide}
            aria-label={`Question ${index + 1} of ${QUESTION_COUNT}`}
            style={{ "--q-tint": desktopQuestionTint(q.id) } as CSSProperties}
          >
            <div className={styles.qMedia}>
              {/* Decorative: the question is answerable without it. */}
              <img
                className={styles.qImg}
                src={questionImage(q.id)}
                alt=""
                loading={index < 2 ? "eager" : "lazy"}
              />
              <div className={styles.qMediaTint} />
              <p className={styles.progress}>
                Question {index + 1} of {QUESTION_COUNT}
              </p>
            </div>

            <div className={styles.qBody}>
              {/* Desktop only: the label lives in the on-image stack, hugging
                  the question. The mobile label above (inside .qMedia) is
                  hidden on desktop, so the two never both show. */}
              <p className={styles.progressOverlay}>
                Question {index + 1} of {QUESTION_COUNT}
              </p>
              <h2
                className={styles.question}
                style={
                  { "--q-size": desktopQuestionSize(q.copy.length) } as CSSProperties
                }
              >
                {q.copy}
              </h2>
              <div className={styles.answers}>
                {(["A", "B"] as const).map((letter) => {
                  const chosen = stored === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      className={
                        chosen
                          ? `${styles.answerBtn} ${styles.answerChosen}`
                          : styles.answerBtn
                      }
                      aria-pressed={chosen}
                      onClick={() => answer(index, letter)}
                    >
                      {q.answers[letter].copy}
                    </button>
                  );
                })}
              </div>
              {index > 0 ? (
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => goTo(index)}
                >
                  Back
                </button>
              ) : null}
            </div>
          </section>
        );
      })}

      {/* ---- The result slide. Only exists once every question is
             answered, so it cannot be reached early by swiping. ---------- */}
      {result ? (
        <section className={styles.slide} aria-label={`${config.copy.gameTitle} result`}>
          <div className={styles.rMedia}>
            <RadarChart
              plot={result.plot}
              displayMin={config.plot.displayMin}
              displayMax={config.plot.displayMax}
              primaryEmphasisSet={result.chartPrimaryEmphasisSet}
              secondaryEmphasisSet={result.chartSecondaryEmphasisSet}
            />
          </div>

          <div className={styles.rBody}>
            <h1 className={styles.resultTitleHidden}>{result.title}</h1>

            {result.layout === "single" && result.supportingPower !== null ? (
              <>
                <div className={styles.mainBlock}>
                  <h2 className={styles.mainBlockTitle}>
                    {config.powerMeta[result.leadingPowers[0]].mainTitle}
                  </h2>
                  <p className={styles.blockBody}>
                    {config.powerMeta[result.leadingPowers[0]].relativeDescription}
                  </p>
                  <p className={styles.blockBody}>
                    {config.powerMeta[result.leadingPowers[0]].packContribution}
                  </p>
                </div>
                <CompactBlock
                  power={result.supportingPower}
                  bodyText={config.powerMeta[result.supportingPower].packContribution}
                />
              </>
            ) : null}

            {result.layout === "pair" && result.supportingPower !== null ? (
              <>
                <div className={styles.blockRow}>
                  {result.leadingPowers.map((p) => (
                    <CompactBlock
                      key={p}
                      power={p}
                      bodyText={config.powerMeta[p].packContribution}
                    />
                  ))}
                </div>
                <CompactBlock
                  power={result.supportingPower}
                  bodyText={config.powerMeta[result.supportingPower].packContribution}
                />
              </>
            ) : null}

            {/* Sidekick states award no power: no leading, supporting or
                per-power block, and no chart emphasis. The role leads,
                never the absence. */}
            {result.layout === "sidekick" ? (
              <ul className={styles.reasonList}>
                {result.reasons.map((reason) => (
                  <li key={reason} className={styles.reason}>
                    {reason}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className={styles.restartRow}>
              <button type="button" className={styles.introBtn} onClick={restart}>
                Play again
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Progress bar, fixed across the foot of every slide. */}
      {started ? (
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
      ) : null}
    </div>
  );
}
