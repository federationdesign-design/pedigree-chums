# Pick a Chum: out-of-domain handling design (REPORT ONLY)

Task 7. How to tell four kinds of "we did not match this" apart, using a SHAPE
test (structure of the message), not a semantic classifier. Report only, no
build. The point: "Is there a God?" is a clear, well-formed question that is
simply outside scope, and today it gets `gk_unknown` -> "try that again as a full
question", which is wrong (they DID ask a full question).

## The four cases

1. **valid-but-unsupported** - a well-formed question we do not answer (God,
   politics, maths homework). The visitor did nothing wrong; we just do not cover
   it. Today: mis-served by `gk_unknown` telling them to rephrase.
2. **near-domain** - adjacent to our world (dogs, the game, the site) but not a
   matched route, e.g. "what's the best dog food brand?", "how much does a real
   labrador cost?". Should narrow toward what we DO cover.
3. **malformed-but-recoverable** - a real attempt that is a fragment or typo,
   e.g. "wat dog", "the labrdor", "name gen?". Recoverable with a retry/clarify.
4. **true gibberish** - a keyboard smash ("asdfgh", "jkljkl"). Already handled by
   B14.

## Why a shape test, not a classifier

We do not need to know the topic. We need three structural reads the router can
already produce, composed in order:

- **Is it structurally a question / well-formed?** Signal: starts with a wh-word
  (what/who/where/when/why/how) OR an auxiliary/opener (is/are/do/does/can/will/
  should/could/would) OR ends with "?", AND has at least ~3 real-word tokens.
  (Note: the existing `GK_SHAPE` regex is too narrow, it misses "Is there a God?"
  which opens with "is". Broaden it to the auxiliary set above.)
- **Is it gibberish?** Signal: the existing `isGibberish` (keyboard runs, no
  vowels, low vowel ratio, single letters). This is already a pure shape test.
- **Does it carry domain vocabulary?** Signal: contains a domain token (dog,
  dogs, breed, puppy, game, play, card, cards, chum, site, website, rules) that
  did NOT resolve to a route.

Everything is structure and token presence, no meaning.

## Decision order (after all normal routes have missed, before the generic fallback)

```
1. isGibberish(input)                          -> TRUE GIBBERISH        -> B14 (existing copy)
2. has a domain token, but nothing matched     -> NEAR-DOMAIN           -> narrow toward domain
3. well-formed question (broadened shape) AND
   all tokens are plausible real words         -> VALID-BUT-UNSUPPORTED -> "a real question, not my area"
4. otherwise (real words, not a question, not
   domain, not gibberish: a fragment/typo)     -> MALFORMED-RECOVERABLE -> clarify / retry
```

Order matters: gibberish first (cheapest, unambiguous); near-domain before
valid-but-unsupported so "best dog food brand" narrows rather than being brushed
off as unsupported; valid-but-unsupported before malformed so "Is there a God?"
is recognised as a real question, not treated as a typo.

## What each does today vs what it should do

| Case | Today | Should |
|------|-------|--------|
| valid-but-unsupported | `gk_unknown`: "try as a full question" (implies they failed) | acknowledge it is a real question, say it is outside what a dog on a card-game site does, steer back |
| near-domain | usually `gk_unknown` or fallback | narrow: "I don't have that one, but I can help with the dogs, the game or the site" |
| malformed-but-recoverable | `gk_unknown` or fallback (same generic line) | gentle retry / clarify |
| true gibberish | B14 | B14 (no change) |

## Copy I would need from you

I will not write any of these. For each case:

1. **valid-but-unsupported** - ONE new line. The important one. Shape: it grants
   that the question is legitimate, states plainly that it is outside a dog /
   card-game site, and offers the domain. Example shape only (NOT approved copy):
   "That is a fair question, just not one a dog on a card-game site can answer.
   Ask me about the dogs, the game, or the site." Your wording, please.
2. **near-domain** - ONE line, OR a decision to REUSE the existing approved
   fallback line ("...choose dogs, games or the website"), which already narrows
   to the domain. If the fallback line is acceptable here, no new copy is needed.
   Your call.
3. **malformed-but-recoverable** - ONE line, OR reuse the existing approved
   GK-UNKNOWN repair line ("I am not sure what you mean yet. Try asking me as a
   full question..."), which already fits a fragment/typo. If acceptable, no new
   copy. Your call.
4. **true gibberish** - none. Reuses B14.

So the minimum new copy is ONE line (valid-but-unsupported); the other two can
reuse existing approved lines if you approve that reuse.

## Build note (for later, not now)

This is a small addition after the normal route miss: broaden the question-shape
check, add a domain-token check, and branch to the four outcomes. No scoring
layer needed; it is all structure. It would carry its own harness assertions
("Is there a God?" -> valid-but-unsupported; "asdfgh" -> gibberish; "best dog
food brand" -> near-domain; "the labrdor" -> recoverable). Nothing built here.
