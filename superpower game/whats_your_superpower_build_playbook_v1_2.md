# What's Your Superpower?

## Build Playbook, version 1.2

Pedigree Chums product and developer brief. Prepared 28 July 2026.

Companion to `whats_your_superpower_mvp_specification_v4_3`. The specification says what to build. This says in what order, on what evidence, and where the rework risk sits.

**What changed since version 1.1**

The thirty result names are final and approved as name set final-1.0. The simulation has been rerun against them, so the golden results file and the canonical hash are now real rather than provisional.

**Change freeze**

How the game works is frozen. The scoring, ranking, supporting-power rule, the six result states, the title hierarchy, the three layouts and the chart emphasis rules are settled and closed to further change. Any proposal to alter them from this point is a new configuration version and reruns every gate in section 3. Copy corrections that do not move a name between title sets are not covered by the freeze and are handled as ordinary content edits.

---

## 1 Evidence

The engine was implemented against the specification, the configuration was generated from the workbook exactly as instructed, and every mechanically checkable acceptance criterion was run across all 32,768 possible playthroughs. This is a dry run of the build, not a review of the documents.

**Fifteen of fifteen mechanical checks pass.**

Fifteen questions load from configuration. Six primary and six secondary opportunities per power. Four distinct powers in every question. Raw range of 0 to 18 for all five. Every array totals 45. All 32,768 arrays complete without error. Raw scores determine rank, with zero arrays where the plot conversion would reorder. The supporting phrase changes correctly at a gap of four. No deficit or medical wording. No visible number in rendered output. Uniform leading-power share between 18.98 and 21.54 per cent. Every tie path deterministic. Supporting field suppressed for three or more leaders. No empty placeholder ever rendered. Exactly three layouts required.

**The result contract verifies clean against the final names.**

All six result states reproduce their locked counts exactly. All twenty directional titles and all ten level titles are reachable, so no title is dead content. Thirty-one distinct titles are in play across the four sets, and the game produces 85 distinct result strings.

**The name set is final.**

Thirty titles and thirty lines, all two to three words for titles and ten to fourteen for lines, no banned vocabulary, and no title sharing a word with the main-power title rendered beneath it. Fourteen names changed from the first pass: ten directional and four level. The reasons are recorded beside each row in the Result Copy replacement file.

Two conventions are locked with the names. Steady marks the supporting power Focus in all four directional titles where Focus supports, and appears nowhere else. The Vision and Zoom family shares the word trail across all three of its names, which is accepted because trail is the brand world and the three names remain distinct.

**The whole result space is 85 strings.**

| Layout | Distinct strings |
|---|---|
| Single leader, close behind | 20 |
| Single leader, clear | 19 |
| Two joint leaders | 30 |
| Three or more joint leaders | 16 |
| Total | 85 |

Small enough for a person to read every possible output before launch, which is a rare position to be in. The full list is `whats_your_superpower_golden_results_v4_1.csv`.

One detail for the copy review: Focus leading with Energy supporting is the only directional pair that never reaches a gap of four or more, so its title, Turbo Tracker, only ever appears with "close behind". Nineteen of twenty pairs appear in both variants.

**The distribution is concentrated.**

| Rank | Share | Result |
|---|---|---|
| 1 | 7.29% | Clue Keeper. Leading Zoom, with Focus close behind. |
| 2 | 6.79% | Precision Hound. Leading Focus, with Zoom close behind. |
| 3 | 6.70% | Idea Rocket. Leading Ideas, with Energy close behind. |
| 4 | 6.21% | Route Master. Leading Vision, with Focus close behind. |
| 5 | 5.80% | Adventure Spark. Leading Energy, with Ideas close behind. |

The top five account for 32.8 per cent of playthroughs and the top ten for 51.1 per cent.

Every one of the top five pairs a leading power with the power it is correlated to. This is risk R27 expressed in the language a player actually sees, and it is the clearest available argument for the Phase 3 calibration, because a product owner can read it directly where a correlation matrix needs interpreting.

**One finding about the test plan itself**

The criterion "no visible number, percentage or named level appears" fails if it is run against copy templates, because the templates contain `[POWER_1]` and similar. It must run against rendered output after substitution. This is now written into T38.

---

## 2 Rework analysis

Two things can still change the configuration, and each invalidates a different amount of work.

**Volatile input 1: the question set.** The legal opinion on M01, M02 and M03 could force replacements. Phase 3 calibration is designed to change scoring assignments.

*Invalidates:* question content, the scoring map, every structural test result, construct-fit ratings, the canonical hash, the 85-string output set, and any adult testing already completed on a changed item.

*Does not invalidate:* the engine, the configuration loader, the test harness, the question-loop interface, privacy architecture, accessibility work, the chart shell, or the result contract itself.

**Volatile input 2: nothing else.** The five result-screen gaps that carried rework risk in version 1.0 of this playbook are closed.

**What is settled and will not move**

