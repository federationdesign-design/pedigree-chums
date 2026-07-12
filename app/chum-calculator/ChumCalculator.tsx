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

// ── Types ─────────────────────────────────────────────────────────────────────

type Option = { label: string; value: string };
type Question = { id: string; question: string; sub?: string; options: Option[] };

// ── Core 10 questions ─────────────────────────────────────────────────────────

const CORE_QUESTIONS: Question[] = [
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

// ── Tiebreaker questions (shown when >12 breeds remain) ───────────────────────

const TIEBREAKERS: Question[] = [
  {
    id: "tb_type",
    question: "Are you open to designer crossbreeds?",
    sub: "Cockapoos, Labradoodles, Cavapoos and similar",
    options: [
      { label: "Pedigree breeds only", value: "classic" },
      { label: "Crossbreeds only", value: "designer" },
      { label: "Either -- doesn't matter to me", value: "any" },
    ],
  },
  {
    id: "tb_coat",
    question: "What kind of coat do you prefer?",
    options: [
      { label: "Short and smooth -- minimal coat care", value: "short" },
      { label: "Medium length", value: "medium" },
      { label: "Long and flowing -- I love a fluffy dog", value: "long" },
      { label: "No preference", value: "any" },
    ],
  },
  {
    id: "tb_professional_groom",
    question: "Are you happy paying for professional grooming?",
    options: [
      { label: "No -- I want to handle all grooming at home", value: "no" },
      { label: "Occasionally is fine", value: "occasional" },
      { label: "Yes -- regular salon visits are fine", value: "yes" },
    ],
  },
  {
    id: "tb_snoring",
    question: "How do you feel about a dog that snores?",
    sub: "Flat-faced breeds (pugs, bulldogs, French bulldogs) tend to snore and breathe loudly",
    options: [
      { label: "I'd find that annoying -- prefer a longer muzzle", value: "no" },
      { label: "I don't mind at all", value: "yes" },
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

  if (!suit && !ex) return 30;

  // Size
  if (answers.size && answers.size !== "any" && breed?.sizeBand) {
    if (breed.sizeBand !== answers.size) score -= 40;
  }
  // Home
  if (suit && answers.home) {
    if (answers.home === "flat") score += (suit.smallHome - 3) * 12;
    else if (answers.home === "small_garden") score += (suit.smallHome - 3) * 6;
  }
  // Children
  if (suit && answers.children) {
    if (answers.children === "young") score += (suit.children - 3) * 15;
    else if (answers.children === "older") score += (suit.children - 3) * 8;
  }
  // Other pets
  if (suit && answers.other_pets) {
    if (answers.other_pets === "dogs") score += (suit.otherDogs - 3) * 10;
    if (answers.other_pets === "cats") score += (suit.cats - 3) * 10;
    if (answers.other_pets === "both") {
      score += (suit.otherDogs - 3) * 8;
      score += (suit.cats - 3) * 8;
    }
  }
  // Alone
  if (suit && answers.alone) {
    const aloneMap: Record<string, number> = { rarely: 5, sometimes: 3, often: 2, lots: 1 };
    const needed = aloneMap[answers.alone] ?? 3;
    const diff = suit.timeAlone - needed;
    score += diff < -1 ? diff * 18 : diff * 6;
  }
  // Exercise
  if (ex && answers.exercise) {
    const mins = ex.minutesPerDay;
    if (answers.exercise === "high") score += mins >= 90 ? 15 : mins >= 60 ? 5 : -10;
    else if (answers.exercise === "medium") score += mins > 100 ? -15 : mins >= 50 && mins <= 90 ? 10 : 2;
    else if (answers.exercise === "low") score += mins > 80 ? -25 : mins <= 40 ? 15 : -5;
  }
  // Experience
  if (train && answers.experience) {
    if (answers.experience === "first") score += (3 - train.score) * 12;
    else if (answers.experience === "some") score += (3 - train.score) * 6;
  }
  if (suit && answers.experience === "first") score += (suit.firstTimer - 3) * 10;
  // Grooming
  if (groom && answers.grooming) {
    const groomMap: Record<string, number> = { low: 30, medium: 60, high: 120 };
    const maxMins = groomMap[answers.grooming] ?? 60;
    score += groom.timePerWeek > maxMins ? -(groom.timePerWeek - maxMins) * 0.4 : 5;
  }
  // Budget
  if (cost && answers.budget) {
    const annual = cost.annualCosts.food + cost.annualCosts.routineCare +
      cost.annualCosts.dentalAllowance + cost.annualCosts.neuteringAllowance +
      cost.medicalScenarios.typical;
    const budgetMap: Record<string, number> = { low: 1000, medium: 2000, high: 3500, any: 99999 };
    const max = budgetMap[answers.budget] ?? 2000;
    score += annual > max ? -(annual - max) * 0.02 : 8;
  }
  // Shedding
  if (groom && answers.shedding) {
    if (answers.shedding === "low" && groom.sheddingLevel >= 4) score -= 20;
    if (answers.shedding === "low" && groom.sheddingLevel <= 2) score += 10;
    if (answers.shedding === "medium" && groom.sheddingLevel >= 5) score -= 10;
  }

  // ── Tiebreakers ──
  if (answers.tb_type && answers.tb_type !== "any" && breed) {
    if (answers.tb_type === "classic" && breed.type !== "classic") score -= 35;
    if (answers.tb_type === "designer" && breed.type !== "designer-crossbreed") score -= 35;
  }
  if (answers.tb_coat && answers.tb_coat !== "any" && breed) {
    const coat = breed.coatLength.toLowerCase();
    if (answers.tb_coat === "short" && !coat.includes("short")) score -= 20;
    if (answers.tb_coat === "long" && !coat.includes("long")) score -= 20;
    if (answers.tb_coat === "medium" && (coat.includes("short") || coat.includes("long"))) score -= 10;
  }
  if (answers.tb_professional_groom && groom) {
    if (answers.tb_professional_groom === "no" && groom.monthlyProfessionalCost > 0) score -= 25;
    if (answers.tb_professional_groom === "occasional" && groom.monthlyProfessionalCost > 60) score -= 15;
  }
  if (answers.tb_snoring && breed) {
    const isFlat = breed.skull === "flat";
    if (answers.tb_snoring === "no" && isFlat) score -= 40;
    if (answers.tb_snoring === "yes" && isFlat) score += 5;
  }

  return Math.max(0, Math.round(score));
}

// ── Identify which tiebreaker questions to show based on remaining breeds ─────

function selectTiebreakers(slugs: string[], existingAnswers: Record<string, string>): Question[] {
  const remaining: Question[] = [];
  for (const tb of TIEBREAKERS) {
    if (existingAnswers[tb.id] !== undefined) continue; // already answered
    // Only suggest relevant tiebreakers
    if (tb.id === "tb_type") {
      const hasDesigner = slugs.some((s) => breeds.find((b) => b.slug === s)?.type === "designer-crossbreed");
      const hasClassic = slugs.some((s) => breeds.find((b) => b.slug === s)?.type === "classic");
      if (hasDesigner && hasClassic) remaining.push(tb);
    } else if (tb.id === "tb_coat") {
      remaining.push(tb);
    } else if (tb.id === "tb_professional_groom") {
      const hasProfessional = slugs.some((s) => (groomingNeeds[s]?.monthlyProfessionalCost ?? 0) > 0);
      if (hasProfessional) remaining.push(tb);
    } else if (tb.id === "tb_snoring") {
      const hasFlat = slugs.some((s) => breeds.find((b) => b.slug === s)?.skull === "flat");
      if (hasFlat) remaining.push(tb);
    }
    if (remaining.length >= 3) break;
  }
  return remaining;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ALL_BREEDS = breeds.filter((b) => !b.draft);
const THRESHOLD = 65;
const TOO_MANY = 12;
const TOO_FEW = 2;

export default function ChumCalculator() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQ, setActiveQ] = useState<string | null>(CORE_QUESTIONS[0].id);

  const coreAnsweredCount = CORE_QUESTIONS.filter((q) => answers[q.id] !== undefined).length;
  const allAnswered = coreAnsweredCount === CORE_QUESTIONS.length;
  const progress = Math.round((coreAnsweredCount / CORE_QUESTIONS.length) * 100);

  const scoredBreeds = useMemo(() => {
    if (coreAnsweredCount === 0) return ALL_BREEDS.map((b) => ({ ...b, score: 100 }));
    return ALL_BREEDS
      .map((b) => ({ ...b, score: scoreBreed(b.slug, answers) }))
      .sort((a, b) => b.score - a.score);
  }, [answers, coreAnsweredCount]);

  // Apply threshold only once core questions are mostly answered
  const thresholdActive = coreAnsweredCount >= 5;
  const aboveThreshold = scoredBreeds.filter((b) => b.score >= THRESHOLD);
  const visibleBreeds = thresholdActive ? aboveThreshold : scoredBreeds;

  // Adaptive state
  const tooMany = allAnswered && visibleBreeds.length > TOO_MANY;
  const tooFew = allAnswered && visibleBreeds.length <= TOO_FEW;
  const tiebreakersAvailable = tooMany
    ? selectTiebreakers(visibleBreeds.map((b) => b.slug), answers)
    : [];

  // Which tiebreakers are answered
  const tbAnswered = TIEBREAKERS.filter((tb) => answers[tb.id] !== undefined);

  function handleAnswer(qId: string, value: string) {
    const next = { ...answers, [qId]: value };
    setAnswers(next);
    // Advance to next unanswered core question, or first tiebreaker
    const coreIdx = CORE_QUESTIONS.findIndex((q) => q.id === qId);
    if (coreIdx !== -1) {
      const nextCore = CORE_QUESTIONS[coreIdx + 1];
      setActiveQ(nextCore ? nextCore.id : null);
    } else {
      // Was a tiebreaker -- advance to next tiebreaker if any
      const tbIdx = TIEBREAKERS.findIndex((q) => q.id === qId);
      const nextTb = TIEBREAKERS[tbIdx + 1];
      setActiveQ(nextTb ? nextTb.id : null);
    }
  }

  function relaxAnswers() {
    // Soften the most restrictive answer
    const relaxOrder = ["shedding", "grooming", "budget", "exercise", "alone"];
    const relaxMap: Record<string, Record<string, string>> = {
      shedding: { low: "medium", medium: "high" },
      grooming: { low: "medium", medium: "high" },
      budget: { low: "medium", medium: "high" },
      exercise: { high: "medium", low: "medium" },
      alone: { lots: "often", often: "sometimes" },
    };
    for (const key of relaxOrder) {
      const current = answers[key];
      if (current && relaxMap[key]?.[current]) {
        setAnswers({ ...answers, [key]: relaxMap[key][current] });
        return;
      }
    }
  }

  function reset() {
    setAnswers({});
    setActiveQ(CORE_QUESTIONS[0].id);
  }

  const ALL_QUESTIONS = [...CORE_QUESTIONS, ...(tooMany ? tiebreakersAvailable : [])];

  return (
    <main className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <p className={styles.eyebrow}>Find your perfect match</p>
        <h1 className={styles.title}>
          Chum <span className={styles.titleAccent}>Calculator</span>
        </h1>
        <p className={styles.headerSub}>
          Answer the questions below and watch the pack filter to your ideal chums in real time.
        </p>
      </div>

      {/* ── Questions ── */}
      <div className={styles.questionsWrap}>
        {ALL_QUESTIONS.map((q, idx) => {
          const answered = answers[q.id];
          const isActive = activeQ === q.id;
          const isTiebreaker = TIEBREAKERS.some((tb) => tb.id === q.id);

          return (
            <div
              key={q.id}
              className={`${styles.qBlock} ${isActive ? styles.qBlockActive : ""} ${answered && !isActive ? styles.qBlockDone : ""} ${isTiebreaker ? styles.qBlockTiebreaker : ""}`}
            >
              <button className={styles.qHeader} onClick={() => setActiveQ(isActive ? null : q.id)}>
                <span className={styles.qNum}>{isTiebreaker ? "+" : idx + 1}</span>
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

        {/* Too many -- prompt tiebreakers */}
        {tooMany && tiebreakersAvailable.length === 0 && tbAnswered.length > 0 && (
          <div className={styles.adaptiveBanner}>
            <p>Still {visibleBreeds.length} matches -- try adjusting your answers above to narrow further.</p>
          </div>
        )}
        {tooMany && tiebreakersAvailable.length > 0 && (
          <div className={styles.adaptiveBanner}>
            <p>You still have <strong>{visibleBreeds.length} matches</strong>. Answer a few more questions to narrow it down.</p>
          </div>
        )}

        {/* Too few -- offer to relax */}
        {tooFew && (
          <div className={`${styles.adaptiveBanner} ${styles.adaptiveBannerWarn}`}>
            <p>Only <strong>{visibleBreeds.length} breed{visibleBreeds.length !== 1 ? "s" : ""}</strong> match your criteria. That might be too narrow.</p>
            <button className={styles.relaxBtn} onClick={relaxAnswers}>
              Relax my criteria →
            </button>
          </div>
        )}

        {coreAnsweredCount > 0 && (
          <button className={styles.resetBtn} onClick={reset}>Reset all answers</button>
        )}
      </div>

      {/* ── Progress + count ── */}
      <div className={styles.progressRow}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.breedCount}>
          {!thresholdActive
            ? `All ${ALL_BREEDS.length} breeds`
            : visibleBreeds.length === 0
            ? "No matches yet"
            : `${visibleBreeds.length} breed${visibleBreeds.length !== 1 ? "s" : ""} match`}
        </p>
      </div>

      {/* ── Breed grid ── */}
      <div className={styles.breedGrid}>
        {scoredBreeds.map((b) => {
          const cardImg = breedCard[b.slug];
          const hidden = thresholdActive && b.score < THRESHOLD;
          return (
            <Link
              key={b.slug}
              href={`/chums/${b.slug}`}
              className={`${styles.breedCard} ${hidden ? styles.breedCardHidden : ""}`}
              tabIndex={hidden ? -1 : 0}
            >
              <img
                src={bust(cardImg || b.image)}
                alt={b.name}
                className={styles.cardImg}
                loading="lazy"
              />
              {coreAnsweredCount > 0 && !hidden && (
                <div className={styles.cardScore}>{b.score}%</div>
              )}
            </Link>
          );
        })}
      </div>

    </main>
  );
}
