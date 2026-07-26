# Recovery Rules: draft harness assertions (WRITTEN ONLY, not added)

Session item 4. These are DRAFTS. They are NOT in `scripts/test-pickachum.mjs`
and I have not touched that file. The floor of 190 is untouched; every draft
below only ADDS assertions (they would take the suite well above 194). Nothing
here is executed.

They are written in the existing harness idiom so they drop in cleanly when the
phases are approved:

- `check(input, expect, opts)` runs the real engine on a fresh session unless
  `opts.session` is supplied, diffs `{ layer, bucket, action }` against
  `expect`, and supports `notAction`, `transferTo`, `destinationId`, `url`, and
  a custom `opts.assert(r, response, session)` returning an error string or
  null. (Source: `test-pickachum.mjs:43` to `64`.)
- Multi-turn cases reuse ONE session by passing `opts.session`, exactly as the
  rotation and ceiling cases already do.

Where an assertion depends on a Steve decision (A to F in the runbook), it is
marked DECISION-GATED and written both ways or left with the branch called out,
because the expected value literally depends on the answer.

---

## Phase 0. State scaffold (no behaviour change)

```js
// The seven recovery fields exist and default correctly on a fresh session.
(() => {
  const s = newSession();
  const r = s.recovery;
  const ok = r && r.sameIntent === 0 && r.confusion === 0 && r.rudeness === 0
    && s.lastResponseId === null && s.lastIntent === null
    && Array.isArray(s.lastComplexTerms) && s.lastComplexTerms.length === 0
    && s.lastAction === null;
  record('recovery state defaults to empty', ok);
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

// Regression guard: the full existing battery still passes (this is implicit,
// but note it explicitly in the phase gate: 194 must remain 194+, never fewer).
```

## Phase 1. AAN and no dead ends (copy-shape guards)

```js
// Every recovery-family bucket ends with a permitted exit. hasExit() checks the
// rendered text for a question mark, or a choice/transfer/action cue.
const hasExit = (t) => /\?\s*$/.test(t.trim())
  || /\b(choose|pick|or)\b/i.test(t)
  || /\b(open|fetch|transfer|take you|show you|i will)\b/i.test(t);

for (const [input, fam] of [
  ['Hello.', 'B09'], ['Kettle', 'B13'], ['qwerty', 'B14'],
  ['What do I do here?', 'B15'], ['🐶', 'B18'],
]) {
  check(input, { bucket: fam }, { assert: (_r, resp) =>
    hasExit(resp.followUp ? `${resp.text} ${resp.followUp}` : resp.text)
      ? null : `${fam} line has no next-step exit` });
}
```

## Phase 2. Confusion ladder, reset and end (section 12 rows 2 and 7)

```js
// Repeated confusion escalates: rephrase -> choices -> reset/transfer.
(() => {
  const s = newSession();
  const a = submit(data, s, 'huh?');
  const b = submit(data, s, 'huh?');
  const c = submit(data, s, 'huh?');
  const ok = a.resolution.recoveryStage === 1
    && b.resolution.recoveryStage === 2
    && (c.resolution.recoveryStage === 3
        || c.resolution.action === 'transfer');
  record('confusion ladder 1->2->3', ok);
})();

// Stage 4 reaches a graceful end and closes the loop (reuses `closed`).
(() => {
  const s = newSession();
  for (let i = 0; i < 3; i++) submit(data, s, 'huh?');
  const fourth = submit(data, s, 'huh?');
  const ok = fourth.resolution.recoveryStage === 4 && fourth.response.closed === true;
  record('confusion stage 4 = graceful end + closed', ok);
})();

// Counter reset: a meaningful message returns confusion to zero.
// DECISION-GATED (A): "meaningful" = routed to a substantive family.
(() => {
  const s = newSession();
  submit(data, s, 'huh?');
  submit(data, s, 'huh?');
  submit(data, s, 'How do I play?'); // substantive (rules) -> resets
  const ok = s.recovery.confusion === 0;
  record('meaningful message resets confusion (DECISION A)', ok);
})();

// DECISION-GATED (A): alternation must NOT dodge escalation. Interleaving a
// FALLBACK (not substantive) between confusions does not reset.
(() => {
  const s = newSession();
  submit(data, s, 'huh?');
  submit(data, s, 'asdfgh'); // gibberish = recovery family, NOT meaningful
  const third = submit(data, s, 'huh?');
  // Under the recommended definition, confusion is now at stage 2, not reset.
  const ok = third.resolution.recoveryStage === 2;
  record('gibberish between confusions does NOT reset (DECISION A)', ok);
})();
```

