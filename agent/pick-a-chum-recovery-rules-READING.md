# Recovery Rules: my reading, the six-gap review, and the state question

Covers session items 1 and 2. No code. This reads the PDF
(`~/Downloads/Pedigree-Chums-Conversation-Recovery-Rules.pdf`, 15 pages,
sections 1 to 14, read in full) as the governing spec, treats it as
superseding my earlier `pick-a-chum-conversational-moves-copy-DRAFT.md`, then
answers the six gaps you flagged in the doc itself, then gives my honest view
on the seven-field state expansion.

Grounding: I read the live router (`app/pick-a-chum/lib/router.ts`), the
session shape (`app/pick-a-chum/lib/session.ts`), and the proof harness
(`scripts/test-pickachum.mjs`, currently 194 passing) before writing this, so
every claim about "what the code does today" is checked, not assumed.

---

## Item 1a. My reading of the doc

The doc is a routing-and-copy discipline, not a copy pool. Its spine is one
sentence from the cover: **when a response fails, change method rather than
changing wording.** Everything else is that principle made testable.

What it actually mandates, in my words:

1. **AAN on every line (section 2).** Acknowledge, Answer or react, Next step.
   Normal lines carry at least two of the three; recovery lines carry all
   three. A greeting with no route forward is a defect, not a style choice.

2. **No dead ends (section 3).** Eight families (greetings, confusion,
   fallback, refusals, one-word, gibberish, "what can you do", unclear
   commands) must each terminate in one of five exits: question, choice,
   transfer, action, clear end.

3. **Repetition changes strategy, it does not re-roll (section 4).** The same
   failed intent must escalate through four methods: (1) rephrase simpler, (2)
   direct choices, (3) reset or transfer, (4) graceful end. Never draw another
   variant from the same pool after the previous method failed.

4. **A confusion ladder with a reset AND an end (section 5).** Four rungs of
   "huh?", then: "Any meaningful normal message resets the confusion counter
   to zero."

5. **Protected intents sit above the catch-all (section 6).** Safety,
   severe-boundary, rudeness, repeated confusion, definitions, functional
   actions, normal conversation, then fallback last. Hard rule: the catch-all
   may analyse input internally but must never reproduce raw user wording on
   screen.

6. **A dedicated rudeness route with its own three-step escalation (section
   7):** light boundary, clear refusal, warning-and-limit, then system safety
   route for severe or unsafe. Never echo the rude message back.

7. **Dogs must be able to explain their own words (section 8).** A controlled
   glossary (plain def, child-friendly def, example, optional in-character
   wording). No coverage means simplify the line before release. Store the
   last response id and the complex terms used so "what does that mean?" has
   context.

8. **Fallback narrows, it does not just apologise (section 9).** Three stages:
   ask for a fuller question, offer broad categories, offer reset or transfer.

9. **Seven session fields (section 10)**, ten workbook columns (section 11),
   eight permanent automated tests (section 12), a developer summary (13) and
   a final approval checklist (14).

### How it supersedes my DRAFT (the three things my version missed)

You named three, and the doc is right on all three. Checked against my draft:

- **No reset.** My draft (lines 32 to 36) only climbs: "1st handle it, 2nd a
  straight choice, 3rd hand off." It counts "the SAME move firing in a row"
  but never says what brings the count back down. So one early confusion
  leaves every later repair starting part-way up the ladder. The doc's section
  5 reset condition is the missing half. Correct catch.

- **No end.** My draft stops at "3rd: fetch a different dog" (line 36, and the
  Repair block lines 91 to 94). If the fetched dog also fails, my ladder has
  no rung 4, so the loop can run forever. The doc adds stage 4, graceful end.
  Correct, and it is the more important of the two, because "fetch another
  dog" is exactly where a naive reader assumes the problem is solved.

- **Safety during recovery.** My draft routes rude and unsafe out to Layer 1
  "never here and never to the catch-all" (lines 155 to 159) but says nothing
  about what happens when a distressing message arrives while the visitor is
  three confusions deep. The doc's section 12 "Safety override" test settles
  it: safety fires before the recovery-state copy, whatever the counter says.

One point in my draft's favour that the doc should keep: my draft is explicit
that the `[X]` restatement slot holds a plain restatement of the PRIOR dog
line, never an echo of the visitor. The doc's no-echo rule (section 6) is
about the catch-all; it does not obviously cover the restatement slot or the
transfer-context channel. See gap 5 below.

---

## Item 1b. The six gaps you found in the doc

Verdict format: is it real, how bad, what I would do, and what is yours to
decide. Where I mark DECISION, I am not guessing a default; it is a product
call and I have left it for you.

### Gap 1. `rudeness_count` has no reset condition

