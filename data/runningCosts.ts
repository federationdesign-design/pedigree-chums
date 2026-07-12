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
    insurance: number;
    boarding: number;
  };
  medicalScenarios: {
    low: number;
    typical: number;
    high: number;
  };
  modelVersion: string;
}

// ── Real-world all-in annual cost model (GBP, 2026) ──────────────────────────
//
// Components:
//   food          scaled to adult weight
//   routineCare   vet check-ups, vaccinations, flea/worm treatments
//   dental        annual scale-and-polish allowance
//   neutering     amortised over first 3 years
//   insurance     accident & illness policy; higher for brachycephalic/giant breeds
//   boarding      ~2 weeks kennels/pet-sitter per year
//
// Medical scenarios (uninsured top-up / excess costs):
//   low     healthy year, just excesses
//   typical one minor claim
//   high    one significant claim or chronic condition
//
// Realistic all-in annual totals by tier:
//   giant       £3,200 -- £5,500
//   large       £2,000 -- £3,500
//   medium      £1,500 -- £2,500
//   small       £1,200 -- £2,000
//   toy         £1,000 -- £1,800
//   brachycephalic premium: +£400-£800 on insurance

const runningCosts: Record<string, RunningCostConfig> = {

  // ── Giant breeds ──────────────────────────────────────────────────────────

  "irish-wolfhound": {
    breedId: "irish-wolfhound", breedName: "Irish Wolfhound",
    currency: "GBP", priceYear: 2026, lifespanYears: 7,
    annualCosts: { food: 900, routineCare: 420, dentalAllowance: 120, neuteringAllowance: 50, insurance: 1200, boarding: 500 },
    medicalScenarios: { low: 150, typical: 600, high: 2000 },
    modelVersion: "1.1",
  },

  "mastiff": {
    breedId: "mastiff", breedName: "Mastiff",
    currency: "GBP", priceYear: 2026, lifespanYears: 9,
    annualCosts: { food: 900, routineCare: 420, dentalAllowance: 120, neuteringAllowance: 50, insurance: 1100, boarding: 500 },
    medicalScenarios: { low: 150, typical: 600, high: 2000 },
    modelVersion: "1.1",
  },

  "great-dane": {
    breedId: "great-dane", breedName: "Great Dane",
    currency: "GBP", priceYear: 2026, lifespanYears: 9,
    annualCosts: { food: 900, routineCare: 420, dentalAllowance: 120, neuteringAllowance: 50, insurance: 1100, boarding: 500 },
    medicalScenarios: { low: 150, typical: 600, high: 2000 },
    modelVersion: "1.1",
  },

  "saint-bernard": {
    breedId: "saint-bernard", breedName: "Saint Bernard",
    currency: "GBP", priceYear: 2026, lifespanYears: 9,
    annualCosts: { food: 900, routineCare: 420, dentalAllowance: 120, neuteringAllowance: 50, insurance: 1100, boarding: 500 },
    medicalScenarios: { low: 150, typical: 600, high: 2000 },
    modelVersion: "1.1",
  },

  "bloodhound": {
    breedId: "bloodhound", breedName: "Bloodhound",
    currency: "GBP", priceYear: 2026, lifespanYears: 10,
    annualCosts: { food: 850, routineCare: 400, dentalAllowance: 110, neuteringAllowance: 45, insurance: 1000, boarding: 480 },
    medicalScenarios: { low: 130, typical: 550, high: 1800 },
    modelVersion: "1.1",
  },

  // ── Large breeds ──────────────────────────────────────────────────────────

  "labrador": {
    breedId: "labrador", breedName: "Labrador Retriever",
    currency: "GBP", priceYear: 2026, lifespanYears: 12,
    annualCosts: { food: 600, routineCare: 340, dentalAllowance: 90, neuteringAllowance: 35, insurance: 700, boarding: 420 },
    medicalScenarios: { low: 100, typical: 420, high: 1400 },
    modelVersion: "1.1",
  },

  "golden-retriever": {
    breedId: "golden-retriever", breedName: "Golden Retriever",
    currency: "GBP", priceYear: 2026, lifespanYears: 12,
    annualCosts: { food: 600, routineCare: 340, dentalAllowance: 90, neuteringAllowance: 35, insurance: 750, boarding: 420 },
    medicalScenarios: { low: 100, typical: 420, high: 1400 },
    modelVersion: "1.1",
  },

  "german-shepherd": {
    breedId: "german-shepherd", breedName: "German Shepherd",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 600, routineCare: 340, dentalAllowance: 90, neuteringAllowance: 35, insurance: 750, boarding: 420 },
    medicalScenarios: { low: 100, typical: 450, high: 1500 },
    modelVersion: "1.1",
  },

  "rottweiler": {
    breedId: "rottweiler", breedName: "Rottweiler",
    currency: "GBP", priceYear: 2026, lifespanYears: 10,
    annualCosts: { food: 650, routineCare: 360, dentalAllowance: 100, neuteringAllowance: 40, insurance: 900, boarding: 440 },
    medicalScenarios: { low: 120, typical: 480, high: 1600 },
    modelVersion: "1.1",
  },

  "doberman-pinscher": {
    breedId: "doberman-pinscher", breedName: "Doberman Pinscher",
    currency: "GBP", priceYear: 2026, lifespanYears: 9,
    annualCosts: { food: 620, routineCare: 340, dentalAllowance: 90, neuteringAllowance: 35, insurance: 850, boarding: 430 },
    medicalScenarios: { low: 110, typical: 450, high: 1500 },
    modelVersion: "1.1",
  },

  "weimaraner": {
    breedId: "weimaraner", breedName: "Weimaraner",
    currency: "GBP", priceYear: 2026, lifespanYears: 12,
    annualCosts: { food: 580, routineCare: 330, dentalAllowance: 85, neuteringAllowance: 33, insurance: 700, boarding: 420 },
    medicalScenarios: { low: 100, typical: 420, high: 1400 },
    modelVersion: "1.1",
  },

  "dalmatian": {
    breedId: "dalmatian", breedName: "Dalmatian",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 560, routineCare: 320, dentalAllowance: 85, neuteringAllowance: 33, insurance: 680, boarding: 400 },
    medicalScenarios: { low: 100, typical: 400, high: 1300 },
    modelVersion: "1.1",
  },

  "old-english-sheepdog": {
    breedId: "old-english-sheepdog", breedName: "Old English Sheepdog",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 580, routineCare: 340, dentalAllowance: 90, neuteringAllowance: 35, insurance: 720, boarding: 420 },
    medicalScenarios: { low: 100, typical: 430, high: 1400 },
    modelVersion: "1.1",
  },

  "afghan-hound": {
    breedId: "afghan-hound", breedName: "Afghan Hound",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 540, routineCare: 320, dentalAllowance: 85, neuteringAllowance: 33, insurance: 650, boarding: 400 },
    medicalScenarios: { low: 90, typical: 400, high: 1300 },
    modelVersion: "1.1",
  },

  "siberian-husky": {
    breedId: "siberian-husky", breedName: "Siberian Husky",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 560, routineCare: 320, dentalAllowance: 85, neuteringAllowance: 33, insurance: 680, boarding: 420 },
    medicalScenarios: { low: 100, typical: 400, high: 1300 },
    modelVersion: "1.1",
  },

  "labradoodle": {
    breedId: "labradoodle", breedName: "Labradoodle",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 540, routineCare: 320, dentalAllowance: 85, neuteringAllowance: 33, insurance: 680, boarding: 400 },
    medicalScenarios: { low: 100, typical: 400, high: 1300 },
    modelVersion: "1.1",
  },

  "goldendoodle": {
    breedId: "goldendoodle", breedName: "Goldendoodle",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 540, routineCare: 320, dentalAllowance: 85, neuteringAllowance: 33, insurance: 680, boarding: 400 },
    medicalScenarios: { low: 100, typical: 400, high: 1300 },
    modelVersion: "1.1",
  },

  "boxer": {
    breedId: "boxer", breedName: "Boxer",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 580, routineCare: 340, dentalAllowance: 90, neuteringAllowance: 35, insurance: 950, boarding: 430 },
    medicalScenarios: { low: 120, typical: 480, high: 1600 },
    modelVersion: "1.1",
  },

  "irish-setter": {
    breedId: "irish-setter", breedName: "Irish Setter",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 560, routineCare: 320, dentalAllowance: 85, neuteringAllowance: 33, insurance: 660, boarding: 410 },
    medicalScenarios: { low: 90, typical: 390, high: 1250 },
    modelVersion: "1.1",
  },

  "greyhound": {
    breedId: "greyhound", breedName: "Greyhound",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 520, routineCare: 300, dentalAllowance: 80, neuteringAllowance: 30, insurance: 580, boarding: 380 },
    medicalScenarios: { low: 80, typical: 360, high: 1200 },
    modelVersion: "1.1",
  },

  "lurcher": {
    breedId: "lurcher", breedName: "Lurcher",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 500, routineCare: 300, dentalAllowance: 80, neuteringAllowance: 30, insurance: 560, boarding: 380 },
    medicalScenarios: { low: 80, typical: 350, high: 1150 },
    modelVersion: "1.1",
  },

  "springer-spaniel": {
    breedId: "springer-spaniel", breedName: "Springer Spaniel",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 500, routineCare: 300, dentalAllowance: 80, neuteringAllowance: 30, insurance: 640, boarding: 380 },
    medicalScenarios: { low: 90, typical: 380, high: 1250 },
    modelVersion: "1.1",
  },

  "staffordshire-bull-terrier": {
    breedId: "staffordshire-bull-terrier", breedName: "Staffordshire Bull Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 480, routineCare: 290, dentalAllowance: 80, neuteringAllowance: 30, insurance: 820, boarding: 370 },
    medicalScenarios: { low: 100, typical: 420, high: 1400 },
    modelVersion: "1.1",
  },

  // ── Medium breeds ─────────────────────────────────────────────────────────

  "beagle": {
    breedId: "beagle", breedName: "Beagle",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 380, routineCare: 270, dentalAllowance: 70, neuteringAllowance: 27, insurance: 540, boarding: 340 },
    medicalScenarios: { low: 80, typical: 330, high: 1100 },
    modelVersion: "1.1",
  },

  "border-collie": {
    breedId: "border-collie", breedName: "Border Collie",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 420, routineCare: 280, dentalAllowance: 75, neuteringAllowance: 28, insurance: 560, boarding: 360 },
    medicalScenarios: { low: 80, typical: 340, high: 1100 },
    modelVersion: "1.1",
  },

  "cocker-spaniel": {
    breedId: "cocker-spaniel", breedName: "Cocker Spaniel",
    currency: "GBP", priceYear: 2026, lifespanYears: 12,
    annualCosts: { food: 360, routineCare: 270, dentalAllowance: 70, neuteringAllowance: 27, insurance: 600, boarding: 340 },
    medicalScenarios: { low: 90, typical: 360, high: 1200 },
    modelVersion: "1.1",
  },

  "whippet": {
    breedId: "whippet", breedName: "Whippet",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 340, routineCare: 260, dentalAllowance: 65, neuteringAllowance: 25, insurance: 500, boarding: 330 },
    medicalScenarios: { low: 70, typical: 310, high: 1000 },
    modelVersion: "1.1",
  },

  "basset-hound": {
    breedId: "basset-hound", breedName: "Basset Hound",
    currency: "GBP", priceYear: 2026, lifespanYears: 12,
    annualCosts: { food: 400, routineCare: 280, dentalAllowance: 75, neuteringAllowance: 28, insurance: 620, boarding: 360 },
    medicalScenarios: { low: 90, typical: 370, high: 1200 },
    modelVersion: "1.1",
  },

  "bull-terrier": {
    breedId: "bull-terrier", breedName: "Bull Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 400, routineCare: 280, dentalAllowance: 75, neuteringAllowance: 28, insurance: 700, boarding: 360 },
    medicalScenarios: { low: 90, typical: 370, high: 1200 },
    modelVersion: "1.1",
  },

  "miniature-schnauzer": {
    breedId: "miniature-schnauzer", breedName: "Miniature Schnauzer",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 280, routineCare: 250, dentalAllowance: 65, neuteringAllowance: 25, insurance: 480, boarding: 310 },
    medicalScenarios: { low: 70, typical: 300, high: 1000 },
    modelVersion: "1.1",
  },

  "cockapoo": {
    breedId: "cockapoo", breedName: "Cockapoo",
    currency: "GBP", priceYear: 2026, lifespanYears: 15,
    annualCosts: { food: 300, routineCare: 260, dentalAllowance: 65, neuteringAllowance: 25, insurance: 520, boarding: 320 },
    medicalScenarios: { low: 70, typical: 310, high: 1000 },
    modelVersion: "1.1",
  },

  "jackapoo": {
    breedId: "jackapoo", breedName: "Jackapoo",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 260, routineCare: 250, dentalAllowance: 60, neuteringAllowance: 23, insurance: 460, boarding: 300 },
    medicalScenarios: { low: 65, typical: 290, high: 950 },
    modelVersion: "1.1",
  },

  "corgi": {
    breedId: "corgi", breedName: "Corgi",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 300, routineCare: 260, dentalAllowance: 65, neuteringAllowance: 25, insurance: 560, boarding: 320 },
    medicalScenarios: { low: 80, typical: 330, high: 1100 },
    modelVersion: "1.1",
  },

  "border-terrier": {
    breedId: "border-terrier", breedName: "Border Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 60, neuteringAllowance: 23, insurance: 420, boarding: 290 },
    medicalScenarios: { low: 60, typical: 270, high: 900 },
    modelVersion: "1.1",
  },

  "west-highland-terrier": {
    breedId: "west-highland-terrier", breedName: "West Highland Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 220, routineCare: 240, dentalAllowance: 60, neuteringAllowance: 23, insurance: 500, boarding: 290 },
    medicalScenarios: { low: 70, typical: 300, high: 1000 },
    modelVersion: "1.1",
  },

  "jack-russell-terrier": {
    breedId: "jack-russell-terrier", breedName: "Jack Russell Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 15,
    annualCosts: { food: 200, routineCare: 230, dentalAllowance: 55, neuteringAllowance: 21, insurance: 380, boarding: 270 },
    medicalScenarios: { low: 55, typical: 250, high: 850 },
    modelVersion: "1.1",
  },

  // ── Brachycephalic -- insurance premium ───────────────────────────────────

  "bulldog": {
    breedId: "bulldog", breedName: "Bulldog",
    currency: "GBP", priceYear: 2026, lifespanYears: 9,
    annualCosts: { food: 420, routineCare: 320, dentalAllowance: 90, neuteringAllowance: 35, insurance: 1400, boarding: 380 },
    medicalScenarios: { low: 200, typical: 700, high: 2500 },
    modelVersion: "1.1",
  },

  "french-bulldog": {
    breedId: "french-bulldog", breedName: "French Bulldog",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 280, routineCare: 270, dentalAllowance: 75, neuteringAllowance: 28, insurance: 1300, boarding: 330 },
    medicalScenarios: { low: 180, typical: 650, high: 2300 },
    modelVersion: "1.1",
  },

  "pug": {
    breedId: "pug", breedName: "Pug",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 200, routineCare: 250, dentalAllowance: 70, neuteringAllowance: 25, insurance: 1200, boarding: 290 },
    medicalScenarios: { low: 160, typical: 600, high: 2200 },
    modelVersion: "1.1",
  },

  "cavalier-king-charles-spaniel": {
    breedId: "cavalier-king-charles-spaniel", breedName: "Cavalier King Charles Spaniel",
    currency: "GBP", priceYear: 2026, lifespanYears: 11,
    annualCosts: { food: 200, routineCare: 250, dentalAllowance: 65, neuteringAllowance: 23, insurance: 950, boarding: 290 },
    medicalScenarios: { low: 140, typical: 550, high: 2000 },
    modelVersion: "1.1",
  },

  "boston-terrier": {
    breedId: "boston-terrier", breedName: "Boston Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 220, routineCare: 250, dentalAllowance: 65, neuteringAllowance: 23, insurance: 900, boarding: 300 },
    medicalScenarios: { low: 130, typical: 500, high: 1800 },
    modelVersion: "1.1",
  },

  "dachshund": {
    breedId: "dachshund", breedName: "Dachshund",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 180, routineCare: 240, dentalAllowance: 60, neuteringAllowance: 21, insurance: 820, boarding: 270 },
    medicalScenarios: { low: 120, typical: 480, high: 1800 },
    modelVersion: "1.1",
  },

  // ── Small / toy breeds ────────────────────────────────────────────────────

  "cavachon": {
    breedId: "cavachon", breedName: "Cavachon",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 200, routineCare: 240, dentalAllowance: 60, neuteringAllowance: 21, insurance: 480, boarding: 280 },
    medicalScenarios: { low: 65, typical: 290, high: 950 },
    modelVersion: "1.1",
  },

  "cavapoo": {
    breedId: "cavapoo", breedName: "Cavapoo",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 200, routineCare: 240, dentalAllowance: 60, neuteringAllowance: 21, insurance: 500, boarding: 280 },
    medicalScenarios: { low: 65, typical: 290, high: 950 },
    modelVersion: "1.1",
  },

  "bichon-frise": {
    breedId: "bichon-frise", breedName: "Bichon Frise",
    currency: "GBP", priceYear: 2026, lifespanYears: 16,
    annualCosts: { food: 180, routineCare: 230, dentalAllowance: 60, neuteringAllowance: 21, insurance: 440, boarding: 270 },
    medicalScenarios: { low: 60, typical: 270, high: 900 },
    modelVersion: "1.1",
  },

  "shih-tzu": {
    breedId: "shih-tzu", breedName: "Shih Tzu",
    currency: "GBP", priceYear: 2026, lifespanYears: 13,
    annualCosts: { food: 160, routineCare: 220, dentalAllowance: 60, neuteringAllowance: 19, insurance: 500, boarding: 260 },
    medicalScenarios: { low: 70, typical: 290, high: 980 },
    modelVersion: "1.1",
  },

  "poodle": {
    breedId: "poodle", breedName: "Poodle",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 200, routineCare: 240, dentalAllowance: 60, neuteringAllowance: 21, insurance: 460, boarding: 280 },
    medicalScenarios: { low: 60, typical: 280, high: 920 },
    modelVersion: "1.1",
  },

  "maltipoo": {
    breedId: "maltipoo", breedName: "Maltipoo",
    currency: "GBP", priceYear: 2026, lifespanYears: 15,
    annualCosts: { food: 160, routineCare: 220, dentalAllowance: 55, neuteringAllowance: 19, insurance: 420, boarding: 250 },
    medicalScenarios: { low: 55, typical: 260, high: 880 },
    modelVersion: "1.1",
  },

  "chihuahua": {
    breedId: "chihuahua", breedName: "Chihuahua",
    currency: "GBP", priceYear: 2026, lifespanYears: 16,
    annualCosts: { food: 120, routineCare: 200, dentalAllowance: 55, neuteringAllowance: 17, insurance: 380, boarding: 230 },
    medicalScenarios: { low: 50, typical: 240, high: 820 },
    modelVersion: "1.1",
  },

  "yorkshire-terrier": {
    breedId: "yorkshire-terrier", breedName: "Yorkshire Terrier",
    currency: "GBP", priceYear: 2026, lifespanYears: 15,
    annualCosts: { food: 120, routineCare: 200, dentalAllowance: 55, neuteringAllowance: 17, insurance: 420, boarding: 230 },
    medicalScenarios: { low: 55, typical: 250, high: 850 },
    modelVersion: "1.1",
  },

  "maltese": {
    breedId: "maltese", breedName: "Maltese",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 120, routineCare: 200, dentalAllowance: 55, neuteringAllowance: 17, insurance: 400, boarding: 230 },
    medicalScenarios: { low: 50, typical: 240, high: 820 },
    modelVersion: "1.1",
  },

  "papillon": {
    breedId: "papillon", breedName: "Papillon",
    currency: "GBP", priceYear: 2026, lifespanYears: 15,
    annualCosts: { food: 120, routineCare: 200, dentalAllowance: 55, neuteringAllowance: 17, insurance: 380, boarding: 230 },
    medicalScenarios: { low: 50, typical: 240, high: 820 },
    modelVersion: "1.1",
  },

  "pomeranian": {
    breedId: "pomeranian", breedName: "Pomeranian",
    currency: "GBP", priceYear: 2026, lifespanYears: 15,
    annualCosts: { food: 120, routineCare: 200, dentalAllowance: 55, neuteringAllowance: 17, insurance: 420, boarding: 230 },
    medicalScenarios: { low: 55, typical: 250, high: 850 },
    modelVersion: "1.1",
  },

  "italian-greyhound": {
    breedId: "italian-greyhound", breedName: "Italian Greyhound",
    currency: "GBP", priceYear: 2026, lifespanYears: 14,
    annualCosts: { food: 140, routineCare: 210, dentalAllowance: 55, neuteringAllowance: 19, insurance: 440, boarding: 240 },
    medicalScenarios: { low: 60, typical: 260, high: 880 },
    modelVersion: "1.1",
  },
};

export default runningCosts;
