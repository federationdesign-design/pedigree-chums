# Dogs at Work: page redux, agent brief v2.9

Repo: `federationdesign-design/pedigree-chums`
Clone: `~/pedigree-chums-main`
Branch: `dogsatwork`
Date: 10 August 2026
Supersedes: v1 through v2.8

Blue panel copy is supplied in Appendix A. The article template already exists
and is described in Appendix B. Neither was in v2.

Read this document in full before running any command. Task 0 is read-only.
Do not write, edit or create any file until Task 0 has been reported and
approved.

---

## 1. What this is

The `/dogs-at-work` page is already live and working. This is a redux of that
page, not a rebuild. Most of the structure, routing, article pages and card
data already exist. Your job is to change the page architecture, add one new
article, and correct a set of known content faults.

If at any point the fastest route appears to be replacing an existing working
component, stop and report instead. Reuse is the default.

### In scope

1. The `/dogs-at-work` index page.
2. The four Dogs at Work article pages, being the three existing medical
   articles and one new Sheepdogs article.
3. A reusable payslip component, applied to all four articles.
4. Two amendments to `CLAUDE.md`.
5. A taxonomy reference file for future articles.

### Not in scope, do not touch

- Any other page, route or layout on the site.
- The Pick a Chum feature, its branch, its workbook, its data or its agent
  directory.
- The clone at `~/pedigree-chums`. That belongs to a different agent and is
  never to be opened, read or written to from this task.
- All marketing activity from the original section brief. Launch order, social
  platform plans, outreach and permission emails, the sensitivities list, the
  economic value model and named-dog approvals are handled outside this build.
  If you find yourself reasoning about any of them, you have gone out of scope.

---

## 2. Working rules

1. Work on branch `dogsatwork`, created from current `origin/main`. Never
   commit to `main`. The merge to `main` happens by hand, later, and not by you.
2. Commit incrementally with real messages. Run `git show --stat` before any
   push. A short commit message with hundreds of deletions is a red flag and
   means stop.
3. Use the repo binaries, never `npx`. Type-check with
   `./node_modules/.bin/tsc --noEmit`. Build with `npm run build`.
4. CSS Modules only. Never Tailwind, never styled-components, never inline
   style blocks in new pages.
5. Relative imports only. Never the `@/` alias.
6. Before any commit that touches module CSS, run:
   `grep -n ":global(\.[a-zA-Z-]*) *{" **/*.module.css`
   Every hit must be compounded as `.localClass:global(.foo)`. A bare
   `:global(.foo)` selector with no local class hard-fails the Vercel build and
   passes the type-check silently, so it is invisible until deploy.
7. Run `git add public/` whenever new images or assets are involved, or they
   will 404 on Vercel.
8. Any input you need but do not have gets a clearly named placeholder, logged
   in `PLACEHOLDERS.md` at the repo root and listed in `agent/NEEDS_STEVE.md`.
   Never invent a fact, a figure, a date, a price or an asset path.
9. If a verification step fails, read the failure. Never adjust an expected
   value, a hash or a count to make a check pass.
10. File names use underscores, never spaces.

---

## 3. Two house rule amendments

`CLAUDE.md` currently contradicts this build in two places. Append the
amendments, never replace the file. The file has been overwritten once before
and had to be restored from git.

1. **The no-dark-backgrounds rule is retired.** Dark backgrounds are already
   present across the site and are part of the Dogs at Work design. Record the
   rule as withdrawn, with the date, so a future agent does not undo the work.
2. **Editorial copy is carved out of the no-em-dash rule.** The rule continues
   to apply to interface copy, code, comments, documentation and all other
   output. Long-form editorial copy in the Dogs at Work articles and panels may
   retain em dashes, because the existing published copy depends on them.

Make both amendments in a single commit, separate from any code change, so the
diff is legible.

---

## 4. Reference material

Four source documents are in `~/Downloads`. Two of them have spaces in their
names, so quote the paths. Copy them into `agent/reference/`, renamed to
underscore form, and commit them:

| From | To |
|---|---|
| `~/Downloads/main page.pdf` | `agent/reference/dogs_at_work_main_page_concept.pdf` |
| `~/Downloads/dosg and work-article.pdf` | `agent/reference/dogs_at_work_article_concept.pdf` |
| `~/Downloads/mobile.pdf` | `agent/reference/dogs_at_work_mobile_concept.pdf` |
| `~/Downloads/sheepdogs-job.jpg` | `public/sheepdogs_job.jpg`, see section 15 |
| The v2 project document, if present | `agent/reference/dogs_at_work_project_document_v2.docx` |

Do this as part of Task 0's follow-up commit. Every later reference in this
brief to reference artwork means these files at these paths.

**Note when reading the PDFs.** Text extracted from them loses ligatures, so
"sniffing" appears as "sning" and "off" as "o". Those are extraction artefacts,
not errors in the copy. Do not report or correct them.

