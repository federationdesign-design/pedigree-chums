# Pick a Chum safety net: handover (for picking up cold)

Date: 2026-07-26. Everything below is on branch `pick-a-chum` (preview) EXCEPT
the one production change noted. Nothing is merged to `main`.

## State in one line

The safety net is built and deployed to the `pick-a-chum` PREVIEW only. The
Pick a Chum launcher is HIDDEN on production while it is tested. Steve is running
a test round; do not start anything new until he returns with findings.

---

## RUN 3 (2026-07-26, simulation fixes + breed retrieval). Read this first.

All on `pick-a-chum` preview. Tip is now `c507d81`. Harness is **280 passing,
0 failing** (started this run at ~257, floor was 224). Nothing merged to `main`.

Shipped this run, one commit each (newest last):
- `e0acf6b` audit fix 2: TRANSFER_REQUEST requires a verb (no bare "another dog").
- `7850b65` audit fix 3: delete NAV_FRAME dead code.
- `2c24cdf` + `69c3052` FAQ audit fix: remove bare single-word phrasings, in the
  router AND at source (workbook) so a rebuild cannot reintroduce them.
- `8382f9c` ANATOMY_GENERAL_REDIRECT: approved trusted-adult redirect line, fires
  at most once per session (`session.anatomyRedirectUsed`).
- Five simulation fixes (12-scenario multi-turn sim, ran to 0/12 then fixed):
  - `2af3cc9` fix 1: B07 never returns wrong-breed facts (assembler no longer
    hardcodes border-collie; `isActiveBreedQuestion` tightened); FAQ002 audience
    words removed so "good with kids" stops hitting the game-age FAQ.
  - `a09b5db` fix 2: safety guard. `session.safetyLatched` blocks
    comedy/game/sales/orientation after a protected safety state until a
    meaningful topic clears it.
  - `66a5ac0` fix 3: answer-capture for transfer offers ("the boxer" performs the
    transfer) and complaint follow-ups (stay in FAQ012).
  - `677d83f` fix 4: delete the single-word echo (bye/ok/no/why no longer echoed).
  - `2ee4a11` fix 5: remove the meaningless B05 "correct Chum" line; voice-leak
    reported only.
- `c507d81` BREED PAGE RETRIEVAL (10 proof breeds). The main deliverable:
  - `router.ts` `BREED_PAGES` (labrador, border collie, boxer, border terrier,
    cocker spaniel, beagle, french bulldog, pug, german shepherd, staffordshire
    bull terrier) + `matchBreed`. Signal-STRENGTH scoring: an exact whole-word
    breed name/alias is confident alone; a lone weak/partial match is not; two
    weak signals are. Placed AFTER the active-breed (Collie) B07 route so
    "Are Border Collies easy to train?" keeps the Collie answer. Ambiguous term
    in the confidence gap ("terrier" -> Border Terrier or Staffie) returns
    `breed_choice`. Breed hub ("dog breeds") -> approved fallback, NOT a
    placeholder. Deferred while a complaint is open (so "the labrador one" during
    a complaint stays FAQ012).
  - Alias table is intentionally EMPTY; only the two real misspelling entries
    (labrador, terrier) resolve via `misspellings.json`. Plurals/singulars are
    mechanical in `matchBreed`, not aliases.
  - `session.ts`/`engine.ts`: `lastBreedSlug` carries the breed across turns so a
    follow-up ("how long do they live") re-resolves to the same page.
  - `types.ts`: `breed_page` / `breed_choice` actions + Resolution breed fields.
  - `assembler.ts`: PLACEHOLDER lines for per-breed and choice copy.
  - 5 assertions added: labradors -> /chums/labrador; labradror misspelling ->
    same; terrier -> choice(border-terrier, staffordshire-bull-terrier);
    "dog breeds" -> NOT a confident page; cocker spaniel carried across two turns.

PAUSED, approved but NOT built (survives to next session):
- PERSONAL_SADNESS_GENTLE_REDIRECT. Fully specced and approved (L1 shared line,
  trigger = first-person + present + sadness; DO-NOT-trigger list; remove
  sad/lonely from PERSONAL; L2 -> general distress; L3 -> protected distress;
  6 assertions; recorder field `sadness_self_disclosure_count`). L2-variant copy
  is owed by Steve. Build floor was quoted as 249 at spec time.

Needs COPY from Steve (nothing invented; all logged in PLACEHOLDERS.md):
- Per-breed page lines `BREED-<slug>`, one per breed, all 10.
- Breed choice framing `BREED-CHOICE` (the "A or B?" sentence).
- Breed hub line (currently routed to the approved fallback as a stand-in).
- Per-breed alias list (empty table). The requested shape was handed to Steve:
  informal names / nicknames / short forms per breed (lab, frenchie, staffie,
  gsd/alsatian, cocker, etc.), flagging any cross-breed alias (bare "spaniel",
  "shepherd") to wire to the confidence gap -> choice, not a guess.
- Carried: L2-variant distress copy for the sadness redirect (above).

---

## RUN 2 (2026-07-26, nine-task run). Read this first.

All on `pick-a-chum` preview, floor now **247** (started this run at 224).

Shipped, one commit each:
- `1a94c9f` task 1: reported speech ("my dad called me stupid") -> safeguarding, not the abuse boundary.
- `2520b90` task 2: complaint / human-contact intent -> approved FAQ012 answer.
- `4452230` task 3: clarifier answer-capture + never fire the clarifier twice.
- `87c884c` task 4: D6 recorder redaction (safety input never stored) + replay skip.
- `7043c69` task 5: recorder analysis columns (topIntent, clusterKey, gapType, + blank scored fields).
- `a149838` task 6: bare common-word audit (report) -> `pick-a-chum-common-word-audit.md`.
- `a287aac` task 7: out-of-domain shape-test design (report) -> `pick-a-chum-ood-design.md`.
- `62a0333` audit fix 1: COMMERCIAL requires context, no bare buy-word purchase-modal.
- (task 8) programme map -> `pick-a-chum-programme-map.md`.
- (task 9) this handover update.

