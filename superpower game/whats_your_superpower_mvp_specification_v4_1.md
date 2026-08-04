# What's Your Superpower?

## MVP Specification, version 4.1

Pedigree Chums product and developer brief. Prepared 28 July 2026.

**Configuration** MVP-4.1

**Result schema** result-contract-1.0

**Replaces** version 4.0, errata 4.0.1 and errata 4.0.2, in full. This document is complete. No earlier document needs to be read alongside it.

**Working source of truth** whats_your_superpower_question_bank.xlsx, corrected as described in section 11.

**Companion** whats_your_superpower_build_playbook, which carries the dry-run evidence, the build order and the rework analysis.

**Status**

| Item | Position |
|---|---|
| Technical prototype | Approved for design and build |
| Content freeze | Blocked pending calibration and Concept-led legal clearance |
| Child pilot | Blocked until Phase 4 entry gates pass |
| Public release | Blocked pending legal, privacy, accessibility, pilot and production sign-off |
| Open product decisions | None |
| Launch assurances outstanding | Three: legal, privacy, accessibility |

**What changed in 4.1**

Version 4.0 was proven buildable by an exhaustive dry run: the engine was implemented as specified and every mechanically checkable acceptance criterion passed across all 32,768 possible playthroughs. That exercise found five gaps, all in the result screen and the chart, and none touching the questions or the scoring arithmetic. Version 4.1 closes all five by replacing the result rules with a machine-readable result contract. The fifteen questions, their answer wording and every scoring assignment are unchanged.

---

## 1 Product definition

**Working title** What's Your Superpower?

**Core promise** Answer a collection of strange dog-themed questions and reveal your power mix.

Fifteen fixed dog-themed paired choices, client-side scoring, a five-axis unnumbered radar shape, relative result copy, restart, and no stored profile.

The game is fictional. It does not assess, screen for or identify autism, ADHD, dyslexia or any health condition. It does not produce five independent ability scores.

**Required boundary statement**

> This is a game about different ways of thinking and doing. It is not a medical test or assessment.

It appears before Start and on the result screen, visible without scrolling at 320 pixels wide. No result compares a player with another person, an average, a population or a threshold. No axis is described as weak, low, poor, deficient or abnormal.

---

## 2 The five-power model

| Power | Internal meaning | User-facing interpretation |
|---|---|---|
| Focus | Staying with a mission, returning after interruption, persistence and follow-through. | Stays with the mission. |
| Vision | Seeing arrangements, routes, systems and how parts relate across the whole scene. | Sees where the trail leads. |
| Zoom | Noticing exact features, subtle changes, sounds, patterns and anomalies within a scene. | Finds the clue everyone else missed. |
| Ideas | Making unusual connections, inventing alternatives, imagining and improvising. | Creates a route nobody else considered. |
| Energy | Starting quickly, moving, responding, exploring and maintaining momentum. | Gets the pack moving. |

Vision concerns arrangement, route, system and relationships between parts. Zoom concerns exact features, changes and anomalies. Version 4.0 also recorded the stronger structural coupling between Focus and Zoom and between Ideas and Energy, which remains a Phase 3 calibration matter and is covered by risk R27.

**Fixed power order**

Focus, Vision, Zoom, Ideas, Energy.

This order governs chart axes, every list of powers, every placeholder substitution and the final deterministic tie-break. It carries no ranking or importance.

---

## 3 User flow

| Step | Screen | Required behaviour |
|---|---|---|
| 1 | Entry | Title, one-sentence promise, approximate completion time, boundary statement and Start. |
| 2 | Question loop | One question at a time, two large answer buttons, progress and optional Back. |
| 3 | Selection | Store one current answer per question and prevent double submission. |
| 4 | Calculation | Recalculate all raw scores from the answer array after every change. |
| 5 | Reveal | Draw the fixed-scale unnumbered radar shape, apply the emphasis sets from section 9, and render the result contract from section 10. |
| 6 | End | Restart only. No sharing or email capture in the prototype. |

