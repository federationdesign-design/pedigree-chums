# Brief: resolve the 15 pass-through nodes

**Owner:** Steve James, Federation Design
**Written:** 19 August 2026
**For:** Terry (Claude Code agent)
**File:** `data/lineage.ts`

---

## The problem

A node whose `children` array holds exactly one entry at `value: 100` is a **pass-through**.
D3 packs that single child to fill its parent completely, so on screen the child's name is
what the user reads and the parent is invisible behind it.

This was always true, but it was hidden while these nodes only appeared buried inside other
dogs' trees. On 19 August they were added to the history strips, so each is now a level in its
own right and the fault is visible on four screenshots already.

**20 pass-throughs exist. 15 are now visible as their own level. Those 15 are this job.**

---

## The decision Steve has made

**Research a real second parent for each. Only where research genuinely fails, apply the
Celtic Heeler pattern.**

Do not reach for the pattern first. It is the fallback, not the fix.

---

## The 15, with their single child

| Node | Its only child |
|---|---|
| Old working collies | Shepherd's Dog |
| Old Scotch Collie | Old working collies |
| Old hill and bearded collies | Old working collies |
| Old Cumberland herding dogs | Old working collies |
| Low-slung soldiers' dogs | Earth Dog |
| Native Irish terriers | Old English Black and Tan Terrier |
| Old fell terriers | Old English Black and Tan Terrier |
| Old English Black and Tan Terrier | Earth Dog |
| Old English White Terrier | Old English Black and Tan Terrier |
| Soft-Coated Wheaten Terrier | Native Irish terriers |
| Water spaniels | Otterhound |
| Old Irish water dogs | Otterhound |
| English Water Spaniel | Water spaniels |
| Old toy spaniels | Land spaniels |
| Old sporting toy spaniels | Land spaniels |

**Note the clustering.** Four collie nodes all descend from `Old working collies`. Three
terrier nodes all descend from `Old English Black and Tan Terrier`. Two water nodes from
`Otterhound`, two toy nodes from `Land spaniels`. Research one cluster at a time; the sources
overlap heavily and the answers may be shared.

**Five more are pass-throughs but ancestor-only, so not visible and NOT in this job:**
Skye terrier stock, Arctic sled dogs, Asian flat-faced toys, Old European water dogs,
Fishermen's water dogs. Leave them.

---

## Sourcing rules, and these matter

This project has already had to walk back two claims that came from breed-club folklore rather
than evidence. A Viking herding spitz claim was removed, and a Polish Lowland Sheepdog origin
story was replaced. **Both looked plausible and both were wrong.**

- **Prefer:** peer-reviewed work, national kennel club breed histories, primary period sources
  such as Caius 1576, university and museum material
- **Treat with caution:** breed club origin stories, "it is said that", anything tracing a
  modern breed to a specific ancient event without evidence
- **Never** state a Kennel Club recognition date as an origin date. That error was found in the
  Norfolk Terrier this week
- Where a story is traditional rather than documented, say so in the node's `note`. The data
  already uses "said to have" and similar hedges
- **If you cannot source a second parent, say so and use the fallback.** A wrong second parent
  is far worse than a repeated ring

---

## Two hard constraints

**1. No cycles.** Before adding any parent, check the proposed parent does not already descend
from the node you are editing. The file already carries a comment recording a cycle that had to
be undone between `Early badger hunting dogs` and `Earth Dog`. Read it before you start.

**2. No backwards edges.** The proposed parent must be **older** than the node. Two edges have
already been reversed this week for running backwards in time, `Celtic Heeler` to
`Welsh herding dogs` being the most recent. Check the era each dog sits in via
`data/uk-breeds.ts` before wiring anything.

---

## The fallback: the Celtic Heeler pattern

Only when research fails. Read the `Celtic Heeler` root in `data/lineage.ts` first, including
its comment about d3.

The shape is:

```
Parent            <- carries NO value of its own
  ├ Real child    <- value 50
  └ Parent        <- value 50, repeating the parent with the parent's own note and img
```

**The parent must not carry a `value` of its own.** The comment inside `Celtic Heeler` records
why: d3 adds an owned value **on top of** its children, which counts the line twice and the
circle renders oversized.

An even 50/50 split is the default. Weight it otherwise only if there is a reason.

---

## Working rules

- All work in `~/pedigree-chums-main`. `git status --short` clean before starting
- Never `git add`, `git commit` or `git push`. Prepare the tree, hand over bare commands
- **No `git -C`.** No `cd`, no `;` or `&&` chaining on read-only commands you run yourself
- No `for` loops or `$(...)`, they are gated and prompt Steve every time
- Always include `git pull --rebase origin main` before the push
- After `npm run build:chumdata`, stage `app/pick-a-chum/data/generated` too
- Verify with `./node_modules/.bin/tsc --noEmit`, never `npx tsc`
- Steve's terminal truncates pasted commands at roughly 1300 characters
- No em dashes in delivered files or in chat

---

## Batches, and stop after the first

Work by cluster, not down the list:

| Batch | Cluster | Nodes |
|---|---|---|
| 1 | Collies | Old working collies, Old Scotch Collie, Old hill and bearded collies, Old Cumberland herding dogs |
| 2 | Terriers | Old English Black and Tan Terrier, Native Irish terriers, Old fell terriers, Old English White Terrier, Soft-Coated Wheaten Terrier, Low-slung soldiers' dogs |
| 3 | Water and spaniels | Water spaniels, Old Irish water dogs, English Water Spaniel, Old toy spaniels, Old sporting toy spaniels |

**Do batch 1 only, then stop for Steve's review.** Four nodes is enough to judge whether the
research is holding up.

---

## For each node, report before editing

1. The second parent proposed, or **"no second parent found"**
2. The source, named, not "commonly believed"
3. Confidence: solid, fair, or weak
4. The proposed value split
5. Cycle check result and era check result

**Steve approves the list, then you edit.** Do not research and edit in one pass.

---

## Acceptance

- Every changed node has two or more children summing to 100
- Every added parent is sourced, or is the Celtic Heeler fallback with the failure recorded
- A dated comment on each change recording the second parent, the source, and whether it was
  researched or the fallback
- No cycles: `npm run build:chumdata` completes without hanging
- `./node_modules/.bin/tsc --noEmit` clean
- eslint reported against baseline, no regression
- On screen, each of these nodes now shows its own name on the ring with children inside it

---

## Cost

Batch 1 roughly 4%. All three batches 15% or more, depending on how much research holds up.
If most of batch 1 falls back to the pattern, tell Steve, because that changes the value of
doing batches 2 and 3 the same way.