---

## 5. Task 0: read-only inventory

Run no writes. Produce a short report covering:

1. The component and file structure of the current `/dogs-at-work` page.
2. Where the article card content currently lives. State explicitly whether it
   is hard-coded in the page component or held in a data record.
3. How the existing three-item carousel is implemented, including the `1 / 3`
   counter, and whether it can be extended to four items and re-skinned with
   dots rather than replaced.
4. The component that renders the six-card "Coming to the workforce" grid, and
   what removing it would touch.
5. The route and file layout of the three existing article pages, including the
   slug of the electronic nose article.
6. Whether `public/yellow-triangle.svg` exists, and its actual filename and
   path.
7. The current token definitions, and which of the required pill colours are
   already defined.
8. The exact current headline, dek, family label and sub-label string for each
   of the three live articles, so the budgets in section 9 can be confirmed
   against reality rather than against this brief.
9. The article page template. Name the component, describe how the body copy
   and the sidebar modules are composed, and list every sidebar module type that
   already exists. See Appendix B. This determines how much of article 4 is
   assembly rather than construction, so report it in detail.
10. Whether the article template takes its content from a data record or from
    per-article markup, and what adding a fourth article would actually require.

Report and stop. Do not proceed to Task 1 until told to. This is one of only two
halts in the run, per section 17. Everything after it depends on what you find
here, so the report needs to be specific rather than reassuring.

---

## 6. Page architecture

The page has three stacked regions. Two of them change together when the
visitor navigates; one does not.

| Region | Behaviour |
|---|---|
| Introduction | Persistent. Identical on every slide. Never animates. |
| Blue panel | Changes per slide. |
| Article panel | Changes per slide. |

### The blue panel is not an article introduction

This is the point most likely to be misunderstood. The blue panel does not
describe the article below it. It carries supporting points that expand the
persistent introduction above it. The content is section-level argument, and it
changes as the visitor moves through the articles so that more of it gets seen.

**Panel 1 only** carries small square thumbnails, one beside each of its three
supporting points. Panels 2, 3 and 4 have no thumbnails. Three images in total,
not twelve.

Thumbnails are desktop only. The mobile artwork has none, so mobile renders the
text alone on every panel.

Because only one panel uses them, the thumbnail field is optional in the data
record. A panel without thumbnails is valid and must not fail validation. Do not
apply the missing-image build failure from section 8 to this field.

Build the three slots on panel 1 and use placeholders. Steve is supplying the
real images. Log all three in `PLACEHOLDERS.md`, one line each, and log their alt
text as outstanding in `agent/NEEDS_STEVE.md`. Do not generate, crop or source
images yourself, and do not reuse an article hero as a thumbnail.

Consequences you must build for:

- The pairing between a blue panel and an article is editorial, not semantic.
  It must be an explicit pair in the data, never inferred from array order.
  Inserting an article must not silently reshuffle the panels.
- Every article requires a matching blue panel. Adding a fifth article without
  a fifth panel is a data error and must fail the build with a clear message.

### Desktop

The purpose of the design is to remove the long scroll. All three regions,
introduction, blue panel and article panel, fit within the viewport, and the
visitor moves through the content by sliding rather than by scrolling.

- The page fills the viewport height. There is no fixed pixel height.
- The article panel is fixed to the bottom of the viewport.
- The article panel splits exactly 50/50, image and text.
- On navigation, the article panel moves in one direction and the blue panel
  moves in the opposite direction. That counter-motion is the signature of the
  design and is intentional.

Minimum supported desktop viewport height is 700 CSS pixels. Below that, fall
back to the mobile stack in the next subsection rather than compressing the
desktop layout. A 1366 by 768 laptop leaves roughly 620 pixels of viewport after
browser chrome, so the fallback will fire in the real world and must look
deliberate.

At checkpoint 3, report the actual measured height of the tallest slide at 700
pixels of viewport using the real copy in Appendix A. If it does not fit, report
it and stop. Do not solve it by shrinking type, tightening leading or reducing
the text budgets on your own initiative.

### Mobile

Mobile is not the desktop mechanic scaled down. It is a single vertical stack
that scrolls normally. There is no counter-motion on mobile.

Order, top to bottom:

1. Persistent introduction.
2. Blue panel, carrying all its supporting points in one container.
3. Pager: dots and a forward chevron.
4. Full-width image.
5. Dark article block: "Learn about…", pills, headline, dek, call to action.

The 50/50 split is desktop only. Reference artwork is
`agent/reference/dogs_at_work_mobile_concept.pdf`.

On mobile the pager sits above the image, so navigating from mid-page must not
leave the visitor looking at a new image with the new blue text scrolled off
above them. On advance, scroll to the top of the blue panel.

---

## 7. Navigation

- Dots are the primary navigation and must be tappable and clickable. They are
  the only route backwards, because the artwork provides a forward chevron
  only.
