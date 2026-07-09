// Health conditions per breed.
// severity: 1-5 (1=minor/manageable, 5=life-limiting or very serious)
// likelihood: "rare" | "occasional" | "common" | "very-common"
// onsetStage: "puppy" | "adult" | "senior" | "any"
// description: plain-English explanation for owners (what it means to live with this condition)

export interface HealthCondition {
  name: string;
  severity: 1 | 2 | 3 | 4 | 5;
  likelihood: "rare" | "occasional" | "common" | "very-common";
  onsetStage: "puppy" | "adult" | "senior" | "any";
  description: string;
}

export interface BreedHealthProfile {
  breedId: string;
  conditions: HealthCondition[];
  generalNote: string;
  modelVersion: string;
}

const healthConditions: Record<string, BreedHealthProfile> = {
  labrador: {
    breedId: "labrador",
    generalNote: "Labradors are generally a robust breed but their popularity means certain hereditary conditions are well-documented. Hip and elbow screening of both parents before purchase is strongly recommended.",
    conditions: [
      {
        name: "Hip dysplasia",
        severity: 4,
        likelihood: "common",
        onsetStage: "adult",
        description: "Abnormal development of the hip joint leads to arthritis and mobility problems. Can range from mild stiffness to severe lameness requiring surgery. Both parents should be hip-scored before breeding.",
      },
      {
        name: "Elbow dysplasia",
        severity: 4,
        likelihood: "common",
        onsetStage: "adult",
        description: "A group of developmental conditions affecting the elbow joint, causing pain and lameness in one or both front legs. Surgical intervention is often required in moderate to severe cases.",
      },
      {
        name: "Obesity",
        severity: 3,
        likelihood: "very-common",
        onsetStage: "adult",
        description: "Labradors are famously food-motivated and prone to weight gain. Obesity significantly worsens joint conditions and reduces lifespan. Careful portion control and regular exercise are essential throughout life.",
      },
      {
        name: "Progressive Retinal Atrophy (PRA)",
        severity: 4,
        likelihood: "occasional",
        onsetStage: "adult",
        description: "A hereditary eye condition causing gradual deterioration of the retina, eventually leading to blindness. Dogs adapt well but it is not treatable. DNA testing can identify carriers before breeding.",
      },
      {
        name: "Exercise Induced Collapse (EIC)",
        severity: 3,
        likelihood: "occasional",
        onsetStage: "adult",
        description: "During intense exercise some Labs experience sudden muscle weakness and collapse. Episodes usually resolve within 30 minutes. DNA testing identifies affected and carrier dogs.",
      },
      {
        name: "Centronuclear Myopathy (CNM)",
        severity: 4,
        likelihood: "rare",
        onsetStage: "puppy",
        description: "A hereditary muscle disorder causing progressive weakness and muscle wasting. Symptoms appear in early puppyhood. DNA testing is available and responsible breeders screen for it.",
      },
      {
        name: "Tricuspid Valve Dysplasia (TVD)",
        severity: 4,
        likelihood: "occasional",
        onsetStage: "any",
        description: "A congenital heart defect affecting the valve between the right atrium and ventricle. Severity varies widely. Some dogs are mildly affected; severe cases can cause heart failure.",
      },
      {
        name: "Bloat (GDV)",
        severity: 5,
        likelihood: "occasional",
        onsetStage: "adult",
        description: "Gastric Dilatation-Volvulus is a life-threatening emergency where the stomach fills with gas and twists. Requires immediate veterinary intervention. Large, deep-chested dogs are at higher risk.",
      },
    ],
    modelVersion: "prototype-1.0",
  },
};

export default healthConditions;
