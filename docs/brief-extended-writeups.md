# Brief: extended write-ups in the learn info box

**Owner:** Steve James, Federation Design
**Written:** 19 August 2026
**For:** Terry (Claude Code agent)
**Measured against:** `main` at the time of writing. Re-measure before trusting any line number.

Two pieces of work. **Part A is code and small. Part B is writing and large.** Part A must
land first, because it decides the shape the Part B text is written into.

---

## Ground rules

- All work in `~/pedigree-chums-main` only
- `git status --short` clean before starting. A second agent pushes to `main` continuously
- Never `git add`, `git commit` or `git push`. Prepare the tree, hand over the commands
- Never `git add -A`. Stage named files
- Always include `git pull --rebase origin main` before the push in any command block
- After `npm run build:chumdata`, always stage `app/pick-a-chum/data/generated` as well
- Read-only commands you run yourself must be bare: no `cd`, no `-C`, no `;` or `&&` chaining
- Verify with `./node_modules/.bin/tsc --noEmit`, never `npx tsc`
- Steve's terminal truncates pasted commands at roughly 1300 characters, mid-string. Keep
  anything handed over well under that
- No em dashes in delivered files or in chat

---

# PART A: show the short text on hover, the long text on click

## What happens now

`components/BreedTree/BreedTree.tsx` line 7303 renders one string:

```
{ancestryFor ? ancestryFor.note : breedInfo[shown.data.name] || (shown.depth === 0 && rootNote ? rootNote : shown.data.note)}
```

`shown` is defined at line 5125 as `hovered ?? focus`. So the same text appears whether the
user is merely hovering a circle or has clicked into it.

## What it should do

- **Hovering a circle:** show the short write-up, as now
- **After clicking into a circle:** show the extended write-up

The distinction is already available with no new state. `hovered` is non-null only while the
pointer is over a circle. `focus` is the clicked node. So:

```
const isFocused = hovered === null && shown === focus;
```

Use that to choose between the short and long text.

## The data shape, and this is the decision that matters

`data/breedInfo.ts` currently holds one string per name, `Record<string, string>`.

**Do not overload the existing field.** Add a second, optional map so short and long stay
separate and the short one keeps working untouched:

```ts
export const breedInfoLong: Record<string, string> = {
  // extended write-ups, added progressively. Any name missing from here falls
  // back to the short entry in breedInfo, so this can be filled in batches
  // without ever leaving a blank box.
};
```

**Fallback is mandatory.** If a name has no long entry, render the short one. Part B will fill
these in batches over time, so most names will be missing at first and nothing may break.

## Acceptance

- Hover a circle: short text, unchanged from today
- Click into a circle: long text if one exists, short text if not
- No blank info box in any state
- `ancestryFor` behaviour unchanged: when a chum is picked from the rail, that path still
  renders `ancestryFor.note` exactly as now
- The "Tap a circle inside to keep digging" suffix still appends correctly
- `./node_modules/.bin/tsc --noEmit` clean
- eslint count reported against baseline, no regression

## Watch for

- **`frozen`** in `BreedTree.tsx` silently disables handlers on the start screen. It has caused
  bugs where the code was correct but never ran. Check the behaviour on the start screen as
  well as mid-level
- Line numbers in this file move. 7303 and 5125 were correct when this was written. Re-check

**Cost: roughly 3 to 4%. Ship this on its own and let Steve review before Part B starts.**

---

# PART B: the 102 extended write-ups

## The measured position

`data/breedInfo.ts` holds 210 entries. Word counts split almost perfectly along one line:

| Group | 40+ words | Under 40 |
|---|---|---|
| 54 pack cards | 27 | 6 |
| Strip breeds | 66 | 7 |
| **Ancestor-only nodes** | **2** | **102** |

93 of the 95 long entries are real breeds. 102 of the 104 short ones are extinct ancestor
types. The long entries were written when the project covered living breeds; the ancestor
nodes came later and never got the same treatment.

