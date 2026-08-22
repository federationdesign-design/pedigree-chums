# DECISIONS: Chum pages v2 (/chums2/[slug])

Running log of reversed or non-obvious decisions, per brief section 2.
Format per entry: question, option A, option B, which built, one line why.
Dated. HEAD at start of run: e830e0dd (brief cited 51fef3d, stale; re-verified).

Baseline (measured before stage 1):
- git HEAD: e830e0dd
- eslint on shared files I may touch:
  - components/BreedTree/BreedTree.tsx: 61 problems (54 errors, 7 warnings)
  - components/PackPit/LineageMap.tsx: 48 problems (34 errors, 14 warnings)
  - components/CardDock/CardDock.tsx: 0 problems
- Rule: never exceed these counts on any file I touch.

---

## Stage 1

### D1. Mobile handling on /chums2
- Question: the old /chums route branches to BreedMobile on a mobile UA. What does /chums2 do?
- Option A: mirror the UA branch and render BreedMobile.
- Option B: render the desktop client for all UAs, no mobile branch.
- Built: B. Brief says desktop only, mobile comes later, and forbids touching BreedMobile. A UA branch would either couple to BreedMobile or need a new mobile file, both out of scope. Reversible: add the branch later.

### D2. noindex mechanism
- Question: how to keep /chums2 out of search while both pages exist.
- Followed precedent app/britains-dog-history-2/page.tsx, which sets `robots: "noindex"` in the route metadata. Used the same on the /chums2 server page.

### D4. Header title drop shadow exact values (brief 5.1 asked to log)
- `text-shadow: 0 4px 0 rgba(10,58,87,0.35), 0 6px 14px rgba(0,0,0,0.25)` on `.title`. Layered: a hard navy offset for the cartoon "sticker" edge plus a soft black ambient shadow. Matches brief default.

## Stage 2

### D5. Rail component: dedicated Chums2Rail, not the shared CardDock
- Question: reuse components/CardDock or build a new rail?
- CardDock is a fixed RIGHT-edge column that only shows already-closed items and reopens them. The v2 rail must be LEFT-edge, show every card closed on load, and pop a card open on click (inverted model). Making CardDock do that would change the live page's dock behaviour, which is forbidden.
- Built: a dedicated `Chums2Rail` under app/chums2/[slug]/ (brief 5.4 explicitly allows a small shared component under app/chums2/). It imports the exported `ICONS` glyph map from CardDock (import only, no edit) so icons stay visually consistent. Zero risk to the live page.

### D6. Circular-diagram rail reopen icon
- Brief 5.2: reuse the closest CardDock ICONS asset, else a yellow circle glyph.
- None of the ICONS (brain, tree, hourglass, pound, jigsaw, runner, scissors, mortarboard) depicts the circular lineage diagram. The tree icon (ICONS.ancestry) is reserved for the family tree. Built a simple yellow concentric-circles glyph for the diagram's reopen icon.

### D7. Repo found mid-merge with conflict markers (blocker, logged)
- During this session main HEAD moved e830e0dd -> 4985bff0 -> c593a8c0 (merges of origin/main and origin/dogsatwork by a concurrent operator).
- Working tree had unresolved conflict markers in tracked files: components/Nav/Nav.tsx (3), app/chum-calculator/ChumKnockout.tsx (15), app/chum-calculator/ChumKnockout.module.css; index UU entries with NO MERGE_HEAD (inconsistent). components/PackPit/LineageMap.tsx staged-modified.
- Consequence: tsc --noEmit (the gate) fails repo-wide on those conflict markers, independent of my code, so no stage gate can pass until the tree is clean.
- Surfaced to Steve. Decision (Steve): proceed on NEW untracked files only, no shared-file edits, until he cleans the tree.
- Two shared-file edits are therefore DEFERRED, not skipped:
  1. BreedTree: add optional `displayOnly?: boolean` (default false). Verified edits needed (exact-string, since line numbers move): gate the corner close-X block `{dockAside && (() => {` with `&& !displayOnly`, and OR `displayOnly` into the caption aside `visibility: hideCaption ? "hidden" : undefined`. Everything else (PLAY, START, slider, drop) is already inert because the v2 host omits `gravity`.
  2. LineageMap: add optional `initialDepth?: number` for the depth-2 pre-expand (stage 6), default current behaviour.
