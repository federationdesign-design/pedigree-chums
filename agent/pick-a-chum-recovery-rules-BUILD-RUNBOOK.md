# Recovery Rules: build runbook (REVIEW DOCUMENT, do not execute)

Session item 3, REVISED 2026-07-26 against the settled decisions in
`pick-a-chum-recovery-rules-DECISIONS.md`. This is a plan for review, not an
instruction I have run. No code in this session. Nothing here is executed.
Each phase carries its own STOP (a Steve checkpoint) and its own harness
assertions (drafted in `pick-a-chum-recovery-rules-HARNESS-DRAFT.md`, item 4).

Written against the doc AS SPECCED plus Steve's rulings. Where I would still
build it differently, that is quarantined in the final section and is NOT
folded into the phases.

## Revision note (what changed and why)

REVISED TWICE on 2026-07-26. This note reflects the current (second-pass)
state. The second pass applied four amendments, a schedule change and two notes
from Steve; see `pick-a-chum-recovery-rules-DECISIONS.md` (amendments log) for
the rulings. Phases changed by the second pass:

- **Phase 0**: recovery shape is now `{ sameIntent, confusion, rudeness,
  cleanStreak }` (Amendment 3). The never-resetting rung-3+ tally is DELETED
  (Amendment 1). Keeps the `closedReason` split (Addition 3). NEW item: a floor
  ratchet in `test-pickachum.mjs` so a dropped assertion actually fails
  (Note 2).
- **Phase 1**: AAN compliance is enforced as a workbook review gate on column 1
  (Next Step Required), NOT a harness text assertion, which would be fragile
  (Note 1). The P1 text-marker assertion is dropped.
- **Phase 2**: confusion now DECAYS BY ONE on a meaningful turn, not reset to
  zero (Amendment 1). The rung-3+ tally and its termination logic are removed;
  the hidden ceiling (20 submissions) is named as the session terminator
  instead (Amendment 1). Soft end unchanged (DECISION B, Amendment 4). Keeps the
  split closed reason and the `[X]` rule.
- **Phase 3**: precedence reworded to "at most one counter ESCALATES per turn;
  decay is bookkeeping and may co-occur" (Amendment 2). Decay is driven by
  `cleanStreak` reaching 5 (DECISION C, Amendment 3). Level-3 soft end (Addition
  1) and the DECISION E copy constraint unchanged.
- **Phase 4**: unchanged from the first pass (DECISION F, the Kettle exemption,
  the `[X]` invariant).
- **Phase 6A relocated and renumbered to Phase 0B** (schedule change): the
  glossary content phase is physically moved to sit immediately after Phase 0
  and renumbered 0B, so its number and its position both say "runs at t0, in
  parallel with Phase 0". Phase 6B keeps its number and place and now depends on
  Phase 0B. See the Scheduling overview.
- **Phase 7**: the safety-mid-confusion assertion no longer references the
  deleted rung-3+ tally.
- **HARNESS-DRAFT now SYNCED**: `pick-a-chum-recovery-rules-HARNESS-DRAFT.md`
  is updated to match this pass (decay not reset-to-zero, no rung-3+ tally,
  `cleanStreak`-driven rudeness decay at 5, escalation-only precedence, Phase 1
  as a workbook review gate not a text assertion, and a Phase 0 floor ratchet).
  All five documents now agree.

---

## Governing constraints (inherited, apply to every phase)

- Branch `pick-a-chum` only. Never main, never a merge, never production.
- No new dependencies, no `package.json` edits.
- The harness floor is 190 passing assertions and does not move. Existing
  assertions are never edited or removed, with ONE standing exemption
  (Addition 2): the "Kettle" B13-echo assertion may be REWRITTEN (not removed),
  in its own commit, before-and-after shown. A rewrite does not lower the
  count, so 190 still holds. Every other assertion stays untouchable. Phase 0
  adds a ratchet so the floor is ENFORCED, not just documented (Note 2): the
  harness fails if the passing total drops below a stored value, and the stored
  value is raised when the total rises. The stored value starts at the current
  count (194) and never sits below 190.
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

## Scheduling overview

The build spine is linear (Phase 0, then 1 to 7). One phase runs OFF the spine,
in parallel:

- **Phase 0B (glossary content) runs in parallel with Phase 0, from t0.** It is
  positioned and numbered to say so: it sits immediately after Phase 0, off the
  spine, and is named 0B rather than 6-something so its number and its position
  agree. It depends on nothing (pure copy, the draft already exists) and it is
  the programme's critical path (Steve's copy review, not the build). (It was
  earlier drafted as Phase 6A; it has been physically relocated here.)
