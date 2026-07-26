# Recovery Rules: build runbook (REVIEW DOCUMENT, do not execute)

Session item 3. This is a plan for review, not an instruction I have run. No
code in this session. Nothing here is executed. Each phase carries its own
STOP (a Steve checkpoint) and its own harness assertions (drafted separately
in `pick-a-chum-recovery-rules-HARNESS-DRAFT.md`, item 4).

Written against the doc AS SPECCED. Where I would build it differently, that
is quarantined in the final section "What I would do differently" and is NOT
folded into the phases, so you can approve the spec-faithful plan cleanly and
treat my variations as separate opt-in decisions.

## Governing constraints (inherited, apply to every phase)

- Branch `pick-a-chum` only. Never main, never a merge, never production.
- No new dependencies, no `package.json` edits.
- The harness floor is 190 passing assertions and does not move. Existing
  assertions are never edited or removed. Phases only ADD assertions.
- Detection stays a pure function of the current message (item 2). All new
  state lives in a recovery layer that runs after detection.
- No raw user input rendered from any refusal, rude, unsafe or fallback path.
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
  the bark game.
- Harness `scripts/test-pickachum.mjs` = 194 passing, 0 failing.
- No glossary or definition structure exists anywhere in the code.
- No git hooks (so verification is a manual step, run it explicitly).

---

## Phase 0. Recovery state scaffold (no behaviour change)

Goal: add the seven fields as dormant state so later phases have somewhere to
write, with zero change to any current response.

Scope:
- Add `session.recovery = { sameIntent, confusion, rudeness }` plus
  `lastResponseId`, `lastIntent`, `lastComplexTerms`, `lastAction` to
  `Session` (`session.ts`), all initialised empty/zero in `newSession()`.
- Thread them into `RouterState` as read-only inputs. Do NOT read them in
  `resolve()` yet. Populate `lastIntent` / `lastResponseId` / `lastAction` in
  the engine after each turn (they are already computed).
- Extend the recorder `TurnRow` (`dev/recorder-store.ts`) to capture the
  recovery block, so replay can see counter evolution.

Assertions added (see harness draft P0): the seven fields exist and default
correctly; a fresh session has all counters at zero; existing 194 all still
pass unchanged.

STOP 0: Steve confirms the state shape and field names before any phase reads
them. Nothing user-visible has changed, so this is a code-shape review only.

---

## Phase 1. AAN and no-dead-end audit (copy-only, no routing change)

Goal: bring existing copy up to sections 2 and 3 (every recovery-family line
acknowledges, answers, and offers a next step). No new families yet.

Scope:
- Audit the recovery-sensitive buckets that exist today: B09 greeting, B13
  one-word, B14 gibberish, B15 orientation, B18 emoji, B06 gk_unknown, and the
  refusal/boundary lines. Flag any line that ends without one of the five
  exits (question, choice, transfer, action, clear end).
- Steve rewrites flagged lines in the workbook. Build rebuilds data
  (`npm run build:chumdata`) and re-runs the harness.

Assertions added (P1): for each recovery-family bucket, a shape assertion that
the resolved response text contains a next-step marker (ends in a question, or
contains a choice/transfer/action cue). This is a copy-shape guard, asserted
on the rendered text, not new routing.

STOP 1: Steve approves the audit list and writes the replacement copy. Build
does not invent lines.

---

## Phase 2. Confusion ladder with reset and end (sections 4 and 5)

Goal: the four-rung confusion ladder, driven by `confusion_count`, with a
reset condition and a stage-4 graceful end.

Scope:
- Introduce a recovery selector that runs AFTER detection: when the resolved
  family is a confusion/repair family, read `confusion_count`, pick the rung
  (1 rephrase, 2 choices, 3 reset-or-transfer, 4 end), then increment.
- Reset: on a meaningful turn (defined precisely, see the DECISION below),
  set `confusion_count = 0`.
- Stage 4 end: reuse the existing `closed` mechanism from the Boxer cut-off.
- Rungs 1 to 4 copy is Steve's (workbook), one pool per rung.

Depends on two of your decisions (from the READING doc, gaps 2 and 4):
- DECISION A (gap 2): the exact definition of "meaningful message" that
  triggers reset. Recommended: routed to a substantive family, not to any
  recovery-sensitive family. The build cannot proceed on the reset without
  this, because it decides which turns reset the counter.
- DECISION B (gap 4): soft end or hard end after stage 4. Recommended soft.
  This decides whether a post-end meaningful message re-engages.

