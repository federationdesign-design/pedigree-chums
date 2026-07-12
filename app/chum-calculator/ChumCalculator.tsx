"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { breeds, breedCard } from "../../data/breeds";
import { bust } from "../../data/imgVersion";
import suitabilityScores from "../../data/suitabilityScores";
import exerciseNeeds from "../../data/exerciseNeeds";
import runningCosts from "../../data/runningCosts";
import groomingNeeds from "../../data/groomingNeeds";
import trainingDifficulty from "../../data/trainingDifficulty";
import styles from "./calculator.module.css";

// ── Questions ─────────────────────────────────────────────────────────────────

type Option = { label: string; value: string };
type Question = { id: string; question: string; sub?: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    id: "size",
    question: "How big do you want your dog?",
    options: [
      { label: "Small -- lap dog, easy to carry", value: "small" },
      { label: "Medium -- the classic family dog", value: "medium" },
      { label: "Large -- a proper big dog", value: "large" },
      { label: "No preference", value: "any" },
    ],
  },
  {
    id: "home",
    question: "What kind of home do you have?",
    options: [
      { label: "Flat or apartment -- no garden", value: "flat" },
      { label: "House with a small garden", value: "small_garden" },
      { label: "House with a large garden", value: "large_garden" },
    ],
  },
  {
    id: "children",
    question: "Do you have young children?",
    options: [
      { label: "Yes -- toddlers or under 5", value: "young" },
      { label: "Yes -- school age (5-12)", value: "older" },
      { label: "No children at home", value: "none" },
    ],
  },
  {
    id: "other_pets",
    question: "Do you have other pets?",
    options: [
      { label: "Other dogs", value: "dogs" },
      { label: "Cats", value: "cats" },
      { label: "Both dogs and cats", value: "both" },
      { label: "No other pets", value: "none" },
    ],
  },
  {
    id: "alone",
    question: "How many hours a day is the house empty?",
    sub: "Include commuting and working hours",
    options: [
      { label: "Under 2 hours -- nearly always someone home", value: "rarely" },
      { label: "2-4 hours -- mornings or afternoons", value: "sometimes" },
      { label: "4-6 hours -- a standard working day", value: "often" },
      { label: "Over 6 hours most days", value: "lots" },
    ],
  },
  {
    id: "exercise",
    question: "How active is your household?",
    sub: "Be honest -- a dog's needs will outlast your good intentions",
    options: [
      { label: "Very active -- daily runs, long hikes", value: "high" },
      { label: "Moderately active -- good walks every day", value: "medium" },
      { label: "Fairly relaxed -- shorter walks, mostly home", value: "low" },
    ],
  },
  {
    id: "experience",
    question: "Have you owned a dog before?",
    options: [
      { label: "First time dog owner", value: "first" },
      { label: "Some experience -- had dogs growing up", value: "some" },
      { label: "Experienced -- confident with any breed", value: "experienced" },
    ],
  },
  {
    id: "grooming",
    question: "How much grooming are you happy with?",
    options: [
      { label: "Minimal -- a quick brush now and then", value: "low" },
      { label: "Some -- weekly brushing is fine", value: "medium" },
      { label: "Happy to groom regularly", value: "high" },
    ],
  },
  {
    id: "budget",
    question: "What's your rough annual budget?",
    sub: "Including food, vet bills and routine care",
    options: [
      { label: "Under £1,000", value: "low" },
      { label: "£1,000 -- £2,000", value: "medium" },
      { label: "£2,000 -- £3,500", value: "high" },
      { label: "Over £3,500 -- cost is not a concern", value: "any" },
    ],
  },
  {
    id: "shedding",
    question: "How do you feel about dog hair?",
    options: [
      { label: "I need a low-shedding breed", value: "low" },
      { label: "I can live with some hair", value: "medium" },
      { label: "Completely unbothered", value: "high" },
    ],
  },
];

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreBreed(slug: string, answers: Record<string, string>): number {
  let score = 100;
  const suit = suitabilityScores[slug];
  const ex = exerciseNeeds[slug];
  const cost = runningCosts[slug];
  const groom = groomingNeeds[slug];
  const train = trainingDifficulty[slug];
  const breed = breeds.find((b) => b.slug === slug);

  if (!suit && !ex) return 30; // no data -- keep in list but low score

  if (answers.size && answers.size !== "any" && breed?.sizeBand) {
    if (breed.sizeBand !== answers.size) score -= 40;
  }
  if (suit && answers.home) {
    if (answers.home === "flat") score += (suit.smallHome - 3) * 12;
    else if (answers.home === "small_garden") score += (suit.smallHome - 3) * 6;
  }
  if (suit && answers.children) {
    if (answers.children === "young") score += (suit.children - 3) * 15;
    else if (answers.children === "older") score += (suit.children - 3) * 8;
  }
  if (suit && answers.other_pets) {
    if (answers.other_pets === "dogs") score += (suit.otherDogs - 3) * 10;
    if (answers.other_pets === "cats") score += (suit.cats - 3) * 10;
    if (answers.other_pets === "both") {
      score += (suit.otherDogs - 3) * 8;
      score += (suit.cats - 3) * 8;
    }
  }
  if (suit && answers.alone) {
    const aloneMap: Record<string, number> = { rarely: 5, sometimes: 3, often: 2, lots: 1 };
    const needed = aloneMap[answers.alone] ?? 3;
    const diff = suit.timeAlone - needed;
    score += diff < -1 ? diff * 18 : diff * 6;
  }
  if (ex && answers.exercise) {
    const mins = ex.minutesPerDay;
    if (answers.exercise === "high") {
      score += mins >= 90 ? 15 : mins >= 60 ? 5 : -10;
    } else if (answers.exercise === "medium") {
      score += mins > 100 ? -15 : mins >= 50 && mins <= 90 ? 10 : 2;
    } else if (answers.exercise === "low") {
      score += mins > 80 ? -25 : mins <= 40 ? 15 : -5;
    }
  }
  if (train && answers.experience) {
    if (answers.experience === "first") score += (3 - train.score) * 12;
    else if (answers.experience === "some") score += (3 - train.score) * 6;
  }
  if (suit && answers.experience === "first") score += (suit.firstTimer - 3) * 10;
  if (groom && answers.grooming) {
    const groomMap: Record<string, number> = { low: 30, medium: 60, high: 120 };
    const maxMins = groomMap[answers.grooming] ?? 60;
    score += groom.timePerWeek > maxMins ? -(groom.timePerWeek - maxMins) * 0.4 : 5;
  }
  if (cost && answers.budget) {
    const annual = cost.annualCosts.food + cost.annualCosts.routineCare +
      cost.annualCosts.dentalAllowance + cost.annualCosts.neuteringAllowance +
      cost.medicalScenarios.typical;
    const budgetMap: Record<string, number> = { low: 1000, medium: 2000, high: 3500, any: 99999 };
    const max = budgetMap[answers.budget] ?? 2000;
    score += annual > max ? -(annual - max) * 0.02 : 8;
  }
  if (groom && answers.shedding) {
    if (answers.shedding === "low" && groom.sheddingLevel >= 4) score -= 20;
    if (answers.shedding === "low" && groom.sheddingLevel <= 2) score += 10;
    if (answers.shedding === "medium" && groom.sheddingLevel >= 5) score -= 10;
  }

  return Math.max(0, Math.round(score));
}

