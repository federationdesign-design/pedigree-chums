# Dog History Lineage Expansion

**Build brief | Britain's Dog History family trees | version 1.1, 3 August 2026**

This is the operative specification. It supersedes version 1.0 (1 August) and
the discussion document of 31 July wherever they differ.

Version 1.1 incorporates the Batch 0 reconnaissance (`docs/lineage/RECON.md`)
and the owner's decisions D1 (percentages frozen, fixture-verified), D2 (the
two ancient records are additions, not replacements) and D3 (no record IDs, no
migration; the existing display-name keying stays). Where this brief cites a
file and line, the reference is to the tree RECON.md was written against.

Scope: five foundation records plus two ancient additions, feeding six
approved trees. The rest is recorded in section 9 as later work.

---

## 1 What is being fixed

Several medieval and Tudor dogs currently begin with one generation behind
them, or with labels such as "Old working collies", "Land spaniels" and "Old
Highland terriers" (exact code casing; these names are lookup keys) that have
no earlier root. That makes early development look more precise than the
evidence allows.

Separately, the Ancient-to-medieval strip carries only the modern names
Mastiff and Greyhound for the ancient period. Both survive today but are not
the same as the varied British mastiff-type and Celtic coursing dogs described
in ancient sources. Presenting only the modern names implies an unbroken,
unchanged breed lasting nearly two thousand years.

**The trees show historical influence, not proven pedigree.** No copy, label
or field may describe a connection as a documented mating or a genetic result.

---

## 2 Batch 0: reconnaissance. COMPLETE

Done, read-only, reported in `docs/lineage/RECON.md`. The corrections it
forced are folded into this version. The load-bearing findings:

- Records are keyed by display-name strings everywhere; there are no IDs.
- The record shape is `LineageNode { name, note, value?, img?, children? }`
  (`data/lineage.ts:11-17`) plus the strip rows in `data/uk-breeds.ts:9-17`
  and long text in `data/breedInfo.ts`.
- A record feeds multiple trees via a top-level `LINEAGE` entry grafted into
  childless same-name nodes (`data/lineage.ts:1424-1447`), depth cap 5.
- In the data model, ancestors are `children` of the breed. "Adding a
  foundation above" a label means adding a deeper child beneath it.
- `relativesForLevel` is dead code; the related-pack-dogs rail calls
  `descendantPackBreeds` directly (`components/BreedTree/BreedTree.tsx:4686`).
- Percentages are computed by summing leaves, so a new child generation moves
  existing figures unless weights are inherited exactly (section 7).
- Grafting propagates edits beyond the six trees, for example Manchester
  Terrier embeds the Black and Tan Terrier tree (`data/lineage.ts:573, 586`).
- Mastiff and Greyhound are pack dogs whose strip cards navigate to modern
  pages; they are not levels. New strip rows with trees would become levels
  automatically (`BreedStrip.tsx:137-147`), which section 4 now constrains.
- The disclosure exists in four places, two rotating through variant titles.
  No current label anywhere uses the word "influence".

---

## 3 Records to create

Seven records. Two are ancient additions to the strip, five are foundations
needed by the approved trees. **There are no record IDs (owner decision D3).**
A record is identified by its display name, exactly as typed, because names
are lookup keys across `LINEAGE`, grafting, `breedInfo` and the pack-dog
index. Each name below was checked against the existing keys in RECON and
collides with nothing. Any change to one of these names is a content change
to a key and reruns the section 7 fixture.

| Display name | Era | Kind of record |
|---|---|---|
| Ancient Celtic Coursing Hound | Ancient | strip row + top-level tree entry |
| Ancient British Mastiff Type | Ancient | strip row + top-level tree entry |
| Ancient Celtic Scent Hound | Ancient | strip row + top-level tree entry, flip-only |
| Ancient Livestock Dog | Ancient | strip row + top-level tree entry, flip-only |
| Medieval Shepherd's Dog | Medieval | strip row + top-level tree entry, flip-only |
| Medieval Drover's Dog | Medieval | strip row + top-level tree entry, flip-only |
| Medieval Earth Dog | Medieval | strip row + top-level tree entry, flip-only |

