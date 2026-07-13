"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { breeds, breedCard, personalityFlags, robustFlags, cityScore } from "../../data/breeds";
import { bust } from "../../data/imgVersion";
import suitabilityScores from "../../data/suitabilityScores";
import exerciseNeeds from "../../data/exerciseNeeds";
import runningCosts from "../../data/runningCosts";
import groomingNeeds from "../../data/groomingNeeds";
import trainingDifficulty from "../../data/trainingDifficulty";
import styles from "./calculator.module.css";

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
    sub: "All-in: food, insurance, vet bills, grooming and boarding",
    options: [
      { label: "Up to £1,500", value: "low" },
      { label: "£1,500 -- £2,500", value: "medium" },
      { label: "£2,500 -- £3,500", value: "high" },
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
  {
    id: "velcro",
    question: "Do you need personal space, or are you happy with a dog glued to you?",
    sub: "Some breeds follow their owner everywhere and struggle to settle alone",
    options: [
      { label: "I need my space -- an independent dog suits me better", value: "no" },
      { label: "I'd love a dog that wants to be close all the time", value: "yes" },
      { label: "Either is fine", value: "any" },
    ],
  },
  {
    id: "vocal",
    question: "Do you or your neighbours mind a noisy dog?",
    sub: "Some breeds bark, howl or whine frequently -- huskies, beagles and some terriers are particularly vocal",
    options: [
      { label: "Yes -- I need a quieter breed", value: "yes" },
      { label: "No -- noise doesn't bother us", value: "no" },
    ],
  },
  {
    id: "destructive",
    question: "Do you have expensive soft furnishings or things you really treasure?",
    sub: "Some breeds chew, dig or destroy when bored or anxious -- puppyhood aside, some never grow out of it",
    options: [
      { label: "Yes -- I need a calmer, less destructive breed", value: "yes" },
      { label: "No -- I'm not precious about my home", value: "no" },
    ],
  },
  {
    id: "tb_roughplay",
    question: "Do you like rough and tumble play with your dog?",
    sub: "Some breeds have very fine bones and can be seriously injured by boisterous play",
    options: [
      { label: "Yes -- I want a sturdy dog that can handle it", value: "yes" },
      { label: "No -- I prefer gentle, calm interaction", value: "no" },
      { label: "Either is fine", value: "any" },
    ],
  },
  {
    id: "tb_location",
    question: "Where do you live?",
    sub: "Some breeds need open countryside -- others are happiest on city streets",
    options: [
      { label: "City or large town -- mostly pavements and parks", value: "city" },
      { label: "Suburban -- some green space nearby", value: "suburban" },
      { label: "Rural -- countryside, fields and open space", value: "rural" },
    ],
  },
  {
    id: "tb_openspace",
    question: "Do you have easy access to open space for off-lead running?",
    options: [
      { label: "Yes -- fields, woodland or a large park nearby", value: "yes" },
      { label: "No -- mostly streets and small urban parks", value: "no" },
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
  const flags = personalityFlags[slug];

  if (!suit && !ex) return 30;

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
    if (answers.exercise === "high") score += mins >= 90 ? 15 : mins >= 60 ? 5 : -10;
    else if (answers.exercise === "medium") score += mins > 100 ? -15 : mins >= 50 && mins <= 90 ? 10 : 2;
    else if (answers.exercise === "low") score += mins > 80 ? -25 : mins <= 40 ? 15 : -5;
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
      cost.annualCosts.insurance + cost.annualCosts.boarding +
      cost.medicalScenarios.typical;
    const budgetMap: Record<string, number> = { low: 1500, medium: 2500, high: 3500, any: 99999 };
    const max = budgetMap[answers.budget] ?? 2500;
    score += annual > max ? -(annual - max) * 0.04 : 10;
  }
  if (groom && answers.shedding) {
    if (answers.shedding === "low" && groom.sheddingLevel >= 4) score -= 20;
    if (answers.shedding === "low" && groom.sheddingLevel <= 2) score += 10;
    if (answers.shedding === "medium" && groom.sheddingLevel >= 5) score -= 10;
  }
  if (flags && answers.velcro) {
    if (answers.velcro === "no" && flags.velcro) score -= 35;
    if (answers.velcro === "yes" && flags.velcro) score += 10;
    if (answers.velcro === "yes" && !flags.velcro) score -= 10;
  }
  if (flags && answers.vocal) {
    if (answers.vocal === "yes" && flags.vocal) score -= 40;
    if (answers.vocal === "no" && !flags.vocal) score += 8;
  }
  if (flags && answers.destructive) {
    if (answers.destructive === "yes" && flags.destructive) score -= 40;
    if (answers.destructive === "no" && !flags.destructive) score += 8;
  }

  return Math.max(0, Math.round(score));
}

function fitLabel(score: number): string {
  if (score >= 120) return "Perfect fit";
  if (score >= 100) return "Great fit";
  return "Good fit";
}

function fitColour(score: number): { bg: string; text: string } {
  if (score >= 120) return { bg: "#4ade80", text: "#0a3a57" }; // green -- Popular
  if (score >= 100) return { bg: "#ff7a3c", text: "#ffffff" }; // orange -- Endangered
  return { bg: "#ffb02e", text: "#0a3a57" };                   // amber -- In decline
}

function fitReason(breed: { name: string; score: number }, answers: Record<string, string>): string {
  const parts: string[] = [];
  if (answers.size && answers.size !== "any") parts.push(`matches your size preference`);
  if (answers.children === "young" || answers.children === "older") parts.push(`good with children`);
  if (answers.exercise === "high") parts.push(`suits an active lifestyle`);
  if (answers.exercise === "low") parts.push(`happy with a relaxed routine`);
  if (answers.alone === "lots") parts.push(`copes well alone`);
  if (answers.alone === "rarely") parts.push(`thrives with company`);
  if (answers.shedding === "low") parts.push(`low shedding`);
  if (answers.velcro === "yes") parts.push(`loves being close to you`);
  if (answers.velcro === "no") parts.push(`independent natured`);
  if (parts.length === 0) return `${breed.name} scores well across your answers.`;
  return `${breed.name} is a strong match: ${parts.slice(0, 3).join(", ")}.`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ALL_BREEDS = breeds.filter((b) => !b.draft);
const THRESHOLD = 80;

export default function ChumCalculator() {
  const [step, setStep] = useState(0); // 0 = not started, 1..N = question index (1-based)
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hoveredBreed, setHoveredBreed] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const CORE_COUNT = 13;
  const coreAnswered = Object.keys(answers).filter(k => !k.startsWith("tb_")).length;
  const coreScored = ALL_BREEDS.map((breed) => ({ ...breed, score: scoreBreed(breed.slug, answers) })).sort((a, b) => b.score - a.score);
  const coreVisible = coreAnswered >= 3 ? coreScored.filter(b => b.score >= THRESHOLD).length : ALL_BREEDS.length;
  // Skip tiebreakers if 5 or fewer breeds remain after core questions
  const total = (step > CORE_COUNT || coreAnswered < CORE_COUNT) && coreVisible > 5 ? QUESTIONS.length : CORE_COUNT;
  const currentQ = step >= 1 && step <= QUESTIONS.length ? QUESTIONS[step - 1] : null;
  const started = step > 0;
  const finished = step > total;

  const scoredBreeds = useMemo(() => {
    if (answeredCount === 0) return ALL_BREEDS.map((b) => ({ ...b, score: 100 }));
    return ALL_BREEDS
      .map((b) => ({ ...b, score: scoreBreed(b.slug, answers) }))
      .sort((a, b) => b.score - a.score);
  }, [answers, answeredCount]);

  const thresholdActive = answeredCount >= 3;
  const visibleCount = thresholdActive ? scoredBreeds.filter((b) => b.score >= THRESHOLD).length : ALL_BREEDS.length;

  function handleAnswer(qId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    setStep((s) => s + 1);
  }

  function goBack() {
    if (step > 1) {
      // Remove the previous answer so it doesn't score
      const prevQ = QUESTIONS[step - 2];
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[prevQ.id];
        return next;
      });
      setStep((s) => s - 1);
    }
  }

  function reset() {
    setAnswers({});
    setStep(0);
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
          Answer {total} questions and watch the pack filter to your ideal chums in real time.
        </p>
      </div>

      {/* ── Question stepper ── */}
      <div className={styles.stepperWrap}>

        {/* Not started */}
        {!started && (
          <div className={styles.stepCard}>
            <p className={styles.stepIntro}>Ready to find your ideal chum?</p>
            <button className={styles.startBtn} onClick={() => setStep(1)}>
              Let's go →
            </button>
          </div>
        )}

        {/* Active question */}
        {currentQ && (
          <div className={styles.stepCard}>
            <div className={styles.stepProgress}>
              <div className={styles.stepDots}>
                {QUESTIONS.map((_, i) => (
                  <span
                    key={i}
                    className={`${styles.stepDot} ${i < step - 1 ? styles.stepDotDone : ""} ${i === step - 1 ? styles.stepDotActive : ""}`}
                  />
                ))}
              </div>
              <span className={styles.stepCount}>{step} / {total}</span>
            </div>

            <h2 className={styles.stepQuestion}>{currentQ.question}</h2>
            {currentQ.sub && <p className={styles.stepSub}>{currentQ.sub}</p>}

            <div className={styles.stepOptions}>
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
              <button className={styles.backBtn} onClick={goBack}>← Back</button>
            )}
          </div>
        )}

        {/* Finished */}
        {finished && (
          <div className={styles.stepCard}>
            <p className={styles.stepDoneIcon}>🐾</p>
            <h2 className={styles.stepDoneTitle}>Here are your chums</h2>
            <p className={styles.stepDoneSub}>
              {visibleCount > 0
                ? `${visibleCount} breed${visibleCount !== 1 ? "s" : ""} match your lifestyle`
                : "No strong matches -- try relaxing your answers"}
            </p>
            <button className={styles.resetBtn} onClick={reset}>Start again</button>
          </div>
        )}
      </div>

      {/* ── Progress bar + count ── */}
      {started && (
        <div className={styles.progressRow}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${Math.round((answeredCount / total) * 100)}%` }} />
          </div>
          <p className={styles.breedCount}>
            {!thresholdActive
              ? `All ${ALL_BREEDS.length} breeds`
              : visibleCount === 0
              ? "No matches yet"
              : `${visibleCount} breed${visibleCount !== 1 ? "s" : ""} match`}
          </p>
        </div>
      )}

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
              {answeredCount > 0 && !hidden && (
                <div
                  className={styles.cardScore}
                  style={{ background: fitColour(b.score).bg, color: fitColour(b.score).text }}
                  onMouseEnter={() => setHoveredBreed(b.slug)}
                  onMouseLeave={() => setHoveredBreed(null)}
                >
                  {hoveredBreed === b.slug && (
                    <div className={styles.fitTooltip}>
                      <p className={styles.fitTooltipText}>{fitReason(b, answers)}</p>
                    </div>
                  )}
                  {fitLabel(b.score)}
                </div>
              )}
            </Link>
          );
        })}
      </div>

    </main>
  );
}
