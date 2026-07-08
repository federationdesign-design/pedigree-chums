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

const runningCosts: Record<string, RunningCostConfig> = {
  labrador: {
    breedId: "labrador",
    breedName: "Labrador Retriever",
    currency: "GBP",
    priceYear: 2026,
    lifespanYears: 12,
    annualCosts: {
      food: 344,
      routineCare: 288,
      dentalAllowance: 60,
      neuteringAllowance: 25,
    },
    medicalScenarios: {
      low: 33,
      typical: 333,
      high: 983,
    },
    modelVersion: "prototype-1.0",
  },
};

export default runningCosts;
