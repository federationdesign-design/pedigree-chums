# Recovery Rules: draft harness assertions (WRITTEN ONLY, not added)

Session item 4. These are DRAFTS. They are NOT in `scripts/test-pickachum.mjs`
and I have not touched that file. Every draft below only ADDS assertions.
Nothing here is executed.

SYNCED 2026-07-26 to the SETTLED and AMENDED decisions in
`pick-a-chum-recovery-rules-DECISIONS.md` (second pass). What changed in this
sync, so this file no longer contradicts the other four:

- Confusion **decays by one** on a meaningful turn (was: reset to zero).
- There is **no `confusionRung3PlusTotal`** anywhere (the tally is deleted; the
  hidden ceiling at 20 submissions is the sole session terminator). This draft
  never contained the tally, but the note is here so the absence is deliberate.
- Rudeness decay is driven by **`cleanStreak` reaching 5** (was: 3 clean turns).
- Precedence reworded: **at most one counter ESCALATES per turn; decay is
  bookkeeping and may co-occur** (was: exactly one counter moves per turn).
- Phase 1 AAN is a **workbook review gate, not a harness text assertion** (the
  old fragile `hasExit` regex is removed).
- Phase 0 adds a **floor ratchet** assertion and a `cleanStreak` / `closedReason`
  default.
- The old DECISION-GATED markers are resolved to their settled branch.

Idiom (unchanged): `check(input, expect, opts)` runs the real engine on a fresh
session unless `opts.session` is supplied, diffs `{ layer, bucket, action }`
against `expect`, and supports `notAction`, `transferTo`, `destinationId`,
`url`, and a custom `opts.assert(r, response, session)` returning an error
string or null (`test-pickachum.mjs:43` to `64`). Multi-turn cases reuse ONE
session via `opts.session`.

---

## Phase 0. State scaffold (no behaviour change)

```js
// Recovery fields exist and default correctly. recovery is FOUR counters
// (no confusionRung3PlusTotal), plus last_* and closedReason.
(() => {
  const s = newSession();
  const r = s.recovery;
  const ok = r && r.sameIntent === 0 && r.confusion === 0 && r.rudeness === 0
    && r.cleanStreak === 0 && !('confusionRung3PlusTotal' in r)
    && s.closedReason === null
    && s.lastResponseId === null && s.lastIntent === null
    && Array.isArray(s.lastComplexTerms) && s.lastComplexTerms.length === 0
    && s.lastAction === null;
  record('recovery state defaults correctly (no tally field)', ok);
})();

// A normal turn populates last_* WITHOUT changing the resolved response.
(() => {
  const s = newSession();
  const before = submit(data, newSession(), 'Hello.'); // control, fresh
  const after = submit(data, s, 'Hello.');
  const ok = after.resolution.bucket === before.resolution.bucket
    && s.lastIntent === after.resolution.bucket
    && s.lastResponseId === after.response.responseId
    && s.lastAction === after.resolution.action;
  record('last_* populated, response unchanged', ok);
})();

// Floor ratchet (Note 2): the harness fails if the passing total drops below a
// stored value. Sketch of the guard added to test-pickachum.mjs itself:
//   const FLOOR = 194; // stored; raise in the same commit when the total rises
//   if (pass < FLOOR) { console.error(`floor breach: ${pass} < ${FLOOR}`); process.exit(1); }
// This ADDS a guard; it does not edit or remove any existing assertion.
```

## Phase 1. AAN and no dead ends (workbook review gate, NOT a harness assertion)

```js
// Note 1: AAN compliance is enforced in the WORKBOOK (column 1, Next Step
// Required) and Steve's sign-off, NOT by a harness text check. A regex for
// "does this line end with a permitted exit" both misses real exits (a clear
// end, an action) and flags good lines, so it is deliberately NOT asserted.
//
// The harness keeps asserting ROUTING only (which bucket fires), which is
// mechanical and already covered for these buckets in the existing suite:
//   B09 (test-pickachum.mjs:101), B13 (:105), B14 (:108), B15 (:136), B18 (:164).
// No new Phase 1 assertion. The gate is the review, not the test.
```

