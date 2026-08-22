"use client";

import { useState } from "react";
import { QUESTIONS, scoreBreed } from "./ChumCalculator";
import BreedResultRail from "./BreedResultRail";
import styles from "./calculator.module.css";
import k from "./ChumKnockout.module.css";

// The knockout runs on the dogs the calculator has already revealed and whittles
// them down with the four tb_ questions, in fixed file order. scoreBreed is reused
// as-is (the one and only scoring path). No animation yet. (Job B, 22 Aug 2026.)
//
// A split-score question picker was built and REMOVED on 22 Aug 2026. It chose the
// next question by how many survivors its answer swung. A 108k-field sweep showed it
// reproduced the fixed file order (tb_build, tb_dogperson, tb_instincts, tb_smallchar)
// in 100% of sampled reveals: the swing metric is dominated by each question's scoring
// magnitude, tb_build's are the largest, so it always won round 1, tb_dogperson round 2,
// and so on. It cost runtime for zero behavioural change. The order is fixed on purpose.
// Do not rebuild the picker without a metric that adapts to the current field (split
// balance, not swing count) and a sweep proving it actually varies.

type ScoredBreed = { slug: string; name: string; image: string; score: number };

type Props = {
  breeds: ScoredBreed[];            // the revealed dogs, up to MAX_RESULTS (8)
  answers: Record<string, string>;  // the core answers so far, merged into each round
  onRestart: () => void;            // Start again
};

const TARGET_MAX = 3; // knockout stops once this many or fewer survive
const FLOOR = 1;      // the screen is never cleared below one dog

// LAST DOG STANDING guard. Runs at the end of every elimination pass, never trusted
// to the ranking maths. Ranks the current survivors on their CUMULATIVE scoreBreed
// (every answer so far merged), keeps roughly the top half, keeps every dog tied at
// the cut line, and can never return an empty set. This is why a tb_ answer can push
// all scores down yet never clear the screen. Do not "simplify" it away.
// (Job B stage 3, 22 Aug 2026.)
function survivorsAfterRound(prev: ScoredBreed[], answers: Record<string, string>): ScoredBreed[] {
  const scored = prev
    .map((b) => ({ ...b, score: scoreBreed(b.slug, answers) }))
    .sort((a, b) => b.score - a.score);
  if (scored.length <= FLOOR) return scored;
  const keepCount = Math.max(FLOOR, Math.ceil(scored.length / 2)); // drop roughly half
  const cutScore = scored[keepCount - 1].score;
  const kept = scored.filter((b) => b.score >= cutScore);          // ties at the cut all stay
  return kept.length > 0 ? kept : [scored[0]];                     // never clear the screen
}

export default function ChumKnockout({ breeds, answers, onRestart }: Props) {
  // The four tb_ questions in fixed file order. Computed here (not at module level)
  // so a future import cycle with ChumCalculator cannot hit a TDZ.
  const tbQuestions = QUESTIONS.filter((q) => q.id.startsWith("tb_"));

  const [survivors, setSurvivors] = useState<ScoredBreed[]>(breeds);
  const [acc, setAcc] = useState<Record<string, string>>(answers);
  const [roundIdx, setRoundIdx] = useState(0);
  const [done, setDone] = useState(breeds.length <= TARGET_MAX);

  const currentQ = done ? null : (tbQuestions[roundIdx] ?? null);

  function answer(value: string) {
    if (!currentQ) return;
    const nextAnswers = { ...acc, [currentQ.id]: value };
    const nextSurvivors = survivorsAfterRound(survivors, nextAnswers);
    setAcc(nextAnswers);

    if (nextSurvivors.length <= TARGET_MAX) {
      setSurvivors(nextSurvivors);
      setDone(true);
      return;
    }
    if (roundIdx + 1 >= tbQuestions.length) {
      // Questions exhausted with more than TARGET_MAX still standing: fall back to
      // cumulative score order and take the top TARGET_MAX. With four questions used
      // on nearly every run this is the common exit, not a rare branch.
      setSurvivors(nextSurvivors.slice(0, TARGET_MAX));
      setDone(true);
      return;
    }
    setSurvivors(nextSurvivors);
    setRoundIdx(roundIdx + 1);
  }

  // ── End screen: straight to the result rail, then Start again ────────────────
  if (done || !currentQ) {
    return (
      <div>
        <BreedResultRail breeds={survivors} bestSlug={null} />
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button className={styles.resetBtn} onClick={onRestart}>Start again</button>
        </div>
      </div>
    );
  }

  // ── A question round: message, then the surviving dogs, then the question ────
  return (
    <div>
      <p className={k.message}>We still have a few too many chums matching you</p>
      {/* The pack still in the running. Re-rendered every round so the user watches
          it shrink as they answer. This rail is what stage 5 will animate. */}
      <BreedResultRail breeds={survivors} bestSlug={null} />
      <div className={styles.stepperWrap}>
        <div className={styles.stepCard}>
          <div className={styles.questionHeader}>
            <h2 className={styles.stepQuestion}>{currentQ.question}</h2>
          </div>
          {currentQ.sub && <p className={styles.stepSub}>{currentQ.sub}</p>}
          <div className={styles.stepOptions}>
            {currentQ.options.map((opt) => (
              <button key={opt.value} className={styles.option} onClick={() => answer(opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
