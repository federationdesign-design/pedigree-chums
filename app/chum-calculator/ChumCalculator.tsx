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
    id: "mobility",
    question: "Do you have any physical limitations that affect how far or fast you can walk?",
    sub: "There is no wrong answer -- this helps us match you to a breed that genuinely suits your daily life",
    options: [
      { label: "Fully mobile -- exercise is about preference not ability", value: "full" },
      { label: "Some limitations -- I can manage regular walks but nothing strenuous", value: "limited" },
      { label: "Significantly limited -- short slow walks only, around 10-15 minutes", value: "minimal" },
    ],
  },
  {
    id: "allergies",
    question: "Does anyone in the household have dog allergies or asthma that could be triggered by pet hair or dander?",
    options: [
      { label: "No -- we are all fine", value: "none" },
      { label: "Mild -- we would prefer a lower-shedding breed", value: "mild" },
      { label: "Yes, significant -- we need a breed known to be low-allergen", value: "significant" },
    ],
  },
  {
    id: "tb_substance",
    question: "When you picture your ideal dog, what do you see?",
    sub: "Be honest -- this shapes everything that follows",
    options: [
      { label: "A proper dog -- substantial, grounded, takes up space", value: "substantial" },
      { label: "Small and light -- easy to carry, happy on a lap", value: "lap" },
      { label: "Either is fine", value: "any" },
    ],
  },
  {
    id: "tb_park",
    question: "At the park, dogs play rough -- jumping, barging, tumbling. Some breeds can get seriously hurt in that environment.",
    sub: "Would you rather have a dog that can pile in and take care of itself?",
    options: [
      { label: "Yes -- I want a sturdy dog that can handle boisterous play", value: "sturdy" },
      { label: "No -- I'd prefer a more delicate dog and manage the environment", value: "delicate" },
      { label: "Either is fine", value: "any" },
    ],
  },
  {
    id: "tb_dogperson",
    question: "Be honest -- are you drawn to dogs as animals, or mainly as company?",
    sub: "Some people love a dog with its own agenda. Others just want something warm and devoted.",
    options: [
      { label: "As an animal -- independent spirit, its own instincts and agenda", value: "animal" },
      { label: "As a companion -- devoted, close, emotionally attuned", value: "companion" },
      { label: "Somewhere in the middle", value: "any" },
    ],
  },
  {
    id: "tb_instincts",
    question: "A Beagle that catches an interesting scent will follow it with total commitment -- your recall becomes irrelevant. A Border Collie without a job will invent one, usually involving your furniture.",
    sub: "Working breeds live out their instincts every day. Would that feel charming, or drive you mad?",
    options: [
      { label: "Charming -- I'd love a dog with real instincts and drive", value: "working" },
      { label: "Honestly that would frustrate me -- I want a calmer, more biddable dog", value: "biddable" },
      { label: "Somewhere in between", value: "any" },
    ],
  },
  {
    id: "tb_looks",
    question: "Some dogs stop traffic -- long coats, striking looks, unusual shapes. Others are just dogs.",
    sub: "Does the aesthetic matter to you?",
    options: [
      { label: "Yes -- I'd love something visually striking that turns heads", value: "striking" },
      { label: "No -- temperament and practicality matter far more than looks", value: "practical" },
      { label: "No strong feelings either way", value: "any" },
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

  // ── Mobility scoring ────────────────────────────────────────────────────
  const minimalWalkOk = new Set(["maltese","chihuahua","bulldog","french-bulldog","pug",
    "bichon-frise","shih-tzu","yorkshire-terrier","pomeranian","maltipoo",
    "cavachon","cavalier-king-charles-spaniel","boston-terrier","papillon"]);
  const highExercise = new Set(["labrador","golden-retriever","rottweiler","boxer",
    "labradoodle","goldendoodle","german-shepherd","dalmatian","irish-setter",
    "springer-spaniel","doberman-pinscher","old-english-sheepdog",
    "weimaraner","border-collie","siberian-husky"]);
  const largeHard = new Set(["irish-wolfhound","mastiff","great-dane","saint-bernard",
    "bloodhound","weimaraner","rottweiler","boxer","doberman-pinscher",
    "old-english-sheepdog","german-shepherd"]);
  if (answers.mobility === "minimal") {
    if (minimalWalkOk.has(slug)) score += 15;
    else if (highExercise.has(slug)) score -= 50;
    else score -= 25;
    if (largeHard.has(slug)) score -= 30;
  } else if (answers.mobility === "limited") {
    if (highExercise.has(slug)) score -= 25;
    if (largeHard.has(slug)) score -= 15;
  }

  // ── Allergy scoring ─────────────────────────────────────────────────────
  const lowAllergen = new Set(["poodle","cockapoo","labradoodle","goldendoodle","cavapoo",
    "maltipoo","jackapoo","bichon-frise","maltese","yorkshire-terrier",
    "shih-tzu","west-highland-terrier","miniature-schnauzer",
    "border-terrier","boston-terrier"]);
  const highAllergen = new Set(["german-shepherd","siberian-husky","golden-retriever",
    "labrador","old-english-sheepdog","rottweiler","boxer","dalmatian",
    "great-dane","saint-bernard","bloodhound","rough-collie",
    "springer-spaniel","basset-hound","corgi"]);
  if (answers.allergies === "significant") {
    if (lowAllergen.has(slug)) score += 20;
    else if (highAllergen.has(slug)) score -= 50;
    else score -= 20;
  } else if (answers.allergies === "mild") {
    if (highAllergen.has(slug)) score -= 25;
    if (lowAllergen.has(slug)) score += 8;
  }

  return Math.max(0, Math.round(score));
}

function fitLabel(score: number, isBest = false): string {
  if (isBest) return "Best fit";
  if (score >= 120) return "Perfect fit";
  if (score >= 100) return "Great fit";
  return "Good fit";
}

function fitColour(score: number, isBest = false): { bg: string; text: string } {
  if (isBest) return { bg: "#9333ea", text: "#ffffff" };        // purple -- best fit
  if (score >= 120) return { bg: "#4ade80", text: "#0a3a57" }; // green -- perfect
  if (score >= 100) return { bg: "#ff7a3c", text: "#ffffff" }; // orange -- great
  return { bg: "#ffb02e", text: "#0a3a57" };                   // amber -- good
}

function fitReason(breed: { name: string; score: number; slug: string }, answers: Record<string, string>): string {
  const parts: string[] = [];
  const flags = personalityFlags[breed.slug] ?? {};
  const robust: Record<string, boolean> = {
    "labrador": true, "golden-retriever": true, "german-shepherd": true, "springer-spaniel": true,
    "staffordshire-bull-terrier": true, "boxer": true, "border-collie": true, "beagle": true,
    "border-terrier": true, "jack-russell-terrier": true, "bull-terrier": true, "rottweiler": true,
    "lurcher": true, "corgi": true, "labradoodle": true, "goldendoodle": true,
    "chihuahua": false, "papillon": false, "maltese": false, "italian-greyhound": false,
    "yorkshire-terrier": false, "pomeranian": false, "shih-tzu": false, "cavapoo": false,
    "cavachon": false, "bichon-frise": false, "maltipoo": false, "dachshund": false,
    "pug": false, "french-bulldog": false, "cavalier-king-charles-spaniel": false,
  };
  const isRobust = robust[breed.slug] ?? true;

  // Size match
  const sizeBandMap: Record<string, string[]> = {
    small: ["small","toy"], medium: ["medium"], large: ["large","giant"],
  };
  const breedSizes: Record<string, string> = {
    "irish-wolfhound": "giant", "mastiff": "giant", "great-dane": "giant", "saint-bernard": "giant",
    "bloodhound": "large", "labrador": "large", "golden-retriever": "large", "german-shepherd": "large",
    "rottweiler": "large", "doberman-pinscher": "large", "weimaraner": "large", "dalmatian": "large",
    "old-english-sheepdog": "large", "siberian-husky": "large", "labradoodle": "large",
    "goldendoodle": "large", "boxer": "large", "irish-setter": "large", "springer-spaniel": "medium",
    "border-collie": "medium", "beagle": "medium", "cocker-spaniel": "medium", "whippet": "medium",
    "basset-hound": "medium", "staffordshire-bull-terrier": "medium", "bull-terrier": "medium",
    "lurcher": "medium", "poodle": "medium", "cockapoo": "small", "jackapoo": "small",
    "bulldog": "medium", "dachshund": "small", "corgi": "small", "border-terrier": "small",
    "miniature-schnauzer": "small", "west-highland-terrier": "small", "jack-russell-terrier": "small",
    "cavalier-king-charles-spaniel": "small", "cavachon": "small", "cavapoo": "small",
    "bichon-frise": "small", "shih-tzu": "small", "boston-terrier": "small", "pug": "small",
    "french-bulldog": "small", "pomeranian": "toy", "maltipoo": "toy", "chihuahua": "toy",
    "yorkshire-terrier": "toy", "maltese": "toy", "papillon": "toy", "italian-greyhound": "small",
    "rough-collie": "large", "greyhound": "large", "afghan-hound": "large",
  };
  const breedSize = breedSizes[breed.slug] ?? "medium";
  const wantedSizes = sizeBandMap[answers.size] ?? [];
  if (answers.size && answers.size !== "any" && wantedSizes.includes(breedSize)) {
    parts.push(`the right size for you`);
  }

  // Exercise match
  const exerciseMins: Record<string, number> = {
    "border-collie": 120, "siberian-husky": 120, "weimaraner": 100, "dalmatian": 90,
    "german-shepherd": 90, "irish-setter": 90, "springer-spaniel": 90, "doberman-pinscher": 90,
    "old-english-sheepdog": 90, "labrador": 80, "golden-retriever": 80, "rottweiler": 80,
    "boxer": 80, "labradoodle": 80, "goldendoodle": 80, "staffordshire-bull-terrier": 70,
    "lurcher": 50, "bloodhound": 60, "great-dane": 60, "irish-wolfhound": 60,
    "afghan-hound": 60, "beagle": 60, "bull-terrier": 60, "jack-russell-terrier": 60,
    "cockapoo": 60, "jackapoo": 60, "poodle": 60, "cocker-spaniel": 60, "corgi": 60,
    "border-terrier": 60, "mastiff": 45, "saint-bernard": 45, "basset-hound": 45,
    "cavalier-king-charles-spaniel": 45, "miniature-schnauzer": 45, "west-highland-terrier": 45,
    "cavapoo": 45, "greyhound": 40, "whippet": 40, "italian-greyhound": 40,
    "papillon": 40, "boston-terrier": 40, "dachshund": 40, "cavachon": 40,
    "bulldog": 30, "french-bulldog": 30, "pug": 30, "bichon-frise": 30,
    "shih-tzu": 30, "yorkshire-terrier": 30, "pomeranian": 30, "maltipoo": 30,
    "maltese": 25, "chihuahua": 25, "rough-collie": 80,
  };
  const mins = exerciseMins[breed.slug] ?? 60;
  if (answers.exercise === "high" && mins >= 80) parts.push(`matches your active lifestyle`);
  if (answers.exercise === "low" && mins <= 45) parts.push(`happy with shorter walks`);
  if (answers.exercise === "medium" && mins >= 45 && mins <= 80) parts.push(`suits your exercise level`);

  // Children
  if ((answers.children === "young" || answers.children === "older") && isRobust) {
    parts.push(`sturdy and good with children`);
  }

  // Velcro
  if (answers.velcro === "yes" && flags.velcro) parts.push(`loves being close to you`);
  if (answers.velcro === "no" && !flags.velcro) parts.push(`gives you space`);

  // Shedding
  if (answers.shedding === "low") {
    const lowShed = new Set(["poodle","cockapoo","labradoodle","goldendoodle","cavapoo","maltipoo",
      "jackapoo","bichon-frise","maltese","yorkshire-terrier","shih-tzu",
      "west-highland-terrier","miniature-schnauzer","border-terrier","boston-terrier"]);
    if (lowShed.has(breed.slug)) parts.push(`low shedding coat`);
  }

  // Alone time
  if (answers.alone === "lots" && !flags.velcro) parts.push(`handles time alone well`);
  if (answers.alone === "rarely" && flags.velcro) parts.push(`loves constant company`);

  if (parts.length === 0) return `${breed.name} scores well across your lifestyle answers.`;
  return `${breed.name}: ${parts.slice(0, 3).join(", ")}.`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ALL_BREEDS = breeds.filter((b) => !b.draft);
const THRESHOLD = 80;

export default function ChumCalculator() {
  const [step, setStep] = useState(0); // 0 = not started, 1..N = question index (1-based)
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hoveredBreed, setHoveredBreed] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const answeredCount = Object.keys(answers).length;
  const CORE_COUNT = 13;
  const coreAnswered = Object.keys(answers).filter(k => !k.startsWith("tb_")).length;
  const coreScored = ALL_BREEDS.map((breed) => ({ ...breed, score: scoreBreed(breed.slug, answers) })).sort((a, b) => b.score - a.score);
  const coreVisible = coreAnswered >= 3 ? coreScored.filter(b => b.score >= THRESHOLD).length : ALL_BREEDS.length;
  // After core questions, show tiebreakers only if >5 breeds remain
  const needsTiebreakers = coreAnswered >= CORE_COUNT && coreVisible > 5;
  const total = needsTiebreakers ? QUESTIONS.length : CORE_COUNT;
  const currentQ = step >= 1 && step <= total ? QUESTIONS[step - 1] : null;
  const started = step > 0;
  const finished = step > total;

  const scoredBreeds = useMemo(() => {
    if (answeredCount === 0) return ALL_BREEDS.map((b) => ({ ...b, score: 100 }));
    return ALL_BREEDS
      .map((b) => ({ ...b, score: scoreBreed(b.slug, answers) }))
      .sort((a, b) => b.score - a.score);
  }, [answers, answeredCount]);

  const thresholdActive = answeredCount >= 5;
  const visibleBreeds = thresholdActive ? scoredBreeds.filter((b) => b.score >= THRESHOLD) : scoredBreeds;

  // Best fit -- rank 1 only, and only when 20+ points clear of rank 2
  const top2 = visibleBreeds.slice(0, 2);
  const bestSlug = (
    finished &&
    top2.length >= 1 &&
    (top2.length === 1 || top2[0].score - top2[1].score >= 20)
  ) ? top2[0].slug : null;

  // Hide tail when 5+ perfect fits exist
  const perfectCount = visibleBreeds.filter(b => b.score >= 120).length;
  const greatCount = visibleBreeds.filter(b => b.score >= 100 && b.score < 120).length;
  // Cap shown breeds: max 5 perfect, max 5 great, hide good if enough above
  // Hide good fits if any great or perfect fits exist
  // Hide great fits if any perfect fits exist
  // Always cap each tier at 5
  const hideTail = finished && (perfectCount > 0 || greatCount > 0);
  const hideGreat = finished && perfectCount > 0;

  // shownBreeds -- what's actually displayed after all tier hiding rules
  const shownBreeds = finished
    ? visibleBreeds.filter(b => {
        if (b.slug === bestSlug) return true;
        if (hideGreat && b.score >= 100 && b.score < 120) return false;
        if (hideTail && b.score < 100) return false;
        return true;
      }).slice(0, 16)
    : visibleBreeds;
  const visibleCount = thresholdActive ? shownBreeds.length : ALL_BREEDS.length;
  // Track how many of each tier we have shown so far (used in render)
  let shownPerfect = 0;
  let shownGreat = 0;

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
          const isBest = b.slug === bestSlug;
          // Hide good fits when great/perfect fits exist
          if (hideTail && b.score < 100 && !isBest) return null;
          // Hide great fits when perfect fits exist
          if (hideGreat && b.score >= 100 && b.score < 120 && !isBest) return null;
          // Cap perfect fits at 5
          if (finished && b.score >= 120 && !isBest) {
            shownPerfect++;
            if (shownPerfect > 5) return null;
          }
          // Cap great fits at 5
          if (finished && b.score >= 100 && b.score < 120 && !isBest) {
            shownGreat++;
            if (shownGreat > 5) return null;
          }
          return (
            <Link
              key={b.slug}
              href={`/chums/${b.slug}`}
              className={`${styles.breedCard} ${hidden ? styles.breedCardHidden : ""}`}
              tabIndex={hidden ? -1 : 0}
              onMouseEnter={(e) => { setHoveredBreed(b.slug); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
              onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHoveredBreed(null)}
            >
              <img
                src={bust(cardImg || b.image)}
                alt={b.name}
                className={styles.cardImg}
                loading="lazy"
              />
              {answeredCount >= 5 && !hidden && (
                <div
                  className={styles.cardScore}
                  style={{ background: fitColour(b.score, isBest).bg, color: fitColour(b.score, isBest).text }}

                >
                  {fitLabel(b.score, isBest)}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Global tooltip rendered at mouse position */}
      {hoveredBreed && (() => {
        const hb = scoredBreeds.find(b => b.slug === hoveredBreed);
        return hb ? (
          <div
            className={styles.fitTooltip}
            style={{ left: tooltipPos.x - 100, top: tooltipPos.y - 80 }}
          >
            <p className={styles.fitTooltipText}>{fitReason(hb, answers)}</p>
          </div>
        ) : null;
      })()}
    </main>
  );
}