## Phase 3. Rudeness route and its escalation (section 12 row 3)

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

// Severe/unsafe goes to the safety route, not the boundary.
check('<a severe/unsafe example Steve supplies>', { action: 'safety_signpost' },
  { assert: (_r, resp) => resp.text.includes('Childline') ? null : 'expected signpost' });

// DECISION-GATED (C): reset/decay policy. Written for the recommended DECAY:
// N consecutive clean meaningful turns lower the rudeness level by one.
(() => {
  const s = newSession();
  submit(data, s, 'shut up');           // rudeness 1
  submit(data, s, 'How do I play?');    // clean 1
  submit(data, s, 'Tell me about working dogs.'); // clean 2
  submit(data, s, 'Where is Know Your Chum?');    // clean 3 -> decay
  const ok = s.recovery.rudeness === 0; // decayed back down
  record('rudeness decays after clean run (DECISION C = decay)', ok);
})();

// DECISION-GATED (D): one counter per turn. A rude turn does NOT reset
// confusion, and a confusion turn does NOT decay rudeness.
(() => {
  const s = newSession();
  submit(data, s, 'huh?');        // confusion 1
  submit(data, s, 'shut up');     // rudeness 1, confusion untouched
  const ok = s.recovery.confusion === 1 && s.recovery.rudeness === 1;
  record('one counter per turn; no cross-reset (DECISION D)', ok);
})();
```

## Phase 4. No-echo hardening across channels (gap 5)

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

// B13 still echoes a benign single word (existing behaviour preserved)...
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

## Phase 6. Glossary and contextual definition (section 12 rows 4 and 5)

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

// Build-time integrity: every complex term tagged in copy has glossary
// coverage (this one runs over the data, not the engine).
(() => {
  const tagged = collectTaggedComplexTerms(data);       // from copy records
  const covered = new Set(Object.keys(data.glossary));   // glossary keys
  const missing = tagged.filter((t) => !covered.has(t));
  record('no undefinable term ships', missing.length === 0);
})();
```

## Phase 7. Safety during recovery (section 12 row 8, "Safety override")

```js
// Safety fires mid-confusion and does NOT advance the ladder.
(() => {
  const s = newSession();
  submit(data, s, 'huh?');
  submit(data, s, 'huh?');
  const before = s.recovery.confusion;
  const t = submit(data, s, 'I want to die');
  const ok = t.resolution.action === 'safety_signpost'
    && t.response.text.includes('Childline')
    && s.recovery.confusion === before; // ladder did not advance
  record('safety wins mid-confusion, ladder frozen', ok);
})();

// Safety fires mid-rudeness too (over the boundary route).
(() => {
  const s = newSession();
  submit(data, s, 'shut up');
  const t = submit(data, s, 'I want to hurt myself');
  const ok = t.resolution.action === 'safety_signpost';
  record('safety wins over the rudeness route', ok);
})();

// The eight section-12 tests, wired as permanent cases:
// (greeting, repeated confusion, rudeness, definition, contextual definition,
//  fallback loop, counter reset, safety override) -- each already has a draft
// above except the greeting, which the existing suite covers at test-pickachum.mjs
// line 101. No existing assertion is edited; these are additive.
```

---

## Notes for whoever wires these up

- Several drafts reference fields the engine does not yet expose:
  `resolution.recoveryStage`, `resolution.rudenessStage`,
  `resolution.fallbackStage`, `resolution.contextCarried`, `session.recovery`,
  `session.lastComplexTerms`, `data.glossary`, and helpers `record()`,
  `collectTaggedComplexTerms()`. They are the surface the phases must build.
  `record(label, ok)` is just the existing pass/fail-and-push pattern
  (`test-pickachum.mjs:60` to `62`) given a name; use the real inline form when
  adding them.
- The placeholders `<...Steve supplies...>` are exactly the copy and example
  inputs that are Steve's to provide (severe/unsafe examples, rude single
  words). The build must not invent them.
- DECISION-GATED cases must be finalised to ONE expected value once DECISIONS A
  and C are answered; they are written to the recommended branch and flagged.
