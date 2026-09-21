/* ROUND DATES FOR THE DOGS WITH NO ERA-STRIP ENTRY, 21 September 2026 (owner: every card
   on a chum page's slider should carry the same date label above it, a round year for
   when the dog was known to exist, based on internet research).

   THE RULE the dates follow, agreed with the owner: the EARLIEST DATE THE DOG IS RECORDED
   AS THIS TYPE, anywhere; rounded to the century before 1800 and to the decade from 1800
   on; "c." before 1800. Where sources disagree by centuries, the date best supported by
   the Kennel Club, AKC, FCI, Britannica, museums and classical authors was taken.

   SOURCE: the research report "Earliest-Recorded Dates for 82 Dog Types" produced in the
   chat on 21 September 2026, which holds a justification, a source link and a confidence
   rating for every line below. Entries it marked "estimated from period" are the site's
   own group names with no record of their own, dated to the period their note describes.

   Two groups: the 27 chums with no strip entry, then the 55 foreign progenitors. The
   strip's own dogs keep their existing era and are not in here. */
export const ERA_YEARS: Record<string, string> = {
  // ---- The 27 chums with no strip entry ----
  "Great Dane": "c. 1500",
  "Doberman Pinscher": "1890",
  "Saint Bernard": "c. 1700",
  "Afghan Hound": "1810",
  "Weimaraner": "1810",
  "Dalmatian": "c. 1600",
  "Rottweiler": "c. 100",
  "Italian Greyhound": "c. 200 BC",
  "Papillon": "c. 1500",
  "Corgi": "c. 1100",
  "Bichon Frise": "c. 1300",
  "Maltese": "c. 500 BC",
  "Boston Terrier": "1870",
  "Siberian Husky": "1900",
  "Shih Tzu": "c. 1600",
  "Miniature Schnauzer": "1890",
  "West Highland Terrier": "1860",
  "Pomeranian": "c. 1800",
  "French Bulldog": "1880",
  "Chihuahua": "1850",
  "German Shepherd": "1890",
  "Pug": "c. 200 BC",
  "Poodle": "c. 1500",
  "Dachshund": "c. 1500",
  "Springer Spaniel": "c. 1600",
  "Labrador": "1830",
  "Boxer": "1890",
  // ---- The 55 foreign progenitors ----
  "Affenpinscher": "c. 1600",
  "Alaunt war dogs": "c. 400",
  "Alpine Mastiff farm dogs": "c. 100",
  "Ancient Arctic Spitz": "c. 4000 BC",
  "Ancient Chinese toy dogs": "c. 700",
  "Ancient Spitz dogs": "c. 900",
  "Ancient Techichi dogs": "c. 100 BC",
  "Ancient eastern sighthounds": "c. 3000 BC",
  "Ancient spotted Hounds": "c. 2000 BC",
  "Arctic sled Spitz": "c. 900",
  "Basset Artesien Normand": "c. 1600",
  "Brabant Bullenbeisser": "c. 1600",
  "Chien-gris": "c. 1300",
  "Chukchi sled dogs": "c. 1000 BC",
  "Continental Germanic herding dogs": "c. 400",
  "Continental toy Spaniels": "c. 1500",
  "Dogs of the Alan horsemen": "c. 100",
  "Early Badger hunting dogs": "c. 1200 BC",
  "Early Boar hunting dogs": "c. 100",
  "Eastern Lion dogs": "c. 200",
  "Gaulish coursing Hounds": "c. 100",
  "German Bullenbeisser dogs": "c. 1500",
  "German Pinscher": "1880",
  "German bracke scenthounds": "c. 1500",
  "German farm Spitz": "c. 1400",
  "Great Bullenbeisser (Danziger Bullenbeisser)": "c. 1500",
  "Laconian tracking Hounds": "c. 400 BC",
  "Local German cattle dogs": "c. 1500",
  "Medieval Alaunts dogs": "c. 500",
  "Mediterranean Bichon lapdogs": "c. 500 BC",
  "Mediterranean miniature sighthounds": "c. 200 BC",
  "Mountain coursing Hounds": "c. 1000 BC",
  "Newfoundland landrace dogs": "c. 1700",
  "Norse settlers dogs": "c. 900",
  "Old Desert coursing dogs": "c. 3000 BC",
  "Old European lapdogs": "c. 500 BC",
  "Old European water dogs": "c. 1500",
  "Old German Ratters": "c. 1500",
  "Old German boarhounds": "c. 1500",
  "Old German farm guards": "c. 1700",
  "Old German hunting dogs": "c. 1700",
  "Old Mastiffs of the East": "c. 600 BC",
  "Old hunting dogs of the Celts": "c. 500 BC",
  "Old trail dogs of the East": "c. 700 BC",
  "Parisian Ratters": "1850",
  "Portuguese fishing dogs": "c. 1300",
  "Roman drover dogs": "c. 100",
  "Schnauzer farm dogs": "c. 1500",
  "Schnauzer-type farm dogs": "c. 1500",
  "Segusian tracking Hounds": "c. 100 BC",
  "Shaggy upland herders": "c. 1500",
  "Small imported dogs": "c. 1800",
  "Thuringian herding dogs": "c. 1800",
  "Tibetan temple dogs": "c. 800",
  "Wurttemberg Sheepdogs": "c. 1800",
};

/* The label as a number, so the row can sort by it: BC is negative. null if absent. */
export function eraYear(label: string | undefined): number | null {
  if (!label) return null;
  const m = label.match(/(\d+)\s*(BC)?/);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] ? -n : n;
}