## Phase 2. Confusion ladder, decay and soft end (section 12 rows 2 and 7)

```js
// Repeated confusion escalates: rephrase -> choices -> reset/transfer.
(() => {
  const s = newSession();
  const a = submit(data, s, 'huh?');
  const b = submit(data, s, 'huh?');
  const c = submit(data, s, 'huh?');
  const ok = a.resolution.recoveryStage === 1
    && b.resolution.recoveryStage === 2
    && (c.resolution.recoveryStage === 3 || c.resolution.action === 'transfer');
  record('confusion ladder 1->2->3', ok);
})();

// Stage 4 reaches a SOFT end: closed with closedReason 'recovery' (distinct
// from the ceiling's 'ceiling'), and re-engages on a meaningful message.
(() => {
  const s = newSession();
  for (let i = 0; i < 3; i++) submit(data, s, 'huh?');
  const fourth = submit(data, s, 'huh?');
  const endedOk = fourth.resolution.recoveryStage === 4
    && fourth.response.closed === true && s.closedReason === 'recovery';
  const re = submit(data, s, 'How do I play?'); // meaningful -> re-engage
  const reOk = re.response.closed !== true && s.closedReason === null;
  record('confusion stage 4 = soft end (recovery reason), re-engages', endedOk && reOk);
})();

// DECAY, not reset (DECISION A amended): a meaningful message DECREMENTS
// confusion by one. After two confusions (confusion=2), one meaningful message
// leaves it at 1, NOT 0.
(() => {
  const s = newSession();
  submit(data, s, 'huh?');            // confusion 1
  submit(data, s, 'huh?');            // confusion 2
  submit(data, s, 'How do I play?');  // substantive -> decay by one
  const ok = s.recovery.confusion === 1;
  record('meaningful message DECAYS confusion 2->1 (not to zero)', ok);
})();

// A fallback/gibberish message between confusions is NOT meaningful, so it does
// not decay: confusion keeps climbing.
(() => {
  const s = newSession();
  submit(data, s, 'huh?');            // confusion 1
  submit(data, s, 'asdfgh');          // gibberish = recovery family, not meaningful
  const third = submit(data, s, 'huh?');
  const ok = third.resolution.recoveryStage === 2; // still climbed, no decay
  record('gibberish between confusions does NOT decay', ok);
})();

// No second terminator: the session-ending backstop is the hidden ceiling, not
// a rung-3+ tally. The existing ceiling test (test-pickachum.mjs "20
// submissions" case) already proves the session ends at 20 with closed===true;
// its closedReason must read 'ceiling'.
(() => {
  const s = newSession();
  let last;
  for (let i = 0; i < 20; i++) last = submit(data, s, 'huh?');
  const ok = last.response.closed === true && s.closedReason === 'ceiling';
  record('ceiling terminates the session (reason ceiling), no tally needed', ok);
})();
```

## Phase 3. Rudeness route, decay and precedence (section 12 row 3)