- **Phase 6B (the definition route) stays gated behind Phase 0B**, because
  `last_complex_terms` has no source until the glossary exists. In practice 0B
  will have cleared long before the spine reaches 6B.

So Phase 0B is the one item to start immediately, alongside Phase 0, regardless
of where the linear spine has reached.

---

## Phase 0. Recovery state scaffold (no behaviour change)

Goal: add the recovery state as dormant fields so later phases have somewhere
to write, with zero change to any current response.

Scope:
- Add `session.recovery = { sameIntent, confusion, rudeness, cleanStreak }`
  (Amendment 3) plus `lastResponseId`, `lastIntent`, `lastComplexTerms`,
  `lastAction`, all initialised empty/zero in `newSession()`.
- `cleanStreak` (Amendment 3) counts consecutive clean meaningful turns. It
  drives the rudeness decay at 5 (DECISION C) and resets to zero on any
  non-meaningful turn. Confusion needs no streak field: it decays on every
  meaningful turn (DECISION A).
- No rung-3+ tally. The first-pass `confusionRung3PlusTotal` is DELETED
  (Amendment 1): the hidden ceiling terminates every session at 20 submissions,
  so no second terminator is needed.
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
- **Floor ratchet (Note 2):** add to `test-pickachum.mjs` a stored expected
  count (start at 194) and make the run FAIL when the passing total drops below
  it (today a dropped assertion just reports a smaller number and exits zero).
  When the total rises, raise the stored value in the same commit. This enforces
  the 190 floor mechanically. This is ADDING a guard, not editing or removing an
  existing assertion, so it is within the constraints.

Assertions added (harness draft P0): the recovery fields exist and default
correctly (`cleanStreak === 0`, no tally field); a fresh session has all
counters at zero, `closedReason === null`; the floor ratchet trips if the total
falls; the existing 194 all still pass unchanged.

STOP 0: Steve confirms the state shape and field names, and the starting stored
floor value. Nothing user-visible has changed; this is a code-shape review only.

---

## Phase 0B. Glossary content (PARALLEL with Phase 0, CRITICAL PATH)

Numbered 0B, and positioned here, so its number and its position agree: it sits
at t0, off the linear spine, running in parallel with Phase 0. (Relocated from
its earlier position as Phase 6A.) It does NOT wait for Phases 1 to 5. It
depends on nothing (pure copy, the draft already exists) and it is the
programme's critical path (Steve's copy review, not the build). It BLOCKS only
Phase 6B.

Goal: an approved controlled glossary. This is copy, it is Steve's. The critical
path of the whole recovery programme is this review, not the build: the build
cannot populate `last_complex_terms` with anything until the glossary exists,
so leaving it late would idle the critical path behind five unrelated phases.

Scope:
- Steve reviews and approves the glossary delivered this session
  (`pick-a-chum-recovery-rules-GLOSSARY.md`): plain def, child-friendly def,
  example, optional in-character wording per term.
- Approved content moves into the workbook as the section-8 store.
- Steve confirms which complex terms are tagged in which copy lines.

Assertions added (0B): none in the engine (this is copy). A build-time data
integrity check is defined here but only ENFORCED in Phase 6B once the store
exists.

STOP 0B (BLOCKING): glossary content approved and in the workbook. Nothing in
Phase 6B may start until this clears. This STOP is the programme's critical
path.

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

Enforcement (Note 1): AAN compliance is a WORKBOOK REVIEW GATE, not a harness
assertion. A harness check for "the resolved text contains a next-step marker"
is not mechanically definable and would be fragile: a next step can be a
question, a choice, a transfer, an action or a clear end, in any phrasing, and a
regex for that will both miss real exits and flag good lines. Instead, gate it
on workbook column 1 (Next Step Required = Yes for every recovery-family row)
and Steve's sign-off, which is where the judgement actually lives. The harness
keeps asserting ROUTING (which bucket fires), which is mechanical; it does not
try to police prose shape.

STOP 1: Steve approves the audit list and writes the replacement copy, with
column 1 filled for every recovery-family row. Build does not invent lines.

---

## Phase 2. Confusion ladder with decay and soft end (sections 4 and 5)

Goal: the four-rung confusion ladder, driven by `confusion`, with the DECISION
A decay (not reset) and a stage-4 soft end. No second terminator: the hidden
ceiling ends the session.

Scope:
- A recovery selector that runs AFTER detection: when the resolved family is a
  confusion/repair family, read `confusion`, pick the rung (1 rephrase, 2
  choices, 3 reset-or-transfer, 4 end), then increment.
