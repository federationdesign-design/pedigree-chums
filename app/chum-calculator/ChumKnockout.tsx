"use client";

import { useState } from "react";
import { QUESTIONS, scoreBreed } from "./ChumCalculator";
import BreedResultRail from "./BreedResultRail";
import styles from "./calculator.module.css";
import k from "./ChumKnockout.module.css";

// The knockout runs on the dogs the calculator has already revealed and whittles
// them down with the four tb_ questions. scoreBreed is reused as-is (the one and
// only scoring path). Stage 4: the question order is chosen by split score, not
// fixed. No animation yet. (Job B, 22 Aug 2026.)

type ScoredBreed = { slug: string; name: string; image: string; score: number };
type TBQuestion = { id: string; question: string; sub?: string; options: { label: string; value: string }[] };

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

// SPLIT SCORE (stage 4). How much a question's answer actually changes who survives.
// For each of the question's answers we run the elimination and see which dogs live;
// a dog that survives under some answers but not others is "swung" by this question.
// More swung dogs means the answer matters more, so that is the question to ask.
// A question that eliminates the same dogs whatever the answer scores 0 and is avoided.
function splitScore(q: TBQuestion, survivors: ScoredBreed[], acc: Record<string, string>): number {
  const survivalCount = new Map<string, number>();
  for (const o of q.options) {
    const kept = new Set(survivorsAfterRound(survivors, { ...acc, [q.id]: o.value }).map((b) => b.slug));
    for (const b of survivors) if (kept.has(b.slug)) survivalCount.set(b.slug, (survivalCount.get(b.slug) ?? 0) + 1);
  }
  let swung = 0;
  for (const b of survivors) {
    const c = survivalCount.get(b.slug) ?? 0;
    if (c > 0 && c < q.options.length) swung++;
  }
  return swung;
}

// Pick the highest-splitting unused question. Ties break by fixed file order (the
// order `unused` arrives in), so a run with no discriminating question left still
// falls back to a stable order rather than picking at random.
function pickQuestion(survivors: ScoredBreed[], acc: Record<string, string>, unused: TBQuestion[]): TBQuestion {
  let best = unused[0];
  let bestScore = -1;
  for (const q of unused) {
    const s = splitScore(q, survivors, acc);
    if (s > bestScore) { bestScore = s; best = q; }
  }
  return best;
}

export default function ChumKnockout({ breeds, answers, onRestart }: Props) {
  // The four tb_ questions. Computed here (not at module level) so a future import
  // cycle with ChumCalculator cannot hit a TDZ.
  const tbQuestions = QUESTIONS.filter((q) => q.id.startsWith("tb_")) as TBQuestion[];

  const [survivors, setSurvivors] = useState<ScoredBreed[]>(breeds);
  const [acc, setAcc] = useState<Record<string, string>>(answers);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [done, setDone] = useState(breeds.length <= TARGET_MAX);

  const unused = tbQuestions.filter((q) => !usedIds.includes(q.id));
  const currentQ = !done && unused.length > 0 ? pickQuestion(survivors, acc, unused) : null;

  function answer(value: string) {
    if (!currentQ) return;
    const nextAnswers = { ...acc, [currentQ.id]: value };
    const nextSurvivors = survivorsAfterRound(survivors, nextAnswers);
    const nextUsed = [...usedIds, currentQ.id];
    setAcc(nextAnswers);

    if (nextSurvivors.length <= TARGET_MAX) {
      setSurvivors(nextSurvivors);
      setDone(true);
      return;
    }
    if (nextUsed.length >= tbQuestions.length) {
      // Questions exhausted with more than TARGET_MAX still standing: fall back to
      // cumulative score order and take the top TARGET_MAX. With four questions used
      // on nearly every run this is the common exit, not a rare branch.
      setSurvivors(nextSurvivors.slice(0, TARGET_MAX));
      setDone(true);
      return;
    }
    setSurvivors(nextSurvivors);
    setUsedIds(nextUsed);
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

  // ── A question round ────────────────────────────────────────────────────────
  return (
    <div className={styles.stepperWrap}>
      <div className={styles.stepCard}>
        <p className={k.remaining}>{survivors.length} chums left</p>
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
  );
}