All seven are extinct historical types. Status is carried the way the code
already carries it: the `note` ends with the sentence "An extinct historical
type." so `nodeStatus` (`components/BreedTreeMap/BreedTreeMap.tsx:127-139`)
classes it extinct via its substring check, and any strip row carries
`tag: "extinct"` (`data/uk-breeds.ts:16`). No new status field is introduced.

**Card copy, owner-approved, use verbatim** (as the descriptive body of each
`note`; the status sentence above is appended)

| Record | Short description |
|---|---|
| Ancient Celtic Coursing Hound | Swift Celtic sight-hunting dog described by classical writers, an early root of later British and Irish sighthounds. |
| Ancient British Mastiff Type | Powerful British guard and hunting dog praised by Roman writers for courage and strength. |
| Ancient Celtic Scent Hound | Early Celtic tracking hound that followed game by scent, representing the roots of later European scent hounds. |
| Ancient Livestock Dog | Broad early working-dog population used to guard, move and control livestock before named British breeds existed. |
| Medieval Shepherd's Dog | Practical medieval working dog used to move and protect sheep, forming an early root of Britain's collie families. |
| Medieval Drover's Dog | Tough working dog that helped move cattle and sheep over long distances to markets and towns. |
| Medieval Earth Dog | Small, determined hunting and vermin dog that followed quarry underground. |

The optional longer historical term "Vertragus" is dropped: the record shape
has no alternate-name field and none is invented (Batch 0 confirmed, D3
confirms no new fields beyond genuine need).

**Images.** All seven are in `public/history/breeds/`, the same folder as
every existing historical dog image, and all eight new files (the seven below
plus the unused `early-land-spaniel.jpg`) are staged in git as of 3 August.
Records reference them as root-relative `/history/breeds/<file>` paths, the
existing convention (`data/uk-breeds.ts:21`, `data/lineage.ts:961`). Use these
filenames exactly. Do not derive a filename from a display name, and do not
rename any file.

| Record | Image |
|---|---|
| Ancient Celtic Coursing Hound | `ancient-celtic-coursing-hound.jpg` |
| Ancient British Mastiff Type | `ancient-british-mastiff-type.jpg` |
| Ancient Celtic Scent Hound | `ancient-celtic-scent-hound.jpg` |
| Ancient Livestock Dog | `ancient-livestock-dog.jpg` |
| Medieval Shepherd's Dog | `medieval-shepherds-dog.jpg` |
| Medieval Drover's Dog | `medieval-drover-dog.jpg` |
| Medieval Earth Dog | `medieval-earth-dog.jpg` |

The Drover's Dog image is singular, `drover`, while the record name is
possessive. That is intentional and the file is not renamed to match.

**Case sensitivity remains a live risk in this repository**, with the
correction from Batch 0: the three known case pairs live in the git index
(the safety-poster JPGs, both cases tracked), not visibly on disk. All seven
filenames above were verified byte-exact and entirely lowercase from `ls`.
Every new reference typed into data must match the on-disk bytes exactly,
because images are served verbatim and the Linux build is case-sensitive.

**Not in this build**, and not to be created: Early Land Spaniel, Early Water
Dog. `early-land-spaniel.jpg` stays unused until the spaniel trees are done.

---

## 4 The two ancient additions (owner decision D2)

**Mastiff and Greyhound are NOT replaced, NOT edited and NOT removed.** Their
strip rows (`data/uk-breeds.ts:22-23`), their pack records, their pages, their
conservation status, photography and copy all stay exactly as they are. This
remains the single most important constraint in the brief.

Instead, Ancient British Mastiff Type and Ancient Celtic Coursing Hound are
ADDED to the Ancient-to-medieval strip alongside them, as extinct historical
types with their own imagery and copy.

