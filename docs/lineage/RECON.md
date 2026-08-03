# Lineage expansion, Batch 0 reconnaissance

Read-only pass, 3 August 2026, against BRIEF.md (227 lines, copied from
~/Downloads/LINEAGE_EXPANSION_BRIEF.md). No file other than this report was
created or changed. Line numbers are from the tree as of commit c764540 on
branch pick-a-chum.

---

## Q1. Where the lineage data lives

**Record shape.** `LineageNode` at `data/lineage.ts:11-17`:
`{ name: string; note: string; value?: number; img?: string; children?: LineageNode[] }`.
That is the whole shape. Trees are keyed by display name in the `LINEAGE`
record at `data/lineage.ts:19`, which holds 125 top-level keys: 119 dog trees
plus 6 how-to-play trees ("Deal the cards" etc., `data/lineage.ts:20-171`)
that share the same structure for the homepage game. There are 284 inline
`{ name: ... }` child objects across the file.

**A second record set feeds the history strips.** `UKBreed` at
`data/uk-breeds.ts:9-17`:
`{ name; strip; era; anchor; note; image?; tag? }`, 90 entries. A third,
`data/breeds.ts`, holds the 54 pack dogs (54 entries, each with `slug`).
`data/breedInfo.ts:3` holds encyclopedic text keyed by exact tree-node name.
`data/lineageNames.ts:4-13` maps four history-page names to lineage keys.

**Shared or duplicated?** Both. A top-level tree is shared: `getLineage`
(`data/lineage.ts:1458-1462`) grafts a top-level entry into any other tree
where a childless node carries the same name (`expandNode`,
`data/lineage.ts:1424-1447`), through the alias table at
`data/lineage.ts:1409-1412`. But child-level labels with `img` and `note` are
plain duplicates kept in step by hand; the code says so itself at
`data/lineage.ts:1006-1012` ("a duplicate has to be kept in step by hand").
Example: "Old Highland terriers" is retyped at `data/lineage.ts:549, 558, 692`.

## Q2. How the Ancient carousel is populated

There is no separate Ancient carousel. There is one combined strip,
`strip: "ancient-medieval"`, labelled "Ancient to medieval"
(`app/britains-dog-history/BreedStrip.tsx:29`). Its entries are the `ukBreeds`
rows at `data/uk-breeds.ts:20-27`, filtered and sorted at
`BreedStrip.tsx:176-178` and rendered at `BreedStrip.tsx:476-548`, mounted per
era section at `app/britains-dog-history/page.tsx:343`.

- **Mastiff entry:** `data/uk-breeds.ts:22` (era "Ancient", image
  `/history/breeds/english-mastiff-photo.jpg`, tag "endangered").
- **Greyhound entry:** `data/uk-breeds.ts:23` (era "Ancient", image
  `/history/breeds/original-greyhound.jpg`, tag "in-decline").
- Mastiff's tree resolves through the alias `"Mastiff": "English Mastiff"`
  (`data/lineage.ts:1411`) to the tree at `data/lineage.ts:957-964`;
  Greyhound's tree is at `data/lineage.ts:966-973`.

Two facts that matter for the section 4 replacement:

1. Both are pack dogs with pages: `data/breeds.ts:65-66` (`slug: "mastiff"`)
   and `data/breeds.ts:507-508` (`slug: "greyhound"`). `breedCardKind`
   (`BreedStrip.tsx:68-72`) therefore classes their cards "learn": a tap
   navigates to `/chums/mastiff` or `/chums/greyhound`
   (`BreedStrip.tsx:160`), it does not open a tree.
2. The strip component is borrowed wholesale by the second history page:
   `app/britains-dog-history-2/IntroButtons.tsx:15,31` and
   `app/britains-dog-history-2/TimelineRun.tsx:10,327` render through the same
   `BreedStrip`, which owns the shared level game (lives, streak, campaign
   score, `BreedStrip.tsx:40-54`). Any change to the strip data changes both
   pages.

## Q3. Can a record feed more than one tree without duplication?

Yes, with conditions. Make it a top-level `LINEAGE` entry and reference it by
name as a childless node in any tree: `expandNode`
(`data/lineage.ts:1424-1447`) grafts the entry's own children in, scaled to
the referencing node's share. Working example: "Celtic Hound"
(`data/lineage.ts:1047-1054`) is grafted under both Greyhound
(`data/lineage.ts:970`) and Scottish Deerhound (`data/lineage.ts:1042`).

