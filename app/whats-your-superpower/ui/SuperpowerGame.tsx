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
// hijacking and no preventDefault. Slide 0 is the intro, slides 1..15 are the
// questions, slide 16 is the result. The result slide is only rendered once
// every question is answered, so it cannot be swiped to early.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import configJson from "../data/config.mvp-4.2.json";
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

/** Question images. Slots exist whether or not the files do. */
const questionImage = (index: number) =>
  `/superpower/q${String(index + 1).padStart(2, "0")}.jpg`;

interface GameState {
  answersByQuestion: (AnswerLetter | null)[];
  started: boolean;
}

const freshState = (): GameState => ({
  answersByQuestion: config.questions.map(() => null),
  started: false,
});

function BoundaryStatement({ tone }: { tone?: "light" }) {
  return (
    <p className={tone === "light" ? styles.boundaryLight : styles.boundary}>
      {config.copy.boundary}
    </p>
  );
}

function CompactBlock({
  power,
  showMainTitle,
  bodyText,
}: {
  power: Power;
  showMainTitle: boolean;
  bodyText: string;
}) {
  return (
    <div className={styles.compactBlock}>
      <h3 className={styles.compactPower}>{power}</h3>
      {showMainTitle ? (
        <p className={styles.compactTitle}>{config.powerMeta[power].mainTitle}</p>
      ) : null}
      <p className={styles.blockBody}>{bodyText}</p>
    </div>
  );
}

export default function SuperpowerGame() {
  const [state, setState] = useState<GameState>(freshState);
  const [slide, setSlide] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const { answersByQuestion, started } = state;

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
    goTo(index + 2);
  };

  const progressPct = (100 * Math.min(slide, resultSlide)) / resultSlide;

  return (
    <div className={styles.rail} ref={railRef} aria-label={config.copy.gameTitle}>
      {/* ---- Slide 0: the intro ------------------------------------------ */}
      <section className={styles.slide} aria-label="Start">
        <div className={styles.introImg} />
        <div className={styles.introTint} />
        <div className={styles.introBody}>
          <h1 className={styles.introTitle}>
            What&apos;s Your
            <br />
            <span className={styles.titleAccent}>Superpower?</span>
          </h1>
          <p className={styles.introText}>{config.copy.promise}</p>
          <p className={styles.introTime}>{config.copy.completionTime}</p>
          <BoundaryStatement tone="light" />
          <div className={styles.introBtnRow}>
            <button type="button" className={styles.introBtn} onClick={start}>
              Start
            </button>
          </div>
        </div>
      </section>

      {/* ---- Slides 1..15: one question each ------------------------------ */}
      {config.questions.map((q, index) => {
        const stored = answersByQuestion[index];
        return (
          <section
            key={q.id}
            className={styles.slide}
            aria-label={`Question ${index + 1} of ${QUESTION_COUNT}`}
          >
            <div className={styles.qMedia}>
              {/* Decorative: the question is answerable without it. */}
              <img
                className={styles.qImg}
                src={questionImage(index)}
                alt=""
                loading={index < 2 ? "eager" : "lazy"}
              />
              <div className={styles.qMediaTint} />
            </div>

            <div className={styles.qBody}>
              <p className={styles.progress}>
                Question {index + 1} of {QUESTION_COUNT}
              </p>
              <h2 className={styles.question}>{q.copy}</h2>
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

      {/* ---- Slide 16: the result. Only exists once every question is
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
            <h1 className={styles.resultTitle}>{result.title}</h1>
            {result.line !== null ? (
              <p className={styles.resultLine}>{result.line}</p>
            ) : null}
            <p className={styles.summary}>{result.summary}</p>

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
                  showMainTitle={false}
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
                      showMainTitle
                      bodyText={config.powerMeta[p].packContribution}
                    />
                  ))}
                </div>
                <CompactBlock
                  power={result.supportingPower}
                  showMainTitle={false}
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

            <p className={styles.relativeExplanation}>
              {config.copy.relativeExplanation}
            </p>
            <BoundaryStatement />

            <div className={styles.restartRow}>
              <button type="button" className={styles.introBtn} onClick={restart}>
                Play again
              </button>
              <p className={styles.replay}>{config.copy.replay}</p>
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
