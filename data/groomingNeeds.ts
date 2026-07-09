// Grooming needs per breed.
// timePerWeek: typical grooming time in minutes per week
// monthlyProfessionalCost: average professional grooming cost per month in GBP (0 if not needed)
// professionalFrequency: how often professional grooming is needed (null if not applicable)
// homeGroomingTools: list of tools typically needed at home
// sheddingLevel: 1-5 (1=minimal, 5=heavy shedder)
// coatType: descriptor for the coat
// notes: one short plain-English tip

export interface GroomingNeeds {
  breedId: string;
  timePerWeek: number;
  monthlyProfessionalCost: number;
  professionalFrequency: string | null;
  homeGroomingTools: string[];
  sheddingLevel: number;
  coatType: string;
  notes: string;
  modelVersion: string;
}

const groomingNeeds: Record<string, GroomingNeeds> = {
  labrador: {
    breedId: "labrador",
    timePerWeek: 20,
    monthlyProfessionalCost: 0,
    professionalFrequency: null,
    homeGroomingTools: ["Slicker brush", "Rubber curry comb", "Deshedding tool"],
    sheddingLevel: 4,
    coatType: "Short double coat",
    notes: "Labs shed heavily twice a year and lightly year-round. A weekly brush keeps the coat healthy and reduces hair around the home.",
    modelVersion: "prototype-1.0",
  },
};

export default groomingNeeds;