- Provide previous and next via keyboard left and right arrow keys.
- Dots require accessible names, current-item state and a visible focus style.
- Honour `prefers-reduced-motion`. With reduced motion set, the panels change
  without the counter-motion transition.
- Set the rule now for more than eight articles rather than discovering it
  later. Propose an approach in your Task 0 report; do not implement it yet.

---

## 8. Data model

All page content lives in one data record, not in the page component. Steve
must be able to add articles five through twelve without an agent.

Each entry pairs one blue panel with one article and holds, at minimum:

- Slide identifier and order.
- Blue panel: heading and body, allowing up to three subheaded sections.
- Article: family, sub-label, headline, dek, image path, image alt text, call
  to action label, href.
- Publication state.

Validate the record at build. Fail loudly, with the offending field named, on a
missing pair, a missing image, a missing alt text or a budget breach.

---

## 9. Text budgets

The budget exists because the desktop layout has a fixed height. It is enforced
once, on the shared data record, so it governs the strings used on both desktop
and mobile. Mobile is not exempt from the budget; it is simply not the reason
for it.

Mechanism, in order of precedence:

1. A character budget per field, validated at build. A breach fails the build.
2. A warning at ninety per cent of budget, so a wall is never hit without
   notice.
3. A CSS line clamp underneath, as a safety net, so a breach can never break
   the live layout.

Do not implement auto-fit or scaling type. Different type sizes on adjacent
slides read as a fault.

Budgets are set from the longest real string in the launch set, plus roughly
fifteen per cent headroom. Measured lengths are given so you can verify rather
than trust.

| Field | Longest real string | Budget |
|---|---|---|
| Family pill | 9, "Emergency" | 12 |
| Sub-label | 18, "Bio-detection dogs" | 24 |
| Headline | 47, "The Dogs Teaching Medicine How to Smell Disease" | 55 |
| Dek | 334, bio-detection | 380 |
| Call to action label | to be set, see section 11 | 24 |
| Blue panel subheading | 27, "The payment; very different" | 34 |
| Blue panel body, total across all sections | approximately 1,350 | 1,500 |

Confirm every figure in Task 0 against the live strings. If a live string
already exceeds its budget, report it rather than truncating it.

---

## 10. Tokens, pills and assets

- The existing tokens stand: `--blue-sky` #5cc4ee, `--blue-deep` #0b78bd,
  `--navy` #0a3a57, `--yellow` #ffd23e, `--cream` #fff8e6.
- The yellow triangle decoration exists in the repo as `yellow-triangle.svg`.
  Confirm its path in Task 0 and reuse it. Do not recreate it.
- A token is also needed for the green call-to-action button.

### Family pill colours

Settled. Use these values exactly. Name the tokens by family, not by colour.

| Family | Pill fill | Text | Contrast |
|---|---|---|---|
| Medical | #17C138 | `--navy` | 4.97 |
| Security | #000000 | `--cream` | 19.8 |
| Emergency | #D71F6C | `--cream` | 4.61 |
| People | #2B7095 | `--cream` | 5.14 |
| Rural | #97AA31 | `--navy` | 4.62 |
| Science | #10D1B7 | `--navy` | 6.17 |

The rule behind the text column, which applies to any family added later: a
light pill takes dark text, a dark pill takes light text. Dark text is `--navy`,
light text is `--cream`. Every new pill must reach 4.5 against its text.

Three of the six values are adjusted from the originals supplied, for stated
reasons. Do not revert them.

- **Emergency** was #E02574. Darkened so cream text reaches 4.5. The original
  measured 4.23 and failed.
- **Rural** was #84952B. Lightened so navy text reaches 4.5. The original
  measured 3.60 against navy and 3.33 against cream, so it failed with either
  text colour and could not be fixed by choosing a different text.
- **Science** was #10D187. Shifted from green towards teal because it was
  visually indistinguishable from Medical at pill size, and Medical appears on
  three of the four launch articles. Hue and lightness only; the character of
  the colour is unchanged.

### Pill outline

Every pill carries a one pixel `--cream` outline.

Pills sit mainly on `--navy`. Three of the six fills are too close to navy for
the pill shape itself to be distinguishable: Security at 1.76, People at 2.20
and Emergency at 2.45, against a 3.0 threshold for a user interface component.
The outline resolves all three without touching the fills, and reads as
deliberate.

Report at checkpoint 5 whether pills also appear on `--blue-sky` anywhere. The
same outline covers that case, but the Science and Medical fills sit close to
sky blue and should be checked.

---

## 11. Taxonomy

This section is definitive. Where the live page, the concept artwork or the v2
project document disagree with it, this section wins and the discrepancy is
reported.

Every article carries two labels: a **family**, which is one of five and is
navigational, and a **sub-label**, which names the kind of working dog.

### The six families

