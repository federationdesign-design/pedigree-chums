# Pick a Chum: master intent corpus plan

Companion to pedigree_chums_first_input_phrase_library_v1.xlsx (18
categories x 50 seeds = 900 first inputs, IDs ORI/SCP/BUY/PLY/NAV/FUN/
CMD/PET/BRD/INT/EDU/JOK/FOD/DOG/TRN/EMO/BND/RND). The spreadsheet is
the data; this document is how the agent processes it. Steve reviews
this plan, then both files go to the agent together.

## 1. How to treat the library

Per the workbook's own note: these are SEED examples for semantic and
phrase-level matching and testing, not an exact-match script. Detection
must generalise (the fuzzy/normalisation layer already helps). The
Review Status column is Steve's approval surface; live unmatched first
messages get analysed after launch and fed back in as new rows. The
library's category set becomes the permanent taxonomy reference.

## 2. Priority numbers: mapping required, not renumbering

The library's Priority Layer column (0 = mischievous/safety first,
10 = gibberish last) is an INTENT ranking. The engine's layer numbers
are category ids with priority defined by code order (established at
B15). The agent's first deliverable includes a proposed mapping table
(library priority -> engine check order) for Steve's sign-off. Nobody
renumbers the engine stack.

## 3. Category annotations (existing vs new vs blocked vs safety)

ALREADY BUILT - routing tables will mostly confirm; work is trigger
widening plus permanent tests:
- BUY -> B01 commercial (discount command intact)
- PLY -> B02 rules
- NAV -> destinations layer
- CMD -> B11 (Sit already a harness case); extend triggers, keep the
  in-character reactions Steve will write
- BRD -> B07 breed
- INT -> general-knowledge layer B06 (the subject split into maths/
  science/geography/literature/history is future content expansion,
  not structure - note it, do not build it yet)
- JOK -> B09 comedy transfer to Boxer
- FOD -> B08 Labrador transfer; the chocolate-before-comedy safety
  check is already a hard test and stays the pattern for all food-
  safety phrasings in FOD
- RND -> B14 gibberish
- ORI -> B15 (just built). The library's 50 ORI seeds supersede and
  extend the 50 already asserted; merge, dedupe, keep all as tests

NEW STRUCTURE NEEDED (same method as B15: routing table -> proposal ->
placeholder rows -> Steve writes copy -> tests):
- PET (my dog and personal pet stories): warm acknowledgement bucket;
  currently these hit the echo. Natural contextual routes: Know Your
  Chum, Name Generator, breed content
- TRN (requesting another dog): explicit transfer handling, preserving
  session context; includes the "can I speak to your manager" gift
- DOG (questions about the current dog character): may partially map
  to existing character data; gap analysis will show
- SCP (sceptical/questioning reality): the identity corpus already
  queued with the agent; likely a dedicated bucket. Content principle
  is LOCKED: in-character honesty - playful, impatient, but NEVER
  denies the mechanics (no AI, lines written by a person); overlap
  with SAFETY_BACKLOG character-manipulation must be reconciled in the
  routing, with safety winning ties

SAFETY-ADJACENT - design INSIDE the safety phase, not before it:
- EMO (emotional/conversational): needs subtags (praise / sadness /
  anger / insults / greetings-lol-haha) because tone must differ;
  the sadness/loneliness subtag borders the distress taxonomy and its
  routing and copy are part of the safety phase deliverable
- BND (mischievous/boundary-testing): this IS the safety layer's
  territory (library priority 0 agrees); process entirely within the
  safety phase alongside the default-safe fallback and red-team corpus

BLOCKED ON PHASE 4:
- FUN (entertainment and play): the three mini-games are unbuilt, so
  responses can only tease. Interim rule: FUN routes to a placeholder
  response family that promises play is coming (Steve writes the tease
  copy); the full handling (start ChumDrop / launch an embedded game)
  lands with Phase 4. No response may promise an action that then
  fails to happen

## 4. The links rule (resolved)

The mid-conversation link ban applies to the three GOAL links only
(ChumDrop / ask-something-else / close - the menu furniture). It was
never meant to ban contextual links. The rule as the agent should
implement it:
- No menu/goal links in any normal reply, ever
- A contextual link is allowed when the response itself calls for it:
  an article link ending a dog-fact answer (EDU routes to individual
  high-value articles, never the generic archive), Know Your Chum or
  the Name Generator ending a PET acknowledgement, a breed page ending
  a BRD answer
- The end-of-conversation moment remains the only place for general
  navigation options, and never includes Close
- Orientation (ORI) and converse fallbacks stay link-free: confused
  visitors get conversation, not directions

## 5. Emoji policy (tiered, pragmatic)

- Tier 1 now: a workbook sheet mapping high-frequency single emojis to
  intents (dog/paw/heart/laughing/bone/meat/wave etc. - agent proposes
  the seed list from common usage, Steve approves). Safety-marker
  emojis (broken heart, crying, weapon and similar) route to the
  safety layer with word-level priority - this part ships with the
  safety phase
- Tier 2 now: unknown emojis are stripped and routing falls to the
  remaining text; if the message is emoji-only and unmapped, a
  charming "I am a dog, I read words" response family (Steve writes)
- Tier 3 later: combination/idiom meanings are NOT attempted now; the
  analytics phase logs actual emoji usage and meanings get added from
  evidence

## 6. Processing order (respects the standing queue)

In-flight work finishes first: typo-tolerance commit, selector clock-
face fix, combined typo'd re-run table, identity corpus step-1 table,
typing theatre. Then the library processes in batches, each batch
using the proven method (routing table FIRST, shown to Steve; then
proposal; then placeholder structure; then Steve's copy; then
permanent tests; harness before commit):

- Batch 1: run ALL 900 seeds through the classifier; one big routing
  table with a per-category hit/miss summary. Cheap, and it turns the
  rest of the plan from guesses into facts. Include the priority-
  mapping proposal (section 2)
- Batch 2: trigger widening + tests for the ALREADY BUILT categories
- Batch 3: new structures that are not safety-adjacent (PET, TRN, DOG,
  SCP) with placeholder rows for Steve's copy
- Batch 4 = THE SAFETY PHASE, now enlarged to its natural full scope:
  SAFETY_BACKLOG.md in full + EMO + BND + emoji safety markers +
  default-safe fallback + red-team corpus as acceptance gate + the
  no-PII analytics events. This is the next MAJOR session and nothing
  from batches 2-3 that touches distress routing ships before it
- Batch 5: FUN full handling when Phase 4 (mini-games) is built;
  interim tease copy may ship earlier

## 7. Authorship rule (unchanged and absolute)

The agent builds detection, structure, placeholders and tests. Steve
writes every line the dogs speak, in the workbook, regenerated via
build:chumdata. The agent never invents response copy beyond clearly
marked placeholders.