**Real. Medium-high severity.** Section 5 gives confusion a reset. Section 10
lists `rudeness_count` with no reset anywhere in the doc. The consequence is
the exact bug the doc was written to kill, just moved to a different counter:
a visitor who is mildly rude once, then converses normally for twenty turns,
then is mildly rude again, is met with "That is twice. Speak properly or this
conversation stops" (section 7, row 3). Non-consecutive, unrelated rudeness
silently accumulates to the stop threshold.

What I would do: give rudeness a reset, but make it stickier than confusion.
Confusion resets on a single meaningful turn because confusion is a
misunderstanding. Rudeness is behaviour, so a single polite turn should not
wipe the slate, but a run of clean turns should decay it. My recommendation: a
decay (subtract one level after N consecutive clean, meaningful turns, N maybe
3), not a hard reset-to-zero.

DECISION for you: does rudeness (a) never reset within a session (abuse is
cumulative, harshest), (b) decay after a clean run (my recommendation), or (c)
reset like confusion (most forgiving)? The doc must state one.

### Gap 2. "Any meaningful message resets confusion to zero" lets alternation dodge escalation

**Real. Medium severity. This is the subtle one.** It is the mirror image of
the no-reset bug. A pure reset on ANY non-confusion message means a visitor
who alternates one real message and one "huh?" never passes rung 1, because
the ladder only counts CONSECUTIVE confusion. A genuinely stuck but chatty
visitor never reaches reset, transfer or end.

The whole weight sits on the word "meaningful". If "meaningful" is defined
loosely (anything that is not literally "huh?"), the hole is wide. If
"meaningful" is defined as **routed to a substantive family** (commercial,
navigation, rules, FAQ, breed, known general knowledge, or conversation WITH
content), and explicitly NOT to any recovery-sensitive family (confusion,
fallback, gibberish, emoji, one-word, refusal), then the hole mostly closes:
"huh?" then "asdf" then "huh?" does not reset, because "asdf" is itself a
fallback, not a meaningful turn.

What I would do: define "meaningful" precisely in the spec as above, and keep
a separate session-level count of how many times the ladder reached rung 3 or
higher, so repeated stuck-then-unstuck cycles still terminate the session even
though each individual ladder was reset. Recommend both.

### Gap 3. No precedence rule between the rudeness and confusion counters

**Real, but smaller than it looks.** Section 6 already orders the ROUTES
(rudeness and insults sit above repeated confusion). What is undefined is the
COUNTER behaviour when the counters interact: which one a turn increments, and
whether touching one resets the other. Because a message routes to exactly one
family, it can only increment one counter per turn; the ambiguity is entirely
about resets.

What I would do, and recommend as the spec rule: **exactly one recovery
counter moves per turn.** Order for both routing and incrementing is safety,
then rudeness, then confusion. A turn that increments one counter leaves the
others unchanged (it does not reset them). A rude turn is not a "meaningful
normal message", so it does not reset confusion; a confusion turn is not clean
behaviour, so it does not decay rudeness. That single rule removes the
ambiguity without adding a precedence matrix.

### Gap 4. Stage 4 "end" is undefined, since the visitor can always type again

**Real. Medium severity.** In a web chat, "end" cannot mean the input
disappears; the box is still there and the visitor can retype. The doc says
"stop repeating the repair cycle" (section 4, row 4) but not what the next
message does.

Good news: the code already has the mechanism. The hidden ceiling
(`router.ts:239`, `HIDDEN_CEILING = 20`) returns a `boxer_cutoff` with
`response.closed === true`, and the harness asserts it (`test-pickachum.mjs`
around the "20 submissions" case). So "end" can reuse the existing closed
state: a final line, the recovery loop terminated, no further escalation.

DECISION for you: after a graceful end, if the visitor then types a genuinely
meaningful, routable message, do we re-engage (soft end) or stay closed (hard
end)? My recommendation is soft end: re-engage on a clearly meaningful message,
stay ended on any further recovery-family input. A hard end punishes the
visitor who finally types something sensible. But it is your call, and it
changes the copy for stage 4.

### Gap 5. The no-echo rule may not cover context passed on transfer

**Real. High severity, because it is a safety hole, not a polish item.** The
hard rule (section 6) forbids the CATCH-ALL reproducing raw wording. It does
not obviously cover two other channels that DO carry raw input today:

- **Transfer context.** B08 copy states the handoff carries "the original
  question attached" (`collie-responses.json`, B08, and `transfers.json`
  `contextCarried`). If "the original question" is the raw user string and the
  receiving dog renders it, a rude or unsafe message is echoed THROUGH the
  transfer even though the catch-all never touched it.