| Family | Pill label |
|---|---|
| Medical | Medical |
| Security | Security |
| Emergency | Emergency |
| People | People |
| Rural and Traditional | Rural |
| Science | Science |

Medical is a full family, not a featured exception. Three of the four launch
articles are Medical, and treating the medical trilogy as a set outside the
taxonomy would leave three of four articles with no pill.

The Rural pill reads "Rural" for length. The family is named "Rural and
Traditional" in the data and in documentation.

Two label sets are hereby retired. The live page's set (Public service, Rural,
Emergency, Science, Wildcard, Independence) and the concept artwork's set
(Rural, Emergency, People, Science, plus the erroneous "Headering dogs") are
both replaced by the table above. Science survives as a family name, but only
as defined here.

### The launch set

| # | Article | Family | Sub-label | Status |
|---|---|---|---|---|
| 1 | The Dogs Teaching Medicine How to Smell Disease | Medical | Bio-detection dogs | Live, editorially unchanged |
| 2 | The Colleague Who Never Clocks Off | Medical | Medical alert dogs | Live, editorially unchanged |
| 3 | The Machine That May Owe Dogs a Biscuit | Medical | Bio-detection dogs | Live, retitled |
| 4 | The Farm Worker With Four Legs | Rural and Traditional | Sheepdogs | New |

"Editorially unchanged" means the body copy, voice, facts and named dogs of
articles 1 and 2 are not to be touched. It does not exempt them from the
payslip component in section 13, the label corrections in this section, or the
mechanical copy corrections in section 14.

Article 3 changes in two ways. Its display title becomes "The Machine That May
Owe Dogs a Biscuit", dropping the "The Electronic Nose:" prefix, which brings it
inside the headline budget. Its sub-label becomes "Bio-detection dogs",
replacing "The machine the dogs built", which is an editorial phrase rather
than a kind of working dog. Do not change its URL slug. If the slug appears
anywhere as a link, leave it alone.

The three medical articles keep their named dogs. The change of direction away
from named dogs applies to new articles only.

### The four-article launch and the removed grid

The "Coming to the workforce" grid is removed. The fourth article replaces it.

### The article panel is the existing card, re-presented

The bottom article panel shows the same content as the card that is already on
the live page: family pill, sub-label, headline, dek and button. The redux
changes how that content is displayed, not what it is.

Reuse the existing card data. Do not create a second record holding the same
strings. If the current implementation hard-codes those strings in the page
component, move them into the record described in section 8 rather than
duplicating them.

---

## 12. The forward register, and what happens to the removed grid's faults

Roughly half the known label faults sit on the six grid cards that are being
deleted. Correcting them in place would be wasted work; deleting them silently
would throw away the corrections.

Create `agent/reference/dogs_at_work_taxonomy.md` containing:

1. The six families, the pill colours from section 10, and the sub-label rule
   from section 11.
2. A forward register of the six removed grid subjects, each with the label it
   carried, the label it should carry, and a note that it is deferred to a later
   series. Recording the correction is the point of the file.

| Subject | Label as shipped | Correct family | Correct sub-label |
|---|---|---|---|
| Police and Border Force dogs | Public service / Rural, Sniffing dogs | Security | Police dogs |
| Sheepdogs | Rural, Headering dogs | Rural and Traditional | Sheepdogs |
| Search and rescue dogs | Emergency, Rescue dogs | Emergency | Search and rescue dogs |
| Conservation detection dogs | Science, Detection dogs | Science | Conservation dogs |
| Water-leak detection dogs | Emergency, Headering dogs | Science | Detection dogs |
| Assistance and guide dogs | Independence, Independence dogs | People | Guide dogs |

Conservation detection and water-leak detection both sit under Science, which
is why Science exists as a family. Sheepdogs is promoted out of the register
into the launch set.

3. The v2 project document's twelve-article plan mapped onto the six families,
   so the next person adding an article has one place to look. Note that the v2
   document predates the Science family and assigns some of these subjects
   elsewhere. Section 11 wins.

---

## 13. Article template and payslip

Every Dogs at Work article carries a payslip. Build it once as a reusable
component and apply it to all four.

Fields, in this order:

Job Title, Department, Shift Pattern, Official Duties, Human Value, Paid In,
Retirement.

Seven fields. Two earlier fields have been removed and must not reappear:

- **Name.** Removed because the series no longer builds articles around an
  individual named dog.
- **Working Hours.** Removed because Shift Pattern now carries hours and days
  together, for example "5am-3pm mon-sat". Two fields for one idea.

Rules:

- The payslip currently on the bio-detection article is a placeholder. Every
  value on it is wrong and must be replaced. Do not carry any of it forward. In
  particular, "Blood-sugar bodyguard" is the medical alert dog's job title and
  has been applied to the wrong article.
- Shift Pattern is required and carries specific hours and days. This overrides
  the guidance in the v2 project document, which advises against inventing
  precision. That is a deliberate decision.