// ── Component ─────────────────────────────────────────────────────────────────

const ALL_BREEDS = breeds.filter((b) => !b.draft);

export default function ChumCalculator() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQ, setActiveQ] = useState<string | null>(QUESTIONS[0].id);

  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / QUESTIONS.length) * 100);

  // Score and sort all breeds based on answers so far
  const scoredBreeds = useMemo(() => {
    if (answeredCount === 0) return ALL_BREEDS.map((b) => ({ ...b, score: 100 }));
    return ALL_BREEDS
      .map((b) => ({ ...b, score: scoreBreed(b.slug, answers) }))
      .sort((a, b) => b.score - a.score);
  }, [answers, answeredCount]);

  // Threshold: hide breeds below 40 once at least 3 questions answered
  const visibleBreeds = answeredCount >= 3
    ? scoredBreeds.filter((b) => b.score >= 40)
    : scoredBreeds;

  function handleAnswer(qId: string, value: string) {
    const next = { ...answers, [qId]: value };
    setAnswers(next);
    // Advance to next unanswered question
    const qIdx = QUESTIONS.findIndex((q) => q.id === qId);
    const nextQ = QUESTIONS[qIdx + 1];
    setActiveQ(nextQ ? nextQ.id : null);
  }

  function reset() {
    setAnswers({});
    setActiveQ(QUESTIONS[0].id);
  }

  return (
    <main className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <p className={styles.eyebrow}>Find your perfect match</p>
        <h1 className={styles.title}>
          Chum <span className={styles.titleAccent}>Calculator</span>
        </h1>
        <p className={styles.headerSub}>
          Answer the questions below and watch the pack filter down to your ideal chums in real time.
        </p>
      </div>

      {/* ── Questions ── */}
      <div className={styles.questionsWrap}>
        {QUESTIONS.map((q, idx) => {
          const answered = answers[q.id];
          const isActive = activeQ === q.id;
          const isPast = !!answered;

          return (
            <div
              key={q.id}
              className={`${styles.qBlock} ${isActive ? styles.qBlockActive : ""} ${isPast && !isActive ? styles.qBlockDone : ""}`}
            >
              <button
                className={styles.qHeader}
                onClick={() => setActiveQ(isActive ? null : q.id)}
              >
                <span className={styles.qNum}>{idx + 1}</span>
                <span className={styles.qTitle}>{q.question}</span>
                {answered && (
                  <span className={styles.qAnswer}>
                    {q.options.find((o) => o.value === answered)?.label}
                  </span>
                )}
              </button>

              {isActive && (
                <div className={styles.qOptions}>
                  {q.sub && <p className={styles.qSub}>{q.sub}</p>}
                  {q.options.map((opt) => (
                    <button
                      key={opt.value}
                      className={`${styles.option} ${answered === opt.value ? styles.optionSelected : ""}`}
                      onClick={() => handleAnswer(q.id, opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {answeredCount > 0 && (
          <button className={styles.resetBtn} onClick={reset}>
            Reset all answers
          </button>
        )}
      </div>

      {/* ── Progress + breed count ── */}
      <div className={styles.progressRow}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.breedCount}>
          {visibleBreeds.length === ALL_BREEDS.length
            ? `All ${ALL_BREEDS.length} breeds`
            : `${visibleBreeds.length} of ${ALL_BREEDS.length} breeds match`}
        </p>
      </div>

      {/* ── Breed grid ── */}
      <div className={styles.breedGrid}>
        {scoredBreeds.map((b) => {
          const cardImg = breedCard[b.slug];
          const hidden = answeredCount >= 3 && b.score < 40;
          return (
            <Link
              key={b.slug}
              href={`/chums/${b.slug}`}
              className={`${styles.breedCard} ${hidden ? styles.breedCardHidden : ""}`}
              tabIndex={hidden ? -1 : 0}
            >
              {cardImg
                ? <img src={bust(cardImg)} alt={b.name} className={styles.cardImg} loading="lazy" />
                : <img src={bust(b.image)} alt={b.name} className={styles.cardImgFallback} loading="lazy" />
              }
              {answeredCount > 0 && !hidden && (
                <div className={styles.cardScore}>
                  {b.score}%
                </div>
              )}
            </Link>
          );
        })}
      </div>

    </main>
  );
}