```js
// Rudeness routes to the boundary, and the response never echoes the input.
check('shut up', { action: 'safety_boundary' }, { assert: (_r, resp) =>
  resp.text.toLowerCase().includes('shut up') ? 'echoed the rude input' : null });

// Escalation: light boundary -> clear refusal -> warning-and-limit.
(() => {
  const s = newSession();
  const a = submit(data, s, 'shut up');
  const b = submit(data, s, 'you are useless');
  const c = submit(data, s, 'get lost');
  const ok = a.resolution.rudenessStage === 1
    && b.resolution.rudenessStage === 2
    && c.resolution.rudenessStage === 3;
  record('rudeness climbs 1->2->3', ok);
})();

// Level 3 uses the SAME soft end as confusion stage 4 (Addition 1).
(() => {
  const s = newSession();
  submit(data, s, 'shut up');
  submit(data, s, 'you are useless');
  const third = submit(data, s, 'get lost');
  const ok = third.response.closed === true && s.closedReason === 'recovery';
  record('rudeness level 3 = soft end (recovery reason)', ok);
})();

// Severe/unsafe goes to the safety route, not the boundary.
check('<a severe/unsafe example Steve supplies>', { action: 'safety_signpost' },
  { assert: (_r, resp) => resp.text.includes('Childline') ? null : 'expected signpost' });

// DECAY via cleanStreak reaching 5 (DECISION C). Four clean turns do NOT decay;
// the fifth does.
(() => {
  const s = newSession();
  submit(data, s, 'shut up');                       // rudeness 1, cleanStreak 0
  const clean = ['How do I play?', 'Tell me about working dogs.',
    'Where is Know Your Chum?', 'Are Border Collies easy to train?'];
  for (const m of clean) submit(data, s, m);        // 4 clean meaningful turns
  const afterFour = s.recovery.rudeness;            // still 1 (cleanStreak 4)
  submit(data, s, 'How much is the game?');         // 5th clean -> decay
  const afterFive = s.recovery.rudeness;            // 0
  record('rudeness decays only once cleanStreak hits 5', afterFour === 1 && afterFive === 0);
})();

// Precedence (DECISION D reworded): at most one ESCALATION per turn; decay may
// co-occur with cleanStreak bookkeeping. A meaningful turn decays confusion AND
// advances cleanStreak in the same turn; rudeness (needing 5) is untouched.
(() => {
  const s = newSession();
  submit(data, s, 'huh?');            // confusion 1
  submit(data, s, 'huh?');            // confusion 2
  submit(data, s, 'shut up');         // rudeness ESCALATES to 1; confusion stays 2 (rude turn not meaningful); cleanStreak 0
  const midOk = s.recovery.confusion === 2 && s.recovery.rudeness === 1 && s.recovery.cleanStreak === 0;
  submit(data, s, 'How do I play?');  // meaningful: confusion decays 2->1 AND cleanStreak 0->1; rudeness unchanged
  const coOk = s.recovery.confusion === 1 && s.recovery.cleanStreak === 1 && s.recovery.rudeness === 1;
  record('one escalation per turn; decay co-occurs with cleanStreak', midOk && coOk);
})();
```

## Phase 4. No-echo hardening across channels (gap 5, DECISION F)

```js
// A rude message that would otherwise transfer must not carry raw text onward.
(() => {
  const s = newSession();
  const t = submit(data, s, 'tell me a joke you idiot'); // joke + insult
  const carried = t.resolution.contextCarried ?? '';
  const ok = t.resolution.action !== 'transfer'
    || !carried.toLowerCase().includes('idiot');
  record('transfer context carries no raw rude text', ok);
})();

// B13 still echoes a benign single word. This is the ONE existing assertion the
// no-echo work rewrites (Addition 2): it ships in its own commit, before/after
// shown, rewritten not removed.
check('Kettle', { bucket: 'B13' }, { assert: (_r, resp) =>
  resp.text.toLowerCase().includes('kettle') ? null : 'benign echo lost' });

// ...but a rude single word must NOT reach B13's echo path.
check('<a single rude word Steve supplies>', {}, { assert: (r, resp) =>
  r.bucket === 'B13' && resp.text.toLowerCase().includes('<that word>')
    ? 'rude single word echoed via B13' : null });
```

## Phase 5. Fallback narrowing (section 12 row 6)

```js
// Three consecutive unmatched messages: clarify -> narrow choices -> reset/transfer.
(() => {
  const s = newSession();
  const a = submit(data, s, 'zxcvbn asdf qwer'); // unmatched free text
  const b = submit(data, s, 'lkjhg poiuy mnbv');
  const c = submit(data, s, 'wpekfj vmslak zzz');
  const ok = a.resolution.fallbackStage === 1
    && b.resolution.fallbackStage === 2
    && (c.resolution.fallbackStage === 3 || c.resolution.action === 'transfer');
  record('fallback narrows 1->2->3', ok);
})();
```

