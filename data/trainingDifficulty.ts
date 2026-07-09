// Training difficulty per breed.
// score: 1-5 (1=very easy, 5=very challenging)
// label: plain English summary
// traits: 2-3 bullet points on what the score means in practice
// goodFor: what this breed excels at training-wise
// watchOut: the main training pitfall for this breed

export interface TrainingDifficulty {
  breedId: string;
  score: 1 | 2 | 3 | 4 | 5;
  label: string;
  traits: string[];
  goodFor: string;
  watchOut: string;
  modelVersion: string;
}

const trainingDifficulty: Record<string, TrainingDifficulty> = {
  labrador: {
    breedId: "labrador",
    score: 1,
    label: "Eager to please",
    traits: [
      "Picks up new commands quickly, often in just a few repetitions",
      "Highly food-motivated which makes reward-based training very effective",
      "Rarely stubborn and responds well to consistent, positive reinforcement",
    ],
    goodFor: "Obedience, assistance work, agility and scent detection",
    watchOut: "Their enthusiasm can tip into pulling on the lead and jumping up -- start loose-lead and greeting manners early",
    modelVersion: "prototype-1.0",
  },
};

export default trainingDifficulty;