Question order and left-to-right answer order remain fixed during prototype and testing. Any later randomisation creates a new configuration and reruns every test.

---

## 4 The question set

| ID | Question |
|---|---|
| M01 | A small sound happens somewhere in the house. What grabs you first? |
| M02 | If you were a dog arriving at a busy park, what would hit you first? |
| M03 | You are busy with important dog business when a letter drops through the door. What happens? |
| M04 | If you were a dog, how would you dig? |
| M05 | Somebody has moved the dog's favourite toy by only a few inches. What do you notice? |
| M06 | How would you remember a brand-new dog walk? |
| M07 | Before building the perfect dog den, what is in your head? |
| M08 | A trail of pawprints has one strange print in it. What happens? |
| M09 | The usual dog-walk route is suddenly closed. What is your first reaction? |
| M10 | You are halfway through a dog job when something exciting appears. What do you do? |
| M11 | Someone starts saying 'walkies'. When do you move? |
| M12 | While waiting for a treat, what are you like? |
| M13 | Your thoughts chase a squirrel halfway through a story. What happens next? |
| M14 | A dog toy lands upside down. How do you work out its proper shape? |
| M15 | A strange automatic ball-thrower appears. What interests you first? |

Full answer copy, weights, construct-fit notes and change history live in the workbook. The developer does not alter them in code.

**Accuracy position**

The items are original game questions based on broad constructs. They are not validated measures and do not preserve the measurement properties of a clinical instrument. Six items are rated High and nine Medium for construct fit against their final prototype wording. Medium means usable for prototype testing with mandatory comprehension review. Binary forced choice is accepted as the interaction and therefore produces relative preference data. The result applies to the choices made in this round, and a later round may produce a different shape.

---

## 5 Scoring specification

1. Each selected answer awards two points to its primary power and one point to its secondary power.
2. Each power appears exactly six times as primary and six times as secondary across the thirty answer options.
3. No power scores on both answers of the same question.
4. Every question therefore uses exactly four distinct powers.
5. Every power has a theoretical raw minimum of zero and maximum of eighteen.
6. Every playthrough awards exactly forty-five raw points.
7. Scores are always derived from the stored answer array. A button click never permanently increments a score.

**Ipsative scoring**

The five scores divide a fixed total. A stronger allocation to one power necessarily leaves fewer points for others. The result is a relative mix within the player and within this round, not a set of independent ability measurements.

---

## 6 Ranking and supporting power

Raw scores determine rank. The plotting conversion is monotonic and identical for all five powers, so it never changes ranking and is never used to determine rank.

**Leading set.** Every power holding the highest raw score, listed in fixed power order.

**Supporting power.** Defined only where the leading set contains one or two powers. It is the highest-scoring power outside the leading set. Where two or more remaining powers tie for that position, resolve by the greater number of primary selections, then by fixed power order.

Where the leading set contains three or more powers there is no supporting power, no next power is calculated, and no supporting field is rendered.

---

## 7 Title hierarchy

Each title set has exactly one purpose. The engine never has to choose between two valid titles.

| Result state | Main title source |
|---|---|
| One leader | Directional combination title for leading power then supporting power |
| Exactly two joint leaders | Unordered joint-pair title |
| Three, four or five joint leaders | The Power Pack |

The twenty directional combination titles are the main result titles for single-leader results. The ten joint titles cover exact two-way ties. The five main-power titles are headings inside descriptive power blocks and never occupy the main title slot. One generic title covers every three-or-more-way tie.

The dry run confirms that all twenty directional titles and all ten joint titles are reachable. No title is dead content.

---

## 8 The result-state table

This table is authoritative. It replaces every earlier result-copy table and the superseded gap-zero implementation rule.