- Chums2Client currently passes `displayOnly` to BreedTree; this will type-error until edit (1) lands. Intentional and documented, so the finished shared edit closes it.
- UPDATE (later in session): the concurrent operator resolved the conflicts. Working tree no longer has conflict markers; only `M components/PackPit/LineageMap.tsx` remains staged by the operator (not mine). The full `tsc --noEmit` gate now reports EXACTLY ONE error: the deferred `displayOnly` on BreedTree. So the gate is one shared-file edit away from green. LineageMap still being staged means the tree is not fully settled, so shared edits stay deferred until Steve confirms.
- The two deferred shared edits are ready to apply on Steve's word:
  1. BreedTree `displayOnly?: boolean` (default false): gate the `{dockAside && (() => {` corner close-X block with `&& !displayOnly`, and OR `displayOnly` into the caption aside `visibility` (`hideCaption || displayOnly ? "hidden" : undefined`). Dated comment. Closes the only tsc error.
  2. LineageMap `initialDepth?: number` for stage-6 depth-2 pre-expand (see D13).

## Stage 3-6

### D8. Extra rail glyphs
- Cards the shared ICONS map does not cover got new stroke glyphs in chums2Icons.tsx: intro (open book), health (medical-cross shield), historical influence (percentage bar chart, kept distinct from the family-tree glyph which uses ICONS.ancestry). Same yellow-via-currentColor style so they invert on hover like CardDock glyphs.

### D9. Lifespan chart + explanation are ONE card
- Brief 5.4 inventory lists "lifespan chart + its explanation" as a single item. The live page had the chart fixed and the explanation as a separate card. Read the brief literally: one rail card holding the LifespanChart plus the EXPLANATION text and a Method and sources details block. Smallest reading of the "+". Chart wrapped in an overflow-x container so a wide chart scrolls inside the card.

### D10. Health card width cap
- Brief 5.5: HealthSection unchanged inside a card; if too wide, cap at 560 and scroll internally. Built: card width 560, HealthSection wrapped in a max-height 70vh vertical-scroll container.

### D11. ?alt=1 read on the server
- Read the query on the server page (searchParams) and pass altVariant to the client, instead of reading window in a mount effect. Avoids a setState-in-effect eslint error and any hydration mismatch: the server HTML already matches the variant. A single v2Variants(altVariant) object at the top of the client is the one switch (brief 5.3).

### D12. Ancestor pack grid numbers
- maxPerRow = 10, tiles 77px. rows = 1 if count <= 10, 2 if <= 20, else 3 (capped at 3). columns = ceil(count / rows). CSS grid: grid-template-rows: repeat(var(--pack-rows), auto) + grid-auto-flow: column + grid-auto-columns: 77px, so dogs past 30 add columns (width), never a 4th row. Matches brief 5.6.

### D13. Family tree (LineageMap) embed: scaffolded, embed deferred (KEY remaining work)
- Question: brief 5.8 wants LineageMap embedded bounded, right of the diagram in the main band, self-loading (no tree prop), pre-expanded to depth 2, centre card draggable unchanged, X close + rail icon.
- Blockers found:
  1. Depth-2 pre-expand needs LineageMap's expand mechanism. Its expandNode is INTERNAL, not callable from outside, so per brief this needs a new optional prop `initialDepth?: number` (default current behaviour) added INSIDE LineageMap. That is a shared-file edit, deferred under Steve's "new files only" instruction, and LineageMap is additionally staged-modified by the in-flight merge (D7).
  2. LineageMap is viewport-anchored: it renders placed cards as position:fixed and the precedent (BreedTree chumTree, self-loading) positions the centre card at window coords (innerWidth/2, innerHeight*0.75). Whether it can render bounded inside a main-band column (vs covering the viewport) needs visual verification, which is impossible while the tsc gate and dev server are unavailable on the conflicted tree.
- Built now: the tree panel container, its X close, and the rail reopen icon (tree is a panel in the rail inventory, open on load, closing rails its icon, reopening restores it). A labelled placeholder sits in the tree slot.
- Exact integration plan for when the tree is clean and renderable:
  a. Add `initialDepth?: number` to LineageMap (default undefined = current). When set, after first layout, run its existing expandNode for the root's children down to that depth. Dated comment, no behaviour change when unset.
  b. Embed with the chumTree-style prop set: `breed={{ name, image, x, y, angle: 0 }}`, `strongBg`, `currentScore={0}`, no `tree` (self-loads via getLineage(name)), `initialDepth={2}`, `onClose={() => closeCard("tree")}`.
  c. Decide bounded-vs-overlay by rendering: if it must stay a viewport overlay, position breed x/y over the right region and accept the fixed centre card (brief says do not modify its drag).
  d. Audit the ancestor CSS chain for perspective / backface-visibility / transform-style: preserve-3d (none in chums2 CSS today) and keep it that way.

### D3. Data passed to the client
- The old page passes name, slug, image, info, lineage. The v2 intro-box card (stage 3, brief 5.3) needs the breed write-up, which is `breed.character` (data/breeds.ts), not in `info`. Added `character` to the props the server passes, so the client has it without re-reading data.
</content>
