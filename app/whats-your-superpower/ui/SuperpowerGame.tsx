"use client";

// What's Your Superpower: self-contained game component.
//
// All classification is deterministic local code: no external API calls, no
// lookups, nothing at runtime beyond this bundle. Answers exist in React
// state only. Nothing is written to the URL, document title, cookies,
// local storage, session storage or DOM data attributes, and no answer or
// score is transmitted anywhere (spec section 13).

import { useEffect, useMemo, useRef, useState } from "react";
import configJson from "../data/config.mvp-4.1.json";
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

type GameStatus = "entry" | "playing" | "result";

interface GameState {
  gameStatus: GameStatus;
  currentQuestion: number;
  answersByQuestion: (AnswerLetter | null)[];
}

const freshState = (): GameState => ({
  gameStatus: "entry",
  currentQuestion: 0,
  answersByQuestion: config.questions.map(() => null),
});

function BoundaryStatement() {
  return <p className={styles.boundary}>{config.copy.boundary}</p>;
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
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const { gameStatus, currentQuestion, answersByQuestion } = state;

  useEffect(() => {
    if (gameStatus === "playing") {
      trackEvent("question_view");
      questionHeadingRef.current?.focus();
    }
    if (gameStatus === "result") {
      resultHeadingRef.current?.focus();
    }
  }, [gameStatus, currentQuestion]);

  // All scores are recalculated from the stored answer array on every
  // change; a button click never permanently increments a score.
  const result = useMemo(() => {
    if (gameStatus !== "result") return null;
    if (answersByQuestion.some((a) => a === null)) return null;
    return resolveResult(answersByQuestion as AnswerLetter[], config);
  }, [gameStatus, answersByQuestion]);

  const start = () => {
    trackEvent("game_start");
    setState({ ...freshState(), gameStatus: "playing" });
  };

  const restart = () => {
    trackEvent("game_restart");
    setState(freshState());
  };

  // Selection stores one current answer for this question and advances.
  // The index guard prevents a double press from answering two questions.
  const answer = (index: number, letter: AnswerLetter) => {
    setState((prev) => {
      if (prev.gameStatus !== "playing" || prev.currentQuestion !== index) return prev;
      const answers = [...prev.answersByQuestion];
      answers[index] = letter;
      const last = index === config.questions.length - 1;
      if (last) trackEvent("game_complete");
      return {
        gameStatus: last ? "result" : "playing",
        currentQuestion: last ? index : index + 1,
        answersByQuestion: answers,
      };
    });
  };

  const back = () => {
    setState((prev) =>
      prev.gameStatus === "playing" && prev.currentQuestion > 0
        ? { ...prev, currentQuestion: prev.currentQuestion - 1 }
        : prev
    );
  };

  if (gameStatus === "entry") {
    return (
      <section className={styles.stage} aria-label={config.copy.gameTitle}>
        <h1 className={styles.gameTitle}>{config.copy.gameTitle}</h1>
        <p className={styles.promise}>{config.copy.promise}</p>
        <p className={styles.time}>{config.copy.completionTime}</p>
        <BoundaryStatement />
        <button type="button" className={styles.primaryButton} onClick={start}>
          Start
        </button>
      </section>
    );
  }

  if (gameStatus === "playing") {
    const q = config.questions[currentQuestion];
    const stored = answersByQuestion[currentQuestion];
    const progress = `Question ${currentQuestion + 1} of ${config.questions.length}`;
    return (
      <section className={styles.stage} aria-label={config.copy.gameTitle}>
        <p className={styles.progress}>{progress}</p>
        <div className={styles.progressTrack} aria-hidden="true">
          <div
            className={styles.progressFill}
            style={{
              width: `${(100 * (currentQuestion + 1)) / config.questions.length}%`,
            }}
          />
        </div>
        <h2 className={styles.question} tabIndex={-1} ref={questionHeadingRef}>
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
                    ? `${styles.answerButton} ${styles.answerChosen}`
                    : styles.answerButton
                }
                aria-pressed={chosen}
                onClick={() => answer(currentQuestion, letter)}
              >
                {q.answers[letter].copy}
              </button>
            );
          })}
        </div>
        {currentQuestion > 0 ? (
          <button type="button" className={styles.backButton} onClick={back}>
            Back
          </button>
        ) : null}
      </section>
    );
  }

  if (!result) return null;

  const supporting = result.supportingPower;

  return (
    <section className={styles.stage} aria-label={`${config.copy.gameTitle} result`}>
      <div className={styles.chartCard}>
        <RadarChart
          plot={result.plot}
          displayMin={config.plot.displayMin}
          displayMax={config.plot.displayMax}
          primaryEmphasisSet={result.chartPrimaryEmphasisSet}
          secondaryEmphasisSet={result.chartSecondaryEmphasisSet}
        />
      </div>

      <h1 className={styles.resultTitle} tabIndex={-1} ref={resultHeadingRef}>
        {result.title}
      </h1>
      {result.line !== null ? <p className={styles.resultLine}>{result.line}</p> : null}
      <p className={styles.summary}>{result.summary}</p>

      {result.layout === "single" && supporting !== null ? (
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
            power={supporting}
            showMainTitle={false}
            bodyText={config.powerMeta[supporting].packContribution}
          />
        </>
      ) : null}

      {result.layout === "pair" && supporting !== null ? (
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
            power={supporting}
            showMainTitle={false}
            bodyText={config.powerMeta[supporting].packContribution}
          />
        </>
      ) : null}

      {result.layout === "pack" ? (
        <div className={styles.blockRow}>
          {result.leadingPowers.map((p) => (
            <CompactBlock
              key={p}
              power={p}
              showMainTitle={false}
              bodyText={config.powerMeta[p].interpretation}
            />
          ))}
        </div>
      ) : null}

      <p className={styles.relativeExplanation}>{config.copy.relativeExplanation}</p>
      <BoundaryStatement />

      <div className={styles.restartRow}>
        <button type="button" className={styles.primaryButton} onClick={restart}>
          Restart
        </button>
        <p className={styles.replay}>{config.copy.replay}</p>
      </div>
    </section>
  );
}