| State ID | Predicate | Title source | Summary copy | Supporting rule |
|---|---|---|---|---|
| SINGLE_CLOSE | One leader, raw gap 1 to 3 | Directional combination title | Your answers leaned most towards [MAIN], with [SUPPORTING] close behind. | Highest remaining power |
| SINGLE_CLEAR | One leader, raw gap 4 or more | Directional combination title | Your answers leaned most towards [MAIN], with [SUPPORTING] next. | Highest remaining power |
| TIE_TWO | Exactly two leaders | Unordered joint-pair title | Your answers split between [POWER_1] and [POWER_2], with [SUPPORTING] next. | Highest power outside the pair, then the tie-breaks in section 6 |
| TIE_THREE | Exactly three leaders | The Power Pack | Your answers split across [POWER_1], [POWER_2] and [POWER_3]. | None |
| TIE_FOUR | Exactly four leaders | The Power Pack | Your answers split across [POWER_1], [POWER_2], [POWER_3] and [POWER_4]. | None |
| TIE_FIVE | All five leaders | The Power Pack | Your answers divided evenly across all five powers this round. | None |

All placeholders are substituted in fixed power order.

The TIE_TWO copy deliberately uses "next" in every case and does not apply the close-behind threshold. This is simpler and never factually wrong.

**Generator behaviour**

The configuration generator fails the build rather than producing output when any of the following is true: more than one active row matches a result state, a state has no active row, a referenced title is missing, a required placeholder is missing, or a forbidden supporting placeholder appears in TIE_THREE, TIE_FOUR or TIE_FIVE.

---

## 9 Plotting and display rules

| Rule | Decision | Status |
|---|---|---|
| Plot scale | One fixed raw scale from 0 to 18, mapped internally to 1 to 5. Derive the bounds from configuration. | Locked |
| Visible values | None. No raw score, percentage, plot value or radial number. | Locked |
| Named levels | None. All previous named levels remain retired. | Locked |
| Within-player scaling | Prohibited. Never stretch the lowest point to the floor and the highest to the ceiling. | Locked |
| Axis labels | Focus, Vision, Zoom, Ideas and Energy in fixed order. | Locked |
| Emphasis | Set-based, as below. | Required |
| Other axes | Shape only, with no judgement language. | Locked |

Internal plotting conversion: `plotValue = 1 + 4 × rawScore ÷ 18`. Not shown to the player and never used for ranking.

**Set-based emphasis**

    primaryEmphasisSet   = leadingPowers
    secondaryEmphasisSet = supportingPower exists ? [supportingPower] : []

| Result layout | Primary emphasis | Secondary emphasis |
|---|---|---|
| One leader | Main power | Supporting power |
| Exactly two leaders | Both tied leaders | Supporting power |
| Three or more leaders | Every tied leading power | None |

For the 844 three-or-more-way ties, every tied axis receives exactly the same primary visual treatment.

Emphasis must not alter plotted values, axis positions, chart scale or polygon geometry. It may change only marker, stroke weight, outline, label weight or equivalent visual treatment.

Emphasis is Required rather than Recommended, because it communicates the calculated result. The chart and the text must always express the same leading set.

---

## 10 Descriptive block layouts

The result screen has three layouts. The content of each is specified here rather than left to the front-end developer.

**One leader**

1. Directional combination title
2. Directional combination line
3. Gap-dependent summary sentence
4. Detailed main-power block: main-power title, relative description, pack contribution
5. Compact supporting-power block: power name, pack contribution
6. Relative explanation
7. Boundary statement
8. Restart

**Exactly two joint leaders**

1. Unordered joint-pair title
2. Joint-pair line
3. Two-way tie summary
4. One compact block per joint leader: power name, main-power title, pack contribution
5. One compact supporting-power block: power name, pack contribution
6. Relative explanation
7. Boundary statement
8. Restart

**Three or more joint leaders**

1. The Power Pack
2. The three, four or five-power summary
3. One compact block per tied leader: power name, user-facing interpretation
4. Relative explanation
5. Boundary statement
6. Restart

**Never rendered in any layout**

A supporting-power block where none exists, a next power, a directional combination line outside the single-leader layout, a two-power joint line outside the two-leader layout, or an empty reserved area.

**Relative explanation, on every result**

> This is your power mix for this round. It compares your five answers with each other, not with anyone else.

**Replay line, beside Restart**

> A different set of choices may make a different shape.

