// Lifespan curve data for breeds that have it
// X: age in years, Y: conceptual 0-100 score (function/health/quality of life)
// Source: published median lifespans + AAHA senior stage guidance

export type CurvePoint = { age: number; score: number; stage: "Puppy" | "Adolescent" | "Adult" | "Senior" | "Aged" };

export const lifespanCurves: Record<string, CurvePoint[]> = {
  "Labrador Retriever": [
    {age:0.0,score:0.0,stage:"Puppy"},{age:0.1,score:24.422,stage:"Puppy"},{age:0.2,score:42.879,stage:"Puppy"},{age:0.3,score:56.829,stage:"Puppy"},{age:0.4,score:67.372,stage:"Puppy"},{age:0.5,score:75.34,stage:"Puppy"},{age:0.6,score:81.363,stage:"Puppy"},{age:0.7,score:85.914,stage:"Puppy"},{age:0.8,score:89.354,stage:"Puppy"},{age:0.9,score:91.954,stage:"Puppy"},
    {age:1.0,score:93.919,stage:"Adolescent"},{age:1.1,score:95.404,stage:"Adolescent"},{age:1.2,score:96.526,stage:"Adolescent"},{age:1.3,score:97.375,stage:"Adolescent"},{age:1.4,score:98.016,stage:"Adolescent"},{age:1.5,score:98.5,stage:"Adolescent"},{age:1.6,score:97.88,stage:"Adolescent"},{age:1.7,score:97.76,stage:"Adolescent"},{age:1.8,score:97.64,stage:"Adolescent"},{age:1.9,score:97.52,stage:"Adolescent"},
    {age:2.0,score:97.4,stage:"Adult"},{age:2.5,score:96.8,stage:"Adult"},{age:3.0,score:96.2,stage:"Adult"},{age:3.5,score:95.6,stage:"Adult"},{age:4.0,score:95.0,stage:"Adult"},{age:4.5,score:94.4,stage:"Adult"},{age:5.0,score:93.8,stage:"Adult"},{age:5.5,score:93.2,stage:"Adult"},{age:6.0,score:92.6,stage:"Adult"},{age:6.5,score:92.0,stage:"Adult"},{age:7.0,score:91.4,stage:"Adult"},{age:7.5,score:89.55,stage:"Adult"},{age:7.9,score:86.99,stage:"Adult"},
    {age:8.0,score:86.2,stage:"Senior"},{age:8.5,score:81.35,stage:"Senior"},{age:9.0,score:75.0,stage:"Senior"},{age:9.5,score:67.15,stage:"Senior"},{age:10.0,score:57.8,stage:"Senior"},{age:10.5,score:46.95,stage:"Senior"},{age:10.9,score:37.19,stage:"Senior"},
    {age:11.0,score:34.6,stage:"Aged"},{age:11.5,score:20.75,stage:"Aged"},{age:12.0,score:5.4,stage:"Aged"},{age:12.2,score:0.0,stage:"Aged"},{age:13.0,score:0.0,stage:"Aged"},
  ],
  "Boxer": [
    {age:0.0,score:0.0,stage:"Puppy"},{age:0.1,score:17.158,stage:"Puppy"},{age:0.5,score:60.983,stage:"Puppy"},{age:0.7,score:73.224,stage:"Puppy"},
    {age:0.8,score:77.818,stage:"Adolescent"},{age:1.0,score:84.777,stage:"Adolescent"},{age:1.5,score:94.06,stage:"Adolescent"},{age:1.9,score:97.203,stage:"Adolescent"},
    {age:2.0,score:97.683,stage:"Adult"},{age:2.1,score:97.86,stage:"Adult"},{age:3.0,score:96.6,stage:"Adult"},{age:4.0,score:95.2,stage:"Adult"},{age:5.0,score:93.8,stage:"Adult"},{age:6.0,score:92.4,stage:"Adult"},{age:6.9,score:91.14,stage:"Adult"},
    {age:7.0,score:91.0,stage:"Senior"},{age:7.5,score:88.347,stage:"Senior"},{age:8.0,score:82.379,stage:"Senior"},{age:8.5,score:73.825,stage:"Senior"},{age:8.9,score:65.33,stage:"Senior"},
    {age:9.0,score:62.991,stage:"Aged"},{age:9.5,score:50.07,stage:"Aged"},{age:10.0,score:35.199,stage:"Aged"},{age:10.5,score:18.48,stage:"Aged"},{age:11.0,score:0.0,stage:"Aged"},
  ],
  "Great Dane": [
    {age:0.0,score:0.0,stage:"Puppy"},{age:0.1,score:17.158,stage:"Puppy"},{age:0.5,score:60.983,stage:"Puppy"},{age:0.7,score:73.224,stage:"Puppy"},
    {age:0.8,score:77.818,stage:"Adolescent"},{age:1.0,score:84.777,stage:"Adolescent"},{age:1.5,score:94.06,stage:"Adolescent"},{age:1.9,score:97.203,stage:"Adolescent"},
    {age:2.0,score:97.683,stage:"Adult"},{age:2.1,score:97.8,stage:"Adult"},{age:3.0,score:96.0,stage:"Adult"},{age:4.0,score:94.0,stage:"Adult"},{age:5.0,score:92.0,stage:"Adult"},{age:5.4,score:91.2,stage:"Adult"},
    {age:5.5,score:91.0,stage:"Senior"},{age:6.0,score:87.671,stage:"Senior"},{age:6.5,score:80.183,stage:"Senior"},{age:7.0,score:69.448,stage:"Senior"},{age:7.4,score:58.789,stage:"Senior"},
    {age:7.5,score:55.854,stage:"Aged"},{age:8.0,score:39.64,stage:"Aged"},{age:8.5,score:20.978,stage:"Aged"},{age:9.0,score:0.0,stage:"Aged"},
  ],
};

export const STAGE_COLOURS: Record<string, string> = {
  Puppy:      "rgba(255,255,255,0.04)",
  Adolescent: "rgba(255,255,255,0.07)",
  Adult:      "rgba(255,255,255,0.10)",
  Senior:     "rgba(255,255,255,0.07)",
  Aged:       "rgba(255,255,255,0.04)",
};

export const EXPLANATION = "These graphs are a visual guide to how different dog breeds typically move through life. The horizontal axis shows age, from birth to old age, while the vertical axis represents overall function, health, and quality of life. Each breed is shown as a single continuous curve: it starts low at birth, rises quickly through puppyhood as the dog develops, remains high during the prime adult years, and then gradually declines as the dog enters its senior stage. The exact shape of the line changes from breed to breed, which helps show one of the most important differences between dogs: some breeds mature quickly and enjoy a long adult phase, while others spend more of life growing and then age more rapidly. These are conceptual diagrams, designed to make breed differences easier to understand at a glance, rather than strict clinical or veterinary predictions for any individual dog.";

export const METHOD = "The curve score is a conceptual illustration, not observed veterinary data. Published median lifespan informed the x-axis. The y-axis was generated by piecewise mathematical functions representing rapid growth, an adult plateau, and accelerating later-life decline.";

export const SOURCES = [
  { label: "Labrador median longevity (12.0 years)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6196571/" },
  { label: "Great Dane and Boxer breed longevity study", url: "https://www.nature.com/articles/s41598-023-50458-w" },
  { label: "AAHA senior stage (final 25% of estimated lifespan)", url: "https://www.aaha.org/wp-content/uploads/globalassets/02-guidelines/canine-life-stage-2019/2019-aaha-canine-life-stage-guidelines-final.pdf" },
  { label: "Canine social/behavioural maturity", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8110720/" },
];
