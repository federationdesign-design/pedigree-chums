# Recovery Rules: build runbook (REVIEW DOCUMENT, do not execute)

Session item 3, REVISED 2026-07-26 against the settled decisions in
`pick-a-chum-recovery-rules-DECISIONS.md`. This is a plan for review, not an
instruction I have run. No code in this session. Nothing here is executed.
Each phase carries its own STOP (a Steve checkpoint) and its own harness
assertions (drafted in `pick-a-chum-recovery-rules-HARNESS-DRAFT.md`, item 4).

Written against the doc AS SPECCED plus Steve's rulings. Where I would still
build it differently, that is quarantined in the final section and is NOT
folded into the phases.

## Revision note (what changed in this pass and why)

Every DECISION-GATED item from the previous draft is now resolved; the phases
below bake in the answers rather than pausing on them. Phases that changed:

- **Phase 0** changed: adds the never-resetting rung-3+ escalation counter
  (DECISION A) and a `closedReason` field to split the two ends (Addition 3).
- **Phase 2** changed: soft end (DECISION B), the substantive-family definition
  of "meaningful" (DECISION A), the never-reset rung-3+ tally driving
  termination (DECISION A), the split closed reason (Addition 3), and the `[X]`
  restatement rule (spec amendment).
- **Phase 3** changed: rudeness decays after 5 clean meaningful turns (DECISION
  C), one-counter-per-turn precedence and its stated consequence (DECISION D),
  the level-3 "stops" line gets the soft-end mechanism (Addition 1), and the
  scoped-safety-wording copy constraint (DECISION E).
- **Phase 4** changed: no-echo rescoped to all four families and transfer
  context (DECISION F), plus the standing single-assertion exemption for the
  Kettle case (Addition 2), plus the `[X]` restatement invariant.
