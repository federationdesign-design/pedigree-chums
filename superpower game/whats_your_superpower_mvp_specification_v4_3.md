# What's Your Superpower?

## MVP Specification, version 4.3

Pedigree Chums product and developer brief. Prepared 28 July 2026. Revised 9 August 2026 for MVP-4.3.

**Configuration** MVP-4.3

**Result schema** result-contract-2.0

**Replaces** versions 4.0 to 4.2 and their errata, in full. This document is complete. No earlier document needs to be read alongside it.

**Working source of truth** whats_your_superpower_question_bank_v4_3.xlsx, whose Result Copy sheet carries the section 8 state table and the sidekick reasons.

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

**What changed in 4.3**

Version 4.1 replaced the result rules with a machine-readable result contract. Version 4.2 added the sidekick contract, so the three deeper ties award a sidekick role rather than a power. Version 4.3 reduces the question set from fifteen to ten to improve completion, and simplifies the result screen. Every difference below is a deliberate product decision.

- Ten questions, not fifteen. M02, M08, M10, M13 and M14 are dropped. Each power now has four primary and four secondary opportunities, a raw range of 0 to 12, and thirty points per playthrough. There are 1,024 answer arrays, not 32,768.
- A four-way tie is now impossible and is asserted at zero (section 15).
- The result title is hidden, so no result name, directional combination line or joint line is displayed. The sidekick role names are not displayed either. That copy remains in the configuration but is unused.
- The boundary statement and the relative explanation line are removed from every screen and appear nowhere.
- The result screen shows the radar chart, the power boxes and a Play again button. For the three-or-more-way sidekick ties it shows the chart and the three reason bullets.

The retained questions, their answer wording and every scoring assignment are otherwise unchanged from the calibrated configuration. The canonical hash is in section 20, with the earlier hashes retained in its audit log.

---

## 1 Product definition

**Working title** What's Your Superpower?

**Core promise** Answer a collection of strange dog-themed questions and reveal your power mix.

Ten fixed dog-themed paired choices, client-side scoring, a five-axis unnumbered radar shape, per-power result boxes, replay, and no stored profile.

The game is fictional. It does not assess, screen for or identify autism, ADHD, dyslexia or any health condition. It does not produce five independent ability scores.

**Boundary statement (removed in MVP-4.3)**

Earlier versions required this boundary statement before Start and on the result screen:

> This is a game about different ways of thinking and doing. It is not a medical test or assessment.

In MVP-4.3 that statement was removed from both screens by deliberate product decision, so it appears nowhere. The copy remains in the configuration but is not surfaced. The related editorial safeguards still hold: no result compares a player with another person, an average, a population or a threshold, and no axis is described as weak, low, poor, deficient or abnormal.

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
| 1 | Entry | Title, one-sentence promise, approximate completion time and Start. |
| 2 | Question loop | One question at a time, two large answer buttons, progress and optional Back. |
| 3 | Selection | Store one current answer per question and prevent double submission. |
| 4 | Calculation | Recalculate all raw scores from the answer array after every change. |
| 5 | Reveal | Draw the fixed-scale unnumbered radar shape, apply the emphasis sets from section 9, and render the result screen from section 10. |
| 6 | End | Play again only. No sharing or email capture in the prototype. |

Question order and left-to-right answer order remain fixed during prototype and testing. Any later randomisation creates a new configuration and reruns every test.

---

## 4 The question set

| ID | Question |
|---|---|
| M01 | You are a dog. Someone drops something in the next room. What do you do? |
| M03 | You are a dog with a bone in the kitchen. The letterbox clatters. What happens? |
| M04 | You are a dog. You are in the garden. How do you dig? |
| M05 | You are a dog. Somebody has slightly moved your dog bowl. What do you notice? |
| M06 | You are a dog. How would you remember a brand-new dog walk? |
| M07 | You are a human now, building a den. Before you start, what is in your head? |
| M09 | You are a dog. On the walk, the route is closed for maintenance. What is your first reaction? |
| M11 | You are a dog again now. A family member in the home starts to say 'walkies'. When do you move? |
| M12 | You are a dog. You know you are about to get a treat. What are you like? |
| M15 | You are a dog. A strange automatic ball-thrower appears in the garden. What interests you first? |