STOPPED / deferred (requested during the run, NOT built, so they survive):
- Audit fix 2 (TRANSFER_REQUEST: remove bare "new dog"/"different dog"/"another
  dog", require a verb). NOT done. Note: the existing assertion
  `check('new dog please', { action: 'transfer_request' })` still asserts the OLD
  behaviour and will need updating (before/after) when fix 2 is built.
- Audit fix 3 (delete NAV_FRAME dead code). NOT done. NAV_FRAME is still present
  and unused in `router.ts`.
- FAQ matcher finding: FAQ005 has bare single-word alternativePhrasings "people"
  and "players". `phraseMatches` reduces them to one token, so any input with
  "people"/"players" anywhere hits FAQ005 (32 of 300 obscure inputs did). The
  matcher uses scattered-token matching (worse than the router's adjacency). Fix
  is DATA (drop the bare phrasings / require multi-token), not made. Reported only.

Needs COPY from Steve (nothing was invented; these are blocked on his lines):
- Task 3 "two-choice repair": reused the approved fallback line
  ("...choose dogs, games or the website"). A DISTINCT two-choice line needs copy.
- OOD (task 7): one new line for "valid-but-unsupported" ("Is there a God?");
  near-domain and malformed can reuse existing lines if approved.
- Recorder scored columns (topScore/runnerUp/runnerUpScore/matchedSignals) are
  blank until the scoring/NLU layer exists (not copy, but a dependency).

---

## What shipped today

Production (`main`), the only main change:
- `f76f8b8` D1: launcher hidden on production (commented mount in
  `app/layout.tsx`). This commit lives ONLY on `main`. Reverse with `git revert`.
  It does NOT get undone by merging `pick-a-chum` into `main` (see the Sequencing
  note). The `/pick-a-chum` route itself is unchanged.

Preview (`pick-a-chum`), in order:
- `6e2e625` remove "and confidential" from the safety signpost
- `6b60054` Q1: remove "help" from B11 COMMAND (help-seeking no longer a dog command)
- `e75f382` Q2: terminal catch-all stops echoing raw input, approved fallback line
- `5b6e657` D8: split EXPLICIT into CONTENT_SEEKING + ANATOMY; safeguarding route
- `cf482ed` step 4a: elongation normalisation (collapse 3+ repeated chars)
- `e3601e0` step 4b: full safety net (MEDICAL/999, SELF-HARM, SAFEGUARDING,
  GENERAL DISTRESS, HARM TO OTHERS, HARM TO AN ANIMAL/RSPCA, BARE HELP clarifier,
  anatomy+person/action rule) with longest-match-wins + safety-first tie-break;
  ten approved lines wired in `moderation.ts`
- `2540c87` step 4c: repair lines (GK-UNKNOWN, B12, transfer-request)
- `a6f2e14` step 4d: DOG EMERGENCY (checked before the dog-health boundary) +
  BARK-T16 assertion updated (chocolate is an emergency)
- `8f78f5d` step 4e: transfer-request triggers widened and narrowed

Preview URL (latest `pick-a-chum`):
https://pedigree-chums-git-pick-a-chum-federationdesign-5910s-projects.vercel.app

All fifteen of Steve's test inputs were traced through the live engine and route
correctly (safeguarding/medical/self-harm/general-distress/harm/dog-emergency,
plus the false-positive guards: "stroke the dog" -> fallback, "what is a penis"
-> neither).

## Held, and why (do not start)

- Step 5 (D6): recorder redaction (redact safety turns at capture, keep category
  + route + timestamp only) and the replay skip for redacted rows. HELD at
  Steve's request so his own test inputs stay visible in the export during this
  round. The launcher is hidden on production, so no real visitor can generate a
  disclosure meanwhile. D6 goes in AFTER the test round.

## Two open items

1. Step 5 / D6 recorder redaction + replay skip (held, above). Touchpoint:
   `app/pick-a-chum/dev/recorder-store.ts` stores raw `input`/`normalised` and
   exports them; redact those for any safety-category turn at capture.
   `scripts/replay-pickachum.mjs` then skips rows with empty input.
2. Card lookup. "find me a labrador card", "do you have a pug card" etc. have no
   dedicated route; they land on the fallback or the bare-help clarifier. This
   is a content-coverage gap, not a safety issue. Logged for the breeds round.

## Harness floor

`scripts/test-pickachum.mjs` is at **280 passing, 0 failing** (RUN 3). The floor
to hold going forward is **280**: do not remove or weaken existing assertions;
new work only adds. (There is no coded ratchet yet; the floor is a convention. A ratchet
is a Phase-0 item in the Recovery Rules runbook, unbuilt.) The one permitted
edit so far was BARK-T16 (chocolate -> dog emergency), done in its own commit
with before/after shown.

## Sequencing note

The safety net lives only on `pick-a-chum`. Merging it to `main` ships the safety
net. It does NOT re-expose the launcher: the D1 hide (`f76f8b8`) is a commit on
`main`, and merging does not revert commits already on `main`. Verified
(2026-07-26): `pick-a-chum` has NOT separately modified `app/layout.tsx`
(`git log main..pick-a-chum -- app/layout.tsx` is empty; the file is identical to
the merge base `c546d87`). Only `main` changed that file, so a 3-way merge keeps
`main`'s hidden version with no conflict. To bring the launcher back, revert
`f76f8b8` deliberately, after the test round and after D6 (step 5) is in, so a
real visitor never meets the launcher without redaction in place.