Conditions: the referencing node must have no children of its own
(`data/lineage.ts:1428-1431`), depth is capped at `MAX_LINEAGE_DEPTH = 5`
(`data/lineage.ts:1407`), and a cycle guard stops self-reference. The
referencing node still carries its own `img` and `note` per site, which is
where today's hand-synced duplication lives (`data/lineage.ts:1006-1012`).

## Q4. The twelve section 6 fields against today's shape

| Brief field | Today |
|---|---|
| `record_id` | NOT FOUND. Nothing has an ID. Trees, grafts, aliases, breedInfo, the archive index and the strips are all keyed by display-name string (`data/lineage.ts:19`, `data/lineageArchive.ts:8`, `data/breedInfo.ts:3`). Searched for `id:` fields in `data/lineage.ts`, `data/uk-breeds.ts`: none. |
| `display_name` | Exists as `name` (`data/lineage.ts:12`, `data/uk-breeds.ts:10`). |
| `record_kind` | NOT FOUND. Nearest is derivation, not data: `nodeStatus` (`components/BreedTreeMap/BreedTreeMap.tsx:127-139`) parses the prose `note` for the substring "extinct" and falls back to lookup tables and the `ukBreeds` tag. |
| `era` | Exists only on `UKBreed` as free text (`data/uk-breeds.ts:12`): values include "Ancient", "Medieval", "1500s", "c. 1576". `LineageNode` has no era field. |
| `status` | Split across two mechanisms: the `tag` enum on carousel entries (`data/uk-breeds.ts:16`: extinct, trending, popular, endangered, in-decline) and prose parsing of "Now extinct." inside `note` via `nodeStatus` (`BreedTreeMap.tsx:127-139`). No field holds "Extinct historical type"; as a note string it would incidentally parse as extinct via the substring check. |
| `short_description` | Exists as `note` (`data/lineage.ts:13`, `data/uk-breeds.ts:14`). |
| `long_description` | Exists under a different name and file: the `breedInfo` record (`data/breedInfo.ts:3`), keyed by exact node name, shown in the card info popover. Pack dogs also carry `character` and `fact` in `data/breeds.ts`. |
| `source_confidence` | NOT FOUND. Searched `data/` and the tree components for `confidence`, `strong`, `plausible`, `speculative` as fields: none. |
| `parent_or_influence_id` | No field. The relationship is structural: `children` nesting (`data/lineage.ts:16`) plus name-keyed grafting. |
| `influence_weight` | Exists as `value` (`data/lineage.ts:14`). Semantics per the header comment (`data/lineage.ts:3-9`): a node's share of its parent, and leaf values under a parent must sum to the parent's own share. See also the double-count warning at `data/lineage.ts:993-996`. |
| `influence_label` | NOT FOUND. |
| `source_notes` | NOT FOUND. Nothing in the data layer carries citations. |

**Migration size (brief section 6 question).** 125 top-level entries plus 284
child objects in `data/lineage.ts`, 90 `ukBreeds` rows, 54 pack rows. Child
objects have no identity of their own and repeat names across trees, so
per-record fields cannot be attached to them without first deciding what a
record is. This is a migration, not a handful of edits.

## Q5. Percentages: storage, rendering, and the disclosure

**Storage.** `value` on each node, share-of-parent with the leaf-sum invariant
(`data/lineage.ts:3-9`). The d3 pack layout adds an owned value on top of
children, which is why one node deliberately carries no value
(`data/lineage.ts:993-996`).

**Computation.** `ancestryBreakdown` and `ancestorShareOf`
(`data/lineageArchive.ts:50-71, 77-99`) percentage a node by summing leaves
(`sumLeaves`, `data/lineageArchive.ts:45-48`) against the root's leaf total.

**Rendering.**
- Tree break panel: "X% of this dog", "As grandparent: X%", "Share of this
  dog: X%" (`components/BreedTree/BreedTree.tsx:6354-6356`), and "A is X% B"
  with a pie (`BreedTree.tsx:6364-6371`).
- Breed page ancestry card with bars (`app/chums/[slug]/BreedClient.tsx:270-277`).
- Pack pit percentage popover (`components/PackPit/LineageMap.tsx:2204-2235`).

**The disclosure appears in four places, not one:**
1. `app/chums/[slug]/BreedClient.tsx:279-281`, full sentence, inside the
   ancestry card.
