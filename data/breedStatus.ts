// Status band for the 54 pack dogs on Know Your Chums.
//
// WHY THIS FILE EXISTS. The band on Britain's dog history reads `tag` straight
// off data/uk-breeds.ts. That works there because every dog on that page is a
// British or Irish breed and carries a tag. The pack is different: 23 of its 54
// dogs are imports with no entry in uk-breeds at all, so the band needs a second
// source. The 31 that DO appear are read from uk-breeds rather than copied, so
// there is still one authority for a British breed's status.
//
// THE RULE, unchanged from uk-breeds.ts: `endangered` is the Kennel Club's
// Vulnerable Native Breeds list, `in-decline` is the At Watch list. Both lists
// are NATIVE BREEDS ONLY, by definition, so they can never reach an imported
// breed however rare it becomes. That is why no import below is marked
// endangered or in-decline: it is not an oversight.
//
// SOURCES, read 20 September 2026:
//   Vulnerable and At Watch, ten years to 2025
//     royalkennelclub.com/media/0pijmdua/vulnerable-breeds-2025.pdf
//   Ten-year registrations per breed group, linked from
//     royalkennelclub.com/about-us/resources/breed-registration-statistics/
// Figures quoted are 2024, the last complete year. Every group total falls
// sharply in 2025, so 2024 is the safer reference.

import { ukBreeds } from "./uk-breeds";

export type BreedStatus = "trending" | "popular" | "endangered" | "in-decline" | "rare";

export const STATUS_LABEL: Record<BreedStatus, string> = {
  trending: "Trending",
  popular: "Popular",
  endangered: "Endangered",
  "in-decline": "In decline",
  rare: "Rare in the UK",
};

/* Pack name to uk-breeds name, where the two differ. Owner rulings,
   20 September 2026. Corgi and Springer Spaniel each matched two entries with
   opposite tags, so they were referred rather than guessed. */
const UK_ALIAS: Record<string, string> = {
  Corgi: "Pembroke Welsh Corgi",
  "Springer Spaniel": "English Springer Spaniel",
  Labrador: "Labrador Retriever",
  "West Highland Terrier": "West Highland White Terrier",
};

/* The 23 imports, which uk-breeds does not carry. 2024 registrations in the
   comment. Volume alone, except the Italian Greyhound: it is the only import in
   the pack that is actually rising (326 in 2016 to 541 in 2024 to 659 in 2025),
   and `trending` elsewhere in this project means rising, not merely common.

   CAUTION ON TWO OF THESE. French Bulldog and Pug are still high by volume but
   are falling hard, the Frenchie from 54,074 in 2021 and the Pug from 10,408 in
   2016. `popular` reads as thriving; they are not. Kept on the owner's measure,
   which is volume, and noted here so it is a decision rather than a slip. */
const IMPORT_STATUS: Record<string, BreedStatus> = {
  Dachshund: "popular", //            17,401 across all six varieties
  "French Bulldog": "popular", //     13,789, down from 54,074 in 2021
  "German Shepherd": "popular", //     4,817
  Poodle: "popular", //                4,011 across Toy, Miniature and Standard
  "Miniature Schnauzer": "popular", // 3,695
  Boxer: "popular", //                 2,427
  Rottweiler: "popular", //            2,209
  Pomeranian: "popular", //            1,832
  Chihuahua: "popular", //             1,823 across both coats
  Pug: "popular", //                   1,316, down from 10,408 in 2016
  "Shih Tzu": "popular", //            1,273
  "Doberman Pinscher": "popular", //     984
  Dalmatian: "popular", //               983
  "Boston Terrier": "popular", //        820
  Maltese: "popular", //                 724
  "Great Dane": "popular", //            678
  Weimaraner: "popular", //              629
  "Italian Greyhound": "trending", //    541 and climbing, the one riser

  /* THE FIVE SCARCE IMPORTS, owner's ruling of 20 September 2026. They were
     blank at first, then given their own word rather than `endangered`.

     WHY NOT `endangered`. The Kennel Club's criteria are British or Irish
     origin AND 300 or fewer registrations; an import is not eligible at any
     number. Marking these five endangered would make one band mean two
     different things, and on a children's site the word reads as "dying out".
     None of them is: they are globally numerous and merely scarce in British
     pedigree registrations, which is exactly what "Rare in the UK" says.

     WHY ALL FIVE, INCLUDING THE HUSKY. The proposal was to except the Siberian
     Husky. The registrations do not separate it: at 310 in 2024 it sits third
     of the five, above the Bichon and the Papillon, and in 2025 all five fall
     under 300. There is no year in which the husky is the odd one out. */
  "Saint Bernard": "rare", //            350
  "Siberian Husky": "rare", //           310
  "Bichon Frise": "rare", //             308
  Papillon: "rare", //                   248
  "Afghan Hound": "rare", //              75, the scarcest dog in the pack
};

const ukTag = new Map(ukBreeds.map((b) => [b.name, b.tag]));

/** The band for a pack dog, or undefined when it should show none. */
export function statusFor(breedName: string): BreedStatus | undefined {
  const fromUk = ukTag.get(UK_ALIAS[breedName] ?? breedName);
  /* `extinct` is a real uk-breeds value but no pack dog is extinct, so it is
     not a BreedStatus here and would be wrong on a card either way. */
  if (fromUk && fromUk !== "extinct") return fromUk;
  return IMPORT_STATUS[breedName];
}
