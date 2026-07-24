# Pick a Chum: Agent Runbook

You are building the Pick a Chum feature for pedigree-chums.co.uk. The
authoritative documents are in this folder:

- `brief-mvp.md`: system architecture, priority stack, buckets, phases,
  acceptance criteria. THE PLAN.
- `brief-visual.md`: the retro console-RPG dialogue presentation. THE LOOK.
- `data/workbook.xlsx`: the detailed implementation source AND the
  permanent editable source of truth for content. Where the workbook and
  the briefs disagree on content detail, the workbook wins. Where they
  disagree on intent or presentation, the briefs win.
- `reference/`: client mockups (Screenshot_*.png) and the console-RPG
  visual-language references (image1..5.png). Where a mockup and prose
  disagree on aesthetics, the mockup wins, with ONE exception noted below.

Also read `/CLAUDE.md` at the repo root before anything else.

## Global rules

1. Deterministic only. No external API calls, no internet lookups, no LLM
   calls anywhere in the running feature. All classification is local code.
2. Build under the route `/pick-a-chum` and in self-contained components.
   Do NOT touch the global layout, nav, or add any site-wide floating
   launcher until after Checkpoint 2 is approved.
3. Launcher icon: the robot head shown in the mockups is a PLACEHOLDER,
   approved for the build. Use it as-is: do not replace it with a paw, do
   not redesign it, do not treat it as final. It will be swapped for the
   launch mark later, so implement it as a single easily replaced asset.
4. Placeholders: for anything listed in `NEEDS_STEVE.md`, use a clearly
   named placeholder value and log it in `/PLACEHOLDERS.md`. Never invent.
5. Mini-games (Nine-Square Sheep Management, Missing Sheep, Kennel Sketch
   Recognition) come AFTER Checkpoint 2. Do not start them earlier however
   tempting.
6. Work on branch `pick-a-chum`. Commit incrementally.

## STOP discipline

This run has hard stops. When you reach a STOP you commit, write the
review summary described, and END THE SESSION. You do not continue to the
next phase until Steve has replied confirming the checkpoint. This applies
even if you are confident, even if the next step seems obvious, even if
you are mid-flow. STOP means stop.

---

## RUN 0: Data pack (do this first, alone, then STOP)

Goal: eliminate every gatherable unknown before any feature code exists.
Compile the Section 20 "Open inputs" from brief-mvp.md by reading this
repository, and write the results as structured data files in
`app/pick-a-chum/data/` (JSON or TS records matching the workbook schemas):

1. Site URLs: map every entry in the workbook's Destinations sheet to a
   real route in `app/`. List any destination with no matching route.
2. 54-dog database: extract name, slug, lifespan, character, health and
   lineage fields from `data/breeds.ts`, `data/lineage.ts` and related
   data files into the dog-record schema from brief-mvp.md Appendix A.
3. Article catalogue: enumerate the Good Dog Bad Dog and Dogs at Work
   pages with title, URL and topic tags read from their metadata.
4. FAQ library: extract the questions and answers from the home page FAQ
   section into the FAQ record schema.
5. Discount pop-up: locate the pre-order / 30% pop-up component in the
   repo and record the exact component and how to open it programmatically.
6. Moderation wording: DRAFT responses for explicit, abusive, distressed
   and unsafe inputs following brief-mvp.md section 16, marked DRAFT FOR
   APPROVAL. Do not treat them as final.

7. Content pipeline: build a conversion script exposed as
   `npm run build:chumdata` that regenerates every data record from
   `agent/data/workbook.xlsx`. The workbook is Steve's editing surface for
   the life of the feature: he edits the spreadsheet, the script rebuilds
   the records, and a push deploys the change. Hand-edited data files will
   be overwritten by the script, so ALL content changes go through the
   workbook. Make the script tolerant of the workbook's header rows and
   loud about rows it cannot parse.

Then write `agent/NEEDS_STEVE.md` listing only what you could not gather,
which is expected to be roughly: campaign values (launch date, full price,
the 6.99 and 30% relationship), moderation wording approval, and final
launcher/portrait asset files if absent from `public/`.

STOP 0: commit as "pick-a-chum run 0: data pack", summarise what was
gathered and what needs Steve, and end the session.

---

## CHECKPOINT 1: System proof (after Steve confirms Run 0)

Build Phase 1 of brief-mvp.md plus a walking skeleton:

- Message normalisation, moderation gate, the full 10-layer priority
  stack, bucket classification (B01..B14), session state, response
  rotation, and the response assembler consuming the Run 0 data files and
  the workbook's Collie response bank.
- A minimal unstyled page at `/pick-a-chum` proving the state flow:
  select Collie, silent wait, type, classified response with working
  destination links. No styling effort at all at this stage.
- THE PROOF: a test harness (`npm run test:pickachum` or a plain script)
  that feeds at least 25 inputs and asserts the resolved priority layer,
  bucket and action for each. It must cover every acceptance criterion in
  brief-mvp.md section 19 that is testable without UI, including at
  minimum: "Hello, how much is the game?" resolves commercial not
  greeting; "Can dogs eat chocolate?" resolves safety and does NOT
  transfer to the Labrador; "qwerty" resolves gibberish; "Sausages."
  resolves specialist transfer; no exact response repetition within a
  session when alternatives exist; no dog speaks before the visitor.

Definition of done: tsc clean, :global audit clean, all harness
assertions passing, skeleton page navigable.

STOP 1: commit, paste the test-run output into the summary, and end the
session. Do not begin any styling.

---

## CHECKPOINT 2: The look (after Steve confirms Checkpoint 1)

Implement brief-visual.md states 1 to 7 on the skeleton:

- Closed launcher (robot head), fan-out selector with random option,
  silent waiting state, command bar, the framed lower-screen dialogue HUD
  with portrait, nameplate, paged text reveal and continue marker,
  links/choices after reveal, transfer presentation, close control.
- Colour tokens, frame construction and typography exactly as
  brief-visual.md section 9. No scrolling transcript. No typing-dot
  bubbles. Full-quality dog portraits.
- Verify with Playwright screenshots at 390px and 1280px against
  `reference/Screenshot_2026-07-24_at_09_23_09.png` (waiting),
  `..._17.png` (selector fan), `..._24.png` (command bar) and
  `..._31.png` (response HUD). Save the screenshots into
  `agent/checkpoint2-screens/` and commit them.

Definition of done: tsc clean, :global audit clean, screenshots committed,
every non-negotiable in brief-visual.md section 4 satisfied.

STOP 2: commit, end the session, wait for Steve.

---

## After Checkpoint 2 (only when explicitly told to continue)

Phase 3 (other dogs, ceiling, Boxer cut-off), then Phase 4 (the three
mini-games), then Phase 5 content expansion, each as its own committed
stage. The global launcher may be wired into the site layout only when
Steve says so.
