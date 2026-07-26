# Pick a Chum safety net: handover (for picking up cold)

Date: 2026-07-26. Everything below is on branch `pick-a-chum` (preview) EXCEPT
the one production change noted. Nothing is merged to `main`.

## State in one line

The safety net is built and deployed to the `pick-a-chum` PREVIEW only. The
Pick a Chum launcher is HIDDEN on production while it is tested. Steve is running
a test round; do not start anything new until he returns with findings.

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
- Older outstanding: the anatomy-alone "curious child" line (a bare body-part word
  with no person/action) is still unwritten; today it falls through to fallback.
- Recorder scored columns (topScore/runnerUp/runnerUpScore/matchedSignals) are
  blank until the scoring/NLU layer exists (not copy, but a dependency).

---

## What shipped today

Production (`main`), the only main change:
- `f76f8b8` D1: launcher hidden on production (commented mount in
  `app/layout.tsx`). Reverse with `git revert`, or it returns when the tested
  branch merges. The `/pick-a-chum` route itself is unchanged.

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

## Three open items

1. Step 5 / D6 recorder redaction + replay skip (held, above). Touchpoint:
   `app/pick-a-chum/dev/recorder-store.ts` stores raw `input`/`normalised` and
   exports them; redact those for any safety-category turn at capture.
   `scripts/replay-pickachum.mjs` then skips rows with empty input.
2. Reported-speech ABUSE collision. ABUSE terms (stupid, idiot, shut up, fuck,
   ...) fire the boundary even when the visitor is REPORTING someone else's
   abuse aimed at them ("my brother called me stupid", "they keep saying shut up
   to me"). That is a safeguarding/distress signal, not abuse to moderate.
   Needs to distinguish reported speech (a person reference + a saying verb
   before the abuse word) and route it to SAFEGUARDING, not the ABUSE boundary.
   Not started.
3. Card lookup. "find me a labrador card", "do you have a pug card" etc. have no
   dedicated route; they land on the fallback or the bare-help clarifier. This
   is a content-coverage gap, not a safety issue. Logged for the breeds round.

## Harness floor

`scripts/test-pickachum.mjs` is at **224 passing, 0 failing**. The floor to hold
going forward is **224**: do not remove or weaken existing assertions; new work
only adds. (There is no coded ratchet yet; the floor is a convention. A ratchet
is a Phase-0 item in the Recovery Rules runbook, unbuilt.) The one permitted
edit so far was BARK-T16 (chocolate -> dog emergency), done in its own commit
with before/after shown.

## Sequencing note

The safety net lives only on `pick-a-chum`. Merging it to `main` will BOTH ship
the safety net AND re-expose the launcher (the D1 hide is main-only). Do that
deliberately, after the test round and after D6 (step 5) is in, so a real
visitor never meets the launcher without redaction in place.