---

## 11 Workbook correction required

The Result Copy sheet still ends with a superseded implementation rule directing any raw gap of zero to two-power joint copy. A three-way tie also has a gap of zero, so that rule contradicts section 8.

This matters because the configuration is generated from the workbook. An errata sitting beside the workbook is insufficient. Delete the obsolete row and replace the sheet's result table with the section 8 table before the generator is run.

---

## 12 Technical build

The prototype is a self-contained front-end component. No server-side application is required.

Generate versioned JSON configuration from the workbook rather than retyping content. Configuration contains questions, answers, weights, power order, the result-state table, all four title sets, descriptive block definitions and boundary copy.

State contains `currentQuestion`, `answersByQuestion` and `gameStatus`. All scores are derived.

Use an accessible SVG radar chart or a mature component with equivalent text. Support keyboard navigation, visible focus, semantic buttons, reduced motion and a minimum width of 320 pixels. The result must remain understandable if the chart fails.

Permitted analytics events: `game_start`, `question_view`, `game_complete`, `game_restart`. No event parameter carries answer identity, score, plot value, gap, state ID or result label.

---

## 13 Privacy architecture

No name, exact age, date of birth, email, account, free text or persistent identifier. No answer history, raw score, plot value or profile is sent to a server. Answers exist in memory only. No answer identity appears in the URL, document title, cookies, local storage, session storage or DOM data attributes.

Exclude the game page from session replay, heatmaps, enhanced click measurement and click-text capture. Audit every third-party script before release and after every tag-manager change.

---

## 14 Source and legal position

The Source Log holds a row for every bank item with operational legal fields: legal action required, legal owner, due milestone, opinion status, opinion reference and decision notes. Legal action is required for Q001, Q002 and Q003.

Items marked Recognisably close or Unresolved are blocked pending legal review. Concept-led items may enter the technical prototype but cannot pass content freeze, child pilot or Release without recorded clearance or an approved replacement.

If M01, M02 or M03 is replaced, the change creates a new configuration version. The map is re-solved and all count, range, enumeration, correlation, simulation, construct-fit and result-copy tests are repeated.

---

## 15 Locked result-state fire rates

These are regression targets, derived by exhaustive enumeration of all 32,768 answer arrays.

| State | Expected cases | Expected share |
|---|---|---|
| SINGLE_CLOSE | 22,064 | 67.334% |
| SINGLE_CLEAR | 3,901 | 11.905% |
| TIE_TWO | 5,959 | 18.185% |
| TIE_THREE | 785 | 2.396% |
| TIE_FOUR | 39 | 0.119% |
| TIE_FIVE | 20 | 0.061% |
| Total | 32,768 | 100.000% |

An automated assertion must confirm all six counts. This is stronger than testing one fabricated example per state, because it verifies that the state-classification rules have not moved accidentally.

---

## 16 Test plan additions

Tests T01 to T30 carry forward from version 4.0 unchanged. T31, T32 and T33 carry forward from errata 4.0.2. The following are new or revised.

**T34, title selection.** Every answer array receives exactly one title: a directional title for a single leader, an unordered pair title for two leaders, The Power Pack for three or more. The five main-power titles never occupy the main result-title slot.

**T35, descriptive-block layout.** For every answer array the rendered blocks exactly match the section 10 rules. No block is duplicated or left empty.

**T36, chart and text agreement.** For every result, `chartPrimaryEmphasisSet` equals the text leading-power set and `chartSecondaryEmphasisSet` equals the displayed supporting-power set. For three-or-more-way ties the secondary set is empty.

**T37, result-state distribution.** The six state counts match section 15 and total 32,768.

**T38, rendered-output content.** The no-visible-number test runs after token substitution and rendering, never against workbook templates. Inspect visible text nodes, accessible names, ARIA labels, image alternative text and chart descriptions. Internal placeholders such as `[POWER_1]` are not player-visible numbers and must not cause a failure.

---

## 17 Phase 3 re-entry testing

