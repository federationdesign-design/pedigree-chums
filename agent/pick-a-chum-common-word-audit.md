# Pick a Chum: bare common-word trigger audit (REPORT ONLY)

Task 6. Every SINGLE-WORD trigger in the router's keyword lists that is a common
English word an innocent everyday message could contain, and so would be captured
by mistake. Report only, no edits.

Note on Steve's examples: `much`, `letter`, `people`, `card`, `cards` are not
triggers; they live in `normalise.ts` COMMON_WORDS, which is the fuzzy-match
BLOCKLIST (words never fuzzed INTO a trigger). `help` was a real trigger (COMMAND)
and was removed in Q1. The live risks are the bare single-word triggers below.

Matching is whole-word (hasAny), so these fire whenever the word appears as a word,
regardless of surrounding meaning.

## COMMERCIAL -> B01 (opens the discount / offer modal)

| Word | Innocent message it captures |
|------|------------------------------|
| buy | "I'll buy that argument" |
| order | "in order to win" / "the order they came in" |
| cost | "that mistake cost me the game" |
| price | "right, at any price" |
| shop | "the shop down the road" |
| launch | "launch the app for me" / "rocket launch" |
| release | "release the tension" / "new film release" |
| available | "are you available" |

Opening a purchase modal on these is the most visible false positive (a benign
sentence pops the offer).

## FOOD -> B08 transfer to the Labrador

| Word | Innocent message |
|------|------------------|
| food | "food for thought" |
| cheese | "say cheese" |
| bacon | "bring home the bacon" |
| meat | "the meat of the matter" |
| bone | "I broke a bone" / "bone dry" |
| treat | "my treat" / "treat people kindly" |
| dinner | "before dinner" |
| pizza | "pizza night" |
| hungry | "hungry for a win" |

Any of these hands the visitor to the Labrador.

## COMMAND -> B11 (dog-command replies)

| Word | Innocent message |
|------|------------------|
| sit | "should I sit here" |
| stay | "should I stay or go" / "stay safe" |
| fetch | "that will fetch a good price" |
| paw | (low risk) |

## GREETING -> B09

| Word | Innocent message |
|------|------------------|
| morning | "I have a class this morning" |
| evening | "evening classes" |
| afternoon | "this afternoon" |
| yo | (casual, low) |

## TESTING -> B10

| Word | Innocent message |
|------|------------------|
| test | "I failed my test" / "a blood test" |
| testing | "testing the waters" |

## PERSONAL -> B12 (now the repair line). Also a SAFETY-ADJACENCY flag.

| Word | Innocent message | Note |
|------|------------------|------|
| sad | "that film was sad" | mild distress signal; currently NOT safety |
| lonely | "a lonely road" | distress-adjacent; currently NOT safety |
| angry | "the ending made me angry" | |
| clever | "a clever trick" | |

`sad` / `lonely` are worth a second look: a child typing "I feel lonely" gets the
B12 repair line, not any distress route. That is a coverage question for you, not
just a false positive.

## JOKE -> B08 transfer to the Boxer

| Word | Innocent message |
|------|------------------|
| joke | "that's not a joke" |
| funny | "you're funny" / "a funny smell" |

## INVESTIGATE -> B08 transfer to the Terrier

| Word | Innocent message |
|------|------------------|
| dig | "I dig your style" / "dig deep" |
| mystery | "it's a mystery to me" |
| suspicious | "that looks suspicious" |

## TRANSFER_REQUEST -> B08 transfer_request (added this run)

| Word/phrase | Innocent message |
|------|------------------|
| new dog | "I just got a new dog" (a real pet) |
| different dog | "I saw a different dog today" |
| another dog | "there was another dog at the park" |
| another agent / different agent | (narrower, lower risk) |

`new dog` / `different dog` / `another dog` are the widened triggers you approved;
they will catch genuine pet talk. Flagging so you can decide whether to tighten.

## CURRENT_DATA -> B06 gk_unknown (refusal)

| Word | Innocent message |
|------|------------------|
| today | "today I learned something" |
| news | "good news" |
| live | "where do you live" / "live music" |
| score | "what a score" |
| current | "current affairs" |
| latest | "the latest gossip" |

## BREED_CONTENT -> B05 content link

| Word | Innocent message |
|------|------------------|
| article | "an interesting article" |
| essay | "I have to write an essay" |
| detection | "smoke detection" / "crime detection" |

## IDENTITY (B16)

| Word | Family | Innocent message |
|------|--------|------------------|
| software | F03 | "I write software" |
| cartoon | F07 | "I love cartoons" |
| automatic | F05 | "automatic transmission" |
| programmed | F05 | "a programmed response" |
| automated | F05 | "automated email" |
| intelligent | F09 | "intelligent design" |
| the internet | F10 | "the internet is down" |

## COMPLAINT_CONTACT -> B04 FAQ012 (added this run)

| Word | Innocent message |
|------|------------------|
| offensive | "I didn't find it offensive" |

## Safety lists (safety.ts) worth noting

These are deliberate safety triggers, but they are common words and fire on
frustration or casual speech, not only real abuse. Reported speech ("he called me
stupid") is now handled (task 1), but self/site-directed use is not.

| Word | List -> route | Innocent/venting message |
|------|---------------|--------------------------|
| stupid | ABUSE -> boundary | "this is a stupid rule" |
| idiot | ABUSE -> boundary | "I feel like an idiot" |
| useless | ABUSE -> boundary | "this feature is useless" |
| shit | ABUSE -> boundary | "oh shit" (exclamation) |
| nude | CONTENT_SEEKING -> boundary | "nude lipstick" |

## Dead code (not a live risk, but flag it)

`NAV_FRAME` (`router.ts:92`, contains bare `find`, `open`, `show me`) is defined
but NEVER referenced in `resolve()`. If it were wired it would be a heavy
common-word offender (`find`, `open`). Recommend deleting it, or if navigation
framing is wanted, wiring it deliberately with the bare words removed.

## Summary

Heaviest offenders by blast radius: COMMERCIAL (`order`, `cost`, `shop`, `launch`,
`release`) because they pop a purchase modal; FOOD (`bone`, `meat`, `treat`,
`cheese`) and COMMAND (`sit`, `stay`, `fetch`) because they are extremely common.
The two safety-adjacency items (`sad`, `lonely` in PERSONAL) are a coverage
question, not just noise. No edits made; this is a map for you to prioritise.
