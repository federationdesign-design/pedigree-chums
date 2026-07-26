# Recovery Rules: settled decisions (Steve's rulings)

Authoritative record. These are Steve's decisions, not my recommendations.
Where the earlier READING and RUNBOOK docs left DECISION A to F open, this
document closes them. It also captures three additions Steve raised, one
sequencing change, and one spec amendment. The BUILD-RUNBOOK has been revised
against everything here. No build has started.

First settled: 2026-07-26. Amended same day (second pass); see the amendments
log immediately below.

---

## Amendments log (second pass, 2026-07-26)

Four fixes to the first-pass rulings, one schedule change, two smaller notes.
The decision bodies below already incorporate these; this log records what
changed and why so the history is visible.

- **Amendment 1 (DECISION A):** confusion now DECAYS BY ONE on a meaningful
  turn, not reset to zero. The never-resetting rung-3+ tally
  (`confusionRung3PlusTotal`) and its threshold are DELETED. The hidden ceiling
  (20 submissions) is the session terminator, so no second terminator is
  needed and the spec names it as such.
- **Amendment 2 (DECISION D):** reworded from "exactly one counter moves per
  turn" to "at most one counter ESCALATES per turn; decay is bookkeeping and
  may co-occur", because the old wording contradicted DECISION C.
- **Amendment 3 (state shape):** `session.recovery` gains a `cleanStreak`
  field to make DECISION C's "decays after 5 clean turns" testable.
- **Amendment 4 (soft end):** with the tally gone, the soft end is simply soft;
  DECISION B stands unchanged.
- **Schedule change:** the glossary content phase starts at t0 in parallel
  with Phase 0. It is the critical path and must not wait in sixth position. In
  the runbook it is physically relocated to sit immediately after Phase 0 and
  renumbered from Phase 6A to **Phase 0B**, so its number and its position
  agree.
- **Note 1:** Phase 1 AAN compliance is enforced as a workbook review gate
  (column 1, Next Step Required), not a fragile harness text assertion.
- **Note 2:** add a Phase 0 item that makes `test-pickachum.mjs` fail when the
  passing total drops below a stored value (a ratchet), so the 190 floor is
  actually enforced.

---

## DECISION A. Meaningful message (decays confusion) [AMENDED]

"Meaningful" = routed to a substantive family: commercial, navigation, rules,
FAQ, breed, known general knowledge, or conversation with content. It is
explicitly NOT any recovery-sensitive family (confusion, fallback, gibberish,
emoji, one-word, refusal). This definition is unchanged.

Confusion **DECAYS BY ONE** on a meaningful turn. It does NOT reset to zero.
Reason: reset-to-zero means three confusions plus one good message drops the
visitor all the way back to rephrase. Decay holds the ladder's position while
still rewarding progress.

**No second session terminator.** The earlier never-resetting rung-3+ tally
(`confusionRung3PlusTotal`) and its threshold are DELETED. They guarded against
stuck-unstuck cycles running forever, which cannot happen: the hidden ceiling
already ends every session at 20 submissions (`HIDDEN_CEILING` in `router.ts`,
the Boxer cut-off). The spec names the hidden ceiling as the session
terminator, so it is clear why no second terminator exists.

## DECISION B. After the stage 4 end [unchanged; simplified by Amendment 4]

**Soft end.** Re-engage on a clearly meaningful message (DECISION A's
definition of meaningful). Stay ended on any further recovery-family input.
With the tally deleted there is no one-turn re-engagement edge case to reason
about; the soft end is simply soft.

## DECISION C. Rudeness reset [unchanged]

**Decay, not hard reset.** Subtract one rudeness level after **5** consecutive
clean meaningful turns. Five, not three: the audience includes nine-year-olds,
and boundary-testing is play rather than abuse at that age. The higher
threshold keeps a child's testing from decaying away too fast to matter, while
still preventing one early rude turn from poisoning the whole session.

The clean-turn run is tracked by `cleanStreak` (Amendment 3): it counts
consecutive clean meaningful turns, drives the decay at 5, and resets to zero on
any non-meaningful turn.

## DECISION D. Counter precedence [REWORDED]

**At most one counter ESCALATES per turn.** Order for routing and escalation is
safety, then rudeness, then confusion. **Decay is bookkeeping, not escalation,
and may occur on the same turn as another counter's movement.**