The set was reduced from fifteen to ten in MVP-4.3. M02, M08, M10, M13 and M14 are dropped. The retained items keep their original identifiers, so the numbering is deliberately not contiguous. The question copy above reflects the current configuration; full answer copy, weights, construct-fit notes and change history live in the workbook, and the developer does not alter them in code.

**Accuracy position**

The items are original game questions based on broad constructs. They are not validated measures and do not preserve the measurement properties of a clinical instrument. Of the ten retained items, four are rated High and six Medium for construct fit against their final prototype wording. Medium means usable for prototype testing with mandatory comprehension review. Binary forced choice is accepted as the interaction and therefore produces relative preference data. The result applies to the choices made in this round, and a later round may produce a different shape.

---

## 5 Scoring specification

1. Each selected answer awards two points to its primary power and one point to its secondary power.
2. Each power appears exactly four times as primary and four times as secondary across the twenty answer options.
3. No power scores on both answers of the same question.
4. Every question therefore uses exactly four distinct powers.
5. Every power has a theoretical raw minimum of zero and maximum of twelve.
6. Every playthrough awards exactly thirty raw points.
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

| Result state | Title source |
|---|---|
| One leader | Directional combination title for leading power then supporting power |
| Exactly two joint leaders | Unordered joint-pair title |
| Three, four or five joint leaders | Sidekick role for that state |

The twenty directional combination titles cover single-leader results. The ten joint titles cover exact two-way ties. The three sidekick roles cover the three deeper ties: The Right Paw for three, The Kennel Master for four, The Whistle for five. The five main-power titles are headings inside descriptive power blocks and never occupy the title slot. MVP-4.2 replaced the single generic "The Power Pack" title with this per-state sidekick role record; the "The Power Pack" title is gone.

Every array still resolves to exactly one title in the result contract, and all twenty directional titles and all ten joint titles remain reachable. In MVP-4.3 the result title is not displayed: the title element is present in the markup but visually hidden, so no result name, combination line or joint line appears on screen, and the sidekick role names are not shown. This copy is retained in the configuration and in the canonical hash for regression coverage, but it is unused in the interface.

---

## 8 The result-state table

This table is authoritative. It replaces every earlier result-copy table and the superseded gap-zero implementation rule.

| State ID | Predicate | Title source | Summary copy | Supporting rule |
|---|---|---|---|---|
| SINGLE_CLOSE | One leader, raw gap 1 to 3 | Directional combination title | Your answers leaned most towards [MAIN], with [SUPPORTING] close behind. | Highest remaining power |
| SINGLE_CLEAR | One leader, raw gap 4 or more | Directional combination title | Your answers leaned most towards [MAIN], with [SUPPORTING] next. | Highest remaining power |
| TIE_TWO | Exactly two leaders | Unordered joint-pair title | Your answers split between [POWER_1] and [POWER_2], with [SUPPORTING] next. | Highest power outside the pair, then the tie-breaks in section 6 |
| TIE_THREE | Exactly three leaders | The Right Paw (sidekick role) | Three powers came out level, so no single one leads. That is exactly what makes you the one every hero wants beside them. | None |
| TIE_FOUR | Exactly four leaders | The Kennel Master (sidekick role) | Four powers came out level. You are not out in the field. You are the reason the field works. | None |
| TIE_FIVE | All five leaders | The Whistle (sidekick role) | All five powers came out perfectly level. This is the rarest result in the whole game. | None |

All placeholders are substituted in fixed power order. TIE_FOUR cannot occur with ten questions (section 15), so its row is retained for completeness but never fires.

