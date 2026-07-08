export interface RunningCostConfig {
  breedId: string;
  breedName: string;
  currency: string;
  priceYear: number;
  lifespanYears: number;
  annualCosts: {
    food: number;
    routineCare: number;
    dentalAllowance: number;
    neuteringAllowance: number;
  };
  medicalScenarios: {
    low: number;
    typical: number;
    high: number;
  };
  modelVersion: string;
}

// ── Size-tier defaults (GBP, 2026 prices) ─────────────────────────────────
// Food scaled to typical adult weight. Routine care from UK care-plan benchmarks.
// Medical low/typical/high are prototype calibrations, not actuarial figures.
//
// Tiers:
//   giant  ~45-90kg  food £520  routine £360  dental £80  neuter £33
//   large  ~25-45kg  food £344  routine £288  dental £60  neuter £25
//   medium ~10-25kg  food £220  routine £240  dental £50  neuter £21
//   small  ~5-10kg   food £140  routine £210  dental £45  neuter £17
//   toy    ~1-5kg    food £90   routine £190  dental £40  neuter £13
//
// Medical scenarios create approximate annual totals of:
//   giant:  low £950 / typical £1,400 / high £2,500
//   large:  low £750 / typical £1,050 / high £1,700
//   medium: low £580 / typical £820  / high £1,400
//   small:  low £450 / typical £650  / high £1,150
//   toy:    low £380 / typical £560  / high £1,050
//
// High-cost overrides applied to brachycephalic and structurally predisposed breeds.

