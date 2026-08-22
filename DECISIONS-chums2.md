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

### D9. Lifespan chart + explanation (SUPERSEDED by production feedback item 9)
- Originally one rail card (chart + explanation). Production feedback (2026-08-22): the lifespan CHART is now always-on-page (in the intro band, right of the intro box), NOT a rail card. Only the lifespan EXPLANATION (text + method/sources) stays as a rail card, id "lifespanExplain". Its rail icon is the hourglass.

### D10. Health card width cap
- Brief 5.5: HealthSection unchanged inside a card; if too wide, cap at 560 and scroll internally. Built: card width 560, HealthSection wrapped in a max-height 70vh vertical-scroll container.

### D11. ?alt=1 fork (DELETED by production feedback item 8)
- The intro-box dual-build behind ?alt=1 is removed entirely. Production feedback item 8: the intro description box is no longer a rail card at all; it renders always-on-page in the left column under the header (like the old page). No fork, no rail icon, no altVariant prop, no searchParams read. The v2Variants switch and the server searchParams plumbing were deleted.

### D12. Ancestor pack grid numbers (REVISED by production feedback items 11, 12)
- Tiles reduced 77px -> 52px (item 11). Rows: ALWAYS at least 2, never 1 long row, max 3 (item 12): rows = count > 2*maxPerRow ? 3 : 2, maxPerRow = 15. columns = ceil(count / rows). CSS grid grid-template-rows: repeat(var(--pack-rows), auto) default 2, grid-auto-flow: column, grid-auto-columns: 52px, so a big pack adds columns (width), never a 4th row. In flow in the left column with a rail-clearing left inset (item 13).

### D13. Family tree (LineageMap): implemented as an on-demand full-viewport overlay
- Brief 5.8 wanted LineageMap embedded BOUNDED, inline right of the diagram, visible on load at depth 2.
- Hard constraint found on reading LineageMap fresh: its root element is `styles.overlay` = position:fixed; inset:0, and it renders placed cards as position:fixed at viewport coordinates. It is architecturally a FULL-VIEWPORT OVERLAY. Making it render bounded inline would mean changing that shared positioning, which the game's pit-lift card and learn rail both depend on. That is a brief 2.6 STOP condition (cannot change game behaviour). So bounded-inline is not available without a new bounded mode inside LineageMap, a larger shared change Steve should design deliberately.
- DEVIATION from brief 5.8, chosen as the game-safe reading (this is the overlay branch D13 already anticipated): the family tree is LineageMap's native full-viewport overlay, opened ON DEMAND from the tree rail icon (closed on load, so it does not cover the page), not inline. Its own Back/close button calls onClose -> closeCard("tree") -> the rail icon returns. Centre card drags unchanged.
- Depth-2 pre-expand: added `initialDepth?: number` to LineageMap (default undefined = pit unchanged). It seeds the existing `open` set (the pit's own expansion mechanism, no second system) via a new module helper openIdsToDepth, which collects the ids of every node shallower than the depth, so a node renders its children exactly when its id is in `open`. /chums2 passes initialDepth={2}. LineageMap eslint stays at baseline (48).
- Embed prop set (matches BreedTree's chumTree usage, "the chum's own family tree"): `breed={{ name, image, x: innerWidth/2, y: innerHeight*0.75, angle: 0 }}`, `strongBg`, `currentScore={0}`, no `tree` (self-loads via getLineage(name)), `initialDepth={2}`, `onClose`.
- FLAG for Steve: this is a modal tree, not an inline-on-load tree. If you want it inline beside the diagram, that needs a new bounded rendering mode inside LineageMap (a deliberate shared-component change), which I did not make because it would risk the game. Tell me and I will design it behind a defaulted prop.
- CSS constraint respected: no perspective / backface-visibility / transform-style: preserve-3d anywhere in the chums2 chain.

## Production feedback batch (2026-08-22)

### D14. Header geometry: image cannot literally sit on the logo's x-axis
- Items 2 and 3 ask for the rail top aligned to the logo AND the square image on the logo's vertical axis. The rail is a fixed left strip (x ~10-71) and the logo is inset at x ~18-48, i.e. inside the rail zone. Any flow content on the logo's x (including the image) would be covered by the fixed rail.
- Built: rail raised so its top aligns with the logo line (item 2), icons -20% (item 1). The header image clears the rail instead of sitting on the logo x, i.e. it aligns to the left column immediately right of the rail. Image rotated 2deg (item 4), title/subtitle gap tightened (item 5), header right-padded to keep the title clear of the top-right contrast toolbar (item 6). Flagged for Steve's visual pass: if he wants the image literally under the logo, the rail must move (e.g. start below the header) so it does not cover it.

### D15. Speech-bubble leak (item 7)
- The stray speech bubble is the logo-anchored PickAChumLauncher (root layout), which overlaps the /chums2 top-left image. Fixed with a route guard: `if (pathname?.startsWith("/chums2")) return null;` placed after all hooks. Affects only /chums2 (a new route); the live /chums page, the game and every other route are byte-identical. Launcher eslint unchanged (9, baseline).

### D16. Circular diagram hosting corrected to LineageModal stageArea (item 10 + 2026-08-22 correction)
- First attempt sized the fill host as a fixed square box; the diagram rendered zoomed into one child and cropped (the SVG clips to its own bounds when the viewBox is zoomed in). That is the exact failure v2 exists to remove.
- Correction: host BreedTree like LineageModal's learn screen, .overlay (fixed, inset:0, NO overflow) -> .stageArea (absolute, inset:0) -> BreedTree fill. Replicated as a large page region (.diagramPanel: flex-grow, definite height min(88vh,1040px) so fill-mode height:100% has a box, overflow visible) between the rail and the tree column, no overflow clipping on it or any ancestor.
- ROOT CAUSE (confirmed by a full read of BreedTree's fill-mode view state): NOT a framing/zoom bug. BreedTree's mount entrance effect already ends in zoomTo(root) for the no-gravity path (dropArmed = true because holdEntrance is unset), so the seed view is the full pack. The zoomed-into-a-child symptom was the fill host collapsing: .treeFill/.stage use height:100%, which resolves to zero unless the PARENT has a definite height, degenerating the SVG box so meet-fit mis-frames. Fix = definite height on .diagramPanel (min(88vh,1040px)) + no overflow clip on any ancestor. No BreedTree change and no extra prop. startInLearn does NOT affect framing and was NOT added; the prop set stays root/rootImage/rootLabel/centred/fill/dockAside/strokeByDepth/tinted={false}/displayOnly.
- Still needs Steve's visual confirmation (no dev server available here).

### D3. Data passed to the client
- The old page passes name, slug, image, info, lineage. The v2 intro-box card (stage 3, brief 5.3) needs the breed write-up, which is `breed.character` (data/breeds.ts), not in `info`. Added `character` to the props the server passes, so the client has it without re-reading data.
</content>