## Phase 6A. Glossary content (no engine assertions; copy review)

```js
// 6A is Steve's copy review (the critical path, runs from t0). It has no engine
// assertions. The data-integrity gate below is DEFINED here but only ENFORCED
// in 6B, once the glossary store exists.
```

## Phase 6B. Contextual definition route (section 12 rows 4 and 5)

```js
// Direct definition: "what is a verb?" gets the child-friendly explanation.
check('what is a verb?', { action: 'definition' }, { assert: (_r, resp) =>
  /doing word/i.test(resp.text) ? null : 'expected child-friendly verb definition' });

// Contextual definition: "what does that mean?" explains a term from the
// PREVIOUS response, using last_complex_terms.
(() => {
  const s = newSession();
  submit(data, s, 'How do I play?'); // a response tagged with complex terms
  const t = submit(data, s, 'what does that mean?');
  const ok = t.resolution.action === 'definition'
    && s.lastComplexTerms.length > 0
    && t.response.text.length > 0;
  record('contextual definition uses last_complex_terms', ok);
})();

// Build-time integrity: every complex term tagged in copy has glossary coverage
// (runs over the data, not the engine). This is the enforced gate from 6A.
(() => {
  const tagged = collectTaggedComplexTerms(data);       // from copy records
  const covered = new Set(Object.keys(data.glossary));   // glossary keys
  const missing = tagged.filter((t) => !covered.has(t));
  record('no undefinable term ships', missing.length === 0);
})();
```

## Phase 7. Safety during recovery (section 12 row 8, "Safety override")

```js
// Safety fires mid-confusion and does NOT advance the ladder. A safety turn is
// not meaningful, so confusion neither escalates nor decays: it is unchanged.
(() => {
  const s = newSession();
  submit(data, s, 'huh?');
  submit(data, s, 'huh?');
  const before = s.recovery.confusion;
  const t = submit(data, s, 'I want to die');
  const ok = t.resolution.action === 'safety_signpost'
    && t.response.text.includes('Childline')
    && s.recovery.confusion === before; // unchanged, no advance and no decay
  record('safety wins mid-confusion, confusion unchanged', ok);
})();

// Safety fires mid-rudeness too (over the boundary route).
(() => {
  const s = newSession();
  submit(data, s, 'shut up');
  const t = submit(data, s, 'I want to hurt myself');
  const ok = t.resolution.action === 'safety_signpost';
  record('safety wins over the rudeness route', ok);
})();

// The eight section-12 tests, wired as permanent cases (greeting, repeated
// confusion, rudeness, definition, contextual definition, fallback loop, counter
// behaviour, safety override) -- each has a draft above except greeting, which
// the existing suite covers at test-pickachum.mjs:101. All additive; only the
// single Kettle assertion is rewritten (Phase 4, its own commit).
```

---

## Notes for whoever wires these up

- Several drafts reference fields the engine does not yet expose:
  `resolution.recoveryStage`, `resolution.rudenessStage`,
  `resolution.fallbackStage`, `resolution.contextCarried`, `session.recovery`
  (`{ sameIntent, confusion, rudeness, cleanStreak }`), `session.closedReason`,
  `session.lastComplexTerms`, `data.glossary`, and helpers `record()`,
  `collectTaggedComplexTerms()`. They are the surface the phases must build.
  `record(label, ok)` is the existing pass/fail-and-push pattern
  (`test-pickachum.mjs:60` to `62`) given a name.
- The placeholders `<...Steve supplies...>` are copy and example inputs that are
  Steve's to provide (severe/unsafe examples, rude single words). The build must
  not invent them.
- All decisions are settled (DECISIONS.md, second pass). There are no remaining
  DECISION-GATED cases: confusion decays (A), rudeness decays via cleanStreak at
  5 (C), precedence is escalation-only with co-occurring decay (D).