- Human Value is a factual field and must remain strictly true, even where the
  shift fields are comic. On the medical articles this distinction matters. A
  payslip that reads as factual next to a medical claim is the one place in the
  series where the joke can cause harm.
- All four payslips are supplied below and go in as written. None of them is
  yours to reword, shorten or improve.

### The four payslips

**Article 1, The Dogs Teaching Medicine How to Smell Disease**

| Field | Value |
|---|---|
| Job Title | Disease sniffers |
| Department | Bio-Detection |
| Shift Pattern | 9-5 mon/fri |
| Official Duties | Sniffing |
| Human Value | Medical innovation |
| Paid In | head strokes, dog biscuits |
| Retirement | Sofa, blanket |

**Article 2, The Colleague Who Never Clocks Off**

| Field | Value |
|---|---|
| Job Title | Blood-sugar bodyguard |
| Department | Human help |
| Shift Pattern | 24/7 |
| Official Duties | Sniffing |
| Human Value | saving lives |
| Paid In | head strokes, dog biscuits |
| Retirement | Sofa, blanket |

**Article 3, The Machine That May Owe Dogs a Biscuit**

| Field | Value |
|---|---|
| Job Title | Computer trainer |
| Department | Bio-Detection |
| Shift Pattern | 9-5 mon/fri |
| Official Duties | Sniffing |
| Human Value | Medical innovation |
| Paid In | head strokes, dog biscuits |
| Retirement | Sofa, blanket |

**Article 4, The Farm Worker With Four Legs**

| Field | Value |
|---|---|
| Job Title | Herder |
| Department | Sheep Consolidation |
| Shift Pattern | 5am-3pm mon-sat |
| Official Duties | Herding |
| Human Value | optimising processing |
| Paid In | head strokes, dog biscuits |
| Retirement | Sofa, blanket |

Note for the agent: the Sheepdogs article copy in section 15 contains an earlier,
differently worded payslip. The table above supersedes it. Ignore the payslip
inside the article copy and use this one. Report the discrepancy in your
checkpoint 6 summary so it can be checked, but do not merge the two.

Capitalisation is inconsistent across the values as supplied. Apply sentence
case consistently within each field and list the changes in your copy change
log, per section 14.

### Payslip differentiation task

This is the one place in this build where you are asked to write copy. It is
bounded, and it is proposal only. Read this whole subsection before drafting.

**The problem.** As supplied, the four payslips repeat. Official Duties reads
"Sniffing" on articles 1, 2 and 3. Paid In and Retirement are identical on all
four. Articles 1 and 3 differ only in Job Title. The device is meant to work by
showing how radically different the jobs are once translated into employment
language, so identical answers remove the joke.

**The task.** Propose alternative values that make each payslip distinct while
keeping the sentiment, the register and the shortness of the originals. Ship the
supplied values as written. Present your proposals as a table at checkpoint 6
and stop. Apply nothing until Steve approves, field by field. He may accept some
and reject others. Checkpoint 6 is one of only two halts in the run, per
section 17, and this proposal is the reason for it.

**Fields you may vary**

| Field | Vary? | Note |
|---|---|---|
| Job Title | No | Already unique across all four |
| Department | Only article 4 | Bio-Detection is correct for both 1 and 3, leave it |
| Shift Pattern | Yes, 1 and 3 | Both currently 9-5 mon/fri |
| Official Duties | Yes | The worst repeat, "Sniffing" three times |
| Human Value | Articles 1 and 3 only if the change stays true | See the lock below |
| Paid In | Yes | Identical on all four |
| Retirement | Yes | Identical on all four |

**The Human Value lock.** Human Value is the one factual field on the payslip.
On articles 1, 2 and 3 it sits beside medical claims. Do not make it more
specific, more clinical or more impressive than the supplied wording. "Medical
innovation" and "saving lives" are deliberately broad. Never write anything
implying a dog diagnoses disease, per the guardrail in this section. If in doubt,
propose no change to that field.

**Rules for the proposals**

1. Keep the sentiment. These are affectionate jokes about dogs, written for
   families and young readers. Do not make them cynical, corporate or arch.
2. Keep the length. Every value is a short phrase, never a sentence.
3. UK English. No em dashes.
4. No value may repeat across the four articles unless repetition is factually
   correct, as with Department on 1 and 3.
5. Ground each value in the article it belongs to. Article 4's duties are
   herding, not sniffing. Article 3 is about a machine learning from dogs.
6. Propose exactly one alternative per field, not a shortlist. Steve is choosing
   yes or no, not ranking options.
7. Present the four payslips side by side in one table so the repetition, or its
   absence, is visible at a glance.

### The required closing beat

Every article in the series ends by returning from its specifics to the plain
exchange between dog instinct and human value. The medical article does this,
and so does the Sheepdogs article. Treat it as a fixed element of the template.
You are not writing it, but if an article arrives without it, flag it.

### The medical factual guardrail