- **Phases 6 and 7 reordered** (Addition/Sequencing): glossary approval now
  BLOCKS the contextual-definition wiring. The glossary is split into a copy
  phase (6A, critical path, Steve's review) that gates the build phase (6B).
  Phase 7 strengthens the DECISION E release-checklist constraint.
- The old "Decisions this runbook needs from Steve" section is replaced by a
  pointer to the DECISIONS doc.
- "What I would do differently" updated: item 3 (reuse Boxer cut-off) is
  overridden by Addition 3; items 2 and 5 are now partly adopted.

---

## Governing constraints (inherited, apply to every phase)

- Branch `pick-a-chum` only. Never main, never a merge, never production.
- No new dependencies, no `package.json` edits.
- The harness floor is 190 passing assertions and does not move. Existing
  assertions are never edited or removed, with ONE standing exemption
  (Addition 2): the "Kettle" B13-echo assertion may be REWRITTEN (not removed),
  in its own commit, before-and-after shown. A rewrite does not lower the
  count, so 190 still holds. Every other assertion stays untouchable.
- Detection stays a pure function of the current message (item 2). All new
  state lives in a recovery layer that runs after detection.
- No raw user input rendered from any refusal, rude, unsafe or fallback path
  (DECISION F).
- The `[X]` restatement slot holds a restatement of the prior DOG line, never
  the visitor's words (spec amendment). This makes the rephrase rung safe by
  construction.
- No copy may claim "safety wins during recovery" in the general sense; wording
  is scoped to what `detectSafety` covers (DECISION E).
- No em dashes. CSS Modules only. All copy lives in data records, not
  components (house rules).
- Copy is Steve's. Every phase that needs new lines STOPS for Steve to write
  them in the workbook; the build wires routing and asserts it, never invents
  campaign or character copy.

## Baseline (today, verified this session)

- Detection is `resolve()` in `app/pick-a-chum/lib/router.ts`: a strict
  priority waterfall, first match wins, deterministic.
- Session state exists (`session.ts`) but holds no recovery counters. The only
  stateful routing today is the hidden ceiling (`submissionCount >= 20`) and
  the bark game. The ceiling already sets `closed === true`.
- Harness `scripts/test-pickachum.mjs` = 194 passing, 0 failing.
- No glossary or definition structure exists anywhere in the code.
- No git hooks (so verification is a manual step, run it explicitly).

---

## Phase 0. Recovery state scaffold (no behaviour change)

Goal: add the recovery state as dormant fields so later phases have somewhere
to write, with zero change to any current response.

Scope:
- Add `session.recovery = { sameIntent, confusion, rudeness }` plus
  `lastResponseId`, `lastIntent`, `lastComplexTerms`, `lastAction`, all
  initialised empty/zero in `newSession()`.
- Add the never-resetting session-level tally
  `session.recovery.confusionRung3PlusTotal` (DECISION A). It increments when a
  confusion ladder reaches rung 3 or higher and is never reset for the life of
  the session.
- Add `session.closedReason` (Addition 3), one of `null | 'ceiling' | 'recovery'`.
  The existing Boxer cut-off will set `'ceiling'`; the recovery end (Phase 2)
  will set `'recovery'`. One closed STATE, two REASONS, distinct copy per
  reason.
- Thread the recovery block into `RouterState` as read-only inputs. Do NOT read
  them in `resolve()` yet. Populate `lastIntent` / `lastResponseId` /
  `lastAction` in the engine after each turn (already computed).
- Extend the recorder `TurnRow` (`dev/recorder-store.ts`) to capture the
  recovery block and `closedReason`, so replay can see counter evolution and
  distinguish the two ends.

Assertions added (harness draft P0): the fields exist and default correctly; a
fresh session has all counters at zero, `closedReason === null`; the existing
194 all still pass unchanged.

STOP 0: Steve confirms the state shape and field names. Nothing user-visible
has changed; this is a code-shape review only.

---

## Phase 1. AAN and no-dead-end audit (copy-only, no routing change)

Goal: bring existing copy up to sections 2 and 3 (every recovery-family line
acknowledges, answers, and offers a next step). No new families yet.

Scope:
- Audit the recovery-sensitive buckets that exist today: B09 greeting, B13
  one-word, B14 gibberish, B15 orientation, B18 emoji, B06 gk_unknown, and the
  refusal/boundary lines. Flag any line that ends without one of the five exits
  (question, choice, transfer, action, clear end).
- Steve rewrites flagged lines in the workbook. Build rebuilds data
  (`npm run build:chumdata`) and re-runs the harness.

Assertions added (P1): for each recovery-family bucket, a shape assertion that
the resolved text contains a next-step marker. A copy-shape guard on the
rendered text, not new routing.

STOP 1: Steve approves the audit list and writes the replacement copy. Build
does not invent lines.

---

## Phase 2. Confusion ladder with reset and soft end (sections 4 and 5)

Goal: the four-rung confusion ladder, driven by `confusion`, with the DECISION
A reset, the never-reset rung-3+ tally, and a stage-4 soft end.

Scope:
- A recovery selector that runs AFTER detection: when the resolved family is a
  confusion/repair family, read `confusion`, pick the rung (1 rephrase, 2
  choices, 3 reset-or-transfer, 4 end), then increment.
- **Reset (DECISION A):** on a meaningful turn (routed to a substantive family,
  NOT any recovery-sensitive family), set `confusion = 0`.
- **Never-reset tally (DECISION A):** when a ladder reaches rung 3 or higher,
  increment `confusionRung3PlusTotal`, which never resets. When it crosses its
  threshold, force the graceful end even if the per-ladder counter was reset in
  between, so stuck-unstuck cycles terminate. Spec must state the never-reset is
  intentional.
- **Rephrase rung (rung 1)** uses the `[X]` slot, which restates the prior DOG
  line, never the visitor's words (spec amendment).
- **Stage 4 soft end (DECISION B):** set `closed = true`, `closedReason =
  'recovery'`. Re-engage (clear the closed state) only on a clearly meaningful
  message; stay ended on any further recovery-family input.
- Rungs 1 to 4 copy is Steve's (workbook), one pool per rung, plus distinct
  recovery-end copy (separate from the ceiling copy, Addition 3).

Assertions added (P2): `huh? -> huh? -> huh?` yields rephrase then choices then
reset/transfer; a meaningful (substantive-family) message returns `confusion`
to zero; a fallback/gibberish message between confusions does NOT reset (it is
not meaningful); a fourth confusion reaches the soft end with `closedReason ===
'recovery'`; a meaningful message after the soft end re-engages, a
recovery-family message after it does not; repeated stuck-unstuck cycles reach
the end via `confusionRung3PlusTotal` despite per-ladder resets.

STOP 2: rung copy and the recovery-end copy written by Steve. Build wires the
ladder against the settled DECISION A and B.

---

## Phase 3. Rudeness route with decay and precedence (section 7)

Goal: the dedicated boundary route, three steps plus severe handoff, driven by
`rudeness`, never echoing the rude message, with DECISION C decay and DECISION
D precedence.

Scope:
- A rudeness detector ABOVE the catch-all and above confusion in routing order
  (section 6), BELOW safety (safety already wins at the top of `resolve()`).
- Steps by `rudeness`: 1 light boundary, 2 clear refusal, 3 warning-and-limit,
  severe goes to the safety route.
- **Level-3 soft end (Addition 1):** "this conversation stops" cannot literally
  stop a web chat, so level 3 uses the SAME soft-end mechanism as the confusion
  stage-4 end: `closed = true`, `closedReason = 'recovery'`, re-engage on a
  clearly meaningful message.
- **Decay (DECISION C):** subtract one rudeness level after 5 consecutive clean
  meaningful turns (five, not three, for the nine-year-old audience).
- **Precedence (DECISION D):** exactly one recovery counter moves per turn;
  order safety, then rudeness, then confusion; incrementing one resets none of
  the others. Consequence baked in: a confusion-stuck visitor never decays
  rudeness (decay needs meaningful turns). Intended.
- **No raw echo (DECISION F):** boundary copy never renders the input.
- **DECISION E copy constraint:** boundary and warning copy must not claim
  "safety wins during recovery" in the general sense.

Assertions added (P3): `shut up` routes to the boundary and the response does
NOT contain the input; repeated rudeness climbs light, refusal, warning;
level 3 sets the soft end with `closedReason === 'recovery'`; a
severe/unsafe message routes to safety not the boundary; rudeness decays to a
lower level only after 5 clean meaningful turns (4 do not); the one-counter rule
holds (a rude turn leaves `confusion` untouched, a confusion turn leaves
`rudeness` untouched).

STOP 3: boundary, warning and level-3 soft-end copy written by Steve. NOTE:
this phase is adjacent to the parked safety workstream. Per DECISION E, the
build MUST NOT pull the character-manipulation set into scope. It stays parked.

---

## Phase 4. No-echo hardening across all channels (section 6, gap 5, DECISION F)

Goal: close the transfer-context and single-word echo channels so no
unsanitised input is ever rendered, and no input at all is rendered from the
refusal, rude, unsafe or fallback families.

Scope:
- Transfer context (`transfers.json` `contextCarried`, B08 "original question
  attached"): carry the CLASSIFIED intent plus a sanitised summary, never the
  raw string (DECISION F).
- B13 single-word echo: keep it only for a benign single token that has passed
  the safety and rudeness gates; document the gate. A rude single word must not
  reach B13's echo path.
- The `[X]` restatement slot: confirm it restates the prior dog line, never the
  input (spec amendment), so the rephrase rung shares this invariant.
- **Standing harness exemption (Addition 2):** the "Kettle" B13-echo assertion
  in `test-pickachum.mjs` is the one assertion that changes here. It may be
  REWRITTEN, not removed, and that change ships in ITS OWN commit with the
  before and after shown in the message. No other assertion is touched; the 190
  floor holds.

Assertions added (P4): a rude message that would otherwise transfer does not
carry its raw text into the receiving dog's line; B13 still echoes a benign
single word (the rewritten Kettle assertion); a rude single word does not reach
B13's echo path.

STOP 4: Steve approves the sanitisation rule and any changed transfer copy.
Highest-risk phase (a safety hole), so it gets its own review even though it is
mostly plumbing. The Kettle-assertion rewrite is a separate, self-contained
commit.

---

## Phase 5. Fallback narrowing (section 9)

Goal: the three-stage narrowing fallback (ask fuller question, offer broad
categories, offer reset or transfer), replacing bare apology fallback.

Scope:
- Drive fallback stage from `sameIntent` for the fallback family.
- Stage 1 "try as a full question", stage 2 the broad-category question
  ("game, a dog, the website, or something else"), stage 3 reset or transfer.
- Copy is Steve's (workbook).

Assertions added (P5): three consecutive unmatched messages yield clarify then
narrow-choices then reset/transfer.

STOP 5: Steve writes the three fallback stages; build wires the staging.

---

## Phase 6A. Glossary content (CRITICAL PATH, Steve's copy review, BLOCKS 6B)

Goal: an approved controlled glossary. This is copy, it is Steve's, and per the
sequencing ruling it BLOCKS the contextual-definition build. The critical path
of the whole recovery programme is this review, not the build: the build cannot
populate `last_complex_terms` with anything until the glossary exists.

Scope:
- Steve reviews and approves the glossary delivered this session
  (`pick-a-chum-recovery-rules-GLOSSARY.md`): plain def, child-friendly def,
  example, optional in-character wording per term.
- Approved content moves into the workbook as the section-8 store.
- Steve confirms which complex terms are tagged in which copy lines.

Assertions added (6A): none in the engine (this is copy). A build-time data
integrity check is defined here but only ENFORCED in 6B once the store exists.

STOP 6A (BLOCKING): glossary content approved and in the workbook. Nothing in
6B may start until this clears. This STOP is the programme's critical path.

---

## Phase 6B. Contextual definition route (depends on 6A)

Goal: dogs can explain their own words, using `last_complex_terms` and
`last_response_id`.

Scope:
- On each turn, store the complex terms used (tagged per response) into
  `last_complex_terms`. This has NO source until 6A ships the glossary, which
  is why 6A blocks it.
- A definition route: "what is a verb?" answers directly; "what does that
  mean?" answers a term from the previous response via `last_complex_terms`.
- A build-chumdata integrity gate: fail the build if any copy line tags a
  complex term with no glossary entry (turns section 8's "simplify before
  release" into an enforced rule).

Assertions added (6B): dog uses "verb", visitor asks "what is a verb?", gets the
child-friendly explanation; "what does that mean?" explains a term from the
previous response; every complex term tagged in copy has glossary coverage
(data-integrity assertion).

STOP 6B: Steve confirms the tagging and the definition copy. Cannot begin
before STOP 6A clears.

---

## Phase 7. Safety-during-recovery and the section 12 test table

Goal: prove the section 12 table, especially "Safety override", within the
DECISION E scope.

Scope:
- No new safety detection (parked, DECISION E). This phase only asserts that
  the EXISTING safety gate wins over every recovery state built in phases 2 to
  6B, because the recovery selector runs after the safety early-return.
- Wire the full section 12 battery as permanent assertions.
- **DECISION E release-checklist item:** add to the doc's section 14 checklist
  a line confirming no copy claims "safety wins during recovery" in the general
  sense, and that safety wording is scoped to `detectSafety`'s coverage. The
  manipulation set is explicitly declared out of scope for this release.

Assertions added (P7): the eight section-12 tests as permanent cases; a
safety-mid-confusion case (distress at confusion rung 3 still fires safety and
does not advance the ladder or the rung-3+ tally); a safety-mid-rudeness case.

STOP 7: Steve confirms scope: safety wins for the CURRENT safety set only; no
claim of coverage for the parked manipulation set (DECISION E). Ship note and
the section-14 checklist item must say so.

---

## The ten workbook columns (section 11, Steve maintains these)

Reproduced verbatim from the doc so the workbook and the build agree. The build
reads Recovery Family, Exit Type, May Echo Input, Complex Terms, Reset
Condition and Max Repeats as routing inputs, and treats the rest as review
discipline.

| # | Column | Purpose or values |
|---|--------|-------------------|
| 1 | Next Step Required | Yes or No |
| 2 | Exit Type | Question, Choice, Transfer, Action or End |
| 3 | Repeat Stage | 1, 2, 3 or Final |
| 4 | Recovery Family | Where a failed interaction routes next |
| 5 | May Echo Input | Default No |
| 6 | Complex Terms | Words requiring glossary coverage |
| 7 | Definition Coverage Checked | Yes or No |
| 8 | Reset Condition | What returns counters to zero |
| 9 | Max Repeats | Usually two or three |
| 10 | Loop Risk | Low, Medium or High |

---

## Decisions (now SETTLED, see the DECISIONS doc)

DECISIONS A to F, plus the three additions, the sequencing change and the spec
amendment, are all settled in
`pick-a-chum-recovery-rules-DECISIONS.md`. This runbook is written against
them. Nothing in the build is waiting on a Steve decision; it is waiting on
Steve's COPY (each phase STOP) and, for the whole definition track, on the
glossary approval at STOP 6A, which is the critical path.

---

## What I would do differently (NOT part of the phases above)

Updated to reflect Steve's rulings. Some of my earlier variations were adopted,
one was overridden.

1. **One recovery selector owning all three counters.** Still my preference,
   and it now fits DECISION D cleanly: the one-counter-per-turn precedence is a
   single ordered function (safety, rudeness, confusion) rather than three
   scattered checks. I would build it as one selector.

2. **Define "meaningful" by the router's own output.** ADOPTED as DECISION A
   (substantive family versus recovery-sensitive family). No separate predicate;
   reuse the resolved family. Noting it here as settled, not as a variation.

3. **Graceful end.** PARTLY OVERRIDDEN. Soft end is settled (DECISION B), which
   I agree with. But my "reuse the Boxer cut-off exactly" is overridden by
   Addition 3: one closed STATE, two closed REASONS (`ceiling` versus
   `recovery`), distinct copy each. I have folded that into Phases 0 and 2. I
   think Steve is right: conflating them would have made the logs unreadable.

4. **Record real traffic through the dormant Phase 0 counters before writing
   final Max Repeats copy.** Still my suggestion. Because detection is
   deterministic and the recorder exists, threading the counters read-only in
   Phase 0 lets the real confusion/rudeness distribution set the thresholds,
   rather than defaulting to "two or three" blind. Optional.

5. **Glossary as a build-time integrity gate.** ADOPTED into Phase 6B (the
   build-chumdata check that fails on an untagged complex term). This turns
   section 8's "simplify before release" into an enforced rule.

6. **Derive `last_action` rather than store it.** Minor build detail, still my
   preference: store the last resolution rather than a hand-maintained
   `last_action` so two fields cannot disagree. Does not affect any phase STOP.