The TIE_TWO copy deliberately uses "next" in every case and does not apply the close-behind threshold. This is simpler and never factually wrong.

**Sidekick states**

Introduced at MVP-4.2. TIE_THREE, TIE_FOUR and TIE_FIVE award no power. Each resolves to a sidekick role keyed by state id, carrying a role title and three reasons held in the workbook and the configuration. `awardsPower` is false for these three states, no leading, supporting or per-power block is produced, and both chart emphasis sets are empty (section 9). In MVP-4.3 the role title and the summary sentence are not displayed; the three reasons are the visible copy for these states. The summary copy for the power-awarding states is likewise retained in the configuration and the contract but is not displayed (section 10).

**Generator behaviour**

The configuration is generated from the workbook by `scripts/superpower-generate-config.mjs`, which reproduces the signed configuration byte for byte and derives every count (question count, opportunities per power, raw range) from the workbook rather than a literal. It fails the build rather than producing output when any of the following is true: more than one active row matches a result state, a state has no active row, a referenced title is missing, a required placeholder is missing, a forbidden supporting placeholder appears in TIE_THREE, TIE_FOUR or TIE_FIVE, a sidekick state lacks exactly three reasons, or a sidekick role title disagrees with its state title source.

---

## 9 Plotting and display rules

| Rule | Decision | Status |
|---|---|---|
| Plot scale | One fixed raw scale from 0 to 12, mapped internally to 1 to 5. Derive the bounds from configuration. | Locked |
| Visible values | None. No raw score, percentage, plot value or radial number. | Locked |
| Named levels | None. All previous named levels remain retired. | Locked |
| Within-player scaling | Prohibited. Never stretch the lowest point to the floor and the highest to the ceiling. | Locked |
| Axis labels | Focus, Vision, Zoom, Ideas and Energy in fixed order. | Locked |
| Emphasis | Set-based, as below. | Required |
| Other axes | Shape only, with no judgement language. | Locked |

Internal plotting conversion: `plotValue = 1 + 4 × rawScore ÷ 12`. Not shown to the player and never used for ranking.

**Set-based emphasis**

    primaryEmphasisSet   = awardsPower ? leadingPowers : []
    secondaryEmphasisSet = awardsPower && supportingPower exists ? [supportingPower] : []

| Result layout | Primary emphasis | Secondary emphasis |
|---|---|---|
| One leader | Main power | Supporting power |
| Exactly two leaders | Both tied leaders | Supporting power |
| Sidekick (three or more leaders) | None | None |

The three sidekick states award no power (section 8), so both emphasis sets are empty and the chart applies no emphasis. The shape is still plotted in full. This is the same treatment for all 37 sidekick results. This is a change from earlier versions, which emphasised every tied axis in a three-or-more-way tie.

Emphasis must not alter plotted values, axis positions, chart scale or polygon geometry. It may change only marker, stroke weight, outline, label weight or equivalent visual treatment.

Emphasis is Required rather than Recommended, because it communicates the calculated result. The chart and the text must always express the same leading set, and for a sidekick result neither carries a leading power.

---

## 10 Result screen

The engine produces three result layouts: `single`, `pair` and `sidekick` (renamed at MVP-4.2 from `pack`). MVP-4.3 shows a deliberately spare result screen. The result title, the directional combination line, the joint line, the gap-dependent summary sentence, the relative explanation and the boundary statement are all present in the configuration but not displayed (section 7 and section 8). What renders is specified here rather than left to the front-end developer.

**Single leader**

1. The radar chart with the section 9 emphasis applied.
2. A main block for the leading power: its main-power title as a heading, its relative description and its pack contribution.
3. A compact block for the supporting power: power name and pack contribution.
4. A Play again button.

**Exactly two joint leaders**