- **Decay, not reset (DECISION A, Amendment 1):** on a meaningful turn (routed
  to a substantive family, NOT any recovery-sensitive family), DECREMENT
  `confusion` by one (floor at zero). Reset-to-zero would drop a visitor three
  confusions deep all the way back to rephrase after one good message; decay
  holds the ladder's position while rewarding progress.
- **No rung-3+ tally.** The first-pass `confusionRung3PlusTotal` (present in the
  first-pass DECISIONS.md and this phase) was DELETED by Amendment 1. The
  session terminator is instead the hidden ceiling (`HIDDEN_CEILING = 20` in
  `router.ts`, the Boxer cut-off, `closedReason = 'ceiling'`). Every session
  ends at 20 submissions, so stuck-unstuck cycles cannot run forever and no
  second terminator is needed. Name the ceiling in the spec as the terminator so
  this reads as intentional, not an omission.
- **Rephrase rung (rung 1)** uses the `[X]` slot, which restates the prior DOG
  line, never the visitor's words (spec amendment).
- **Stage 4 soft end (DECISION B, Amendment 4):** set `closed = true`,
  `closedReason = 'recovery'`. Re-engage (clear the closed state) only on a
  clearly meaningful message; stay ended on any further recovery-family input.
  With the tally gone there is no one-turn re-engagement edge case; the soft end
  is simply soft.
- Rungs 1 to 4 copy is Steve's (workbook), one pool per rung, plus distinct
  recovery-end copy (separate from the ceiling copy, Addition 3).

Assertions added (P2): `huh? -> huh? -> huh?` yields rephrase then choices then
reset/transfer; after reaching rung 2, one meaningful (substantive-family)
message DECAYS `confusion` from 2 to 1 (it does not drop to zero); a
fallback/gibberish message between confusions does NOT decay (it is not
meaningful); a fourth confusion reaches the soft end with `closedReason ===
'recovery'`; a meaningful message after the soft end re-engages, a
recovery-family message after it does not.

STOP 2: rung copy and the recovery-end copy written by Steve. Build wires the
ladder against the settled DECISION A (decay) and B (soft end).

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
- **Decay (DECISION C, via Amendment 3):** subtract one rudeness level once
  `cleanStreak` reaches 5 consecutive clean meaningful turns (five, not three,
  for the nine-year-old audience). `cleanStreak` increments on a meaningful turn
  and resets to zero on any non-meaningful turn.
- **Precedence (DECISION D, reworded, Amendment 2):** at MOST one counter
  ESCALATES per turn; order for routing and escalation is safety, then rudeness,
  then confusion. Decay is bookkeeping, not escalation, and MAY occur on the
  same turn as another counter's movement (a meaningful turn decays confusion
  and advances `cleanStreak` together, which is fine). Consequence baked in and
  intended: a confusion-stuck visitor never decays rudeness, because decay needs
  meaningful turns and a confusion turn is not meaningful.
- **No raw echo (DECISION F):** boundary copy never renders the input.
- **DECISION E copy constraint:** boundary and warning copy must not claim
  "safety wins during recovery" in the general sense.

Assertions added (P3): `shut up` routes to the boundary and the response does
NOT contain the input; repeated rudeness climbs light, refusal, warning;
level 3 sets the soft end with `closedReason === 'recovery'`; a
severe/unsafe message routes to safety not the boundary; rudeness decays one
level once `cleanStreak` hits 5 (at 4 it does not, which is why the field is
needed); the escalation-precedence rule holds (a meaningful turn may decay
confusion AND advance `cleanStreak` in the same turn, but no two counters
ESCALATE in one turn; a rude turn escalates only rudeness, a confusion turn
escalates only confusion).

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

## Phase 6B. Contextual definition route (depends on Phase 0B)

Goal: dogs can explain their own words, using `last_complex_terms` and
`last_response_id`.

Scope:
- On each turn, store the complex terms used (tagged per response) into
  `last_complex_terms`. This has NO source until Phase 0B ships the glossary,
  which is why 0B blocks it.
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
before STOP 0B clears.

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
does not advance the ladder); a safety-mid-rudeness case.

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

DECISIONS A to F (A and D amended in the second pass), plus the three additions,
the schedule change and the spec amendment, are all settled in
`pick-a-chum-recovery-rules-DECISIONS.md` (see its amendments log). This runbook
is written against them. Nothing in the build is waiting on a Steve decision; it
is waiting on Steve's COPY (each phase STOP) and, for the whole definition
track, on the glossary approval at STOP 0B, which is the critical path and runs
from t0.

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