**Flip-only cards, not levels (owner decision, 3 August, reversing the
earlier option B).** Batch 2 build evidence showed a root record cannot be a
playable level: the round works by revealing what sits below a dog, these are
the deepest recorded types, and inventing ancestry is forbidden, so their
rounds were empty. The two records are therefore strip cards that flip to
show their copy and open nothing. The mechanism is general, not a name list:
`breedCardKind` (`BreedStrip.tsx`) returns "play" only when a record's
lineage has children, and the level list reads the same answer, so any
root-only record (including the five medieval foundation roots in later
batches) is flip-only automatically. The campaign stays at 62 levels and the
level-list fixture (`tests/lineage/level-list.txt`) must match its committed
baseline exactly.

Two verified facts that make the renumbering safe (Batch 1 recon):

- No test, guard or fixture asserts the level list, the campaign length or a
  level number. The minipit checks in `tests/` select levels by name. The
  only artifacts carrying the counts are prose comments at
  `BreedStrip.tsx:64`, `BreedStrip.tsx:153` and `TimelineRun.tsx:329`
  ("90 dogs, 62 play, 28 learn"); Batch 2 updates them to 92/64/28 in the
  same change. Nothing is deleted.
- Campaign progress is never persisted. Position, score, lives and streak
  live in React state in `BreedStrip.tsx:94-124`, keyed by level NAME
  (`nextLevelOf` and `levelNo` both resolve via findIndex on the name at
  render). The only stored state under the trees is toy retirement and
  cookie consent (`BreedTree.tsx:305-430`). No visitor has a saved position
  that renumbering could move; the visible level number simply shifts by two
  on their next run.

Direction of linkage:

- The modern records may point backwards to the ancient types.
- The ancient records inherit nothing forwards: no modern status, no modern
  imagery, no modern breed-standard copy.

Forward links, for the trees that use them later: Ancient Celtic Coursing
Hound to Greyhound, Scottish Deerhound, Irish Wolfhound and other coursing
lines. Ancient British Mastiff Type to Mastiff, Alaunt, bandog, Old English
Bulldog and related branches.

---

## 5 Trees to update

Six trees, owner-approved as the first implementation group. In data terms
each update adds a deeper child generation beneath the tree's existing
ancestor labels; the prose below reads oldest-first. Exact code names are
used, because names are keys.

| Tree | Structure (oldest first) | Note |
|---|---|---|
| Rache | Ancient Celtic Scent Hound beneath Medieval Rache | Treat "rache" as a broad medieval scent-hunting category |
| Talbot | Ancient Celtic Scent Hound beneath the Talbot's scenting stock | Do not present the Talbot as the proven direct ancestor of every later scent hound |
| Cur | Ancient Livestock Dog and Medieval Drover's Dog beneath the Cur's working stock ("Old working collies") | Remove "Old working bandogs" (`data/lineage.ts:1203`) as a main parent unless separate evidence supports it. Its removal changes displayed figures, so it is its own fixture-gated step with owner sign-off, not a side effect |
| Old Welsh Grey Sheepdog | Medieval Shepherd's Dog beneath "Welsh herding dogs" and "Shaggy upland herders" | Regional development, not precise percentages |
| Scottish Terrier | Medieval Earth Dog beneath "Old Highland terriers" | The new record supplies the missing early root |
| Black and Tan Terrier | Medieval Earth Dog beneath "Old British ratting terriers" and "Earth and hunt terriers" | Existing labels remain beneath the new foundation. This tree is grafted into Manchester Terrier (`data/lineage.ts:586`), so the fixture must cover Manchester too |

**Do not touch any other tree directly.** Grafting means an edit here can
surface in trees outside the six, and for Medieval Earth Dog that scope is
an owner decision, not an overrun (4 August): the Highland and ratting
stocks are genuinely shared, so the foundation surfaces in twelve trees
(Scottish Terrier, Black and Tan Terrier, Skye, Paisley, Yorkshire,
Norfolk, Norwich, Lucas, West Highland Terrier, Manchester Terrier,
English Toy Terrier, Lancashire Heeler) plus the three shared stock
entries themselves. The section 7 fixture polices it as ever: indirect
surfacing is allowed only where the displayed figures are proven
unchanged, with the breakdown functions skipping self-duplicate children
so the pattern cannot inflate a stock's own total. Twelve further trees are deferred in section 9.