1. The radar chart with the section 9 emphasis applied.
2. One compact block per joint leader: power name and pack contribution.
3. A compact block for the supporting power: power name and pack contribution.
4. A Play again button.

**Sidekick (three, four or five joint leaders)**

1. The radar chart, with no emphasis applied (section 9).
2. The three sidekick reasons for that state, as a list.
3. A Play again button.

No power box, leading block or supporting block appears for a sidekick result, and no power is awarded.

**Never rendered in any layout**

The result title or role name, a directional combination line, a two-power joint line, a state summary sentence, the relative explanation, the boundary statement, the replay line, a supporting block where none exists, a next power, or an empty reserved area. The title element is present in the markup but visually hidden.

---

## 11 Workbook correction (applied)

Earlier versions carried a superseded implementation rule in the Result Copy sheet directing any raw gap of zero to two-power joint copy, which contradicted section 8. That correction has been applied. The working source of truth is now whats_your_superpower_question_bank_v4_3.xlsx, whose Result Copy sheet carries the section 8 state table and the sidekick reasons, and from which the configuration is generated.

---

## 12 Technical build

The prototype is a self-contained front-end component. No server-side application is required.

Generate versioned JSON configuration from the workbook rather than retyping content. Configuration contains questions, answers, weights, power order, the result-state table, the directional and joint title sets, the main-power block copy and the sidekick roles with their reasons. It also retains the boundary and relative-explanation copy that MVP-4.3 no longer displays. The `powerPackTitle` field was replaced at MVP-4.2 by a `sidekickRoles` record keyed by state id.

State contains the per-question answer array, a started flag and the current slide index. All scores are derived from the answer array; a button click never permanently increments a score.

Question images are addressed by question id (M03 pairs with q03.jpg), not by array position, so dropping a question never reshuffles the pairing. The images are decorative, with empty alt text, and are logged in PLACEHOLDERS.md until supplied.

Use an accessible SVG radar chart or a mature component with equivalent text. Support keyboard navigation, visible focus, semantic buttons, reduced motion and a minimum width of 320 pixels. The result must remain understandable if the chart fails: the power boxes, or for a sidekick result the three reasons, carry the reading as text.

Permitted analytics events: `game_start`, `question_view`, `game_complete`, `game_restart`. No event parameter carries answer identity, score, plot value, gap, state ID or result label.

**Known deliberate departure from the house rules**

The page is built on a dark ground, which departs from the project no-dark-backgrounds house rule. This was requested directly by Steve and is deliberate, not a defect. The night palette is scoped to the game, so the global tokens and every other page are unaffected. Whether it becomes a permanent carve-out or the page returns to the body gradient is an open decision.

---

## 13 Privacy architecture

No name, exact age, date of birth, email, account, free text or persistent identifier. No answer history, raw score, plot value or profile is sent to a server. Answers exist in memory only. No answer identity appears in the URL, document title, cookies, local storage, session storage or DOM data attributes.

Exclude the game page from session replay, heatmaps, enhanced click measurement and click-text capture. Audit every third-party script before release and after every tag-manager change.

---

## 14 Source and legal position

The Source Log holds a row for every bank item with operational legal fields: legal action required, legal owner, due milestone, opinion status, opinion reference and decision notes. Legal action is required for Q001, Q002 and Q003. Of these, Q001 (M01) and Q003 (M03) remain in the enabled ten-question set. Q002 (M02) was dropped in MVP-4.3, so it no longer gates this configuration, though the bank item and its legal position stand.

Items marked Recognisably close or Unresolved are blocked pending legal review. Concept-led items may enter the technical prototype but cannot pass content freeze, child pilot or Release without recorded clearance or an approved replacement.

If M01 or M03 is replaced, the change creates a new configuration version. The map is re-solved and all count, range, enumeration, correlation, simulation, construct-fit and result-copy tests are repeated.

---

## 15 Locked result-state fire rates

