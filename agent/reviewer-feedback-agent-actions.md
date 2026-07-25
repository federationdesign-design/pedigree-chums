# Reviewer feedback: agent action plan

Source: trusted-party review of the live chatbot (notes.rtf, committed
alongside this file). Process in the order below. A large part of the
review describes architecture that ALREADY EXISTS - for those items the
task is VERIFY AND REPORT, not rebuild. Genuinely new work is marked
NEW. Nothing here jumps the standing queue (production merge, identity
deck, deck v3, Batch 1); slot these in after Batch 1 unless marked
sooner.

## A. Verify-and-report (the review independently specified our design)

1. Families-not-sentences with rotation preferring unused variants
   until a family is exhausted (recs 1 and 4). Confirm rotation works
   exactly this way per session; report any gap.
2. Response/action separation (rec 2): confirm the response schema
   carries action, target, and context-preservation distinct from
   copy, and that links/buttons are attached by structure. Report the
   schema against the reviewer's field list; propose adding the
   missing per-response fields: Safety Override (explicit flag) and
   Maximum Uses Per Session.
3. Safety-above-comedy ordering (rec 6): confirm the priority stack
   matches the reviewer's 7-step order and that every food-safety
   phrasing in their examples (biscuits/chocolate/swallowed something)
   beats the Labrador transfer. Add their examples to the harness.

## B. NEW - adopt now (small, high value)

4. CANON SHEET (rec 3): add a Character Canon sheet to the workbook
   seeded with the reviewer's extracted list (the Collie facts, the
   colleague roles, does-not-reveal-age, no-conventional-owner, is
   written fiction, not AI, not internet-connected). Steve owns its
   content; the harness gains an assertion style where canon-relevant
   responses cannot contradict it. Flag to Steve the one open canon
   decision: whether "Collie" is his name or his role (current copy
   deliberately supports either - keeping the ambiguity is itself a
   decision to record on the sheet).
5. TRANSFER EDGE CASES (rec 7): implement and harness-test every
   listed edge: no-previous-dog on "bring back", requesting the
   already-active dog, request-by-description ("somebody clever", "the
   food expert"), repeated transfer requests, asking NOT to be
   transferred, and requesting the Boxer after a Boxer cut-off ended a
   session. Confirm the session state carries active_dog, previous_dog,
   dogs_visited, transfer_count, and that the original message travels
   with a specialist transfer (no retyping).
6. WORKBOOK DEV COLUMNS + TESTING SHEET (workbook improvements
   section): extend the development workbook with the reviewer's
   column list where not already present, and add a Testing sheet
   whose rows generate harness cases (example input, expected family,
   expected dog, expected action). The corpus becoming workbook-
   editable closes the loop: Steve can add a test the same way he adds
   a line.

## C. Deferred by design (record, do not build yet)

7. SLOT EXTRACTION (rec 5, pet_mischief_object=shoe): powerful but
   adds recognition-confidence machinery. The reviewer's own caveat
   (generic beats wrongly-specific) plus their main recommendation
   (do not expand yet) defer this until live data shows which slots
   would pay. Log in SAFETY_BACKLOG-style fashion as ENHANCEMENTS.md.
8. FAMILY SPLITS (content issue section): DOG-F01 name/breed/age/
   origin and similar combined families stay combined for MVP; the
   analytics phase's family-frequency data decides which earn their
   own sharper responses. Log alongside item 7.
9. PER-DOG RESPONSE POOLS (rec 8): this is Phase 3 by definition. The
   reviewer's per-dog manager sketches (Labrador delighted and
   distracted, Terrier investigating why, Boxer as acting manager)
   are recorded as part of the Phase 3 character brief.

## D. For Steve, not the agent (copy style)

10. GEORDIE LIMITS (rec 9) become writing rules on the copy deck
    template: at most one strong regional phrase per response, never
    open consecutive variants with "Aye", "our kid" rotated sparingly,
    no phonetic spelling, rhythm and attitude carry the voice. A light
    edit pass over existing lines (several open with "Aye") goes on
    Steve's list - his edits, not the agent's.
11. TYPING-THEATRE LINE TESTING (rec 10): once the theatre round
    lands, the shoot script gains a per-line report (pages, total
    typing time, position of the joke/key fact) so Steve can see which
    lines run long in the real box. Joke-in-first-two-sentences
    becomes a copy-deck rule.

## E. The main recommendation (aligns with the standing plan)

The reviewer's close - implement, launch controlled, collect unmatched
messages, low-confidence matches, wrong matches, family frequencies,
screenshotted lines, exit points, requested transfers, opened links -
IS the analytics phase already agreed and bundled with safety. Their
list becomes the analytics event specification. No new decision
needed; the phase ordering stands.