Assertions added (P2): `huh? -> huh? -> huh?` yields rephrase then choices then
reset/transfer (section 12 "Repeated confusion"); a meaningful message between
confusions returns the counter to zero (section 12 "Counter reset"); a fourth
confusion reaches the graceful end and sets `closed`; alternation (per DECISION
A) does or does not reset, asserted to match the chosen definition.

STOP 2: DECISIONS A and B answered by Steve; rung copy written. Build wires
the ladder only after both are set.

---

## Phase 3. Rudeness route with its own escalation (section 7)

Goal: the dedicated boundary route, three steps plus severe handoff, driven by
`rudeness_count`, never echoing the rude message.

Scope:
- A rudeness detector that sits ABOVE the catch-all and above confusion in the
  routing order (section 6), but BELOW safety (safety already wins at the top
  of `resolve()`).
- Steps by `rudeness_count`: 1 light boundary, 2 clear refusal, 3
  warning-and-limit, severe goes to the safety route.
- Reset/decay of `rudeness_count` per DECISION C (gap 1).
- No raw echo: the boundary copy never renders the input (section 7 "Never do
  this").

Depends on DECISION C (gap 1): does rudeness never reset, decay after a clean
run (recommended), or reset like confusion? And DECISION D (gap 3): confirm the
one-counter-per-turn precedence rule (safety, then rudeness, then confusion; a
turn touches exactly one counter and resets none of the others).

Assertions added (P3): `shut up` routes to the boundary and the response does
NOT contain the input (section 12 "Rudeness"); repeated rudeness climbs light,
refusal, warning; a severe/unsafe message routes to safety not the boundary;
the reset/decay behaviour matches DECISION C; the precedence rule holds when a
turn could look like both rudeness and confusion.

STOP 3: DECISIONS C and D answered; boundary and warning copy written by
Steve. Note this phase is adjacent to the parked safety workstream; the build
must NOT pull the parked character-manipulation set into scope without a
separate Steve go-ahead (gap 6).

---

## Phase 4. No-echo hardening across all channels (section 6, gap 5)

Goal: close the transfer-context and single-word echo channels so no
unsanitised input is ever rendered from a refusal, rude, unsafe or fallback
family.

Scope:
- Transfer context (`transfers.json` `contextCarried`, B08 "original question
  attached"): carry the CLASSIFIED intent and a sanitised summary, never the
  raw string, whenever the origin could be rude/unsafe.
- B13 single-word echo: keep it, but gate it explicitly to a single token that
  has passed the safety and rudeness gates; document the gate.

Assertions added (P4): a rude message that would otherwise transfer does not
carry its raw text into the receiving dog's line; B13 still echoes a benign
single word (existing assertion preserved) but a rude single word does not
reach B13's echo path.

STOP 4: Steve approves the sanitisation rule and any changed transfer copy.
This is the highest-risk phase (it is a safety hole), so it gets its own
review even though it is mostly plumbing.

---

## Phase 5. Fallback narrowing (section 9)

Goal: the three-stage narrowing fallback (ask fuller question, offer broad
categories, offer reset or transfer), replacing bare apology fallback.

Scope:
- Drive fallback stage from `same_intent_count` for the fallback family.
- Stage 1 "try as a full question", stage 2 the broad-category question
  ("game, a dog, the website, or something else"), stage 3 reset or transfer.
- Copy is Steve's (workbook).

Assertions added (P5): three consecutive unmatched messages yield clarify then
narrow-choices then reset/transfer (section 12 "Fallback loop").

STOP 5: Steve writes the three fallback stages; build wires the staging.

---

## Phase 6. Glossary and contextual definition (section 8)

Goal: dogs can explain their own words. A controlled glossary and a "what does
that mean?" route that uses `last_complex_terms` and `last_response_id`.

Scope:
- A glossary data record per term (plain def, child-friendly def, example,
  optional in-character wording). The starting content is the glossary
  delivered this session (`pick-a-chum-recovery-rules-GLOSSARY.md`), once Steve
  approves and moves it into the workbook.
- On each turn, store the complex terms used (tagged per response) into
  `last_complex_terms`.
- A definition route: "what is a verb?" answers directly; "what does that
  mean?" answers a term from the previous response via `last_complex_terms`.
- Any line whose terms have no glossary coverage is flagged for Steve to
  simplify before release (section 8).

Assertions added (P6): dog uses "verb", visitor asks "what is a verb?", gets
the child-friendly explanation (section 12 "Definition"); "what does that
mean?" explains a term from the previous response (section 12 "Contextual
definition"); every complex term tagged in copy has glossary coverage (a
data-integrity assertion, so undefinable words cannot ship).

STOP 6: Steve approves the glossary content (it is copy) and confirms the
tagging of complex terms in the workbook.

---

## Phase 7. Safety-during-recovery and the section 12 test table

Goal: prove the whole section 12 table, especially "Safety override: unsafe
message during any recovery state, safety answer fires before character
recovery copy."

Scope:
- No new safety detection (that is the parked workstream, out of scope). This
  phase only asserts that the EXISTING safety gate wins over every recovery
  state built in phases 2 to 6, because the recovery selector runs after the
  safety early-return.
- Wire the full section 12 battery as permanent assertions.

Assertions added (P7): the eight section-12 tests as permanent cases; plus a
safety-mid-confusion case (distress at confusion rung 3 still fires safety and
does not advance the ladder) and a safety-mid-rudeness case.

STOP 7: Steve confirms scope: this phase asserts safety wins for the CURRENT
safety set only, and does not claim coverage of the parked manipulation set
(gap 6). Ship note must say so.

---

## The ten workbook columns (section 11, Steve maintains these)

Reproduced verbatim from the doc so the workbook and the build agree. These
are Steve's to fill; the build reads Recovery Family, Exit Type, May Echo
Input, Complex Terms, Reset Condition and Max Repeats as routing inputs, and
treats the rest as review discipline.

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

## Decisions this runbook needs from Steve before any phase is built

Collected here so they are in one place (all restated from the READING doc):

- DECISION A (Phase 2, gap 2): the precise definition of a "meaningful
  message" that resets confusion. Recommended: routed to a substantive family,
  not to any recovery-sensitive family.
- DECISION B (Phase 2, gap 4): soft end or hard end after stage 4.
  Recommended: soft (re-engage on a genuinely meaningful message).
- DECISION C (Phase 3, gap 1): rudeness reset policy: never, decay
  (recommended), or reset-like-confusion.
- DECISION D (Phase 3, gap 3): confirm one-counter-per-turn precedence
  (safety, then rudeness, then confusion; a turn touches one counter, resets
  none of the others).
- DECISION E (Phases 3 and 7, gap 6): the character-manipulation set's home
  (into safety, or explicitly out of scope for this release). Until decided,
  no copy may claim "safety wins during recovery" in the general sense.
- DECISION F (Phase 4, gap 5): approve the transfer-context sanitisation rule
  (carry classified intent plus sanitised summary, never raw string).

---

## What I would do differently (NOT part of the phases above)

Clearly marked, per your instruction. These are my variations; approve or bin
them independently of the spec-faithful plan.

1. **Collapse the three counters conceptually into one "recovery pressure"
   idea, kept as three fields but read through one selector.** The doc treats
   same_intent, confusion and rudeness as parallel counters. In practice they
   are three inputs to one question: "which recovery method fires now?" I would
   build one recovery selector that owns all three, rather than three code
   paths that each poke a counter. Same seven fields, one decision point.
   Reason: it makes the precedence rule (gap 3) a single ordered function
   instead of an emergent property of three scattered checks, which is far
   easier to assert.

2. **Define "meaningful message" by the router's own output, not a new
   predicate.** Rather than write a fresh "is this meaningful" check (a second
   source of truth that will drift from the router), reuse the resolved family:
   meaningful means the resolution landed in a substantive layer. Zero new
   classification logic, and it stays pure.

3. **Make the graceful end soft, and reuse the Boxer cut-off exactly.** The doc
   is silent on soft/hard. I would reuse `closed` and the existing cut-off
   copy path rather than invent a new "ended" state, so there is one way a
   session winds down, one set of assertions, one mental model.

4. **Ship phases 2 and 3 behind the existing recorder before writing final
   copy.** Because no git hooks run and detection is deterministic, I would
   record real traffic through the dormant Phase 0 counters first (no visible
   change), replay it, and let the actual confusion/rudeness distribution tell
   us the right Max Repeats values, rather than defaulting to "two or three"
   blind. This is why Phase 0 threads the counters as read-only before Phase 2
   reads them.

5. **Treat the glossary as a build-time integrity gate, not just a runtime
   route.** Beyond answering "what does that mean?", I would add a
   build-chumdata check that fails if any copy line tags a complex term with no
   glossary entry. That turns section 8's "simplify before release" from a
   manual discipline into an enforced one. It also means a new undefinable word
   cannot slip into copy between reviews.

6. **Do not add a separate `last_action` field; derive it.** `resolution`
   already carries the action and any transfer/destination each turn. I would
   store the last resolution rather than a hand-maintained `last_action`, to
   avoid two fields that can disagree. Minor, but it keeps the state honest.