These are regression targets, derived by exhaustive enumeration of all 1,024 answer arrays.

| State | Expected cases | Expected share |
|---|---|---|
| SINGLE_CLOSE | 744 | 72.656% |
| SINGLE_CLEAR | 58 | 5.664% |
| TIE_TWO | 185 | 18.066% |
| TIE_THREE | 33 | 3.223% |
| TIE_FOUR | 0 | 0.000% |
| TIE_FIVE | 4 | 0.391% |
| Total | 1,024 | 100.000% |

An automated assertion must confirm all six counts. TIE_FOUR is asserted at exactly zero: a four-way tie is impossible with ten questions, and asserting it at zero makes any future map change that reintroduces one fail loudly. Enumerating every count is stronger than testing one fabricated example per state, because it verifies that the state-classification rules have not moved accidentally.

---

## 16 Test plan additions

Tests T01 to T30 carry forward from version 4.0 unchanged. T31, T32 and T33 carry forward from errata 4.0.2. The following are new or revised.

**T34, title selection.** Every answer array receives exactly one title in the result contract: a directional title for a single leader, an unordered pair title for two leaders, a sidekick role for three or more. A four-way tie cannot occur. The five main-power titles never occupy the title slot. The title is selected for the contract and the hash even though MVP-4.3 does not display it.

**T35, result-screen layout.** For every answer array the rendered result screen matches the section 10 rules for its layout. No block is duplicated or left empty.

**T36, chart and text agreement.** For every power result, `chartPrimaryEmphasisSet` equals the text leading-power set and `chartSecondaryEmphasisSet` equals the supporting-power set. For the three sidekick states both sets are empty.

**T37, result-state distribution.** The six state counts match section 15 and total 1,024, with TIE_FOUR at zero.

**T38, rendered-output content.** The no-visible-number test runs after token substitution and rendering, never against workbook templates. Inspect visible text nodes, accessible names, ARIA labels, image alternative text and chart descriptions. Internal placeholders such as `[POWER_1]` are not player-visible numbers and must not cause a failure.

**T39, sidekick states award no power.** For TIE_THREE, TIE_FOUR and TIE_FIVE, `awardsPower` is false, no leading, supporting or per-power block renders, and both chart emphasis sets are empty.

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

**Record fields, sorted object keys:** answerPattern, awardsPower, chartPrimaryEmphasisSet, chartSecondaryEmphasisSet, descriptiveBlockKeys, leadingPowers, stateId, summaryKey, supportingPower, titleKey. The `awardsPower` and `descriptiveBlockKeys` fields belong to result-contract schema 2.0, introduced at MVP-4.2.

**Canonicalisation:** M01 to M15 in fixed order, ten enabled, answer A before answer B, power arrays in fixed power order, sorted object keys, UTF-8, LF line endings, no presentation HTML or CSS, and a header line carrying the configuration and schema versions.

**Header** `config=MVP-4.3;schema=result-contract-2.0;arrays=1024;nameset=final-1.0;sidekick=1.0`

**SHA-256** `ae249fcd7e5455a72c940604fa52525b261cf7cdcf03bc6ea007cbb9636c682a`

**Audit log**

| Version | Hash | Note |
|---|---|---|
| MVP-4.0 plus errata 4.0.2 | def21fc20e42201cc121353f960f2179f3587dbc61d47bdbf59001f214779559 | Pre-result-contract baseline. Main-power titles in the main title slot. Superseded. |
| MVP-4.1, result contract 1.0, provisional name set | 7ed0478570bb69dae75ac9cc89982597a6139256fdb80ff2341b300b47a5198e | First result-contract hash. Superseded by the final name set. |
| MVP-4.1, result contract 1.0, name set final-1.0 | 962ab2422f902db0c507b4c321791b1dbe87f6ec9f58ff72a3900eedd9bae329 | Fifteen questions, final names. Superseded. |
| MVP-4.2, sidekick contract, fifteen questions | ce3437e9f3e326b90e8f67cd9ab93e81064c752cb82de956dddf91fc95da8a5b | Sidekick roles added, schema 2.0. Superseded by the ten-question reduction. |