Never state or imply that a dog can diagnose disease as a clinical service. Use
research, detection studies, scent signatures and future tools. This applies to
anything you touch, including card deks and sub-labels.

---

## 14. Copy correction licence

You have a narrow licence to correct copy, and a hard limit on it.

**You may correct silently, and must log every change:**

- Spelling and typographical errors.
- Punctuation and missing terminal full stops.
- Grammatical errors.
- American spellings and American terminology, replacing them with UK forms.

**You must list for Steve and not apply:**

- Anything that changes meaning.
- Anything that changes a fact, a figure, a statistic or a source.
- Anything that changes voice, tone or a joke.

If you are unsure which side a change falls on, it goes on the list. A tidy-up
pass must never quietly rewrite the editorial voice.

### Known faults on surviving content

- "helping identify diseased by smell" should read disease.
- Missing terminal full stops in the "What we owe dogs" panel, at "jobs chosen
  for enjoyment rather than survival" and "a place inside our families".
- Sub-label and family labels across all four articles, per section 11.

### Known faults on the removed grid

These are not corrected in place. They are recorded in the forward register in
section 12 and the cards are deleted. Do not spend time editing content that is
being removed.

---

## 15. Article 4: Sheepdogs

Copy is written and supplied. It is not yours to write, rewrite or extend.

- Display title: The Farm Worker With Four Legs
- Family: Rural and Traditional
- Sub-label: Sheepdogs
- Named individual dog: none, by design. Do not add one.

### Working notes to strip

The supplied copy ends with a section headed "ARTICLE SIDEBAR / INFO BLOCK
IDEAS" and a closing paragraph beginning "This also gives the Sheepdog piece a
deliberately different visual rhythm". Both are working notes to Steve, not
article copy. The sidebar section is a specification for the sidebars, listed
below. The closing paragraph is discarded entirely. Neither is published.

### Sidebar modules

Article 4 is assembled from the existing article template, not built from
scratch. See Appendix B. Map each module below onto an existing module type
where one exists, and report any that genuinely need a new component.

| Module | Content | Likely existing equivalent |
|---|---|---|
| What the dog thinks it's doing | The human and dog pair of lines, per the series device | "What the dog thinks it's doing" |
| Built for the job | Five attributes: intelligence, stamina, responsiveness, speed, stock sense | the statistics or figures module |
| From work to sport | Two or three lines on trials reflecting real farm tasks | "How a scent line-up works", a prose panel |
| The honest version | Supplied in the copy under that heading | "The honest version" |
| Sources | International Sheep Dog Society, Royal Kennel Club, National Sheep Association | "Sources" |

The four-stage Outrun, Lift, Fetch, Drive diagram is deferred and is not part of
this build. Do not create it, do not stub it and do not leave a placeholder slot
for it in the layout. Record it in `agent/reference/dogs_at_work_taxonomy.md` as
a deferred item so it is not lost.

Do not create a new article layout, a new stylesheet or a new set of module
components for article 4. If the existing template cannot express one of these
modules, report that specific module rather than forking the template.

### Payslip, article 4

Superseded. The payslip printed inside the supplied article copy, beginning
"Woolly Personnel Manager", is an earlier draft. Use the article 4 table in
section 13 instead. Do not merge the two versions.

### Hero image

Supplied. `~/Downloads/sheepdogs-job.jpg`. Copy it into `public/` renamed to
`sheepdogs_job.jpg`, per the underscore convention in rule 10 of section 2, and
`git add public/`. Alt text is still needed from Steve.

### Still needed from Steve for article 4

Log all of these in `agent/NEEDS_STEVE.md`:

- The card dek for the index page. The article opens with a scene, not a
  summary, so it cannot be extracted mechanically.
- Alt text for `sheepdogs_job.jpg`.

### Call to action label rule

Settled. If the article names a dog, the button carries the dog's name. If it
does not, the button carries the kind of working dog, which is the article's
sub-label.

| # | Article | Names a dog? | Button label |
|---|---|---|---|
| 1 | The Dogs Teaching Medicine How to Smell Disease | Yes | Bumper and Peanut |
| 2 | The Colleague Who Never Clocks Off | Verify | see below |
| 3 | The Machine That May Owe Dogs a Biscuit | No | Bio-detection dogs |
| 4 | The Farm Worker With Four Legs | No | Sheepdogs |

Article 2 must be checked against the live article body, not against the
concept artwork. The artwork labels its button "Bramble", but the published dek
names no dog. If the article body names a dog, use that name. If it does not,
the label is "Medical alert dogs". Report which you found.

Two cautions:

- The label is drawn from the article, never invented. If no dog is named and no
  sub-label fits, stop and ask.
- If applying the rule produces two identical button labels anywhere in the set,
  report it rather than differentiating them yourself.

All four labels fit inside the 24 character budget in section 9. The longest is
"Bio-detection dogs" at 18.

---