const runningCosts: Record<string, RunningCostConfig> = {

  // ── Giant breeds ──────────────────────────────────────────────────────────

  "irish-wolfhound": {
    breedId: "irish-wolfhound", breedName: "Irish Wolfhound",
    currency: "GBP", priceYear: 2026, lifespanYears: 7,
    annualCosts: { food: 520, routineCare: 360, dentalAllowance: 80, neuteringAllowance: 33 },
    medicalScenarios: { low: 57, typical: 407, high: 1527 },
    modelVersion: "prototype-1.0",
  },

  "mastiff": {
    breedId: "mastiff", breedName: "Mastiff",
    currency: "GBP", priceYear: 2026, lifespanYears: 9,
    annualCosts: { food: 520, routineCare: 360, dentalAllowance: 80, neuteringAllowance: 33 },
    medicalScenarios: { low: 57, typical: 407, high: 1527 },
    modelVersion: "prototype-1.0",
  },

  "great-dane": {
    breedId: "great-dane", breedName: "Great Dane",
    currency: "GBP", priceYear: 2026, lifespanYears: 9,
    annualCosts: { food: 520, routineCare: 360, dentalAllowance: 80, neuteringAllowance: 33 },
    medicalScenarios: { low: 57, typical: 407, high: 1527 },
    modelVersion: "prototype-1.0",
  },

  "saint-bernard": {
    breedId: "saint-bernard", breedName: "Saint Bernard",
    currency: "GBP", priceYear: 2026, lifespanYears: 9,
    annualCosts: { food: 520, routineCare: 360, dentalAllowance: 80, neuteringAllowance: 33 },
    medicalScenarios: { low: 57, typical: 407, high: 1527 },
    modelVersion: "prototype-1.0",
  },

  "bloodhound": {
    breedId: "bloodhound", breedName: "Bloodhound",
    currency: "GBP", priceYear: 2026, lifespanYears: 10,
    annualCosts: { food: 520, routineCare: 360, dentalAllowance: 80, neuteringAllowance: 33 },
    medicalScenarios: { low: 57, typical: 407, high: 1527 },
    modelVersion: "prototype-1.0",
  },

  // ── Large breeds ──────────────────────────────────────────────────────────

  "labrador": {
    breedId: "labrador", breedName: "Labrador Retriever",
    currency: "GBP", priceYear: 2026, lifespanYears: 12,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "golden-retriever": {
    breedId: "golden-retriever", breedName: "Golden Retriever",
    currency: "GBP", priceYear: 2026, lifespanYears: 12,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "german-shepherd": {
    breedId: "german-shepherd", breedName: "German Shepherd",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "rottweiler": {
    breedId: "rottweiler", breedName: "Rottweiler",
    currency: "GBP", priceYear: 2026, lifespanYears: 10,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 383, high: 1083 },
    modelVersion: "prototype-1.0",
  },

  "doberman-pinscher": {
    breedId: "doberman-pinscher", breedName: "Doberman Pinscher",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "weimaraner": {
    breedId: "weimaraner", breedName: "Weimaraner",
    currency: "GBP", priceYear: 2026, lifespanYears: 12,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "dalmatian": {
    breedId: "dalmatian", breedName: "Dalmatian",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "old-english-sheepdog": {
    breedId: "old-english-sheepdog", breedName: "Old English Sheepdog",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "afghan-hound": {
    breedId: "afghan-hound", breedName: "Afghan Hound",
    currency: "GBP", priceYear: 2026, lifespanYears: 12,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "siberian-husky": {
    breedId: "siberian-husky", breedName: "Siberian Husky",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "labradoodle": {
    breedId: "labradoodle", breedName: "Labradoodle",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "goldendoodle": {
    breedId: "goldendoodle", breedName: "Goldendoodle",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "boxer": {
    breedId: "boxer", breedName: "Boxer",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    // Brachycephalic -- elevated medical
    medicalScenarios: { low: 83, typical: 483, high: 1183 },
    modelVersion: "prototype-1.0",
  },

  "irish-setter": {
    breedId: "irish-setter", breedName: "Irish Setter",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "greyhound": {
    breedId: "greyhound", breedName: "Greyhound",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "lurcher": {
    breedId: "lurcher", breedName: "Lurcher",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "springer-spaniel": {
    breedId: "springer-spaniel", breedName: "Springer Spaniel",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  "staffordshire-bull-terrier": {
    breedId: "staffordshire-bull-terrier", breedName: "Staffordshire Bull Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 344, routineCare: 288, dentalAllowance: 60, neuteringAllowance: 25 },
    medicalScenarios: { low: 33, typical: 333, high: 983 },
    modelVersion: "prototype-1.0",
  },

  // ── Medium breeds ─────────────────────────────────────────────────────────

  "beagle": {
    breedId: "beagle", breedName: "Beagle",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  "border-collie": {
    breedId: "border-collie", breedName: "Border Collie",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  "cocker-spaniel": {
    breedId: "cocker-spaniel", breedName: "Cocker Spaniel",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  "whippet": {
    breedId: "whippet", breedName: "Whippet",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  "basset-hound": {
    breedId: "basset-hound", breedName: "Basset Hound",
    currency: "GBP", priceYear: 2026, lifespanYears: 12,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  "bull-terrier": {
    breedId: "bull-terrier", breedName: "Bull Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  "miniature-schnauzer": {
    breedId: "miniature-schnauzer", breedName: "Miniature Schnauzer",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  "cockapoo": {
    breedId: "cockapoo", breedName: "Cockapoo",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  "jackapoo": {
    breedId: "jackapoo", breedName: "Jackapoo",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  // Brachycephalic medium -- elevated medical
  "bulldog": {
    breedId: "bulldog", breedName: "Bulldog",
    currency: "GBP", priceYear: 2026, lifespanYears: 10,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 149, typical: 649, high: 1649 },
    modelVersion: "prototype-1.0",
  },

  "dachshund": {
    breedId: "dachshund", breedName: "Dachshund",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    // IVDD predisposition -- elevated medical
    medicalScenarios: { low: 99, typical: 499, high: 1349 },
    modelVersion: "prototype-1.0",
  },

  "corgi": {
    breedId: "corgi", breedName: "Corgi",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  "border-terrier": {
    breedId: "border-terrier", breedName: "Border Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  "west-highland-terrier": {
    breedId: "west-highland-terrier", breedName: "West Highland Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  "jack-russell-terrier": {
    breedId: "jack-russell-terrier", breedName: "Jack Russell Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 50, neuteringAllowance: 21 },
    medicalScenarios: { low: 49, typical: 309, high: 1059 },
    modelVersion: "prototype-1.0",
  },

  // ── Small breeds ──────────────────────────────────────────────────────────

  "cavalier-king-charles-spaniel": {
    breedId: "cavalier-king-charles-spaniel", breedName: "Cavalier King Charles Spaniel",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 140, routineCare: 210, dentalAllowance: 45, neuteringAllowance: 17 },
    // MVD and syringomyelia predisposition -- significantly elevated medical
    medicalScenarios: { low: 138, typical: 638, high: 1638 },
    modelVersion: "prototype-1.0",
  },

  "cavachon": {
    breedId: "cavachon", breedName: "Cavachon",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 140, routineCare: 210, dentalAllowance: 45, neuteringAllowance: 17 },
    medicalScenarios: { low: 38, typical: 238, high: 888 },
    modelVersion: "prototype-1.0",
  },

  "cavapoo": {
    breedId: "cavapoo", breedName: "Cavapoo",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 140, routineCare: 210, dentalAllowance: 45, neuteringAllowance: 17 },
    medicalScenarios: { low: 38, typical: 238, high: 888 },
    modelVersion: "prototype-1.0",
  },

  "bichon-frise": {
    breedId: "bichon-frise", breedName: "Bichon Frise",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 140, routineCare: 210, dentalAllowance: 45, neuteringAllowance: 17 },
    medicalScenarios: { low: 38, typical: 238, high: 888 },
    modelVersion: "prototype-1.0",
  },

  "shih-tzu": {
    breedId: "shih-tzu", breedName: "Shih Tzu",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 140, routineCare: 210, dentalAllowance: 45, neuteringAllowance: 17 },
    // Brachycephalic -- elevated medical
    medicalScenarios: { low: 88, typical: 438, high: 1188 },
    modelVersion: "prototype-1.0",
  },

  "boston-terrier": {
    breedId: "boston-terrier", breedName: "Boston Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 140, routineCare: 210, dentalAllowance: 45, neuteringAllowance: 17 },
    // Brachycephalic -- elevated medical
    medicalScenarios: { low: 88, typical: 438, high: 1188 },
    modelVersion: "prototype-1.0",
  },

  // Brachycephalic -- significantly elevated medical
  "pug": {
    breedId: "pug", breedName: "Pug",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 140, routineCare: 210, dentalAllowance: 45, neuteringAllowance: 17 },
    medicalScenarios: { low: 138, typical: 638, high: 1638 },
    modelVersion: "prototype-1.0",
  },

  "french-bulldog": {
    breedId: "french-bulldog", breedName: "French Bulldog",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 140, routineCare: 210, dentalAllowance: 45, neuteringAllowance: 17 },
    // Brachycephalic -- highest medical tier
    medicalScenarios: { low: 138, typical: 638, high: 1638 },
    modelVersion: "prototype-1.0",
  },

  "poodle": {
    breedId: "poodle", breedName: "Poodle",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 140, routineCare: 210, dentalAllowance: 45, neuteringAllowance: 17 },
    medicalScenarios: { low: 38, typical: 238, high: 888 },
    modelVersion: "prototype-1.0",
  },

  "maltipoo": {
    breedId: "maltipoo", breedName: "Maltipoo",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 140, routineCare: 210, dentalAllowance: 45, neuteringAllowance: 17 },
    medicalScenarios: { low: 38, typical: 238, high: 888 },
    modelVersion: "prototype-1.0",
  },

  // ── Toy breeds ────────────────────────────────────────────────────────────

  "chihuahua": {
    breedId: "chihuahua", breedName: "Chihuahua",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 90, routineCare: 190, dentalAllowance: 40, neuteringAllowance: 13 },
    medicalScenarios: { low: 30, typical: 227, high: 827 },
    modelVersion: "prototype-1.0",
  },

  "yorkshire-terrier": {
    breedId: "yorkshire-terrier", breedName: "Yorkshire Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 90, routineCare: 190, dentalAllowance: 40, neuteringAllowance: 13 },
    medicalScenarios: { low: 30, typical: 227, high: 827 },
    modelVersion: "prototype-1.0",
  },

  "maltese": {
    breedId: "maltese", breedName: "Maltese",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 90, routineCare: 190, dentalAllowance: 40, neuteringAllowance: 13 },
    medicalScenarios: { low: 30, typical: 227, high: 827 },
    modelVersion: "prototype-1.0",
  },

  "papillon": {
    breedId: "papillon", breedName: "Papillon",
    currency: "GBP", priceYear: 2026, lifespanYears: 15,
    annualCosts: { food: 90, routineCare: 190, dentalAllowance: 40, neuteringAllowance: 13 },
    medicalScenarios: { low: 30, typical: 227, high: 827 },
    modelVersion: "prototype-1.0",
  },

  "pomeranian": {
    breedId: "pomeranian", breedName: "Pomeranian",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 90, routineCare: 190, dentalAllowance: 40, neuteringAllowance: 13 },
    medicalScenarios: { low: 30, typical: 227, high: 827 },
    modelVersion: "prototype-1.0",
  },

  "italian-greyhound": {
    breedId: "italian-greyhound", breedName: "Italian Greyhound",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 90, routineCare: 190, dentalAllowance: 40, neuteringAllowance: 13 },
    medicalScenarios: { low: 30, typical: 227, high: 827 },
    modelVersion: "prototype-1.0",
  },
};

export default runningCosts;
