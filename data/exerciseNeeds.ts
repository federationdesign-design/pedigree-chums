// Exercise needs data per breed.
// minutesPerDay: typical daily exercise in minutes
// intensity: 1=gentle stroll, 2=brisk walk, 3=jog/run, 4=sustained high output
// weekPattern: 7 values (Mon-Sun) as multipliers 0.5-1.5 of minutesPerDay
//   (allows showing a natural weekly rhythm -- dogs often rest more on one day)
// copesAlone: how well the breed tolerates low-exercise periods (1-5, higher = better)
// notes: one short plain-English tip for owners

export interface ExerciseNeeds {
  breedId: string;
  minutesPerDay: number;
  intensity: 1 | 2 | 3 | 4;
  weekPattern: [number, number, number, number, number, number, number];
  copesAlone: number;
  notes: string;
  modelVersion: string;
}

const exerciseNeeds: Record<string, ExerciseNeeds> = {
  labrador: {
    breedId: "labrador",
    minutesPerDay: 80,
    intensity: 3,
    weekPattern: [1, 1, 1, 1, 1, 1.3, 1.3],
    copesAlone: 2,
    notes: "Labs thrive with two walks daily and love swimming. Without enough exercise they become destructive.",
    modelVersion: "prototype-1.0",
  },
};

export default exerciseNeeds;