2. `components/BreedTree/BreedTree.tsx:6357` and `6373`, title line inside the
   break panel, only after a circle or chum is picked.
3. `components/PackPit/LineageMap.tsx:2217-2228`, rotating through TEN variant
   titles ("Our best guess, not hard science.", "An educated guess, not
   gospel.", ...), picked by hashing the card id.
4. `components/BreedTreeMap/BreedTreeMap.tsx:236-242`, the same idea with FIVE
   variants.

All four are inside detail surfaces, so nothing today is "visible before the
visitor opens individual details".

**"Historical influence" as a current label: NOT FOUND.** Searched
`BreedTree.tsx`, `LineageModal.tsx`, `LineageMap.tsx`, `BreedClient.tsx` and
`data/` for "influence": zero hits. There is no existing measure name to
rename; the current labels are the phrases quoted above plus the "Ancestry"
heading (`BreedClient.tsx:269`).

**Placement options for the global explanation (for the owner to choose, per
brief section 7):**
- The history page intro section, before any strip:
  `app/britains-dog-history/page.tsx:274-284`.
- The slider's intro screens: `app/britains-dog-history-2/IntroButtons.tsx` /
  `sections.ts`.
- The level modal header, seen before the tree and its panels:
  `components/LineageModal/LineageModal.tsx:281-292`.
- The strip itself, beside the era label: `BreedStrip.tsx:477-478`.
- The breed page ancestry card heading: `BreedClient.tsx:268-269`.

## Q6. The image convention and the exact filenames

**Convention.** Records reference images as root-relative paths under
`/history/breeds/`: `UKBreed.image` (`data/uk-breeds.ts:21-23`) and
`LineageNode.img` (for example `data/lineage.ts:961`). Rendered with
`next/image` `unoptimized` (`BreedStrip.tsx:500-506`), so the path is served
verbatim and case matters on the Linux build.

**Where the new files actually are.** NOT in `public/history/` as the brief
states (sections 3 and 11). `ls public/history/` contains no new file; all
seven are in the subfolder `public/history/breeds/`, which is also where every
existing record image lives, so the brief's "same folder as the existing
historical dog images" is true and its literal path is not.

**Exact filename bytes from `ls public/history/breeds/`, all seven present,
all entirely lowercase, flagged: none:**

    ancient-british-mastiff-type.jpg
    ancient-celtic-coursing-hound.jpg
    ancient-celtic-scent-hound.jpg
    ancient-livestock-dog.jpg
    medieval-drover-dog.jpg
    medieval-earth-dog.jpg
    medieval-shepherds-dog.jpg

`early-land-spaniel.jpg` is also present and unused, as section 3 expects.
The names match section 3's table byte for byte, including the intentional
singular `medieval-drover-dog.jpg`.

**Three warnings:**
1. **All eight files are untracked in git** (`git status`: `??` under
   `public/history/breeds/`). Until they are added and committed they 404 on
   every deploy, on any filesystem. House rule: always `git add public/` when
   new images are involved.
2. **The three case pairs the brief mentions are real but live in the git
   index, not on disk.** `git ls-files public` holds both
   `A-car-is-not-a-kennel.jpg` and `a-car-is-not-a-kennel.jpg`, both
   `A-dog-never-died-from-missing-a-walk.jpg` and
   `a-dog-never-died-from-missing-a-walk.jpg`, both
   `If-the-pavement-is-too-hot-for-your-hand.jpg` and
   `if-the-pavement-is-too-hot-for-your-hand.jpg`. APFS shows one of each;
   a Linux checkout materialises both. None are history images. A
   case-insensitive sweep of the working tree found no other pair.
3. The git snapshot at the start of this session listed
   `Ancient-livestock-dog.jpg` (capital A) and no shepherds file; the folder
   now holds `ancient-livestock-dog.jpg` and `medieval-shepherds-dog.jpg`.
   The files look recently renamed and added. Since they are untracked there
   is no git case trap yet, but whoever adds them should verify the bytes
   above survive the `git add`.

## Q7. data/lineageArchive.ts and the related-pack-dogs rail

**How the index works.** Built once at module load
(`data/lineageArchive.ts:8-25`): for each of the 54 pack breeds, `collectNames`
walks the breed's fully EXPANDED tree (grafts included, because it calls
`getLineage`) and records every node name as an ancestor of that breed.
`descendantPackBreeds(names)` (`lineageArchive.ts:28-32`) returns pack dogs
whose sets contain any given name.

