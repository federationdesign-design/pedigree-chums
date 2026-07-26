# Pick a Chum safety net: handover (for picking up cold)

Date: 2026-07-26. Everything below is on branch `pick-a-chum` (preview) EXCEPT
the one production change noted. Nothing is merged to `main`.

## State in one line

The safety net is built and deployed to the `pick-a-chum` PREVIEW only. The
Pick a Chum launcher is HIDDEN on production while it is tested. Steve is running
a test round; do not start anything new until he returns with findings.

---

## RUN 6 (2026-07-26, two regressions + all ten breed lines + games roster). Read this first.

All on `pick-a-chum` preview. Harness **300 passing, 0 failing** (RUN 5 ended at
294). Nothing merged to `main`. Commits this session (after RUN 5's `ac5c3ac`):

- `d9cc581` identity outranks the breed hub: "are you a dog" now reaches B16
  identity. The hub's stopword strip collapsed it to "dog"; F02 gained the
  trigger. (Pass3 regression.)
- `9fa1cf7` widen `TRANSFER_VERBS` (take me back to / get me / bring me / put me
  back to / go back to / swap to / i want the / can i have the): a switch-back
  phrasing plus a dog name is a handoff, not the breed page ("take me back to the
  collie"). (Pass3 regression.)
- `7ffde2b` six breed one-liners (cocker spaniel, beagle, french bulldog, pug,
  german shepherd, staffordshire bull terrier). ALL TEN breeds now have a factual
  line, every one DRAFT-UNVERIFIED.
- Docs (this section): `agent/pick-a-chum-games-roster.md` (parked six-game roster
  + game-surface faults) and this handover update.

Reports produced this session (files, not in repo, under `~/Downloads/`):
`pick-a-chum-sim-results-pass3.csv`, `breed-hub-sweep.csv`, `game-sweep.csv`,
`breed-hub-stopword-check.md`, `b15-orientation-report.md`,
`breed-handoff-trace.md`, `close-with-link-home-and-gate.md`.

Built: the two regression fixes; all ten breed factual one-liners (DRAFT); the
games roster doc.

Paused (approved, NOT built): PERSONAL_SADNESS_GENTLE_REDIRECT (L2 variant copy
owed).

Needs COPY / decisions from Steve:
- Verification of all ten DRAFT-UNVERIFIED breed one-liners (breed pages + a
  Kennel Club source) before merge.
- Breed choice framing line `BREED-CHOICE` (still outstanding).
- The rest of the "Link Handoffs" library beyond the 12 seeded NAV_BREED_HANDOFF
  (Steve intends 20 per dog) plus the CLOSE_WITH_LINK family (20 per dog).
- L2-variant distress copy (sadness redirect).

OPEN items to carry:
1. The /chums index page renders a placeholder STUB ("Chums index - hello");
   BREED_HUB links to it (real route, unfinished).
2. The breed page link may not render in the browser (engine correct at HEAD;
   likely a stale bundle, see `~/Downloads/breed-handoff-trace.md`).
3. The breed choice framing line is still outstanding.
4. All ten breed one-liners are DRAFT-UNVERIFIED, not approved.
5. The game surface has routing faults, recorded in
   `agent/pick-a-chum-games-roster.md` (play-not-ready, the age FAQ over- and
   under-matching, one B02 rules blurb for every rules question, "what is pedigree
   chums" -> gk_unknown, and several missing routes).
6. Orientation is unfixed: the B15 report (`~/Downloads/b15-orientation-report.md`)
   is written but NOT acted on ("whats this?", "what can you do" etc. reach
   gk_unknown, not B15).

---

## RUN 5 (2026-07-26, choice fix + theatre + breed handoff/hub/best + sim).

All on `pick-a-chum` preview. Harness is **294 passing, 0 failing** (RUN 4 ended at
285). Nothing merged to `main`. Commits this session, newest last:

- `5ef1fa9` fix one-option breed_choice: a bare cross-family word ("spaniel",
  "shepherd") that matches exactly ONE proof breed now routes to that breed's page,
  not a single-option "choice"; a choice needs two or more matches (287).
- `61f9db6` typing theatre types clean copy: removed the deliberate misspellings
  (standing AND corrected) that were corrupting breed facts (287).
- `3f3d60d` breed page handoff + contextual link gate: new "Link Handoffs" workbook
  sheet (Family / Response ID / Dog / Line / Status); 12 NAV_BREED_HANDOFF lines
  seeded (3 per dog). breed_page renders factual + active-dog handoff + [LINK]. UI
  `contextualLink` flag lets the breed link show mid-chat (288).
- `1d3ba05` reinstate the self-correcting typo on CHARACTER copy only (`NO_TYPO`
  set): never on breed facts / FAQ / rules / GK / safety, and never a standing typo
  (289).
- `8867922` breed hub + breed best shared lines: BREED_HUB (breed question, no breed
  named) and BREED_BEST (superlative). Both after matchBreed so a named breed always
  wins. BREED_HUB links the /chums index; BREED_BEST has no link (294).
- `83e3e76` multi-turn sim as permanent tooling: `scripts/sim-multi-turn.mjs` +
  `scripts/sim-scenarios.txt` (12 scenarios seeded from pass2), `npm run sim`.

Produced this session (files, not in repo): `~/Downloads/` pass3 sim
(`pick-a-chum-sim-results-pass3.csv`), `breed-hub-sweep.csv`,
`b15-orientation-report.md`, `breed-handoff-trace.md`,
`close-with-link-home-and-gate.md`.

Copy owed by Steve (nothing invented):
- Six per-breed factual lines (cocker spaniel, beagle, french bulldog, pug, german
  shepherd, staffordshire bull terrier); plus verification of the four
  DRAFT-UNVERIFIED one-liners (breed pages + a Kennel Club source) before merge.
- The rest of the "Link Handoffs" sheet: NAV_BREED_HANDOFF beyond the 12 seeded
  (Steve intends 20 per dog) and the CLOSE_WITH_LINK family (end-of-conversation,
  20 per dog). Format is fixed; paste into the workbook sheet.
- Breed choice framing `BREED-CHOICE`; L2-variant distress copy (sadness redirect).

Paused (approved, NOT built, survives): PERSONAL_SADNESS_GENTLE_REDIRECT (L2
variant copy owed).

Two OPEN items from this session:
1. The /chums index page renders a placeholder STUB ("Chums index - hello").
   BREED_HUB attaches /chums as its [LINK] because the route is real (not
   invented), but it is unfinished. Decide: build the index page, or drop the link
   until it exists.
2. The breed page link may not render in the browser. At HEAD the engine returns
   the handoff inside `response.text` and sets `url`, and the UI logic reaches the
   ActionLink branch (full trace in `~/Downloads/breed-handoff-trace.md`); the
   preview showing only the factual line points to a stale bundle / browser cache.
   Needs re-verification on a confirmed-fresh `1d3ba05`+ deploy. (Design note:
   BREED_BEST intentionally has no handoff/link, as every handoff line is a link
   pointer and "best" has no destination.)

---

## RUN 4 (2026-07-26, breed aliases + two guards + four breed one-liners).

All on `pick-a-chum` preview. Harness is **285 passing, 0 failing** (started this
run at 280). Nothing merged to `main`. Two commits this run:

- `84b6cdb` breed aliases + two guards.
  - Steve's alias lists wired into `router.ts` `BREED_PAGES[].aliases`: labrador
    (lab, labs, lab retriever, labrador retriever), border collie (collie,
    collies), cocker spaniel (cocker, cockers), french bulldog (frenchie,
    frenchies, frenchy, french bull dog, french bulldogs), german shepherd (gsd,
    alsatian, alsation, german shepard, german shepperd), staffie (staffie,
    staffy, staffies, staffordshire, staffie bull terrier, sbt). Boxer, beagle,
    pug, border terrier: no aliases. Excluded per Steve: `staff` (means
    employees), `sheepdog` (Old English Sheepdog is a separate breed), and bare
    `shepherd` / `spaniel` (both routed to the gap, below).
  - GUARD 1 (named-dog handoff): a transfer verb (`talk to` / `speak to` /
    `chat to` ...) naming one of the four chatbot dogs (boxer, labrador, terrier,
    collie) is a handoff, checked BEFORE breed retrieval, so "can I talk to the
    boxer" reaches the Boxer, not the Boxer breed page. NOTE: this was NOT winning
    before the fix (boxer is a breed page and matched first); now fixed.
  - GUARD 2 (bare cross-family word): bare `spaniel` / `shepherd` go to the
    confidence gap as a `breed_choice`, never a confident single-page guess
    (`AMBIGUOUS_FAMILY` in `router.ts`). Qualified forms ("cocker spaniel",
    "german shepherd") still match their page. `assembler.ts` `breed_choice` now
    joins a variable-length option list (one option for a bare family word).
  - 5 assertions added (280 -> 285): "can I talk to the boxer" -> transfer;
    "spaniel" -> breed_choice; alsatian -> /chums/german-shepherd; staffie ->
    /chums/staffordshire-bull-terrier; lab -> /chums/labrador.
- `84b6cdb`+1 four breed one-liners (this run). The SHARED factual answer (no dog
  voice) for labrador, border collie, boxer, border terrier wired into
  `assembler.ts` `case 'breed_page'`. The character handoff line and the [LINK]
  (the real breed-page url) follow as specced; the handoff copy is still owed.
  These four are **DRAFT-UNVERIFIED, not approved**: the historical claims need
  checking against the breed pages and a Kennel Club source before this branch
  merges (logged in PLACEHOLDERS.md). Six per-breed lines still owed.

Still owed by Steve after this run (logged in PLACEHOLDERS.md):
- Six per-breed page lines: cocker spaniel, beagle, french bulldog, pug, german
  shepherd, staffordshire bull terrier.
- Verification of the four DRAFT-UNVERIFIED one-liners (breed pages + Kennel Club).
- The per-breed character-handoff line that follows each factual answer.
- Breed choice framing `BREED-CHOICE` (the "A or B?" sentence).
- Breed hub line (still the approved fallback stand-in).
- Carried: L2-variant distress copy for the sadness redirect (below).

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

`scripts/test-pickachum.mjs` is at **300 passing, 0 failing** (RUN 6). The floor
to hold going forward is **300**: do not remove or weaken existing assertions;
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
