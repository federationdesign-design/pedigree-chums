// NG-SHARE-2, 30 Aug 2026. Podium artwork, keyed by lowercase breed name.
//
// Lifted verbatim out of KnockoutRound.tsx so the podium share route can use it
// too. That file is a client component; importing it from a server route would
// drag the whole knockout bundle across, and a second hand-maintained copy of a
// 59-key map is how the two drift apart.
//
// The filenames are a spelling museum (afgan, pomarian, labradooble, and a
// capital P on Papilion). They are mapped by hand so nothing depends on the
// spelling, but do not rename them casually: a case change breaks Vercel's
// Linux build even though it works on a Mac.
//
// Three breeds have no art at all: Weimaraner, Dalmatian and Poodle. Callers
// must handle a miss. New art is on its way for those plus Cavapoo, Italian
// Greyhound, Maltipoo, Maltese and Goldendoodle, which currently borrow another
// breed's podium.

export const PODIUM_ART: Record<string, string> = {
  "afghan hound":                    "/podiums/afgan-podium.jpg",
  "basset hound":                    "/podiums/basset-podium.jpg",
  "beagle":                          "/podiums/beagle-podium.jpg",
  "bichon frise":                    "/podiums/bichon-podium.jpg",
  "bichon":                          "/podiums/bichon-podium.jpg",
  "bloodhound":                      "/podiums/bloodhound-podium.jpg",
  "border collie":                   "/podiums/collie-podium.jpg",
  "border terrier":                  "/podiums/border-terrier-podium.jpg",
  "boston terrier":                  "/podiums/boston-podium.jpg",
  "boxer":                           "/podiums/boxer-podium.jpg",
  "bull terrier":                    "/podiums/bull-terrier-podium.jpg",
  "bulldog":                         "/podiums/bulldog-podium.jpg",
  "cavachon":                        "/podiums/cavachon-podium.jpg",
  "cavalier king charles spaniel":   "/podiums/cavalier-podium.jpg",
  "cavapoo":                         "/podiums/cavalier-podium.jpg",
  "chihuahua":                       "/podiums/chihuahua-podium.jpg",
  "cockapoo":                        "/podiums/cockapoo-podium.jpg",
  "cocker spaniel":                  "/podiums/cocker-podium.jpg",
  "corgi":                           "/podiums/corgi-podium.jpg",
  "pembroke welsh corgi":            "/podiums/corgi-podium.jpg",
  "dachshund":                       "/podiums/dachshund-podium.jpg",
  "doberman pinscher":               "/podiums/doberman-podium.jpg",
  "french bulldog":                  "/podiums/french-bulldog-podium.jpg",
  "german shepherd":                 "/podiums/german-sheperd-podium.jpg",
  "german sheperd":                  "/podiums/german-sheperd-podium.jpg",
  "golden retriever":                "/podiums/golden-retreaver-podium.jpg",
  "golden retreaver":                "/podiums/golden-retreaver-podium.jpg",
  "goldendoodle":                    "/podiums/golden-retreaver-podium.jpg",
  "great dane":                      "/podiums/great-dane-podium.jpg",
  "greyhound":                       "/podiums/greyhound-podium.jpg",
  "irish setter":                    "/podiums/setter-podium.jpg",
  "irish wolfhound":                 "/podiums/irish-wolfhound-podium.jpg",
  "italian greyhound":               "/podiums/greyhound-podium.jpg",
  "jack russell":                    "/podiums/jack-russel-podium.jpg",
  "jack russell terrier":            "/podiums/jack-russel-podium.jpg",
  "jackapoo":                        "/podiums/jackapoo-podium.jpg",
  "labradoodle":                     "/podiums/labradooble-podium.jpg",
  "labrador":                        "/podiums/labrador-podium.jpg",
  "lurcher":                         "/podiums/lurcher-podium.jpg",
  "maltese":                         "/podiums/multipoo-podium.jpg",
  "maltipoo":                        "/podiums/multipoo-podium.jpg",
  "mastiff":                         "/podiums/mastiff-podium.jpg",
  "miniature schnauzer":             "/podiums/schnauzer-podium.jpg",
  "old english sheepdog":            "/podiums/old-english-podium.jpg",
  "papillon":                        "/podiums/Papilion-podium.jpg",
  "papilion":                        "/podiums/Papilion-podium.jpg",
  "pomeranian":                      "/podiums/pomarian-podium.jpg",
  "pomarian":                        "/podiums/pomarian-podium.jpg",
          "pug":                             "/podiums/pug-podium.jpg",
  "rottweiler":                      "/podiums/rotty-podium.jpg",
  "saint bernard":                   "/podiums/st-bernard-podium.jpg",
  "shih tzu":                        "/podiums/shih-tzu-podium.jpg",
  "siberian husky":                  "/podiums/husky-podium.jpg",
  "springer spaniel":                "/podiums/springer-podium.jpg",
  "staffordshire bull terrier":      "/podiums/staffy-podium.jpg",
          "west highland terrier":           "/podiums/westy-podium.jpg",
  "west highland":                   "/podiums/westy-podium.jpg",
  "whippet":                         "/podiums/whippet-podium.jpg",
  "yorkshire terrier":               "/podiums/yorky-podium.jpg",
};

export function podiumArtFor(breed: string): string | null {
  return PODIUM_ART[breed.toLowerCase().trim()] ?? null;
}