Reason for the rewording: the old "exactly one recovery counter moves per turn"
contradicted DECISION C. A meaningful turn has to decay confusion AND advance
the rudeness clean-streak at the same time. Escalation is the thing that needs
the one-per-turn rule; decay does not.

Stated consequence (unchanged, intended not emergent): a visitor stuck in
confusion never decays their rudeness count, because decay requires meaningful
turns and a confusion turn is not meaningful.

## DECISION E. Character-manipulation set [unchanged]

**Out of scope for this release.** Routing it into safety is Act 2 work and
stays parked. The price is a copy constraint that must be written into the
spec: **no line may claim "safety wins during recovery" in the general sense.**
Permitted wording is scoped to what `detectSafety` actually covers. This goes
on the release checklist (the doc's section 14).

## DECISION F. Transfer sanitisation [unchanged]

**Approved as rescoped.** Never render unsanitised input, and never render
input at all from the refusal, rude, unsafe or fallback families. Transfer
context carries the classified intent plus a sanitised summary, never the raw
string.

---

## Additions Steve raised (not in the original gap list)

### Addition 1. Section 7 level 3 "this conversation stops" cannot stop a web chat

Section 7's level-3 rudeness response says "this conversation stops". On a web
chat it cannot literally stop: the box is still there. This is gap 4 again, in
the rudeness family instead of the confusion family. Same treatment: **soft
end, same mechanism** as the confusion stage-4 end (DECISION B).

### Addition 2. The gap 5 fix collides with the harness (standing exemption)

The no-echo hardening (DECISION F) collides with an existing assertion. The
"Kettle" case asserts the B13 single-word echo, so sanitising raw input means
that one assertion changes.

**Standing exemption:** that one assertion **may be rewritten, not removed.**
The change must be called out in **its own commit**, with the before and after
shown. Every other existing assertion remains untouchable, and the floor still
holds (a rewrite does not lower the count).

### Addition 3. Split the `closed` flag into two reasons

Reusing the existing `closed` flag conflates two different ends: hitting the
20-submission ceiling (the Boxer cut-off) and recovery giving up. **Split them
into two reasons behind one closed state** so the logs can tell them apart.
**Different copy for each.** One closed STATE, two closed REASONS.

Note: the ceiling is now also named as the session terminator (DECISION A), so
`closedReason = 'ceiling'` is doing double duty: it both ends the session at 20
and is the backstop that makes the deleted rung-3+ tally unnecessary.

---

## Sequencing (now a schedule change)

`last_complex_terms` has no source until the glossary exists, so the glossary
is a dependency of the contextual-definition phase (6B), not parallel to it.
6B stays gated behind glossary approval.

But the glossary CONTENT phase (Phase 0B, formerly 6A) depends on nothing: it
is pure copy and the draft already exists
(`pick-a-chum-recovery-rules-GLOSSARY.md`). So it **starts at t0, in parallel
with Phase 0**, and must not sit idle in sixth position. In the runbook it is
relocated to sit immediately after Phase 0 and renumbered 0B. It is the
programme's **critical path**, and the critical path is Steve's copy review, not
the build.

---

## Spec amendment

Fold in the one thing the DRAFT had that the doc lacked: **the `[X]`
restatement slot holds a restatement of the prior DOG line, never the visitor's
words.** This makes the rephrase rung (confusion rung 1) safe by construction
and aligns it with the no-echo invariant (DECISION F).

---

## Net effect on the open-decisions list

DECISIONS A to F are CLOSED (A and D amended, second pass). The runbook's
"Decisions this runbook needs from Steve" section is replaced by a pointer to
this document. Nothing in the build is waiting on a Steve decision; it waits on
Steve's COPY at each phase STOP, and on glossary approval at STOP 0B (the
critical path, now running from t0).

The HARNESS-DRAFT still shows the first-pass assertions (reset-to-zero, the
rung-3+ tally, the fragile Phase 1 text marker, one-counter-per-turn). Those
are now superseded by this second pass and need a follow-up sync; that sync was
not in the scope of this revision (which covered DECISIONS.md and the
BUILD-RUNBOOK only) and is flagged for a later pass.
