# Pick a Chum: programme map (filing exercise)

Task 8. A filing map of the overlapping planning documents. NOT a decision point.
Nothing deleted. Built only from documents I can actually read; the three
PDF/Word planning docs are NOT in the repo and I did NOT open them, so their
contents are not guessed here, only their names and Steve's stated relationships.

## The four planning documents

| # | Document | Location | Can I read it? | Author / date |
|---|----------|----------|----------------|---------------|
| 1 | Supplementary Hybrid NLU Architecture Manual (`Pick-a-Chum-Supplementary-Hybrid-NLU-Architecture-Manual.pdf`) | outside repo (PDF) | NO | unknown (not opened) |
| 2 | Confidence-Scoring Mission and Roadmap (`Pick-a-Chum-Confidence-Scoring-Mission-and-Roadmap.docx`) | outside repo (Word) | NO | unknown (not opened) |
| 3 | Ambiguity Testing Mission, Risk and 800-Input Library (`Pick-a-Chum-Ambiguity-Testing-Mission-Risk-and-800-Input-Library.docx`) | outside repo (Word) | NO | unknown (not opened) |
| 4 | Master Intent Corpus Plan (`agent/master-intent-corpus-plan.md`) | in repo | YES | Steve James, 2026-07-25 |

Documents I could NOT see (named, contents not guessed): #1 Hybrid NLU
Architecture Manual, #2 Confidence-Scoring Mission and Roadmap, #3 Ambiguity
Testing Mission. Two more Pick-a-Chum planning files also exist outside the repo
and were not opened (`Pick-a-Chum-Phase-1-Readiness-Review-and-Roadmap.pdf`,
`pick-a-chum-confidence-scoring-brief.pdf`); flagging their existence only.

## Stated overlap (Steve's words, my basis for the retire recommendation)

Steve: "The hybrid NLU manual is a superset of the scoring roadmap and the
ambiguity roadmap." I cannot verify this myself (docs 1-3 unseen); I record it as
his stated relationship. On that basis:

- **#1 Hybrid NLU Architecture Manual** = the superset. Keep.
- **#2 Confidence-Scoring Mission and Roadmap** = subsumed by #1. Candidate to
  retire.
- **#3 Ambiguity Testing Mission** = subsumed by #1. Candidate to retire.
- **#4 Master Intent Corpus Plan** = genuinely unique: it is the taxonomy and
  the data (the 900-seed first-input library, 18 categories), not architecture or
  scoring. Keep.

## What is unique to #4 (the one I can read), so its work is not lost on a retire

The corpus plan's planned work (its section headings), which do NOT appear to be
duplicated by an architecture/scoring doc:

- The 900-seed first-input library (18 categories: ORI/SCP/BUY/PLY/NAV/FUN/CMD/
  PET/BRD/INT/EDU/JOK/FOD/DOG/TRN/EMO/BND/RND) as the permanent taxonomy.
- A required mapping table: library priority layer (0-10) -> engine check order,
  for Steve's sign-off (the engine is NOT renumbered).
- Category annotations: already-built vs new (PET/TRN/DOG) vs blocked (FUN, needs
  mini-games) vs safety (BND -> the safety layer).
- The links rule (resolved): no menu/goal links in normal replies; contextual
  links only when the response calls for it.
- The emoji policy (tiered): tier 1 curated single-emoji map, tier 2 strip
  unknowns, tier 3 combinations deferred.
- Processing order, Batches 1-5 (run all 900 seeds; widen built categories; new
  non-safety structures; the safety phase; FUN when mini-games ship).

## Recommendation (which two to retire)

Retire **#2 Confidence-Scoring Mission and Roadmap** and **#3 Ambiguity Testing
Mission**, on Steve's own statement that #1 (Hybrid NLU manual) is their superset.
Keep #1 (architecture/scoring, the master) and #4 (taxonomy/data). Retire =
supersede, not delete: nothing is deleted here, and I cannot delete files outside
the repo anyway. Steve confirms, since the retire rests on his stated overlap of
three documents I could not read.

## Related but SEPARATE workstream (not one of the four, filed for completeness)

The Conversation Recovery Rules programme lives in `agent/` and overlaps the
corpus plan's Batch 4 (safety), but is its own thing (recovery ladder + the
safety net shipped this week):
`pick-a-chum-recovery-rules-*` (READING, DECISIONS, BUILD-RUNBOOK, HARNESS-DRAFT,
GLOSSARY, SESSION-LOG), `pick-a-chum-safety-lists-PROPOSAL.md`,
`pick-a-chum-safety-net-HANDOVER.md`, plus this run's `pick-a-chum-common-word-
audit.md` and `pick-a-chum-ood-design.md`. These are implementation/planning for
the safety and recovery layers, not the NLU/scoring/ambiguity/corpus set.