Previous hashes are retained in this log and never overwritten. A separate visual snapshot test covers rendered HTML, so that harmless spacing or CSS changes cannot invalidate the semantic engine hash.

---

## 21 Acceptance criteria

- Exactly ten enabled questions load from the signed configuration.
- Every question stores one current answer and re-answering safely replaces it.
- All scores recalculate from the answer array.
- Every power has four primary and four secondary opportunities.
- Every question uses four distinct powers.
- All powers have a raw range of zero to twelve.
- Every answer array totals thirty.
- All 1,024 answer arrays complete without a scoring, state or tie error.
- Raw scores, not plot values, determine rank.
- Every answer array resolves to exactly one of the six result states.
- The six state counts match section 15 exactly, with TIE_FOUR at zero.
- Every answer array receives exactly one title from the correct title set in the result contract.
- The five main-power titles never occupy the title slot.
- The rendered result screen matches the section 10 rules: chart, power boxes and Play again for a power result; chart, three reasons and Play again for a sidekick result.
- The chart primary emphasis set equals the text leading set in every power result.
- Both chart emphasis sets are empty for every three-or-more-way sidekick tie.
- No visible number, percentage or named level appears in rendered output, tested after substitution.
- No low, weak, medical or deficit wording appears.
- No answer or profile is transmitted, stored or captured by third-party tools.
- The complete journey works by keyboard and at 320 pixels wide.
- The result remains understandable if the chart fails, through the power boxes or the sidekick reasons.
- Reduced-motion preferences are respected.
- The implementation reproduces the canonical hash in section 20.
- Current correlation and dimensionality figures are recorded.
- No child testing occurs before the Phase 4 entry gates pass.
- No public release occurs before the Release checklist is complete.

**Criteria from earlier versions that MVP-4.3 no longer meets, by deliberate product decision.** These are recorded here rather than deleted, because they were once required and their removal has consequences that belong with Steve.

- The boundary statement before Start and on the result screen. It was removed from both screens, so it appears nowhere. This safeguarding-facing criterion is not met by design, and its removal needs legal and privacy review before release.
- The result explains, in words, that it is a power mix for this round. The relative explanation line was removed, so no such sentence is displayed. The chart and the power boxes carry the reading instead.

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
| Boundary statement | Removed in MVP-4.3, so this gate cannot be met as written. Its removal is a deliberate product decision that needs Steve's legal and privacy sign-off before release. |
| Analytics | Only approved events fire, with no answer or score data. |
| Production rerun | Structural, privacy and accessibility checks completed after deployment. |

---

## 23 Handover files

| File | Purpose |
|---|---|
| whats_your_superpower_mvp_specification_v4_3 | This document. The complete build specification. |
| whats_your_superpower_question_bank_v4_3.xlsx | Source of truth for content, scoring, risks, tests, sources and decisions. |
| whats_your_superpower_build_playbook | Dry-run evidence, build order, rework analysis and outstanding decisions. |
| whats_your_superpower_reference_harness.py | Working reference implementation, oracle and regression gate. |
| whats_your_superpower_golden_results_v4_3.csv | Every distinct result the game can produce, with its share. |
| whats_your_superpower_golden_hash_v4_3.txt | Canonical hash and audit log. |

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

Generate configuration MVP-4.3 from the workbook by running `node scripts/superpower-generate-config.mjs`, then build to this document alone. Do not alter wording or weights inside code. Any change returns to the workbook, creates a new configuration version, produces a new canonical hash, and reruns every structural, result-contract and privacy gate. The contract is verified with `./node_modules/.bin/tsx scripts/superpower-verify-contract.mts` and the build with `./node_modules/.bin/next build`.
