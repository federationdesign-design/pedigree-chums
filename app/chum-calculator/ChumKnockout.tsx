"use client";

import { useState, useEffect } from "react";
import { QUESTIONS, scoreBreed, fitReason } from "./ChumCalculator";
import BreedResultRail from "./BreedResultRail";
import { fireConfetti } from "../../lib/confetti";
import styles from "./calculator.module.css";
import k from "./ChumKnockout.module.css";
import shared from "../name-generator/knockout-shared.module.css";

// The knockout runs on the dogs the calculator has already revealed and whittles
// them down with the four tb_ questions, in fixed file order. scoreBreed is reused
// as-is (the one and only scoring path). (Job B, 22 Aug 2026.)
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
const FALL_MS = 700;  // must exceed the fallAway animation (0.65s) in knockout-shared

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

type Elim = { falling: string[]; next: ScoredBreed[]; nextDone: boolean; nextRound: number };

export default function ChumKnockout({ breeds, answers, onRestart }: Props) {
  // The four tb_ questions in fixed file order. Computed here (not at module level)
  // so a future import cycle with ChumCalculator cannot hit a TDZ.
  const tbQuestions = QUESTIONS.filter((q) => q.id.startsWith("tb_"));

  const [survivors, setSurvivors] = useState<ScoredBreed[]>(breeds);
  const [acc, setAcc] = useState<Record<string, string>>(answers);
  const [roundIdx, setRoundIdx] = useState(0);
  const [done, setDone] = useState(breeds.length <= TARGET_MAX);
  // While a round is being applied, the eliminated dogs fall away before the rail
  // updates. elim holds the pending next state until the animation has played.
  const [elim, setElim] = useState<Elim | null>(null);

  const currentQ = done ? null : (tbQuestions[roundIdx] ?? null);

  // Confetti comes from the vendored lib/confetti (no external CDN script). Fire once the knockout finishes.
  useEffect(() => {
    if (done) fireConfetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }, [done]);

  // Commit the pending elimination once the fall animation has played out.
  useEffect(() => {
    if (!elim) return;
    const t = setTimeout(() => {
      setSurvivors(elim.next);
      setRoundIdx(elim.nextRound);
      setDone(elim.nextDone);
      setElim(null);
    }, FALL_MS);
    return () => clearTimeout(t);
  }, [elim]);

  function answer(value: string) {
    if (!currentQ || elim) return; // ignore clicks mid-animation
    const nextAnswers = { ...acc, [currentQ.id]: value };
    const nextSurvivors = survivorsAfterRound(survivors, nextAnswers);
    const eliminated = survivors.filter((b) => !nextSurvivors.some((n) => n.slug === b.slug)).map((b) => b.slug);
    setAcc(nextAnswers);

    let nextDone = false;
    let finalNext = nextSurvivors;
    if (nextSurvivors.length <= TARGET_MAX) {
      nextDone = true;
    } else if (roundIdx + 1 >= tbQuestions.length) {
      // Questions exhausted with more than TARGET_MAX still standing: fall back to
      // cumulative score order and take the top TARGET_MAX. Common exit, not rare.
      finalNext = nextSurvivors.slice(0, TARGET_MAX);
      nextDone = true;
    }
    setElim({ falling: eliminated, next: finalNext, nextDone, nextRound: roundIdx + 1 });
  }

  // Native share of a link + the result names (option a). No image: that is a social
  // asset for a later pass, not a feature. (Job B stage 6, 22 Aug 2026.)
  async function shareResults() {
    if (typeof navigator === "undefined") return;
    const names = survivors.map((b) => b.name).join(", ");
    const text = `My Pedigree Chums result${survivors.length !== 1 ? "s" : ""}: ${names}`;
    const url = typeof window !== "undefined" ? `${window.location.origin}/chum-calculator` : "";
    try {
      if (navigator.share) await navigator.share({ title: "Pedigree Chums", text, url });
      else if (navigator.clipboard) await navigator.clipboard.writeText(`${text} ${url}`.trim());
    } catch {
      // share cancelled or unsupported; nothing to do
    }
  }

  // ── Result screen: title, the surviving cards, share + start again ───────────
  if (done || !currentQ) {
    return (
      <div className={k.resultScreen}>
        <h2 className={k.resultTitle}>Your result{survivors.length !== 1 ? "s" : ""}:</h2>
        <div className={shared.cardsVisible}>
          <BreedResultRail breeds={survivors} bestSlug={null} reasons={Object.fromEntries(survivors.map((b) => [b.slug, fitReason(b, acc)]))} />
        </div>
        <div className={k.resultActions}>
          <button className={styles.startBtn} onClick={shareResults}>Share results</button>
          <button className={styles.resetBtn} onClick={onRestart}>Start again</button>
        </div>
      </div>
    );
  }

  // ── A question round: pills, message, the surviving dogs, then the question ──
  return (
    <div>
      <div className={k.pillTrail}>
        {Array.from({ length: roundIdx }).map((_, i) => (
          <span key={i} className={k.pillDone}>Round {i + 1}</span>
        ))}
        <span className={k.pillCurrent}>Round {roundIdx + 1}</span>
      </div>
      <p className={k.message}>We still have a few too many chums matching you</p>
      {/* The pack still in the running. On answer the losers get the fall-away
          animation, then the rail updates. This is the knockout's moment. */}
      <BreedResultRail breeds={survivors} bestSlug={null} fallingSlugs={elim?.falling} />
      <div className={styles.stepperWrap}>
        <div className={styles.stepCard}>
          <div className={styles.questionHeader}>
            <h2 className={styles.stepQuestion}>{currentQ.question}</h2>
          </div>
          {currentQ.sub && <p className={styles.stepSub}>{currentQ.sub}</p>}
          <div className={styles.stepOptions}>
            {currentQ.options.map((opt) => (
              <button key={opt.value} className={styles.option} disabled={!!elim} onClick={() => answer(opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