**The target: bring the 102 ancestor-only entries up to the standard the 93 already set.**

## Voice and length

- **Do not invent a house style.** It already exists in the 93 long entries. Read a dozen
  first and match them
- Target 60 to 80 words
- The existing long entries follow a recognisable shape: what the dog was and did, then its
  reconstructed ancestry, then what became of it. Keep that
- Steve's audience is a dog-obsessed 14-year-old who reads to the end, and an adult who
  trusts it. Fun enough for the first, credible enough for the second

## Each entry needs one genuinely interesting fact

This is the point of the exercise, not padding. Example, and a good one to use where it fits:

> Most short-legged breeds share a single genetic change, an extra copy of the FGF4 growth
> factor gene, which shortens the long bones without shrinking the body. It explains the
> Dachshund, the Corgi, the Basset and a long list of terriers all at once. They did not each
> get short legs separately, they inherited the same ones.

**Verify that against the original research before using it.** It is well established but it
has not been checked against a primary source in preparing this brief.

**Where FGF4 must NOT go:** it cannot hang off a British node such as `Celtic Heeler`. The
mutation is shared with Dachshunds, Bassets and Pekingese, so the common ancestor predates
Britain entirely. It belongs in the write-up text as a fact about the dogs, never as a
lineage link.

## Batches

Work by family, not alphabetically, so the voice stays consistent within a group. **Ship each
batch as its own commit and stop for Steve's review after the first one.**

| Batch | Family | Approx |
|---|---|---|
| 1 | Collies and herding types | 12 |
| 2 | Terriers and earth dogs | 25 |
| 3 | Spaniels and water dogs | 18 |
| 4 | Hounds | 15 |
| 5 | Mastiffs, bandogs, war dogs | 12 |
| 6 | Toys | 10 |
| 7 | Ancient and continental | 10 |

**Start with batch 1 only.** Twelve entries is enough to judge the voice. Do not write 102 and
hand them over at once.

## Sourcing rules

- Britain-first, and use real sources. The project has already had to walk back two claims
  that came from breed-club folklore rather than evidence
- Where a story is traditional rather than documented, say so in the text. "Said to have" and
  "long-standing story rather than settled fact" are both already used in this data
- Never state a recognition date as an origin date. That error was found and fixed in the
  Norfolk Terrier this week
- If a claim cannot be sourced, write a shorter honest entry rather than a longer speculative
  one

## Acceptance per batch

- Every entry 60 to 80 words
- Every entry contains at least one specific, checkable fact
- No claim stated more confidently than its evidence supports
- `./node_modules/.bin/tsc --noEmit` clean
- Names in `breedInfoLong` match names in `data/lineage.ts` **exactly**, including case and
  apostrophes. A mismatch silently falls back to the short text and looks like nothing happened

**Cost: roughly 15 to 20% across all seven batches. Batch 1 alone is about 2%.**

---

## Known traps in this codebase

- **Filename and key case matters.** Vercel builds on Linux, macOS ignores case. A key that
  differs only by case will silently fall back and look like nothing happened
- **Apostrophes.** Several node names carry them: `Shepherd's Dog`, `Celtic herdsmen's dogs`,
  `Low-slung soldiers' dogs`. Copy names from the source, do not retype them
- **Backticks inside inline script template literals break the build.** Has happened repeatedly
- **`:global(.foo)` in CSS Modules passes `tsc` and fails the Vercel build**
- **No `console.log` to production.** Fence any diagnostic with `REMOVE BEFORE COMMIT`
- **If superseding a decision recorded in a code comment, rewrite the comment to record the
  reversal and the date.** Do not delete it. Comments in this repo have stopped several changes
  from reintroducing solved problems

## Order of work

1. Part A, one commit, Steve reviews on a real iPhone and desktop Chrome
2. Part B batch 1, twelve entries, one commit, Steve reviews the voice
3. Remaining batches only after batch 1 is approved
