// Suitability scores for each breed, all axes 1-5.
// Higher always means better/easier for that axis.
// children:    tolerance, gentleness, patience with kids
// otherDogs:   sociability in multi-dog households
// cats:        low prey drive / cohabitation ease
// smallHome:   adaptability to flats or limited outdoor space
// firstTimer:  forgiving of inexperienced handling
// timeAlone:   low separation anxiety / independence

export interface SuitabilityScore {
  children: number;
  otherDogs: number;
  cats: number;
  smallHome: number;
  firstTimer: number;
  timeAlone: number;
}

const suitabilityScores: Record<string, SuitabilityScore> = {
  "labrador":                       { children: 5, otherDogs: 5, cats: 3, smallHome: 2, firstTimer: 5, timeAlone: 2 },
  "golden-retriever":               { children: 5, otherDogs: 5, cats: 4, smallHome: 2, firstTimer: 5, timeAlone: 2 },
  "german-shepherd":                { children: 4, otherDogs: 3, cats: 2, smallHome: 2, firstTimer: 2, timeAlone: 2 },
  "french-bulldog":                 { children: 4, otherDogs: 4, cats: 3, smallHome: 5, firstTimer: 4, timeAlone: 3 },
  "bulldog":                        { children: 4, otherDogs: 3, cats: 3, smallHome: 4, firstTimer: 3, timeAlone: 3 },
  "pug":                            { children: 4, otherDogs: 4, cats: 3, smallHome: 5, firstTimer: 4, timeAlone: 3 },
  "beagle":                         { children: 4, otherDogs: 5, cats: 2, smallHome: 3, firstTimer: 2, timeAlone: 1 },
  "border-collie":                  { children: 3, otherDogs: 3, cats: 2, smallHome: 1, firstTimer: 1, timeAlone: 1 },
  "cocker-spaniel":                 { children: 4, otherDogs: 4, cats: 3, smallHome: 3, firstTimer: 4, timeAlone: 2 },
  "springer-spaniel":               { children: 4, otherDogs: 4, cats: 2, smallHome: 2, firstTimer: 3, timeAlone: 2 },
  "cavalier-king-charles-spaniel":  { children: 5, otherDogs: 5, cats: 4, smallHome: 5, firstTimer: 5, timeAlone: 1 },
  "yorkshire-terrier":              { children: 3, otherDogs: 2, cats: 2, smallHome: 5, firstTimer: 3, timeAlone: 2 },
  "dachshund":                      { children: 3, otherDogs: 3, cats: 2, smallHome: 4, firstTimer: 3, timeAlone: 2 },
  "boxer":                          { children: 5, otherDogs: 3, cats: 2, smallHome: 2, firstTimer: 3, timeAlone: 2 },
  "rottweiler":                     { children: 3, otherDogs: 2, cats: 2, smallHome: 1, firstTimer: 1, timeAlone: 2 },
  "doberman-pinscher":              { children: 3, otherDogs: 2, cats: 2, smallHome: 1, firstTimer: 1, timeAlone: 2 },
  "siberian-husky":                 { children: 4, otherDogs: 4, cats: 1, smallHome: 1, firstTimer: 1, timeAlone: 1 },
  "poodle":                         { children: 5, otherDogs: 4, cats: 4, smallHome: 4, firstTimer: 5, timeAlone: 3 },
  "shih-tzu":                       { children: 4, otherDogs: 4, cats: 4, smallHome: 5, firstTimer: 4, timeAlone: 3 },
  "chihuahua":                      { children: 2, otherDogs: 2, cats: 3, smallHome: 5, firstTimer: 2, timeAlone: 2 },
  "maltese":                        { children: 3, otherDogs: 3, cats: 4, smallHome: 5, firstTimer: 4, timeAlone: 2 },
  "bichon-frise":                   { children: 5, otherDogs: 5, cats: 4, smallHome: 5, firstTimer: 5, timeAlone: 2 },
  "west-highland-terrier":          { children: 3, otherDogs: 3, cats: 2, smallHome: 4, firstTimer: 3, timeAlone: 3 },
  "border-terrier":                 { children: 4, otherDogs: 4, cats: 2, smallHome: 3, firstTimer: 3, timeAlone: 3 },
  "jack-russell-terrier":           { children: 3, otherDogs: 3, cats: 1, smallHome: 3, firstTimer: 2, timeAlone: 2 },
  "miniature-schnauzer":            { children: 4, otherDogs: 3, cats: 3, smallHome: 4, firstTimer: 3, timeAlone: 3 },
  "pomeranian":                     { children: 3, otherDogs: 3, cats: 3, smallHome: 5, firstTimer: 3, timeAlone: 2 },
  "papillon":                       { children: 4, otherDogs: 4, cats: 3, smallHome: 5, firstTimer: 4, timeAlone: 3 },
  "italian-greyhound":              { children: 3, otherDogs: 4, cats: 3, smallHome: 5, firstTimer: 3, timeAlone: 2 },
  "whippet":                        { children: 4, otherDogs: 4, cats: 2, smallHome: 3, firstTimer: 4, timeAlone: 3 },
  "greyhound":                      { children: 4, otherDogs: 4, cats: 1, smallHome: 4, firstTimer: 4, timeAlone: 3 },
  "lurcher":                        { children: 4, otherDogs: 4, cats: 1, smallHome: 3, firstTimer: 3, timeAlone: 3 },
  "basset-hound":                   { children: 4, otherDogs: 4, cats: 3, smallHome: 3, firstTimer: 3, timeAlone: 2 },
  "bloodhound":                     { children: 4, otherDogs: 4, cats: 2, smallHome: 1, firstTimer: 2, timeAlone: 2 },
  "weimaraner":                     { children: 4, otherDogs: 3, cats: 1, smallHome: 1, firstTimer: 2, timeAlone: 1 },
  "dalmatian":                      { children: 3, otherDogs: 3, cats: 2, smallHome: 2, firstTimer: 2, timeAlone: 2 },
  "afghan-hound":                   { children: 3, otherDogs: 3, cats: 1, smallHome: 2, firstTimer: 1, timeAlone: 3 },
  "irish-wolfhound":                { children: 5, otherDogs: 4, cats: 2, smallHome: 1, firstTimer: 3, timeAlone: 3 },
  "mastiff":                        { children: 4, otherDogs: 3, cats: 2, smallHome: 1, firstTimer: 2, timeAlone: 3 },
  "great-dane":                     { children: 4, otherDogs: 3, cats: 2, smallHome: 1, firstTimer: 3, timeAlone: 3 },
  "saint-bernard":                  { children: 5, otherDogs: 4, cats: 3, smallHome: 1, firstTimer: 3, timeAlone: 3 },
  "old-english-sheepdog":           { children: 4, otherDogs: 4, cats: 3, smallHome: 2, firstTimer: 3, timeAlone: 2 },
  "bull-terrier":                   { children: 3, otherDogs: 2, cats: 1, smallHome: 3, firstTimer: 2, timeAlone: 2 },
  "staffordshire-bull-terrier":     { children: 5, otherDogs: 2, cats: 2, smallHome: 3, firstTimer: 3, timeAlone: 2 },
  "corgi":                          { children: 4, otherDogs: 3, cats: 3, smallHome: 3, firstTimer: 3, timeAlone: 3 },
  "cockapoo":                       { children: 5, otherDogs: 5, cats: 4, smallHome: 4, firstTimer: 5, timeAlone: 2 },
  "cavapoo":                        { children: 5, otherDogs: 5, cats: 4, smallHome: 5, firstTimer: 5, timeAlone: 2 },
  "cavachon":                       { children: 5, otherDogs: 5, cats: 4, smallHome: 5, firstTimer: 5, timeAlone: 2 },
  "labradoodle":                    { children: 5, otherDogs: 5, cats: 3, smallHome: 2, firstTimer: 4, timeAlone: 2 },
  "goldendoodle":                   { children: 5, otherDogs: 5, cats: 3, smallHome: 2, firstTimer: 4, timeAlone: 2 },
  "maltipoo":                       { children: 4, otherDogs: 4, cats: 4, smallHome: 5, firstTimer: 4, timeAlone: 2 },
  "jackapoo":                       { children: 4, otherDogs: 4, cats: 2, smallHome: 4, firstTimer: 3, timeAlone: 2 },
  "boston-terrier":                 { children: 4, otherDogs: 4, cats: 3, smallHome: 5, firstTimer: 4, timeAlone: 3 },
  "irish-setter":                   { children: 4, otherDogs: 4, cats: 2, smallHome: 1, firstTimer: 3, timeAlone: 2 },
};

export default suitabilityScores;