The scoring arithmetic of two points primary and one secondary, derived from the stored answer array. Ranking on raw scores with the plot conversion held internal. The supporting-power rule and its tie-breaks. The six result states and their predicates. The title hierarchy and its four sets. The three layouts and their block contents. Set-based chart emphasis. The privacy architecture. The accessibility baseline. The four analytics events. The principle that all content is configuration rather than code.

**The conclusion**

The entire build can now proceed. The only remaining exposure is to a change in the question set, and that affects content and test records rather than code. Provided nothing is hard-coded, an adverse legal opinion or a Phase 3 calibration change costs a configuration regeneration and a test rerun, not a rewrite.

---

## 3 Build stages

Each stage has an entry and an exit condition.

**Stage 0. Correct the workbook.**

Three edits to the Result Copy sheet, all in one sitting:

1. Delete the superseded gap-zero implementation rule.
2. Replace the sheet's result table with the section 8 result-state table.
3. Paste the two name blocks from `whats_your_superpower_result_copy_final.xlsx` over the Combination copy and Joint titles blocks. Columns A and B must not change, because the generator reads them to link name to result.

Enter now. Exit when the generator runs clean and the implementation reproduces the canonical hash.

This is the only remaining blocker on Stage 1, and it is workbook editing rather than a decision.

**Stage 1. Configuration and engine.**

Configuration generator, scoring engine, ranking, supporting-power resolution, result-state classification, title selection, block selection and emphasis sets. No interface.

Enter after Stage 0. Exit when the implementation reproduces the canonical hash for all 32,768 arrays.

**Stage 2. Question loop and platform baseline.**

Entry screen, question loop, Back, restart, keyboard navigation, focus states, reduced motion, 320 pixel width, the boundary statement in both positions, privacy architecture and the four analytics events.

Enter in parallel with Stage 1. Nothing here depends on the result contract.

Exit when the privacy and accessibility acceptance criteria pass.

**Stage 3. Chart.**

Axes, labels, fixed scale, plotted shape, and the set-based emphasis layer.

Enter after Stage 1 exits. Exit when T36 passes, including a five-way tie.

**Stage 4. Result screen.**

The three layouts, all four title sets, descriptive blocks.

Enter after Stage 1 exits. Exit when T34 and T35 pass and all 85 rendered results have been reviewed and approved.

**Stage 5. Production verification.**

The Release checklist, rerun on the deployed page with all scripts and tags live.

---

## 4 The reference harness

`whats_your_superpower_reference_harness.py` is a working implementation of the specification. It is not production code and is not intended to ship. It serves three purposes.

**Oracle.** The developer's engine must produce identical output for all 32,768 arrays. One SHA-256 comparison proves the match, rather than a test suite that might share the implementation's assumptions.

**Regression gate.** Any change to the question set, the scoring map or the result rules produces a new hash. If the hash moves when nobody intended it to, something changed that should not have.

**Review surface.** It emits every possible result, so copy is approved in full rather than sampled.

**Current canonical value**

    header:  config=MVP-4.1;schema=result-contract-1.0;arrays=32768;nameset=final-1.0
    SHA-256: 962ab2422f902db0c507b4c321791b1dbe87f6ec9f58ff72a3900eedd9bae329

Two earlier values are retained in the audit log and never overwritten: the pre-result-contract baseline, and the result contract with the provisional name set. A separate visual snapshot test covers rendered HTML, so spacing and CSS changes cannot invalidate the semantic hash.

---

## 5 Copy approval procedure

Once Stage 4 is built:

1. Regenerate the golden results file from the deployed configuration.
2. Confirm the unique-string count and the six state counts.
3. Review every rendered output.
4. Record copy approval beside each unique output.
5. Freeze the final file and hash together.

The count of 85 holds for MVP-4.1 with name set final-1.0. It is not a permanent acceptance criterion, because it will move if the question set changes.

---

## 6 Outstanding decisions

| Ref | Item | Owner | Blocks |
|---|---|---|---|
| D1 | Correct the workbook Result Copy sheet, including pasting the final names | Product owner | Stage 1 |
| D2 | Commission the legal opinion on M01, M02 and M03 | Product owner | Phase 4 entry, and it grows more expensive with delay |
| D3 | Confirm "The Power Pack" against the physical card pack in brand terms | Product owner | Visual design freeze |
| D4 | Record the Phase 3 baseline measures and run the same report against the four-swap candidate | Content lead | Phase 3 calibration choice |

D1 is workbook editing rather than a decision. D2 is the only item whose cost rises with delay: the dry run confirms that changing one question changes the scoring map, the result frequencies, the 85-string set, the canonical hash, the correlation figures and any adult-test records taken against the old configuration.

---

## 7 What this playbook does not cover

The dry run tests what the specification determines. It cannot test comprehension, answer quality, construct fit, or whether the five-power model describes anything real. Those are Phase 2 and Phase 3 questions and they need people rather than enumeration.

It also does not test the interface, because there is not one yet. Accessibility, reduced motion, mobile width and the chart fallback all need a real browser and a real screen reader.

Passing every mechanical check means the specification is internally consistent and buildable. It does not mean the game is good, and nothing here should be read as evidence that it is.