**Item-level re-entry.** Any question or answer introduced or materially changed during Phase 3 must pass, in its current wording: adult comprehension testing, answer-quality testing, construct-fit review, and editorial review against the surrounding question set.

This applies to:

- a replacement question from the Full Bank
- a new question
- materially revised question wording
- materially revised answer wording
- **changed primary or secondary scoring assignments**
- a changed intended power contrast

The scoring-assignment case is listed deliberately. A secondary reassignment changes no wording at all, so it would otherwise reach the child pilot with no construct-fit review anywhere, and that is precisely the four-swap calibration scenario recorded as Phase 3 pre-work.

**Configuration-level re-entry.** After any question, answer or scoring assignment changes, the complete resulting configuration must pass: primary and secondary opportunity counts, theoretical score ranges, the four-distinct-powers rule, complete answer-array enumeration, total-score verification, tie handling, result-copy selection, leading-power share analysis, latent-preference simulations, correlation analysis, dimensionality analysis and result-distribution review.

These are properties of the configuration, not of an individual question. The revised configuration receives a new version number and a new canonical hash.

**Phase 4 entry rule.** The child pilot cannot begin until every enabled item has passed adult tests in its current wording, every scoring assignment belongs to the tested configuration, the complete configuration has passed all required structural tests, all enabled Concept-led items are legally cleared or have approved replacements, and any approved replacement has completed both item-level and configuration-level re-entry.

---

## 18 Pilot protocol

| Control | Rule |
|---|---|
| Minimum age | Seven |
| Under eighteen | Written parent or guardian consent |
| Child assent | The child agrees at the start and may stop without giving a reason |
| Adult presence | A parent, guardian or approved adult remains nearby but does not answer |
| Recording | No audio, video, screen recording or session replay |
| Individual data | No name, exact birth date, answer sheet or profile retained |
| Notes | Aggregate findings and age bands only |
| Consent record | Stored separately for twelve months, then deleted |

---

## 19 Phased delivery

| Phase | Included | Exit |
|---|---|---|
| 1. Technical prototype | Build and verify the engine and interface. | Functional and structural tests pass, canonical hash matches. |
| 2. Internal and adult testing | Interaction, wording, privacy, accessibility and interpretation defects. | No critical defect. Medium construct-fit items prioritised. |
| 3. Structural calibration | Reduce correlation and repetitive profiles using unused bank items and map optimisation. | Targets pass or a signed exception is recorded. |
| 4. Content freeze and child pilot | Test the final intended experience with consented children. | Legal clearance or replacements complete, pilot criteria pass. |
| 5. Release | Deploy the signed configuration and repeat production-only checks. | Legal, privacy, accessibility, pilot and production gates pass. |
| 6. Optional polish | Animation, sharing, rotation, richer combinations. | No new privacy or interpretation defect. |

**Phase 3 baseline measures.** Record top-five result share, top-ten result share, share of results pairing the known correlated partners, most common directional combinations, number of unique result strings and flat-profile share. Run the same report against the four-swap candidate map. Do not change the live configuration now. Use those figures when choosing the calibration map.

---

## 20 Canonical hash

The reference harness emits one semantic record per answer array, hashed to give a single value that proves an implementation matches the specification.

**Record fields, in order:** answerPattern, stateId, leadingPowers, supportingPower, titleKey, summaryKey, descriptiveBlockKeys, chartPrimaryEmphasisSet, chartSecondaryEmphasisSet.

**Canonicalisation:** M01 to M15 in fixed order, answer A before answer B, power arrays in fixed power order, sorted object keys, UTF-8, LF line endings, no presentation HTML or CSS, and a header line carrying the configuration and schema versions.

**Header** `config=MVP-4.1;schema=result-contract-1.0;arrays=32768`

**SHA-256** `7ed0478570bb69dae75ac9cc89982597a6139256fdb80ff2341b300b47a5198e`

**Audit log**

| Version | Hash | Note |
|---|---|---|
| MVP-4.0 plus errata 4.0.2 | def21fc20e42201cc121353f960f2179f3587dbc61d47bdbf59001f214779559 | Pre-result-contract baseline. Main-power titles in the main title slot. Superseded. |

