# Recovery Rules: settled decisions (Steve's rulings)

Authoritative record. These are Steve's decisions, not my recommendations.
Where the earlier READING and RUNBOOK docs left DECISION A to F open, this
document closes them. It also captures three additions Steve raised, one
sequencing change, and one spec amendment. The BUILD-RUNBOOK has been revised
against everything here. No build has started.

Settled: 2026-07-26. Supersedes the "Decisions this runbook needs from Steve"
section of the earlier runbook draft.

---

## DECISION A. Meaningful message (resets confusion)

"Meaningful" = routed to a **substantive family**: commercial, navigation,
rules, FAQ, breed, known general knowledge, or conversation with content. It is
explicitly NOT any recovery-sensitive family (confusion, fallback, gibberish,
emoji, one-word, refusal).

Additional rule: add a **session-level count of the confusion ladder reaching
rung 3 or higher**. That counter **deliberately never resets**. It must be
stated in the spec as intentional so it does not read as an oversight. Its
purpose is to terminate a visitor who repeatedly gets stuck, then unstuck, then
stuck again: each individual ladder may reset per the rule above, but the
never-resetting rung-3+ tally still drives the session to a graceful end so
stuck-unstuck cycles cannot run forever.

## DECISION B. After the stage 4 end

**Soft end.** Re-engage on a clearly meaningful message (DECISION A's
definition of meaningful). Stay ended on any further recovery-family input.

## DECISION C. Rudeness reset

**Decay, not hard reset.** Subtract one rudeness level after **5** consecutive
clean meaningful turns. Five, not three: the audience includes nine-year-olds,
and boundary-testing is play rather than abuse at that age. The higher
threshold keeps a child's testing from decaying away too fast to matter, while
still preventing one early rude turn from poisoning the whole session.

## DECISION D. Counter precedence

**Exactly one recovery counter moves per turn.** Order for routing and
incrementing is safety, then rudeness, then confusion. A turn that increments
one counter leaves the others unchanged and resets none of them.

Stated consequence (intended, not emergent): a visitor stuck in confusion never
decays their rudeness count, because decay requires meaningful turns and a
confusion turn is not meaningful. This is deliberate.

## DECISION E. Character-manipulation set

**Out of scope for this release.** Routing it into safety is Act 2 work and
stays parked. The price is a copy constraint that must be written into the
spec: **no line may claim "safety wins during recovery" in the general sense.**
Permitted wording is scoped to what `detectSafety` actually covers. This goes
on the release checklist (the doc's section 14).

## DECISION F. Transfer sanitisation

**Approved as rescoped.** Never render unsanitised input, and never render
input at all from the refusal, rude, unsafe or fallback families. Transfer
context carries the classified intent plus a sanitised summary, never the raw
string.

---

## Additions Steve raised (not in the original gap list)

### Addition 1. Section 7 level 3 "this conversation stops" cannot stop a web chat

Section 7's level-3 rudeness response says "this conversation stops". On a web
chat it cannot literally stop: the box is still there. This is gap 4 again, in
the rudeness family instead of the confusion family, and it was not in the
decision list. Same treatment: **soft end, same mechanism** as the confusion
stage-4 end (DECISION B).

### Addition 2. The gap 5 fix collides with the harness (standing exemption)

The no-echo hardening (DECISION F) collides with an existing assertion. The
"Kettle" case asserts the B13 single-word echo, so sanitising raw input means
that one assertion changes.

**Standing exemption:** that one assertion **may be rewritten, not removed.**
The change must be called out in **its own commit**, with the before and after
shown. Every other existing assertion remains untouchable, and the 190 floor
still holds (a rewrite does not lower the count).

### Addition 3. Split the `closed` flag into two reasons

Reusing the existing `closed` flag conflates two different ends: hitting the
20-submission ceiling (the Boxer cut-off) and recovery giving up. **Split them
into two reasons behind one closed state** so the logs can tell them apart.
**Different copy for each.**

This overrides my earlier "reuse the Boxer cut-off exactly" suggestion (the old
runbook's "What I would do differently" item 3). One closed STATE, two closed
REASONS.

---

## Sequencing change

`last_complex_terms` has no source until the glossary exists. The glossary is
therefore a **dependency** of the contextual-definition phase, not parallel to
it. The runbook is reordered so **glossary approval blocks** that phase.

Flagged clearly, per Steve: **the critical path is Steve's copy review, not the
build.** The build cannot outrun the glossary, and the glossary is copy Steve
owns.

---

## Spec amendment

Fold in the one thing the DRAFT had that the doc lacked: **the `[X]`
restatement slot holds a restatement of the prior DOG line, never the visitor's
words.** This makes the rephrase rung (confusion rung 1) safe by construction
and aligns it with the no-echo invariant (DECISION F).

---

## Net effect on the open-decisions list

DECISIONS A to F in the earlier runbook are now CLOSED. The runbook's
"Decisions this runbook needs from Steve" section is replaced by a pointer to
this document. The HARNESS-DRAFT's DECISION-GATED assertions now resolve to a
single expected branch each (A: substantive-family reset; C: decay after 5),
and should be finalised to that branch when they are eventually added.