**Correction to the brief's premise: `relativesForLevel` has no callers.**
It is exported at `lineageArchive.ts:35-42` and referenced nowhere else in the
repository (searched all `.ts`/`.tsx` outside the file: zero hits). The rail
beside a level actually calls `descendantPackBreeds` directly:
`components/BreedTree/BreedTree.tsx:4686-4687` (the per-circle rail) and
`BreedTree.tsx:4717-4725` (the level's chum flood). `ancestryBreakdown` and
`ancestorShareOf` from the same file feed the percentage panels.

**Does adding foundation records above existing dogs change what these return?
Yes, in three distinct ways.**

1. **New names enter the index.** A foundation node added inside any pack
   breed's tree becomes an ancestor of that breed. Because section 5 gives one
   foundation to several trees (Medieval Earth Dog to both Scottish Terrier
   and Black and Tan Terrier), `descendantPackBreeds(["Medieval Earth Dog"])`
   returns the UNION of families that today share no rail. When a visitor
   hovers the foundation circle, the rail (`BreedTree.tsx:4682-4691`) shows
   that union, and the level's falling-chum cast (`BreedTree.tsx:4717-4725`)
   grows the same way.
2. **Grafting propagates beyond the six named trees.** "Black and Tan
   Terrier" is a top-level tree (`data/lineage.ts:573-580`) grafted into
   Manchester Terrier as a childless child (`data/lineage.ts:586`), and
   Manchester's tree flows into the pack index. Adding Medieval Earth Dog
   under Black and Tan Terrier therefore changes Manchester Terrier's expanded
   tree, its rails and its percentages, although Manchester is not one of the
   six trees. The same applies to any tree whose childless node names match a
   new or edited top-level entry ("Old Highland terriers" appears in Skye
   Terrier `data/lineage.ts:549`, Scottish Terrier `558` and Paisley Terrier
   `692`; if a top-level entry with that name is created to hang Medieval
   Earth Dog above it, all three trees graft it in).
3. **Every displayed percentage moves.** `sumLeaves`
   (`lineageArchive.ts:45-48`) sums LEAVES. Today "Old Highland terriers" is a
   leaf worth 60 inside Scottish Terrier; give it a child worth X and the
   branch is worth X instead of 60, changing `rootLeaves` and every figure
   from `ancestryBreakdown` and `ancestorShareOf` for every breed whose tree
   contains the changed branch: breed-page ancestry cards, break panels, the
   mini pit learn rail. "Update the first one or two generations only"
   (section 5) is structurally impossible to do without moving numbers
   elsewhere, unless child values are chosen to preserve leaf sums.

**A fourth side effect sits outside lineageArchive but inside the same taps.**
The level list is `ukBreeds` rows that have a lineage and no pack page
(`BreedStrip.tsx:137-147`). Mastiff and Greyhound currently have pack pages,
so they are "learn" cards and NOT levels. Replacing their strip entries with
historical types that have trees converts those cards to playable levels at
anchors 150 and 200, at the front of the campaign, renumbering `levelNo`
(`BreedStrip.tsx:453`) and the next-level chain for both history pages.

## Q8. Contradictions between the brief and the code

1. **Record IDs do not exist.** Section 3 assigns snake_case IDs and section 6
   requires `record_id`; nothing in the codebase has an ID of any kind.
   Everything is keyed by display-name string (`data/lineage.ts:19`,
   `data/lineageArchive.ts:8`, `data/breedInfo.ts:3`). Deciding where IDs
   live, or whether display names remain the keys, precedes Batch 1.
2. **Image folder.** Sections 3 and 11 say `public/history/`; the files and
   every existing record reference are in `public/history/breeds/`
   (`data/uk-breeds.ts:21`, `data/lineage.ts:961`).
3. **The case pairs are in the git index, not visible on disk**, and they are
   the three safety-poster JPGs, not history images (Q6 above). The stated
   risk is real; its description is off.
4. **`relativesForLevel` is dead code.** Section 2 Q7 and section 10 assume
   the rail reads it; the rail reads `descendantPackBreeds`
   (`BreedTree.tsx:4686-4687`). The reported behaviour change analysis above
   covers the functions actually in use.
5. **There is no Ancient carousel.** One "Ancient to medieval" strip serves
   both eras (`BreedStrip.tsx:29`, `data/uk-breeds.ts:20-27`) and is shared
   with the second history page through the borrowed component
   (`IntroButtons.tsx:15`, `TimelineRun.tsx:10`), so a "carousel" edit is a
   two-page change.
6. **The replacement targets are pack dogs, not plain carousel copy.**
   Mastiff and Greyhound have modern pages (`data/breeds.ts:65-66, 507-508`)
   and their strip cards navigate there. Replacing the entries flips the card
   kind from "learn" to "play", adds two levels at the front of the shared
   campaign and renumbers every level (`BreedStrip.tsx:137-147, 453`). The
   brief's "single most important constraint" (do not overwrite the modern
   records) is safe under this, but the side effects are unstated.