## 16. Verification

Before every commit:

1. `./node_modules/.bin/tsc --noEmit` clean.
2. The `:global` audit from rule 6 in section 2.
3. No `rgba` and no opacity on text anywhere in the new CSS.
4. `npm run build` passes. A Google Fonts network failure during a local build
   is not a code failure.

Before the final report:

5. Screenshots at 390 pixels and 1280 pixels, compared against the artwork in
   `agent/reference/`.
6. Every slide navigated in both directions, including via dots, keyboard and
   the chevron.
7. `prefers-reduced-motion` verified.
8. Build validation proven to fail on a missing blue panel pair and on a budget
   breach. Break one deliberately, capture the error message, restore it.
9. The four article routes confirmed to resolve, including the unchanged slug
   of the retitled article 3.

---

## 17. Checkpoints

Every checkpoint is committed and reported. Only two of them halt the run.

**Report and continue** means: commit, write your report, and start the next
checkpoint without waiting. Steve reads the reports afterwards.

**Stop and wait** means: commit, report, and do nothing further until Steve
replies.

| # | Checkpoint | Mode |
|---|---|---|
| 0 | Read-only inventory. No writes. | Stop and wait |
| 1 | Reference files copied and renamed. CLAUDE.md amendments. | Report and continue |
| 2 | Data model, validation and text budgets. No visual change. | Report and continue |
| 3 | Desktop page architecture, counter-motion and dots. | Report and continue |
| 4 | Mobile stack. | Report and continue |
| 5 | Taxonomy applied, forward register written, grid removed, pills built. | Report and continue |
| 6 | Payslip component on all four articles with the supplied values, plus the differentiation proposals from section 13. | Stop and wait |
| 7 | Sheepdogs article page built from the supplied copy. | Report and continue |
| 8 | Copy correction pass, with the change log and the escalation list. | Report and continue |

Checkpoint 0 halts because everything after it depends on what the existing page
turns out to be, and because a wrong reading there produces a rebuild rather than
a redux. Checkpoint 6 halts because it is the only place you write copy.

### Conditional stops

These override the table. If one fires, halt at that point regardless of the
checkpoint's normal mode, and say clearly which condition tripped.

1. The tallest slide does not fit at 700 pixels of viewport using the real copy
   in Appendix A. Do not solve it by shrinking type or cutting budgets.
2. The article template turns out to be per-article markup rather than a shared
   component. That changes the size of checkpoint 7 substantially.
3. A build validation cannot be made to pass without changing an expected value.
4. Applying a rule in this brief would require you to invent a fact, a figure,
   an image or a line of copy that is not supplied.
5. The repo contradicts this brief on anything structural.
6. Anything at all in `~/pedigree-chums`, the other clone, appears in your path.

### What does not stop the run

- A missing asset that has a placeholder. Log it and continue.
- Missing alt text. Log it and continue.
- A copy change that falls in the escalation category. Collect it for the
  checkpoint 8 list and continue.
- Two identical call to action labels. Report and continue.
- Blue panel 4 repeating panel 1. It is known. Ship it and continue.

Report at each checkpoint with the commit SHA, what changed, what you could not
do, and anything you found that contradicts this brief. If this brief and the
repo disagree, the repo wins and you report the discrepancy rather than acting
on your own reading.

---

## 18. Open questions carried into the build

These are recorded so they are not lost, and are answered by Steve, not by you.

1. **Blue panel 4.** See Appendix A. It largely repeats panel 1 and closes with
   a line lifted from panel 1. It was drawn to pair with the grid that is now
   being deleted, and it is now paired with the Sheepdogs article. Steve needs to
   either replace it or accept the repetition. Build the slot, use the supplied
   copy for now, and flag it.
2. The card dek and image alt text for article 4.
3. The three panel 1 thumbnails and their alt text. Steve is supplying the
   images.
4. A hero image for article 3. It has none today, and a 50/50 split with no
   scroll makes an empty half unmissable. Report what your implementation does
   when an image is absent.
5. Whether the blue panel is intended to overlap the top of the article panel,
   as it does in the concept mockup. It affects how the two counter-moving
   tracks cross. Report, do not resolve.

The pill colour set, the sixth family and the call to action label rule are no
longer open. They are settled in sections 10, 11 and 15.

---

## Appendix A: blue panel copy

Transcribed from the concept artwork and cleaned of PDF extraction artefacts.
This is the source of truth for the four blue panels. Use it as written. Do not
re-extract it from the PDF, which loses ligatures.

Pairing is one panel per article, in this order.

### Panel 1, paired with article 1

**To the dog; it's a game.**

Working dogs do not know they have jobs. To a sheepdog, moving livestock is
instinct, training and the best game in the world. To a detection dog, finding
the scent is a puzzle with a reward at the end. To a medical alert dog, noticing
that their human smells wrong is not a shift pattern. It is just what they do.

**To humans, it's a job.**