---

## 6 Data model (owner decision D3)

**No record IDs. No migration. No twelve-field schema.** The existing shapes
are the data model, and the seven new records use them as-is:

- A tree record is a `LineageNode`: `name`, `note`, `value`, `img`,
  `children` (`data/lineage.ts:11-17`). Shareable foundations are top-level
  `LINEAGE` entries so grafting can reuse them without duplication.
- A strip record is a `UKBreed` row: `name`, `strip`, `era`, `anchor`,
  `note`, `image`, `tag` (`data/uk-breeds.ts:9-17`). Only the two section 4
  additions get one in this build.
- Longer encyclopedic text, if wanted for a foundation, is a `breedInfo`
  entry keyed by the exact node name (`data/breedInfo.ts:3`). Optional.
- Extinct status is carried in the `note` sentence and, on strip rows, the
  `tag` (section 3). Ancient and modern records are kept apart by being
  separate records with distinct names, not by a kind field.

Confidence and sourcing are editorial, not data: they live in this brief
(section 12) and in code comments beside the records. None of the seven
foundations is claimed as strong evidence; the sources support the existence
and function of broad types, not specific descent. No `source_confidence`,
`influence_label`, `source_notes`, `record_id` or `record_kind` fields are
introduced.

---

## 7 Percentages (owner decision D1)

Owner decision: **percentages remain, and nothing that displays today may
change.**

- Every dog shown in a diagram carries a weight and is accounted for in the
  calculation, foundations included. No unweighted circles.
- A foundation inserted beneath an existing label follows the Celtic Heeler
  pattern: the label's former leaf `value` splits between the foundation and
  a same-name self-child, the label drops its own value (the double-count
  warning at `data/lineage.ts:989-1001`), and the branch total is unchanged,
  so displayed figures for existing dogs come out identical. Scaling a whole
  tree by a constant to keep splits in whole numbers is permitted, since it
  moves no percentage (the Cur is scaled by four).
- **The split rule (owner decision, 3 August), for this and every future
  graft:** a foundation takes HALF its branch where the source is plausible,
  and a QUARTER where it is speculative. Nothing among the seven foundations
  is strong. The four Batch 4 grafts are all assessed plausible and take
  half: Ancient Celtic Scent Hound beneath the Rache's Old scenting hounds,
  Ancient Celtic Scent Hound beneath the Talbot's Old scenting hounds,
  Medieval Drover's Dog beneath the Cur's Old working collies, and Ancient
  Livestock Dog beneath Medieval Drover's Dog. Batch 5 and any later graft
  applies this rule rather than re-deciding it.
