# Pick a Chum: Conversation Recovery Rules session log

Session date: 2026-07-26 (Steve away several hours, autonomous run).
Branch: pick-a-chum. Never main. No merges, no production, no installs.

This is the single hand-back document. It is written first and updated as
work proceeds, so it survives interruption.

SPEC STATUS: READABLE. The PDF at
~/Downloads/Pedigree-Chums-Conversation-Recovery-Rules.pdf read cleanly in
full (15 pages, sections 1-14). Items 1-6 all proceed.

---

## Progress tracker

- [x] Item 1: Reading of the doc + view on the six gaps Steve flagged (no code)
      -> agent/pick-a-chum-recovery-rules-READING.md
- [x] Item 2: Stateless-detection vs seven-field state expansion (my honest view)
      -> same file, "Item 2" section
- [x] Item 3: Build runbook as a review document (phased, STOPs, assertions, 10 workbook cols)
      -> agent/pick-a-chum-recovery-rules-BUILD-RUNBOOK.md
- [x] Item 4: Draft harness assertions per phase (written only, not added)
      -> agent/pick-a-chum-recovery-rules-HARNESS-DRAFT.md
- [x] Item 5: Glossary from section 8 (plain + child-friendly + example, flag phrases)
      -> agent/pick-a-chum-recovery-rules-GLOSSARY.md
- [x] Item 6: Do any git hooks exist in this repo? (answered below)

Harness baseline (read-only run of `npm run test:pickachum`, no edits):
**194 passed, 0 failed, 194 total.** The floor of 190 is a passing-assertion
count, not a literal line in the code: `scripts/test-pickachum.mjs` simply
counts pass/fail and exits nonzero on any fail. There is no `190` constant to
protect. "The floor is 190" therefore means: do not remove assertions (current
headroom is 4). Item 4's drafts only ADD assertions, so the floor is safe.

---

## Item 6 (answered first, it was a one-command check)

NO. There are no active git hooks in this repo.
- `.git/hooks/` contains only the stock `*.sample` files (none active).
- `core.hooksPath` is not set.
- No `.husky/`, no `lefthook.yml`, no `.pre-commit-config.yaml`.
- `package.json` has no husky/lefthook/lint-staged/pre-commit wiring.

So `--no-verify` was never actually bypassing a hook in THIS repo. Whatever
made `--no-verify` matter was not a repo-local git hook. (Noted for Steve:
if it mattered, it was likely a global `core.hooksPath` on another machine, a
CI check, or an editor integration, none of which live in this tree.)

---

## Deliverables produced (all review documents, no code, no execution)