It only becomes work when humans benefit from it. This series looks at the dogs
that help Britain function — the noses at the border, the paws on the hills, the
search dogs in the woods, the assistance dogs beside their people, and the
bio-detection dogs helping scientists ask whether disease has a smell.

**The payment; very different**

They are paid in food, shelter, praise, tennis balls, head strokes and the
occasional stolen sausage. But their value is measured in time, safety,
independence, science and trust. This is about that hidden workforce, and the
question behind every wagging tail: if dogs give us this much, what do we owe
them back?

### Panel 2, paired with article 2

**Why dogs love doing**

Dogs seem happiest when they have something to do.

For thousands of years they have been selected to chase, retrieve, guard, herd,
track, dig, carry and solve problems alongside people, so many of those
behaviours are deeply rewarding in their own right. A Labrador fetching a ball,
a Collie rounding up the family, or a Terrier digging furiously under a hedge
may look like play to us, but to the dog they are using the same instincts,
senses and problem-solving skills their ancestors relied on for real jobs.

"Work" does not need to mean employment: anything that gives a dog a purpose, a
challenge and the chance to use the abilities it was built for can provide the
satisfaction of a job well done.

**Why we love dogs doing**

For thousands of years, their enthusiasm has made our lives easier.

They herd animals we could never control alone, find people we cannot see,
retrieve things we cannot reach, guard homes and livestock, guide people through
the world and use extraordinary noses to detect drugs, explosives, disease and
even signs of some cancers. What looks like a dog happily following its
instincts can save humans hours of work, enormous effort and sometimes lives.

Perhaps that is the remarkable bargain at the heart of our relationship with
dogs: the jobs we desperately need doing are often the very things they
absolutely love to do.

### Panel 3, paired with article 3

**What we owe dogs**

Far more than affection. For centuries they have guarded our homes, protected
livestock, carried messages, found the lost, hunted food, controlled vermin,
pulled loads, guided people, served in war and rescue, and taken on countless
jobs simply because working beside us became part of their lives.

What we owe them is responsible care, patience, safety, companionship and the
chance to use the instincts and abilities we deliberately bred into them.

After everything dogs have done for us, the least we can do is make sure their
lives are not only useful to humans, but good for them too.

**What dogs often get**

They get food, shelter, protection, veterinary care, companionship and a place
inside our families. Many live warm, comfortable lives filled with walks, play,
affection and jobs chosen for enjoyment rather than survival.

But dogs have not always received a fair return and that is still the case in
modern times for some dogs. The same animals bred to work beside us can be
neglected, abandoned or treated as just tools, or status symbols and disposable
possessions.

Some spend their lives bored and under-stimulated, while others are pushed into
jobs or environments that damage their welfare.

Two corrections have been applied to this panel: a missing full stop after
"a place inside our families" and another after "jobs chosen for enjoyment
rather than survival".

### Panel 4, paired with article 4

Flagged. See open question 2. Use as written for now.

**Working dogs do not know they have jobs**

- To a sheepdog, moving livestock is instinct, training and the best game in the
  world.
- To a detection dog, finding the scent is a puzzle and an instinct with a
  reward at the end.
- To a medical alert dog, noticing that their human smells wrong is not a shift
  pattern.

Results in:

- Search dogs in the woods finding lost people
- The bio-detection dogs helping identify disease by smell

It is just what they do. It only becomes work when humans benefit from it.

They are paid in food, shelter, praise, tennis balls, head strokes and the
occasional stolen sausage. But their value is measured in time, safety,
independence, science and trust.

One correction has been applied: "helping identify diseased by smell" now reads
disease.

Note that this panel is the only one of the four that uses a bullet list. The
blue panel component must support both prose and bulleted content.

---

## Appendix B: the article template already exists

Before planning any article work, read
`/dogs-at-work/the-dogs-teaching-medicine-how-to-smell-disease` in the repo. It
is fully built and live, and it is the reference execution for the series.

What already exists on it:

- Back link to the index page.
- Family and sub-label pills.
- Headline and long-form body copy with subheadings.
- Sidebar modules, currently: "The honest version", "The 2025 study" with a
  paired statistics block, "How a scent line-up works", "What it costs to train
  a dog" with a three-row cost table, "What the dog thinks it's doing", and
  "Sources".

The only element missing from that page is the payslip.

This changes the shape of the work in two places:

1. **Checkpoint 6 is smaller than it looks.** The payslip is a new module added
   to an existing, working template. It is not an article redesign.
2. **Checkpoint 7 is assembly, not construction.** Article 4 reuses the same
   template and the same module types. The only genuinely new component is the
   four-stage diagram, which is now deferred and out of scope.

If your inventory finds that the template is per-article markup rather than a
shared component, say so plainly at Task 0. That single finding changes the
effort of checkpoint 7 substantially and Steve needs it before checkpoint 7 is
scheduled, not during it.
