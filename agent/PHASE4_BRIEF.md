# Phase 4 planning material (mini-games)

Steve's three mini-game developer briefs, delivered early like the voice decks.
Planning material only. Nothing here is built or wired.

## Status: PARKED

Nothing in Phase 4 is built before the safety phase (Batch 4) ships. These are
developer briefs for estimation and planning, not a build instruction.

- `agent/pedigree-chums-boxer-game-developer-brief.docx`
- `agent/pedigree-chums-labrador-treat-trail-developer-brief.docx`
- `agent/pedigree-chums-border-terrier-missing-biscuit-developer-brief.docx`

## Notes to carry into the Phase 4 planning session

1. **Choice-button UI is gone.** The briefs assume a choice-button UI that was
   removed during the style rounds (the "no menu chips / links only at the end"
   decisions). Game choices are therefore a **new, game-scoped component** to
   design and estimate in Phase 4, not a reuse of an existing control. It must
   not reintroduce the standard-chatbot suggestion-chip look into normal
   conversation; it is scoped to an active game only.

2. **Boxer effects: suppression and the wrong-transfer effect.**
   - Boxer disruption effects must be **suppressed during commerce moments** as
     well: while the offer modal is open and while any form is mid-fill. This is
     in addition to the existing rule that safety responses get no theatre.
   - The **wrong-transfer effect is visual only** (a comic "sent you to the
     wrong dog" beat). It must **never mutate real session state** (no actual
     `activeDog` change, no real transfer, no routing side effect). It is a
     presentation gag over unchanged state.

3. **Analytics events share one spec.** Each brief's analytics events join the
   **same event spec as the safety-phase analytics work** (the no-PII event
   pipeline from SAFETY_BACKLOG section 3). Do not invent a separate Phase 4
   analytics scheme; the game events are rows in the one spec.

## Launch order

Phase 4's launch order (which game ships first, and in what sequence with the
tease copy already parked in the FUN bucket) is decided at its own planning
session, not here.