1. agent/pick-a-chum-recovery-rules-READING.md   (items 1 and 2)
2. agent/pick-a-chum-recovery-rules-BUILD-RUNBOOK.md   (item 3; REVISED against DECISIONS)
3. agent/pick-a-chum-recovery-rules-HARNESS-DRAFT.md   (item 4)
4. agent/pick-a-chum-recovery-rules-GLOSSARY.md   (item 5)
5. agent/pick-a-chum-recovery-rules-SESSION-LOG.md   (this hand-back)
6. agent/pick-a-chum-recovery-rules-DECISIONS.md   (Steve's settled rulings A-F + additions)

Verification note: I ran `npm run test:pickachum` ONCE, read-only, to confirm
the 194/0 baseline. I did not edit the harness or any code. `tsc` was not run
because nothing in this session touches TypeScript source (all outputs are
markdown review docs).

---

## Commits this session (SHAs filled after commit)

- faaa01410ba97efe62907d9e33480ede40efbba0: pick-a-chum: Recovery Rules review
  docs (reading, runbook, harness draft, glossary, log). Docs only, no code.
  5 files, 1198 insertions, 0 deletions.
- d44373e3d0835e66a05de2e3e8605d8f5c7236a6: pick-a-chum: record commit SHA in
  the session log (this line).

PUSH STATUS: PUSHED. Steve ran `git push origin pick-a-chum` himself (my Bash
tool was permission-gated for pushes and denied it; I did not retry verbatim or
force anything). origin/pick-a-chum is now at 8c08a86, with all three commits
published (faaa014, d44373e, 8c08a86). Nothing went to main, nothing merged.
This log line is updated by one further commit on top of 8c08a86.

---

## Decisions: NOW SETTLED (2026-07-26, see the DECISIONS doc)

DECISIONS A to F are closed (A and D AMENDED in a second pass, same day). Steve
ruled on all six, plus three additions, a schedule change and a spec amendment.
Full text and an amendments log in
`agent/pick-a-chum-recovery-rules-DECISIONS.md`. Summary (post-amendment):

- A [amended]: "meaningful" = substantive family, not recovery-sensitive.
  Confusion DECAYS BY ONE on a meaningful turn (not reset to zero). The
  never-reset rung-3+ tally is DELETED; the hidden ceiling (20 submissions) is
  the session terminator, so no second terminator is needed.
- B: soft end (re-engage on a meaningful message). Simplified by the tally
  deletion; unchanged in substance.
- C: rudeness DECAYS one level per 5 clean meaningful turns (five, for the
  nine-year-old audience), tracked by a `cleanStreak` field.
- D [reworded]: at MOST one counter ESCALATES per turn; order safety, rudeness,
  confusion. Decay is bookkeeping and MAY co-occur (fixes the old contradiction
  with C, where a meaningful turn must decay confusion and advance cleanStreak
  at once). Consequence kept: confusion-stuck never decays rudeness.
- E: manipulation set OUT OF SCOPE; copy may not claim "safety wins during
  recovery" generally; on the section-14 release checklist.
- F: approved; never render input from refusal/rude/unsafe/fallback families;
  transfer carries classified intent plus sanitised summary, never raw string.
- Additions: (1) section 7 level-3 "stops" gets the soft-end mechanism; (2)
  standing exemption to REWRITE (not remove) the one Kettle harness assertion,
  in its own commit with before/after; (3) split `closed` into two reasons
  (ceiling vs recovery), distinct copy.
- Schedule change: Phase 6A (glossary content) starts at t0 in parallel with
  Phase 0. It is the critical path (Steve's copy review), must not wait in
  sixth position; 6B stays gated behind it.
- Notes: (1) Phase 1 AAN is a workbook review gate on column 1, not a fragile
  harness text assertion; (2) Phase 0 adds a floor RATCHET to test-pickachum.mjs
  so a dropped assertion fails instead of silently passing.
- Spec amendment: the `[X]` restatement slot restates the prior DOG line, never
  the visitor's words.

The BUILD-RUNBOOK has been revised twice against all of the above (second pass:
Phases 0, 1, 2, 3 changed, 6A rescheduled to t0, Phase 7 tally reference
removed). The HARNESS-DRAFT is now SYNCED to the amended decisions (decay not
reset, no tally, cleanStreak decay at 5, escalation-only precedence, P1 as a
review gate, Phase 0 floor ratchet), so all five documents agree. Still open and
Steve's to provide: the actual COPY at each
phase STOP, and glossary approval at STOP 6A (the critical path). Glossary
judgement calls still flagged at the foot
of the glossary (Hot Dog Mode's real answer, the "Herdability" joke entry, the
Childline row staying in lockstep with approved safety wording).

---

## Could not do without Steve

- Nothing was blocked outright; all six items completed as review documents.
- The build itself (any of the runbook phases) is deliberately NOT started: it
  needs DECISIONS A to F, and every phase needs copy that only Steve writes.
- Confirming whether a `guard-repair` branch exists locally: left unchecked on
  purpose. Steve asked twice for a plain-text answer with no commands; I do not
  have the local branch list in context and did not run `git branch`. I have
  not created or touched any such branch. Say the word for a read-only check.

---

## Guardrails honoured this session (self-audit)

- Branch: pick-a-chum only. No merge, no main, no production, no auto-merge.
- No installs, no package.json edits, no dependency changes.
- Harness untouched: 194/0 baseline confirmed read-only; floor of 190 safe.
  Item 4 drafts only ADD assertions and live in a doc, not the suite.
- Typing theatre: not touched, no copy inside it altered.
- Mini pit / guard-brief workstream: not opened, not searched, not worked.
  SAFETY_BACKLOG.md left uncommitted and unstashed as found.
- Temp/probe files: only in the session scratchpad, never in scripts/ or repo.
- One sub-agent spawned (Explore, read-only by type) for the codebase map.
- No em dashes in any deliverable.
