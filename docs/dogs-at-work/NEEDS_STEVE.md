# Dogs at Work redux: needed from Steve

Outstanding inputs for the Dogs at Work redux (brief v3.0). Each is a clearly
named placeholder in the code, or a slot awaiting a decision. Nothing here is
invented. (Path note: the brief refers to `agent/NEEDS_STEVE.md`; this task
redirects that to `docs/dogs-at-work/NEEDS_STEVE.md` per the path override.)

## Assets and copy

| Item | Where | Placeholder | Notes |
|---|---|---|---|
| Panel 1 thumbnail images (3) | `app/dogs-at-work/data/slides.ts` (bio-detection panel) | WIRED: `/dog_working_img1..3.jpg`, alt text supplied (11 Aug) | Order is game, then job, then payment, mirroring the concept. |
| Blue panel 5 (search and rescue) | `app/dogs-at-work/data/slides.ts` (search-rescue slide) | RESOLVED 11 Aug: supplied and inlined | Heading "Some jobs cannot be done by people alone". |
| Index card dek (article 5) | `app/dogs-at-work/data/slides.ts` (search-rescue slide) | RESOLVED 11 Aug: supplied and inlined | Also filled the article page meta description. |
| Hero alt text (article 5) | `slides.ts` + `the-dog-that-finds-you-when-nobody-else-can/page.tsx` | RESOLVED 11 Aug: "a search and rescue dog working across open moorland" | For `/search_rescue_dogs.jpg`. |
| Article 5 "The honest version" and "Sources" sidebars | `the-dog-that-finds-you-when-nobody-else-can/page.tsx` | Wired from the copy, but marked "drafted for approval" there | Confirm or amend the drafted wording. |
| Blue panel 6 (guide dogs) | `app/dogs-at-work/data/slides.ts` (guide-dogs slide) | RESOLVED 11 Aug: supplied and inlined | Heading "What we get back is bigger than the task". |
| Index card dek (article 6) | `slides.ts` (guide-dogs slide) | RESOLVED 11 Aug: supplied and inlined | Also filled the article page meta description. |
| Hero image + alt (article 6) | `slides.ts` + `the-dog-that-gives-you-your-world-back/page.tsx` | RESOLVED 12 Aug: `/guide_dog_image.jpg` and its alt ("a man with a white cane sitting on a park bench beside a black Labrador in a yellow guide-dog harness") supplied and wired. No placeholder remains. | The old plan to move `article3_hero.jpg` here is dropped: article 6 now has its own hero. |
| Article 6 "What the dog thinks", "The honest version", "Sources" sidebars | `the-dog-that-gives-you-your-world-back/page.tsx` | Wired from the copy, marked "drafted for approval" | Confirm or amend the drafted wording. |
| **Permission: named case studies in article 6** | `the-dog-that-gives-you-your-world-back/page.tsx` (body) | Published as written | The article names real people and dogs (Trudy Sherwood and Connie, Scott and Milo, Emma and Archie), read as Guide Dogs' own case studies. The campaign brief asks for written permission before using named cases; confirm before publishing. |
| **Hero chain (article 2 left short)** | article 2 + article 6 | MOOT 12 Aug: article 6 got its own hero (`/guide_dog_image.jpg`), so `article3_hero.jpg` is no longer moved off article 2. Article 2 keeps its hero; no chain to resolve. | |

Resolved 11 Aug 2026: the two swapped-hero alt texts (article 3 carousel, article 2 Labrador in harness) were confirmed by Steve as written; no longer outstanding.

## Decisions carried into the build (open questions, section 18)

- **Blue panel 4** largely repeats panel 1 and is now paired with the Sheepdogs
  article. Steve to replace it or accept the repetition (open question 1).
  Shipped as written for now.
- **Blue panel overlap.** Whether the blue panel overlaps the top of the article
  panel, as in the concept mockup (open question 5). Report, not resolved.

## Flagged for Steve, not this branch's job

- **Know Your Chums has two `.title` rules, both `!important`.**
  `app/know-your-chums/know.module.css` line 76 sets `.title` to
  `clamp(3rem, 9vw, 6rem) !important`, and line 822 sets `.title` to
  `clamp(4.8rem, 14vw, 11rem) !important`. Same specificity, so the later rule
  (822) wins and line 76 is dead: the page renders at 176px, not 96px. Reported
  here for Steve; deliberately not fixed on the dogsatwork branch. (This is why
  matching Dogs at Work "to Know Your Chums" had to target the live 176px rule,
  not the shadowed 96px one.)

## Budget discrepancy found at checkpoint 2

- **Blue panel subheading budget.** Section 9 gives 34 (longest string 27,
  "The payment; very different"). Appendix A panel 4's bold lead, "Working dogs
  do not know they have jobs", is 39. The copy is supplied and locked, so per
  section 9's own rule (longest real string + ~15%) the budget was set to 45
  (39 + 15%) rather than truncating the copy. **Confirmed by Steve (11 August
  2026): 45 is correct; it derives from his own locked copy.**
