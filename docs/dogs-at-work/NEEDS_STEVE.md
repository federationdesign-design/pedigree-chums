# Dogs at Work redux: needed from Steve

Outstanding inputs for the Dogs at Work redux (brief v3.0). Each is a clearly
named placeholder in the code, or a slot awaiting a decision. Nothing here is
invented. (Path note: the brief refers to `agent/NEEDS_STEVE.md`; this task
redirects that to `docs/dogs-at-work/NEEDS_STEVE.md` per the path override.)

## Assets and copy

| Item | Where | Placeholder | Notes |
|---|---|---|---|
| Alt text for article 3 hero (`article3_hero.jpg`) | `app/dogs-at-work/data/slides.ts` (electronic-nose) | `PLACEHOLDER_ARTICLE_3_ALT` | Image is wired; alt outstanding (open question 4). |
| Alt text for `sheepdogs_job.jpg` | `app/dogs-at-work/data/slides.ts` (sheepdogs) | `PLACEHOLDER_ARTICLE_4_ALT` | Article 4 hero; alt outstanding (section 15). |
| Panel 1 thumbnail images (3) | `app/dogs-at-work/data/slides.ts` (bio-detection panel) | WIRED: `/dog_working_img1..3.jpg` | Steve supplied the images (11 Aug); order is game, then job, then payment, mirroring the concept. |
| Panel 1 thumbnail alt text (3) | same | `PLACEHOLDER_PANEL1_THUMB_1..3_ALT` | Alt strings still outstanding; images now render (section 6). |

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