- **The fixture. BUILT (Batch 1).** `scripts/lineage-percentage-fixture.mts`
  captures every displayed percentage across every tree on the site: all 123
  top-level tree entries (117 dog trees plus the six how-to-play entries),
  expanded with grafts, in both the leaf-sum measure (breed-page breakdowns)
  and the subtree-sum measure (the break panel's d3 maths), plus every
  `ancestryBreakdown` row and every `ancestorShareOf` pair for the 54 pack
  breeds. Committed at `tests/lineage/percentages.txt` (1959 rows).
  After each batch that touches a tree, `npx tsx
  scripts/lineage-percentage-fixture.mts --check` must pass with no
  differences except NEW rows for new foundation records. Manchester
  Terrier and every other graft-reachable tree are covered (the fixture
  showed the Black and Tan graft also surfaces in English Toy Terrier and
  Lancashire Heeler). If any existing figure moves, STOP and report; never
  adjust a figure to make the assertion pass.
- Where evidence is especially weak, the accompanying COPY uses "Main
  influence" and "Supporting influence" wording rather than emphasising the
  number, but the underlying weight still exists (the layout engine and the
  percentage maths require it; RECON Q8 point 12). Whether any of the six
  trees hides its numbers in copy is an open owner decision (section 11).
- **Boxer top split settled at 70/30 (owner decision, 4 August).** The
  hand-authored internal values implied Brabant 75 / Old English Bulldog 25,
  but the leaf structure has always summed to 70/30 and the breed page has
  always displayed 70/30, so the normalisation makes the break panel agree
  rather than changing the story. Restoring 75/25 would need leaf
  rebalancing, a visible breed-page change requiring its own D1 exception.
- "Historical influence" is an INTRODUCTION, not a rename: no current label
  uses the word "influence" (RECON Q5). Where the measure is named in these
  early trees, name it "Historical influence". Percentages are an editorial
  visualisation, never a claimed genetic result.
- The "Our best guess, not hard science" disclosure currently exists in FOUR
  places, two of them rotating through variant titles
  (`app/chums/[slug]/BreedClient.tsx:279`, `BreedTree.tsx:6357, 6373`,
  `LineageMap.tsx:2217-2228`, `BreedTreeMap.tsx:236-242`). The global
  disclosure below becomes visible BEFORE the visitor opens individual
  details; the four in-panel sites are unchanged in this build unless the
  owner directs otherwise.

**Global explanation, owner-approved, verbatim:**

> These family trees show likely historical influences. Ancient and medieval
> dogs were working types, not modern standardised breeds, so the percentages
> are illustrative rather than measured genetic results.

Placement is an owner decision from the options in RECON Q5: the history page
intro (`app/britains-dog-history/page.tsx:274-284`), the slider intro
screens, the level modal header (`LineageModal.tsx:281-292`), the strip label
area, or the breed-page ancestry card heading.

---

## 8 Build sequence

Each batch ends in a stop and a report. Nothing merges without approval.

| Batch | Scope | Stop condition |
|---|---|---|
| 0 | Reconnaissance, read-only. COMPLETE | `docs/lineage/RECON.md` |
| 1 | The percentage fixture: capture, commit, wire the regeneration script. COMPLETE | `scripts/lineage-percentage-fixture.mts`; fixtures committed (1959 percentage rows, 62 levels); rerun verified byte-identical |
| 2 | The two ancient strip additions, as flip-only cards. COMPLETE | Both render and flip (desktop and touch verified); Mastiff and Greyhound rows untouched; level-list fixture identical to baseline (62); percentage fixture gains only the two root rows; count comments read 92 dogs, 62 play, 28 learn, 2 flip-only |
| 3 | The five foundation records, strip rows and tree entries. COMPLETE | All five render and flip, referenced by no tree; level list byte-identical at 62; percentage fixture gains exactly five root rows; tsc clean |
| 4 | The Rache, Talbot and Cur trees. BUILT, two follow-ups gated | Grafts in and fixture clean (four new rows, nothing moved); levels render the new deepest generation. Gated: the Cur bandog removal (proposal below, owner sign-off) and the single-child nest label collision (owner review of the screenshots) |
| 5 | Old Welsh Grey Sheepdog, Scottish Terrier, Black and Tan Terrier. COMPLETE | Six trees carry their foundations; fixture additions-only at every step; the engine re-baseline and self-duplicate skip landed as their own commits; Boxer normalisation queued |
| 6 | The global disclosure and the "Historical influence" naming. COMPLETE | Owner rulings 4 August: the global note lives in the level modal header ALONE (removed from the breed page card, where the four in-panel disclosures still qualify every figure); on narrow screens it appears only after Play, when the LEARN title has gone, still preceding any break panel; the heading rename to "Historical influence" stays on breed desktop and mobile; break panel label reads "X% historical influence" |

**Mobile review after every batch that touches a tree.** Text wrapping,
circle labels and the vertical lineage control.

**Artwork last.** Any new historical artwork is commissioned only once the
structure works.

---

## 9 Explicitly out of scope

**Records not created:** Early Land Spaniel, Early Water Dog.

**Trees not touched directly:** Buckhound, Southern Hound, Beagle, English
Foxhound, Otterhound, Staghound, Old English Bulldog, Bearded Collie, Welsh
Terrier, Norfolk Spaniel, Welsh Springer Spaniel, Tweed Water Spaniel.
(Indirect surfacing through grafts is governed by the section 7 fixture.)

**Decided, 3 August:** all seven records appear in the strip as flip-only
cards; none stays tree-only. The root-only rule in section 4 keeps every one
of them out of the campaign automatically.

**Not in scope but recorded:** `relativesForLevel` in `data/lineageArchive.ts`
is dead code (no callers). Removing it is a separate cleanup, not part of
this work.

---

## 10 Rules for the agent

- **Nothing is overwritten that a visitor can currently see.** Version 1.1
  removes the only exception version 1.0 allowed: the ancient records are
  additions, and the Mastiff and Greyhound rows are untouched.
- **Visitor-facing copy comes from this brief or from the owner.** Do not
  write card text, labels or descriptions that are not specified here.
- **A conflict between two requirements is flagged and stopped on, never
  resolved.** Record it and say what you would do under each reading. The
  one previously open here (new strip rows become levels automatically,
  versus the no-new-level rule) was resolved by the owner on 3 August:
  option B, the two new levels are intended (section 4). No conflicts are
  currently open.
- **Silence is not permission.** If this brief does not say, ask.
- **Report format:** files changed with line counts, the type check as a
  number, the fixture result, and for each requirement the file and line
  implementing it. No "should work" or "appears to".
- **`data/lineageArchive.ts` is shared.** The related-pack-dogs rail and the
  level chum flood read `descendantPackBreeds`
  (`components/BreedTree/BreedTree.tsx:4686, 4719`), and the percentage
  panels read `ancestryBreakdown` and `ancestorShareOf`. Any change to what
  these return for an EXISTING name is reported explicitly. New foundation
  names returning the union of their trees' pack descendants is expected
  behaviour, and the rail contents for foundation circles are reported for
  owner review in the batch that introduces them.

---

## 11 Owner decisions still open

- [x] Where the global disclosure sits: settled 4 August, the level modal
      header alone, shown on narrow screens only after Play.
- [ ] Whether any of the six trees leads with "Main influence" and
      "Supporting influence" copy instead of visible numbers.
- [ ] The Cur "Old working bandogs" removal (fixture-gated, section 5).

Settled: D1 percentages frozen and fixture-verified. D2 additions, not
replacements; after the Batch 2 build evidence the two additions are
flip-only cards, not levels (3 August, reversing option B), under the
general root-only rule in section 4, and the campaign stays at 62. D3 display-name keying stays, no new fields
beyond genuine need. The seven images are present in
`public/history/breeds/`, byte-exact lowercase names, staged in git. The
Batch 1 fixture is built and committed: no test or stored visitor state
depends on level numbering (section 4).

---

## 12 Sources

The proposal rests on written references, historical terminology and the
structure already on the site. The sources support the presence and function
of broad dog types. They rarely prove a modern-style direct pedigree, so the
relationships remain informed reconstructions.

**Why the split is editorial (owner search, 3 August):** no sourced figures
exist for these connections. The genetic literature covers wolf admixture
and modern breed clustering, and where it reaches pre-Victorian populations
it can only identify a closest living link to an extinct population, never a
share. The half and quarter splits in section 7 are therefore an editorial
visualisation, consistent with the global explanation, not measurements.

1. Strabo, *Geography*, Book IV chapter 5, on British dogs exported for
   hunting and Celtic use of dogs in war.
2. Arrian, *Cynegeticus*, on Celtic coursing dogs and the distinction between
   sight and scent hunting.
3. Ælfric of Eynsham, *Colloquy*, c. 990, on the shepherd's use of dogs.
4. Border Collie Museum, introduction to British and Irish herding dogs.
5. Great North Road, drovers and drove roads.
6. Notre Dame Manuscript Studies, "From Chariots to Chaucer: Mastiffs in
   Medieval England".
7. Etymological background for terrier as an earth dog, to be supported by a
   recognised dictionary source. Used as a functional category, not a claim
   of one fixed medieval breed.