7. **Tree direction is inverted relative to the brief's prose.** Section 5
   writes Ancient to Medieval to breed, top down. In the data model ancestors
   are `children` of the breed (`data/lineageArchive.ts:40`: "everything below
   the root is one of its ancestors"). "Adding a foundation above" means
   adding a deeper child below today's leaves.
8. **"First one or two generations only" is not a contained edit.** Leaf-sum
   percentage semantics plus grafting move rendered figures in trees outside
   the six, notably Manchester Terrier via the grafted Black and Tan Terrier
   tree (`data/lineage.ts:573, 586`) and any tree naming "Old Highland
   terriers" (`549, 558, 692`). Q7 point 3 has the mechanism.
9. **Six of the twelve fields are absent, and one is split.** Absent:
   `record_id`, `record_kind`, `source_confidence`, `influence_label`,
   `source_notes`, and `long_description` as a field (its content lives in
   `data/breedInfo.ts` keyed by name). `era` exists only on strip entries as
   free text including values like "c. 1576" (`data/uk-breeds.ts:34`), not
   the section 6 enum. `status` is an enum on strip entries but prose-parsed
   from notes everywhere else (`BreedTreeMap.tsx:127-139`); the string
   "Extinct historical type" would incidentally parse as extinct via the
   substring check.
10. **The disclosure is four sites, two of them rotating through variant
    wordings** (ten in `LineageMap.tsx:2217-2228`, five in
    `BreedTreeMap.tsx:236-242`). Section 7 speaks of "the existing
    disclosure" in one detail panel. Making it global means consolidating
    four implementations, and deciding whether the variant titles survive.
11. **"Historical influence" renames nothing.** No current label carries the
    word "influence" anywhere in the data or the tree components. The rename
    is actually an introduction, and the labels it would replace are "X% of
    this dog", "Share of this dog" (`BreedTree.tsx:6354-6356`) and "Ancestry"
    (`BreedClient.tsx:269`).
12. **Words instead of numbers conflicts with the layout engine.** `value`
    drives the d3 pack geometry and the percentage maths
    (`data/lineage.ts:3-9, 993-996`; `lineageArchive.ts:45-48`). A connection
    with "Main influence" and no number still needs a numeric `value` to be
    drawn. Labels can replace numbers in COPY, not in data.
13. **Name mismatches in section 5 against the code.** "Old Working Bandog"
    is `"Old working bandogs"` (`data/lineage.ts:1203`); "Old Highland
    Terrier stock" is `"Old Highland terriers"` (`549`); section 1's quoted
    labels "Old Working Collies", "Land Spaniels", "Old Highland Terriers"
    are actually `"Old working collies"` (`879`), `"Land spaniels"` (`529`),
    `"Old Highland terriers"` (`549`). Exact-name keying (grafts, breedInfo,
    the archive index) makes case differences load-bearing.
14. **Migration scale.** Section 6 asks whether `record_kind` is a migration
    or a handful of edits: 125 top-level entries, 284 child objects, 90 strip
    rows and 54 pack rows, with child objects owning no identity. Migration.
15. **Vertragus.** The record shape has no alternate-name field
    (`data/lineage.ts:11-17`), so per section 3's own rule the term is
    dropped. NOT FOUND, resolved by the brief's fallback.
16. **Section 11 "Settled" says the seven images are confirmed present in
    `public/history/`.** Present, correct names, wrong folder, and currently
    untracked by git, which is its own 404 risk regardless of case (Q6).

---

Batch 0 complete. Stopping here per BRIEF.md section 2 and section 8: no
Batch 1 work has been started, and no file beyond this report was written.
