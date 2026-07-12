"use client";

import { useState } from "react";
import Link from "next/link";
import { breeds } from "../../data/breeds";
import suitabilityScores from "../../data/suitabilityScores";
import exerciseNeeds from "../../data/exerciseNeeds";
import runningCosts from "../../data/runningCosts";
import groomingNeeds from "../../data/groomingNeeds";
import trainingDifficulty from "../../data/trainingDifficulty";
import styles from "./calculator.module.css";

// ── Question definitions ──────────────────────────────────────────────────────

type Option = { label: string; value: string };
type Question = {
  id: string;
  question: string;
  sub?: string;
  options: Option[];
};

const QUESTIONS: Question[] = [
  {
    id: "size",
    question: "How big do you want your dog to be?",
    options: [
      { label: "Small -- lap dog, easy to manage", value: "small" },
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
    question: "Do you have young children at home?",
    options: [
      { label: "Yes -- under 5 years old", value: "young" },
      { label: "Yes -- school age (5-12)", value: "older" },
      { label: "No children", value: "none" },
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
    question: "How many hours a day will the dog be home alone?",
    sub: "This includes commuting and working hours",
    options: [
      { label: "Under 2 hours -- almost always someone home", value: "rarely" },
      { label: "2-4 hours -- mornings or afternoons", value: "sometimes" },
      { label: "4-6 hours -- a standard work day split", value: "often" },
      { label: "Over 6 hours most days", value: "lots" },
    ],
  },
  {
    id: "exercise",
    question: "How active is your household?",
    sub: "Be honest -- the dog's needs will outlast your good intentions",
    options: [
      { label: "Very active -- daily runs, long hikes, outdoor lifestyle", value: "high" },
      { label: "Moderately active -- good walks every day", value: "medium" },
      { label: "Fairly relaxed -- short walks, mostly home", value: "low" },
    ],
  },
  {
    id: "experience",
    question: "Have you owned a dog before?",
    options: [
      { label: "First time dog owner", value: "first" },
      { label: "Some experience -- had a dog growing up", value: "some" },
      { label: "Experienced -- confident handling any breed", value: "experienced" },
    ],
  },
  {
    id: "grooming",
    question: "How much grooming are you happy with?",
    options: [
      { label: "Minimal -- quick brush occasionally", value: "low" },
      { label: "Some -- weekly brushing is fine", value: "medium" },
      { label: "Happy to groom regularly -- love a fluffy dog", value: "high" },
    ],
  },
  {
    id: "budget",
    question: "What's your rough annual budget for dog ownership?",
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
    question: "How do you feel about dog hair around the home?",
    options: [
      { label: "Hate it -- I need a low-shedding breed", value: "low" },
      { label: "I can live with some hair", value: "medium" },
      { label: "Don't mind at all", value: "high" },
    ],
  },
];

// ── Scoring engine ────────────────────────────────────────────────────────────

function scoreBreed(slug: string, answers: Record<string, string>): number {
  let score = 100;
  const suit = suitabilityScores[slug];
  const ex = exerciseNeeds[slug];
  const cost = runningCosts[slug];
  const groom = groomingNeeds[slug];
  const train = trainingDifficulty[slug];
  const breed = breeds.find((b) => b.slug === slug);

  if (!suit && !ex) return 0; // no data -- skip

  // Size
  if (answers.size !== "any" && breed?.sizeBand) {
    if (breed.sizeBand !== answers.size) score -= 40;
  }

  // Home / small home suitability
  if (suit) {
    if (answers.home === "flat") {
      score += (suit.smallHome - 3) * 12; // 1-5 scale, 3 is neutral
    } else if (answers.home === "small_garden") {
      score += (suit.smallHome - 3) * 6;
    }
  }

  // Children
  if (suit) {
    if (answers.children === "young") score += (suit.children - 3) * 15;
    else if (answers.children === "older") score += (suit.children - 3) * 8;
  }

  // Other pets
  if (suit) {
    if (answers.other_pets === "dogs") score += (suit.otherDogs - 3) * 10;
    if (answers.other_pets === "cats") score += (suit.cats - 3) * 10;
    if (answers.other_pets === "both") {
      score += (suit.otherDogs - 3) * 8;
      score += (suit.cats - 3) * 8;
    }
  }

  // Alone time
  if (suit) {
    const aloneMap: Record<string, number> = { rarely: 5, sometimes: 3, often: 2, lots: 1 };
    const needed = aloneMap[answers.alone] ?? 3;
    const diff = suit.timeAlone - needed;
    if (diff < -1) score += diff * 18; // heavy penalty for breeds that struggle alone
    else score += diff * 6;
  }

  // Exercise
  if (ex) {
    const mins = ex.minutesPerDay;
    if (answers.exercise === "high") {
      // Active owner -- reward high-exercise breeds
      if (mins >= 90) score += 15;
      else if (mins >= 60) score += 5;
      else score -= 10;
    } else if (answers.exercise === "medium") {
      if (mins > 100) score -= 15;
      else if (mins >= 50 && mins <= 90) score += 10;
      else score += 2;
    } else if (answers.exercise === "low") {
      if (mins > 80) score -= 25;
      else if (mins <= 40) score += 15;
      else score -= 5;
    }
  }

  // Experience / trainability
  if (train) {
    if (answers.experience === "first") score += (3 - train.score) * 12; // score 1 = easy, 5 = hard
    else if (answers.experience === "some") score += (3 - train.score) * 6;
    // experienced owners -- no penalty
  }
  if (suit) {
    if (answers.experience === "first") score += (suit.firstTimer - 3) * 10;
  }

  // Grooming
  if (groom) {
    const groomMap: Record<string, number> = { low: 30, medium: 60, high: 120 };
    const maxMins = groomMap[answers.grooming] ?? 60;
    if (groom.timePerWeek > maxMins) score -= (groom.timePerWeek - maxMins) * 0.4;
    else score += 5;
  }

  // Budget -- use typical annual cost
  if (cost) {
    const annual = cost.annualCosts.food + cost.annualCosts.routineCare +
      cost.annualCosts.dentalAllowance + cost.annualCosts.neuteringAllowance +
      cost.medicalScenarios.typical;
    const budgetMap: Record<string, number> = { low: 1000, medium: 2000, high: 3500, any: 99999 };
    const max = budgetMap[answers.budget] ?? 2000;
    if (annual > max) score -= (annual - max) * 0.02;
    else score += 8;
  }

  // Shedding
  if (groom) {
    if (answers.shedding === "low" && groom.sheddingLevel >= 4) score -= 20;
    if (answers.shedding === "low" && groom.sheddingLevel <= 2) score += 10;
    if (answers.shedding === "medium" && groom.sheddingLevel >= 5) score -= 10;
  }

  return Math.max(0, Math.round(score));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChumCalculator() {
  const [step, setStep] = useState(0); // 0 = intro
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{ slug: string; name: string; image: string; score: number }[] | null>(null);

  const currentQ = step >= 1 && step <= QUESTIONS.length ? QUESTIONS[step - 1] : null;
  const progress = step === 0 ? 0 : Math.round((step / QUESTIONS.length) * 100);

  function handleAnswer(qId: string, value: string) {
    const next = { ...answers, [qId]: value };
    setAnswers(next);
    if (step < QUESTIONS.length) {
      setStep(step + 1);
    } else {
      // Calculate results
      const scored = breeds
        .filter((b) => !b.draft)
        .map((b) => ({
          slug: b.slug,
          name: b.name,
          image: b.image,
          score: scoreBreed(b.slug, next),
        }))
        .filter((b) => b.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
      setResults(scored);
      setStep(QUESTIONS.length + 1);
    }
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setResults(null);
  }

  // ── Intro ──
  if (step === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Find your perfect match</p>
          <h1 className={styles.title}>
            Chum<br /><span className={styles.titleAccent}>Calculator</span>
          </h1>
          <p className={styles.introText}>
            10 questions about your lifestyle, home and budget. We'll score all 54 breeds in the pack and find your ideal chums.
          </p>
          <button className={styles.startBtn} onClick={() => setStep(1)}>
            Find my chum →
          </button>
        </div>
      </main>
    );
  }

  // ── Results ──
  if (results) {
    return (
      <main className={styles.page}>
        <div className={styles.resultsWrap}>
          <p className={styles.eyebrow}>Your results</p>
          <h2 className={styles.resultsTitle}>Your ideal chums</h2>
          <p className={styles.resultsSub}>Based on your answers, these are your top matches from all 54 breeds in the pack.</p>

          <div className={styles.resultsGrid}>
            {results.map((r, i) => (
              <Link href={`/chums/${r.slug}`} key={r.slug} className={styles.resultCard}>
                <div className={styles.resultRank}>#{i + 1}</div>
                <div className={styles.resultImgWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image} alt={r.name} className={styles.resultImg} />
                </div>
                <p className={styles.resultName}>{r.name}</p>
                <p className={styles.resultScore}>{r.score}% match</p>
              </Link>
            ))}
          </div>

          <button className={styles.restartBtn} onClick={restart}>
            Start again
          </button>
        </div>
      </main>
    );
  }

  // ── Question ──
  if (!currentQ) return null;

  return (
    <main className={styles.page}>
      <div className={styles.questionWrap}>

        {/* Progress */}
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressLabel}>{step} of {QUESTIONS.length}</p>
        </div>

        <div className={styles.questionCard}>
          <p className={styles.questionNum}>Question {step}</p>
          <h2 className={styles.question}>{currentQ.question}</h2>
          {currentQ.sub && <p className={styles.questionSub}>{currentQ.sub}</p>}

          <div className={styles.options}>
            {currentQ.options.map((opt) => (
              <button
                key={opt.value}
                className={styles.option}
                onClick={() => handleAnswer(currentQ.id, opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {step > 1 && (
            <button className={styles.backBtn} onClick={() => setStep(step - 1)}>
              ← Back
            </button>
          )}
        </div>

      </div>
    </main>
  );
}