Previous hashes are retained in this log and never overwritten. A separate visual snapshot test covers rendered HTML, so that harmless spacing or CSS changes cannot invalidate the semantic engine hash.

---

## 21 Acceptance criteria

- Exactly fifteen enabled questions load from the signed configuration.
- Every question stores one current answer and Back safely replaces it.
- All scores recalculate from the answer array.
- Every power has six primary and six secondary opportunities.
- Every question uses four distinct powers.
- All powers have a raw range of zero to eighteen.
- Every answer array totals forty-five.
- All 32,768 answer arrays complete without a scoring, state or tie error.
- Raw scores, not plot values, determine rank.
- Every answer array resolves to exactly one of the six result states.
- The six state counts match section 15 exactly.
- Every answer array receives exactly one title from the correct title set.
- The five main-power titles never occupy the main result-title slot.
- Rendered blocks match the section 10 layout rules with none duplicated or empty.
- The chart primary emphasis set equals the text leading set in every result.
- The chart secondary emphasis set is empty for every three-or-more-way tie.
- No visible number, percentage or named level appears in rendered output, tested after substitution.
- No low, weak, medical or deficit wording appears.
- The result explains that it is a power mix for this round.
- No answer or profile is transmitted, stored or captured by third-party tools.
- The complete journey works by keyboard and at 320 pixels wide.
- The result remains understandable if the chart fails.
- Reduced-motion preferences are respected.
- The boundary statement appears before Start and on the result screen.
- The implementation reproduces the canonical hash in section 20.
- Current correlation and dimensionality figures are recorded.
- No child testing occurs before the Phase 4 entry gates pass.
- No public release occurs before the Release checklist is complete.

---

## 22 Production release checklist

| Gate | Required evidence |
|---|---|
| Concept-led opinion | Cleared or approved replacement recorded. |
| Privacy | Final signed review and live third-party script audit. |
| Accessibility | Final keyboard, screen-reader, contrast and mobile review. |
| Structural configuration | All tests pass or an approved calibration exception is recorded. |
| Content match | Production copy and weights match the workbook exactly. |
| Result contract | Canonical hash matches the deployed build. |
| Boundary statement | Visible before Start and on results at 320 pixels. |
| Analytics | Only approved events fire, with no answer or score data. |
| Production rerun | Structural, privacy and accessibility checks completed after deployment. |

---

## 23 Handover files

| File | Purpose |
|---|---|
| whats_your_superpower_mvp_specification_v4_1 | This document. The complete build specification. |
| whats_your_superpower_question_bank.xlsx | Source of truth for content, scoring, risks, tests, sources and decisions. Requires the section 11 correction. |
| whats_your_superpower_build_playbook | Dry-run evidence, build order, rework analysis and outstanding decisions. |
| whats_your_superpower_reference_harness.py | Working reference implementation, oracle and regression gate. |
| whats_your_superpower_golden_results_v4_1.csv | Every distinct result the game can produce, with its share. |
| whats_your_superpower_golden_hash_v4_1.txt | Canonical hash and audit log. |

---

## 24 References

1. Autism Research Centre, Tests archive. https://www.autismresearchcentre.com/research/tests/
2. Autism Research Centre, AQ-10 Adult. https://www.autismresearchcentre.com/tests/autism-spectrum-quotient-10-items-aq-10-adult/
3. NICE CG128 recommendations. https://www.nice.org.uk/guidance/cg128/chapter/recommendations
4. ICO, What is special category data? https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/what-is-special-category-data/
5. ICO, Age appropriate design code. https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/
6. Department for Education, informed consent guidance. https://user-research.education.gov.uk/guidance/informed-consent-26

---

## Final build instruction

Correct the workbook Result Copy sheet, generate configuration MVP-4.1 from it, and build to this document alone. Do not alter wording or weights inside code. Any change returns to the workbook, creates a new configuration version, produces a new canonical hash, and reruns every structural, result-contract and privacy gate.