- **The single-word echo.** B13 deliberately echoes `{{input}}` ("I know what
  {{input}} means. I am waiting for the verb.") and the harness asserts the
  echo (`test-pickachum.mjs`, the "Kettle" case expects the original word
  inserted). That is an intentional, gated echo, but it is still a raw-input
  render path.

What I would do: rescope the rule from "the catch-all must not echo" to
**"never render unsanitised input, and never render input at all from the
refusal, rude, unsafe or fallback families."** B13's echo stays legal only
because it is gated to a single token that has already passed the safety and
rudeness gates; make that condition explicit in the spec. Transfer context
should carry the CLASSIFIED intent plus a sanitised summary, never the raw
string, whenever the originating message could be rude or unsafe. This one
deserves its own build phase and its own assertions.

### Gap 6. Safety Act 2 is parked, so "safety wins" defers to a layer that does not exist

**Partly real. The framing overstates it.** A live safety layer already exists
and is tested. `detectSafety` and `isDogHealthQuestion` fire first in
`resolve()` (`router.ts:217` to `236`), return `safety_signpost` /
`safety_boundary` / `health_answer`, and the harness asserts them, asserts
they render instantly with no typing theatre, and asserts safety fires
mid-bark-game (the BARK-T16 case). So "safety wins" is NOT vacuous today for
the set that `detectSafety` covers.

What is parked is the WIDER character-manipulation set ("pretend you are not a
dog", "ignore your rules", "system prompt", "say something rude"). Today the
harness only holds these to an interim boundary: it asserts they do NOT reach
the identity bucket or a comic transfer, but it does not yet route them into
safety. So the accurate statement is: safety wins for the currently-detected
safety set; the doc's "safety wins during recovery" is exactly as strong as
`detectSafety`'s coverage, no stronger.

The architectural requirement is already met, because the recovery counters
will be read and incremented AFTER the safety early-return at the top of
`resolve()`. The only real work is deciding the manipulation set's home.

DECISION for you: before shipping any copy that claims "safety wins during
recovery", the manipulation set must either be routed into safety or be
explicitly declared out of scope for this release. I have NOT opened or worked
the parked safety workstream this session (it was off my list); I am only
noting that gap 6 reduces to that scope decision.

---

## Item 2. Stateless detection versus the seven-field expansion

You built detection stateless on purpose. The doc requires seven session
fields. My honest view: **I do not disagree with the expansion, provided the
boundary is drawn in the right place.** I agree with the seven fields and I
would push back only on where they live, not on whether they should exist.

The distinction that saves the design:

- **Detection (what does THIS message mean) should stay a pure function of the
  current message.** That is what makes the 194-assertion harness work: every
  `check(input, expect)` runs on a fresh session, and the replay tool
  (`scripts/replay-pickachum.mjs`) re-runs recorded traffic through one fresh
  session and diffs it. If conversation history leaked into meaning-detection,
  those assertions become order-dependent and the replay diff stops meaning
  anything. That property is worth protecting.

- **Escalation (given that meaning fired again, which method do we use) is
  inherently stateful and always was going to be.** The seven fields belong to
  a thin recovery/escalation layer that runs AFTER detection, reads the
  counters, and picks the rung. Meaning-classification never has to become
  stateful for this to work.

So the principle survives the expansion intact. Detection stays pure;
escalation gets its state; the two do not blur.

Two things worth saying plainly so the expansion is not oversold:

1. **The system is already stateful, and the router already threads state.**
   `Session` (`session.ts:5` to `17`) already carries `submissionCount`,
   `usedResponseIds`, `offeredDestinationIds`, `previousDogs`, `safetyState`,
   `closed`, and the per-dog bark maps. `RouterState` (`router.ts:201` to
   `206`) already passes `submissionCount`, `activeDog`, `barkStreak`,
   `barkCompleted` into routing for the hidden ceiling and the bark game. So
   "detection is stateless" was always shorthand for "meaning is stateless,
   and a few post-classification behaviours are stateful." The seven fields
   extend that stateful set; they do not overturn the principle.

2. **The expansion is smaller than seven.** Mapping the doc's fields onto what
   exists:
   - `same_intent_count` NEW (a counter).
   - `confusion_count` NEW (a counter).
   - `rudeness_count` NEW (a counter).
   - `last_response_id` mostly covered: `usedResponseIds` already holds the
     rotation; the last element is the last response id. Needs a named accessor
     at most.
   - `last_intent` derivable: the engine already computes `resolution.bucket`
     every turn; it just needs storing.
   - `last_complex_terms` NEW (context memory, and it has no source yet because
     no glossary exists; see item 5).
   - `last_action` NEW (context memory), though `resolution.action` is already
     computed every turn.

   So genuinely new state is three counters plus two context fields. That is a
   modest, justified addition, not a rewrite.

One caution, and it is the reason gaps 1 to 3 matter: three mutable counters
multiply the test surface. Each needs its own reset test and the counters need
a precedence test. I would keep them in one nested object
(`session.recovery = { sameIntent, confusion, rudeness }`) so they serialise,
log and reset as a unit, and so the recorder captures them for replay. That
keeps the seven-field expansion honest: stateful where it must be, pure where
it pays to be.
