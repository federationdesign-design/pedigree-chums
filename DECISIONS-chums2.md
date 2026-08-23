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

## Bounded tree: strip the pit collection chrome (2026-08-23)

### D33. In bounded mode the tree is ONLY centre card + name pill + nodes + connectors
- The bounded tree was pulling in the pit's learn/collect chrome. Gated off in bounded (all default-off, so the pit is byte-identical):
  - Dark panel wash: .overlayChum is no longer applied when bounded (className), so the region is transparent (item 3). (.overlayBounded already dropped .overlay's own background.)
  - Frame slot sections + their headings ("Alive and kicking" / "These dogs have had their days" / "A Pedigree Chum") + the frames counter: frameSlots returns empty when bounded, so frameTotal = 0 and every frameTotal>0-gated element (frames, .frameCount, .packHead) is off.
  - 0/9 circles-turned counter (.dotCount): gated with !bounded.
  - Yellow Back button (.close): gated with !bounded (item 4: /chums2 uses the page's own CloseX, which rails the reopen icon).
  - LEARN button (item 2): gated with !bounded. The green Complete / "Collect Ancestor Pack" buttons were already off for this hosting (circular / !strongBg gated).
- The name pill (root .tag), nodes, connectors and centre card are untouched, so the tree keeps exactly those.

## Inline tree not rendering: fix (2026-08-23)

### D32. Tree started in the `closed` set, so it never mounted
- Bug: on production /chums2 the inline tree area was empty. Cause: the initial `closed` set still contained "tree" (added in D13 when the tree was an overlay opened on demand). The render guard `SHOW_SECTIONS.tree && lineage && !closed.has("tree")` was therefore false on load. Not a vp/ref/coords issue (vp seeds 900x520 before the ResizeObserver measures, never zero; ref/lineage/coords are fine).
- Fix: the tree is now inline and visible on load, so it must not start closed. Initial `closed` = only the rail card ids; "tree" (and the diagram) are added to `closed` only when X'd (which rails the reopen icon).

## Family tree inline: bounded LineageMap (2026-08-23)

### D31. bounded + hideLeafImages props on LineageMap; inline tree on /chums2
- Supersedes the D13 overlay-on-demand decision: the tree now renders INLINE on the wide canvas.
- Exactly what `bounded` (default false) changes, all additive/gated so bounded=false is byte-identical:
  1. .overlay and both SVGs get a modifier class (.overlayBounded / .svgBounded) that switches position:fixed -> absolute (and .overlayBounded drops the fixed z-index, brand-wash background and fade), so they fill a positioned page region instead of the viewport.
  2. `vp` (the coordinate canvas) is measured from the overlay container via a ResizeObserver (overlayRef) instead of window.innerWidth/Height. Seeded 900x520 until measured.
  3. The four inline position:fixed HTML blocks (info panel, stacked cards, placed cards, pct panel) become position:absolute, so they resolve against the region not the viewport.
  4. The info-panel viewport clamps use vp (container) when bounded.
  5. Chrome (.close Back-X, .dotCount, .frameCount, .pauseBtn) becomes absolute within the region (CSS .overlayBounded descendant rules); most is game-state-gated and dormant in the depth-2 rest view anyway.
  The host passes breed.x/y as container-local coords and gives the region position:relative + a fixed size.
- `hideLeafImages` (default false): the node click still expands (follow), scores and recolours (seen/blue), but skips the pick/pin block, so a deepest node never reveals a breed IMAGE tile, it stays a labelled % circle (item 6; the ancestor pack already shows those images).
- `seen` is seeded from initialDepth (openIdsToDepth) so the pre-expanded depth-1 nodes render as the dark named % circles and only the depth-2 frontier stays yellow dashed with "+N inside" (matches the concept). Pit unchanged (no initialDepth).
- /chums2: SHOW_SECTIONS.tree = true; the tree is a bounded LineageMap inside .treeRegion (position:relative, 1100x660), in a new .introTopRow to the RIGHT of the intro box; breed={{x:550,y:320}} = region centre; strongBg, initialDepth={2}, hideLeafImages. Its own Back X closes -> closeCard("tree") -> the rail icon reopens it.
- Gates: tsc clean; eslint chums2 clean; LineageMap 47 (under its 48 baseline); :global audit clean.
- NEEDS VISUAL VERIFICATION (no dev server): (a) the pit lift card and every game path must be byte-identical (bounded=false; verified by construction, but please eyeball the mini pit / a game round). (b) The /chums2 inline tree: check it fits the 1100x660 region (nodes may need a bigger region or a different breed.y), the depth-1 dark / depth-2 yellow-dashed colours, and the drag: panning the tree uses LineageMap's general background pan (delta-based, works in bounded); the centre-card-specific drag is gated on a game end-state (framesDone/packed) and may not fire in the display tree, flag if the card itself must drag.

## Wide-canvas layout model (2026-08-23)

### D30. /chums2 is a wide canvas with horizontal scroll; chrome scrolls with it
- Item 1: .canvas min-width = 2000px (the live /chums canvas is 1800px; I exceed it so the fixed-size lower band never squashes). Chums2Client enables horizontal scroll by setting html/body overflow-x:auto on mount (the global rule is overflow-x:clip), restoring on unmount. Sections lay out at natural sizes across the width.
- Item 2: fixed-size lower band via CSS grid, no flex squeezing. grid-template-columns: 840px (famous area, holds up to four 200px cards at natural size) 900px (chart); column-gap 56px. The chart slot is width 900px and pinned to grid-column 2, so its SIZE and POSITION are invariant to chum count: fewer chums use less of the 840px famous area; at 0 chums the famous block is not rendered but the 840px column stays reserved, so the chart holds the same size and position. Chart px = 900 (fluid LifespanChart fills the 900px slot; viewBox scales, no label cropping).
- Item 3 mechanism: ROUTE-SCOPED OVERRIDE via a data-pc-chums2 attribute set on <body> by Chums2Client (removed on unmount). Scoped CSS: globals.css makes body[data-pc-chums2] position:relative min-width:2000px (a 2000px positioning context) and un-fixes the nav bar (body[data-pc-chums2] .pc-nav { position:absolute }), so the logo, contrast toolbar and hamburger scroll with the page. The 0/10 counter is un-fixed in its own module (HiddenGamesCounter.module.css) via :global(body[data-pc-chums2]) .counter.counter/.reveal.reveal { position:absolute }, compounded with the local class (no bare :global). Other routes keep their fixed behaviour.
- Items 4/5: header and left column stay left-anchored (padding-left, no centering/stretch); the left cluster sits at the left edge. Lower band ends ~1910px, inside the 2000 canvas.
- NEEDS VISUAL VERIFICATION (no dev server here): the chrome un-fixing spans shared files (globals.css nav, HiddenGamesCounter module) and depends on body being a 2000px positioning context; the fixed->absolute nav and counter should sit at the canvas corners and scroll away. Timed hidden-games cards (prelude/intro, fixed) were left as-is (transient, dismissible); flag if they should also un-fix.

## Lifespan chart double-render fix (2026-08-23)

### D29. Removed the leftover chartBox render; one chart only
- Bug: the lifespan chart rendered twice. The lower-band render (fluid, with the LIKELY LIFE SPAN heading) was correct; a second, cropped copy came from a leftover .chartBox render inside .introStack (added in an earlier step when the chart briefly lived under the intro box, before the lower band existed). Switching lifespanChart on lit up both.
- Fix: removed the stray .introStack chartBox render (and its now-unused .chartBox CSS). Exactly one LifespanChart renders now, the lower-band one.
- Item 2 audit: every component in Chums2Client has exactly one render site now (RunningCostCard, SuitabilityRadar, ExerciseCard, GroomingCard, TrainingCard, HealthSection each appear once in the cards memo; Chums2Rail, FamousDogsSection, LifespanChart, BreedTree, BreedTreeMap, LineageMap, CloseX each once; DragCard once inside cards.map, i.e. a list not a duplicate; TileZoom once, part of the popout system). No other double-render exists.

## Lifespan chart switched on (2026-08-23)

### D28. Count-aware lower band (famous chums + lifespan chart)
- SHOW_SECTIONS.lifespanChart = true (nothing else on). Famous chums and the chart now share a flex-row .lowerBand (align-items:flex-start, tops aligned), inside the right column below the pack. No absolute offsets.
- Chum-count aware: .famousWrap is flex 0 1 auto (takes the width its cards need, shrinks so the cards wrap within their own width when tight, max-width min(860px,56vw)); .chartSlot is flex 1 1 340px min-width 300px (takes the remaining width, fixed gap between). With zero famous chums the famous block is not rendered, so the chart flex-grows to the full band directly below the pack. Many chums wrap within .famousWrap and never push the chart under or over.
- To let the band be wide, .introStack now flex:1 (fills the leftBand remaining width); leftBand gained a right padding so the band clears the right edge. Intro box and pack stay left-aligned narrow.
- Chart fits without cropping: added a defaulted `fluid` prop to the shared LifespanChart (viewBox 0 0 1008 576 + width:100%/height:auto in fluid mode). Default false leaves the live /chums page byte-identical (same width/height attrs, no viewBox). LifespanChart eslint stays at baseline (10). /chums2 passes fluid, so the fixed 1008x576 chart scales to its slot with all axis labels intact.
- Heading "Likely life span" added above the chart in the ANCESTOR PACK / FAMOUS CHUMS treatment (.packTitle) so the two headings top-align.
- Verified by layout reasoning (no dev server) against three breeds: yorkshire-terrier (2 chums), bichon-frise (0 chums, chart full band), border-collie (4 chums, most in data/famousDogs; cards wrap, chart takes the rest). All three have lifespan curves.

## Famous chums switched on (2026-08-23)

### D27. Famous chums in the right column; Smoky "duplicate" is a mockup artifact, not a bug
- SHOW_SECTIONS.famousChums = true (nothing else on). FamousDogsSection moved INTO .introStack (right column), directly below the ancestor pack, sharing the pack/intro-box left edge. Wrapped in .famousWrap (max-width min(920px,74vw)) so the card row can extend right of the intro box before wrapping while keeping the shared left edge.
- Heading "FAMOUS CHUMS": the shared component's own <h2> restyled page-scoped to match ANCESTOR PACK exactly (Montserrat, navy, clamp(1.2rem,2vw,1.7rem)); the shared section's 20px heading gap tightened to 14px via .famousWrap > div to match the pack rhythm.
- Cards left as shipped (navy rounded, REAL type pill, name, knownFor, wrapping row, 12px gaps).
- ITEM 5 DATA CHECK: the Smoky-twice in the concept is NEITHER a data nor a render bug. data/famousDogs.ts "yorkshire-terrier" has exactly two unique entries (Smoky, Mr Famous); FamousDogsSection maps them 1:1 keyed by name (no repetition). The live render shows two cards, Smoky and Mr Famous once each. The four cards in the concept crop are a mockup artifact (the two duplicated to fill the row). No code fix made; nothing to fix.

## Enlarge popup: genuine reuse via shared TileZoom (2026-08-22)

### D26. Removed the lookalike; extracted the mini-pit enlarge into a shared component both pages render
- Standing rule (Steve): "reuse" = import/render the SAME shipped component, or extract its exact markup+CSS into a shared component both pages import. Never a parallel lookalike.
- Item 1: removed last round's from-scratch centred-modal popup (markup + CSS) entirely.
- Item 2: the mini pit learn enlarge lives in components/PackPit/LineageMap.tsx. Magnifier button ~line 2816-2825 (calls magnifyHold, which sets zoomedId + infoHover). Enlarged image overlay ~2856-2881 (fixed img, CW*3, blue-deep border, drag via zoomOff/zoomDrag, 2s auto-close via magnifyRelease/zoomTimer, no backdrop/X). Description panel ~2677-2716 (navy, yellow name Luckiest Guy 13px, Montserrat body, PANEL_W 219, repositions beside the enlarged image when zoomOpen). All inline-styled (no CSS-module classes).
- Item 3: extracted those two blocks VERBATIM into components/TileZoom/TileZoom.tsx (owns zoomOff drag + the 2s auto-close + the panel-hides-on-its-own-leave nuance; host owns which tile is open and passes the tile's screen rect as `anchor`). LineageMap now RENDERS <TileZoom> in place of its two inline blocks (removed zoomOff/zoomDrag/zoomTimer/magnifyRelease; gated the i-only panel to !zoomOpen); /chums2 renders the SAME <TileZoom>. Inline styles kept verbatim (not moved to a module) to stay byte-identical.
- Item 4: /chums2 enlarge now grows in place from the tile, panel tight beside, same fonts/sizes, 2s auto-close, NO backdrop dim, NO floating X. Trigger is clicking the tile image (per the earlier /chums2 spec); the mini pit keeps its magnifier button. Both feed the same TileZoom.
- Item 5 AUDIT (not reworked): the /chums2 i-popout (.framePopover) and % popout (.framePctCard + pctCard*) ARE also from-scratch lookalikes: the i-popout mirrors LineageMap's infoHover panel; the % popout mirrors LineageMap's pctHover / BreedTreeMap's pctCard (I copied genLabel + PCT_TITLES + the markup rather than sharing the shipped component). Flagged for a future genuine-reuse pass.
- Gates: tsc clean; eslint chums2 + TileZoom clean; LineageMap 47 (under its 48 baseline). CANNOT runtime-verify the mini pit here (no dev server): the extraction is faithful (verbatim styles/handlers/timer, panel-hide nuance preserved), but Steve should visually confirm the mini pit enlarge on /britains-dog-history after committing.

## Ancestor pack popouts round 2 (2026-08-22)

### D25. Popout name titles restyled; enlarged-image popup added
- Item 1: both popout name titles (i info .framePopoverName and % detail .pctCardName) changed from the display font (Luckiest Guy, hard to read) to Montserrat, weight 800, still yellow, 18px, clearly larger than the body text. Same treatment on the image popup name. /chums2 only.
- Item 2: clicking a tile IMAGE opens an enlarged-image popup: a big rounded image (left) beside a navy panel (right) with the ancestor name (yellow Montserrat) and its description. Reused component/behaviour (stated per request): the pit's magnifier + image-enlarge in components/PackPit/LineageMap.tsx, its placed cards show a magnifier (~line 2540/2559) and the enlarge is the zoomedId zoom-overlay (~line 2858: rounded, blue-deep border, shadow) which I mirror for the enlarged image. The description text is the same note the i-popout uses (frame.note, i.e. breedInfo || node note). No shared file touched this round.
- Item 3: the image popup joins the single openPop {id, kind:"info"|"pct"|"image"} state, so only one popout is open at a time across i, % and image. Closes on its X or on the backdrop / outside click.

## Ancestor pack refinements (2026-08-22)

### D24. Bigger tile badges + % detail popout, reusing the shipped pattern
- Reused component/data (item 3): the percentage-detail popout is the shipped pctCard (components/BreedTreeMap/BreedTreeMap.tsx) / pctHover (components/PackPit/LineageMap.tsx). Its DATA SOURCE is BreedTreeMap's onFramesReady, which already computes pct = leaves/root-leaves ("% of your chum"). I extended FrameNode + the walk to ALSO emit share = leaves/parent-leaves ("As parent") and depth (both optional, additive; existing callers unchanged; BreedTreeMap eslint stays at baseline 2). The popout markup mirrors the shipped one: name in yellow, "{pct}% of your chum", "As {genLabel(depth)}: {share}%", "Share of your chum: {pct}%", a deterministic title from the same PCT_TITLES list (includes "Our interpretation, not established fact."), and the "These figures come from history..." disclaimer. genLabel/PCT_TITLES/pctTxt copied from the shipped source.
- Item 1: i-button 16->24px (font 13), % pill font 8->11px with more padding; tiles stay 61px, grid gaps widened to 22px/14px so the bigger badges still clear neighbours.
- Item 2: i-popout padding 10/14 -> 14/18; its text +2px (name 13->15, note 11->13).
- Item 4: clicking the % pill opens the % popout; single shared state openPop {id, kind} means only one popout (i or %) is open at a time, per tile and overall. Closes on its X or on any outside click (a document click listener; the triggers and popouts stopPropagation).

## Ancestor pack switched on (2026-08-22)

### D23. Ancestor pack: in the right column below the intro box, rail-icon-sized tiles
- SHOW_SECTIONS.ancestorPack = true (nothing else on). The visible pack moved INTO .introStack (the right column of .leftBand), directly below the intro box, so it shares the intro box's left edge (introStack now align-items:flex-start). The hidden BreedTreeMap feed stays a separate off-screen div. Famous chums remain below (still off).
- Heading "ANCESTOR PACK" unchanged: Montserrat, navy, above the grid.
- Tile size set to EXACTLY one rail-icon tile: 61px (was 52px), grid-auto-columns 61px. Global box-sizing:border-box means both are 61px total including their borders. Border kept 3px.
- Badges scaled to fit 61px without overlapping neighbours: i-button 20->16px at right/top -6px; % pill centred under the tile (left 50% / translateX(-50%)) at bottom -9px, font 8px.
- Grid: grid-auto-flow column with grid-template-rows repeat(var(--pack-rows),auto); packRows = 2 (min) up to 30 dogs, 3 (max) beyond, columns = ceil(count/rows). For Yorkshire's 10 ancestors that is 5 columns x 2 rows, matching the concept. Extra dogs grow columns.
- NO internal scrollbar: removed overflow-x/max-width from .packGrid, so every tile is visible; the page scrolls if a pack ever grows very wide.
- Gaps small and even: 18px row / 12px column (the larger row gap clears the % pill and i-button overflow).

## Intro box corrections vs concept (2026-08-22)

### D22. Intro box: correct text source, styling and rail order to the concept
- TEXT SOURCE FIX: the box now shows the learn-area write-up from data/breedInfo.ts (breedInfo[name]) plus " Tap a circle inside to keep digging." when the breed has lineage children, composed exactly as the diagram caption does (BreedTree line ~7335-7338). It was wrongly showing breed.character. breed.character is now unused in the client (server still passes it; left in place to avoid churn).
- Removed the yellow "About the {name}" heading; body text only.
- Body text enlarged to clamp(1.15rem,1.15vw,1.4rem) (was 13px), line-height 1.5, to match the concept proportion.
- Box width reduced 15%: clamp(320,33vw,560) -> clamp(272px,28vw,476px).
- leftBand rail-to-box gap tightened 14px -> 5px (~a third); square-to-first-icon gap tightened via leftBand margin-top 12px -> 6px.
- Rail icon order set to the concept via an explicit RAIL_ORDER: temperament (brain), tree, lifespanExplain (hourglass), cost, suitability, exercise, grooming, training, then influence, health, diagram (the last three are not in the concept crop; kept and appended, only shown when closed).

## Intro box switched on (2026-08-22)

### D21. Blue intro box on, right of the rail, tops aligned
- Split the old introBand flag into introBox (true) and lifespanChart (false), so only the intro box shows, not the chart.
- Rail and intro box now share a flex-row wrapper .leftBand with align-items:flex-start, so the box's TOP sits on the same line as the rail's first icon (the key alignment). The rail lost its own margins (leftBand handles the left alignment with the square and the small fixed 14px rail-to-box gap; margin-top 12px keeps the rhythm below the square).
- Intro box: navy rounded box, white Montserrat write-up, width clamp(320px,33vw,560px) (~a third of the viewport), height driven by its text (no fixed height). Content/styling unchanged from before.
- Nothing else switched on; pop-outs still gated off.

## Rail switched on, repositioned (2026-08-22)

### D20. Icon rail moved into the left column below the square
- SHOW_SECTIONS.rail = true. The rail is now IN-FLOW (was position:fixed top-left), rendered directly after the header and left-aligned with the chum square (margin-left matches the header's left padding clamp(18,4vw,48)), continuing the logo / counter / square stack downward.
- Icons keep the 20% size reduction (61px tile, 34px glyph). railItems is unchanged: the tree icon (tree is closed) plus every card icon (all cards still closed).
- Pop-outs stay gated off: openCard now no-ops for any id whose SHOW_SECTIONS flag is false, so clicking a rail icon does nothing (the icon stays) until its section is switched on. Only the rail is on.
- No new whitespace beyond the rail's own height + a 24px bottom margin; the canvas stays content-driven.

## Header round 2 (2026-08-22)

### D19. The "0/10" counter is HiddenGamesCounter (global), left in place; square moved below it
- Owner: components/HiddenGamesCounter/HiddenGamesCounter.tsx, its minimised `.reveal` pill renders `{count}/{total}` (the "0/10"). It is a root-layout global that sits under the logo (Task 136) and shows whenever the logo shows.
- Why it rode on the square: its CSS nudges it +47px right (and translateX(30px)) to clear the Pick a Chum launcher. I hid that launcher on /chums2 (D15), so the nudge lands the counter over the chum square once the square moved under the logo.
- Fix chosen (lightest, no shared edit): leave the global counter where it is (still tucked under the logo) and drop the chum square BELOW it via header padding-top clamp(110px,14vh,146px), so the counter no longer rides on the square. Confirmed owner per the request.
- OFFER to Steve: if he wants the counter directly under the logo's LEFT edge on /chums2 (un-nudged), I can add a /chums2-scoped override (a body[data-pc-chums2] rule compounded with .reveal.reveal in the counter's module CSS, plus a body-attribute effect in Chums2Client). Not done yet to avoid a shared-CSS change unless wanted.
- Other round-2 header changes: title much bigger (clamp(2.2rem,4.2vw,4.8rem), ~double) with subtitle scaled up (clamp(1.3rem,2.3vw,2.4rem)); tight fixed 16px gap between square and title (item 3); title+subtitle nudged slightly lower (headerText margin-top, item 4); right padding reduced so the big one-line title spans toward the toolbar while staying below its row (item 1); square keeps rotate(2deg) and sits snug under the counter so its top-left corner slightly overlaps the logo area (item 5).
- Tuning note: the exact one-line fit and the square/counter overlap are screenshot-match values I cannot verify without a dev server; tuned for wide (concept) widths, wrap is the fallback per the one-line rule.

## Header layout step (2026-08-22)

### D18. Header repositioned to the concept: left column + one-line title
- Logo (Nav, top-left) with the square chum image DIRECTLY BELOW it and left-aligned to it: header padding-left = the logo's left inset clamp(18,4vw,48), padding-top clamp(84,8vw,104) clears the logo height so the image drops below it rather than beside it. This resolves the D14 conflict: the rail is now hidden (D17), so the image can finally sit on the logo's x-axis.
- Title is ONE line: "LEARN ABOUT THE " white + "{NAME}" yellow, same size, Luckiest Guy, layered drop shadow. titleLead/titleName are now inline (were stacked blocks at 0.46em); a {" "} keeps the space. Sits to the right of the square, vertically centred against it (align-items:center). Font clamp(1.5rem,2.9vw,3rem) so common names fit one line; the reserved right padding (clamp(200,20vw,300)) means if a long name wraps it wraps before the toolbar, never under it.
- Subtitle unchanged: directly beneath the title in the same column, tight (margin-top 4px), left-aligned with the title.
- All sections stay hidden (SHOW_SECTIONS unchanged). No new whitespace below the header.

## Reset to header-only baseline (production review 2026-08-22)

### D17. SHOW_SECTIONS gate, header-only baseline
- Per production review, /chums2 is stripped back to render ONLY the header (square image, "LEARN ABOUT THE {NAME}" title, subtitle). Everything else is HIDDEN not deleted: all code and wiring stay, gated behind a single `SHOW_SECTIONS` flags object at the top of Chums2Client (introBand, diagram, ancestorPack, famousChums, cards, tree, rail, backButton), all false. Sections get switched back on one at a time under Steve's direction in later steps.
- No dead whitespace: .canvas lost its min-height:100svh and padding-bottom, so height is content-driven and the page is only as tall as the header.
- The hidden BreedTreeMap frame feed is now gated with the pack (only mounts when ancestorPack is shown).
- Gates: tsc clean, eslint chums2 clean. One transient react-hooks/refs false-positive appeared when the cards map was wrapped in `SHOW_SECTIONS.cards && ...`; avoided by keeping the original map structure and gating inside the ternary (`!SHOW_SECTIONS.cards || closed.has(id) ? null : ...`).

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
