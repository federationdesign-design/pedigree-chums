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

## 2026-08-23 diagram review round: stroke-only, rotation, tighter zone (D61)

All /chums2-scoped (displayOnly or page-level), game byte-identical.
1. HOVER PREVIEW trimmed: circle-hover opens only the TileZoom image + the % card;
   the i info popout is click-only (removed its `preview` clause) - it just repeated
   the image panel text.
2. INNER OFFSET is now a ROTATION (the leftward shift failed - the pair re-centred).
   Post-relayoutMobile pass rotates each depth-1 parent's whole nested subtree about
   the PARENT centre by DISPLAY_INNER_ROT_DEG = 35 (named tunable), rigidly, tipping
   the pair diagonally off the vertical axis to expose the label. displayOnly-gated.
3. STROKE-ONLY: displayOnly circle fill is "none" (no photo, no depth fill) - just the
   white ring. The hover-yellow highlight keeps its solid yellow fill (the one exception).
4. STROKE -20%: sw *= 0.8 for displayOnly (the rings read heavy without the fill).
5. LABELS INSIDE: with photos gone the name is the content, so displayOnly draws it
   CENTRED and level (dx 0, no rotate) instead of the game's rightward-shifted arc,
   where the fit radius already contains it.
6. ZONE narrowed toward the pack. The pack is height-bound at ~511 wide (cannot fill a
   wide zone); trimming the canvas pulls the canvas-right-anchored zone edge + tree +
   chart left together (--diagram-zone-right stays 1015). Canvas 2750 -> 2344: zone
   right edge 1329 (just past the ~1320 pack right), stage width ~520 (aspect ~0.74 >
   the 0.68 height-bind threshold, so the pack stays height-bound and UNCHANGED), tree
   left 1429, tree right 2269 + 75 margin. gutter 5 ~109 (was 520). NOT exactly 100: a
   small pack->zone margin keeps the aspect buffer; going tighter risks wider/taller
   breeds crossing into width-bound (the pack would shrink). Bump the canvas up a touch
   if the audit shows a breed shrinking.

## 2026-08-23 ancestor pack <-> diagram interaction round (D60)

All /chums2-scoped (displayOnly or page-level), game hostings byte-identical.

### D60.0 Event routing (the blocker): wrapper pass-through
MECHANISM: the behind-diagram is z-index:-1; every FULL-WIDTH wrapper that overlaps
it (.leftBand, .introStack) is pointer-events:none so events fall THROUGH to the
diagram SVG (pointer-events:auto -> hits only painted circles), and the interactive
LEAVES (.railWrap NEW, .ancestorPack, .famousWrap, tree/chart, popouts) are auto. The
bug was .leftBand: it was auto, so it captured over the diagram's empty middle even
though .introStack (its child) was none. Added .leftBand none + wrapped the rail in
.railWrap (auto) since it now inherits none. Circles are hoverable/clickable
everywhere they show; sections keep their own events.

### D60.1 Pack tile hover -> circle yellow
BreedTree gets `highlightName` (page-scoped). Tile onMouseEnter/Leave sets
packHoverName; the circle whose d.data.name matches paints solid var(--yellow) fill +
stroke (isHi = displayOnly && name match). Game never passes it -> inert.

### D60.2 Circle hover -> pack popouts (clicked wins)
BreedTree gets `onCircleHover(name|null)`, fired in the circle mouseenter/leave. The
page sets hoverPreview (with the tile's measured rect) IN the handler (an event, not
an effect -> no set-state-in-effect). `preview = openPop ? null : hoverPreview` so a
clicked popout WINS. The info popover, % card and TileZoom image all render for the
preview frame at the tile locations. Hover-out clears it.

### D60.3 Inner circles off-centre
Site: a post-relayoutMobile pass in the nodes useMemo (runs after the relayout so
"left" is true screen-left). For each depth-1 parent, its whole nested subtree shifts
LEFT by 0.45*parent.r (rigid, keeps the nest shape), clearing the vertical centreline
so the parent label shows. Gated displayOnly (added to the memo deps). Fraction tunable.

### D60.4 / D60.5 padding + badges
padding(displayOnly ? 0 : 8) so nested circles sit flush; the yellow % badge group
gains `&& !displayOnly` so the diagram drops the badges (pack tiles keep their pills).

### D60 pack order + popouts (second batch)
- ORDER oldest-first: FrameNode gains era/anchor from data/uk-breeds.ts (new nodeEra,
  same name-join BreedTreeMap already uses for status). orderedFrames sorts by anchor;
  ancestors with no anchor sort LAST (never invented). Era shown as a line in the i
  card (.framePopoverEra) only when present. CAVEAT: uk-breeds coverage is partial, so
  ancestors absent from it show no era and trail the sort - by design, no dates invented.
- PERSISTENCE: TileZoom gains `persist` (skips the 2s auto-close); /chums2 passes it and
  now closes the image on OUTSIDE click (removed the image exclusion in the doc-click
  effect; image+panel stopPropagation so their own clicks do not count). Pit keeps its timer.
- IMAGE BORDER: TileZoom gains `borderColor`; /chums2 passes frameBorder(status) so the
  enlarge border matches the tile outline (green/orange/red). Pit keeps blue.

## 2026-09-06 tree/chart column pulled left (option A: shrink the canvas)

### D59. Tree follows the diagram zone; canvas trimmed 3000 -> 2750
Option A, fixed reposition. Key insight: the diagram stage RIGHT edge, the tree column
and the chart column are ALL canvas-right-anchored (right offsets), while the pack is
left-anchored (stage left 809). So shrinking the canvas min-width pulls the stage right,
tree and chart LEFT together (gutter 5 preserved at 100) while the pack stays put - and
because the pack is HEIGHT-bound at aspect >= 1, its width depends only on the stage
HEIGHT (unchanged), so narrowing the stage does NOT change the pack (D58). One lever
does points 1, 3, 4 and 5.
- Decoupled the columns with `--diagram-zone-right: 1015px` (the zone right edge as a
  canvas-right offset). `.diagramStage right = var(--diagram-zone-right)`; the tree and
  chart `right = calc(var(--diagram-zone-right) - var(--gutter-tree) - 840px)`, so the
  tree column left = zone right + --gutter-tree (tree FOLLOWS the stage, brief 1).
- Canvas + body[data-pc-chums2] min-width 3000 -> 2750 (rig .diagCanvas /
  data-pc-chums2-diag stay 3000). NUMBERS at 2750: stage right edge 1735, tree column
  LEFT = 1835 (= 1735 + 100), tree right 2675, then a 75px right margin to 2750 (no dead
  plain). gutter 4 (60) and gutter 5 (100) preserved; pack unchanged.
- Tree size RECONCILED: 840 x 500 is real (CSS and DevTools agree); the older 640 x 460
  spec is superseded. Chart moves WITH the tree (same derived right, brief 3).
- Aspect stays >= 1 (stage 926 wide x ~700 tall = ~1.3 at 2750, safe for canvasH up to
  ~1286), so the pack is byte-identical; if a very tall breed pushed canvasH past that
  the pack would grow slightly - bump the canvas a touch if the audit shows it.
Banner stays; ?audit=1 on the three breeds now reads tree left ~1835 and confirms
gutters 4/5 held. Nothing else moved (pack + left column untouched).

## 2026-09-05 gutter 5 diagnosis: HEIGHT binds (zone too landscape for the pack)

### D58. Scale-up fails because the height term binds; gutter 5=100 is geometrically blocked
yorkshire ?audit=1 after the content fit: gutter 4 = 60 (exact), but the pack renders
379px wide in a 1176px zone (32%) and gutter 5 = 897. Which candidate:
- CANDIDATE 2 (a later view write overriding the fit) RULED OUT: cx is exact (gutter 4 =
  60), so displayRestView's frame IS applied - a later override would move cx too.
- CANDIDATE 3 (bbox inflated) unlikely: displayRestView measures depth>=1 non-echo, the
  same set the audit measures (fill != none).
- CANDIDATE 1 (contain-fit HEIGHT term binds) CONFIRMED: the pack fills 32% of the width,
  so width is not binding; the height term is. The two terms: to fill the 1176px WIDTH
  the pack (aspect ~0.72:1 - relayoutMobile turns the dockAside cluster ON ITS SIDE,
  portrait, ~line 910) would need ~1630px of HEIGHT; the stage is only ~600px tall, so
  height-fit wins (a wider view w = a smaller pack) and the pack fills the ~600px height
  at ~380px wide.
Fix per the steer (stage vertical extent + margin): stage bottom 170 -> 40 (extend down
to the content bottom, no spill) and displayRestView margin m 0.06 -> 0.03, so the pack
grows ~30%. Added the live fit terms to the ?audit=1 banner (stage WxH + aspect, pack
WxH + aspect, and "fill-width needs height N vs stage height M -> HEIGHT BINDS").
CEILING (stated honestly): gutter 4 = 60 AND gutter 5 = 100 are geometrically
incompatible for THIS pack in THIS zone. The pack fills the height; a ~600-760px-tall
pack is ~380-500px wide (portrait) - the 1176px-wide zone would need a ~1176px-wide pack,
i.e. ~1176-1630px tall, off the page. So gutter 5 reads a height-bound value (~500-750
after this fix), not 100. To reach ~100 the ZONE must be narrowed: bring the tree left to
follow the pack's right edge + --gutter-tree (needs the pack's runtime width, so a
JS-positioned tree; far-right then goes empty). Optionally, skipping the dockAside
portrait rotation for displayOnly would make the pack squarer/wider (gutter 5 ~750 not
~900) but still not 100. Deliverable: diagnosis + terms + the vertical fix; the zone
-narrowing / tree-follows-pack is a layout decision for Steve. Banner stays.

## 2026-09-04 content-aware resting fit (per-breed gutters hold)

### D57. displayRestView: per-breed content fit replaces DISPLAY_SPAN + PACK_PULL
The audit (D56) confirmed the pack floats ~290-344px wide in a ~1330px zone because the
fixed DISPLAY_SPAN view width + fixed PACK_PULL offset could not hold the gutters as the
pack width varies per breed. Implemented the D47/D48 content fit:
- New `displayRestView()` in BreedTree: over the VISIBLE circles (depth>=1, non-echo) it
  computes the pack's real world bbox, then returns the resting view [cx, cy, w] as a
  CONTAIN fit against the stage aspect: w = max(bboxW/WWperW, bboxH/((1-2m)*WHperW))
  (WWperW/WHperW = the world width/height shown per unit w, = aspect / 1 for landscape),
  cx = minX + (w*WWperW)/2 so the pack's LEFT edge maps to the stage's left edge
  (left-aligned), cy = bbox centre. Uses only the bbox + aspect (stage px cancel), so no
  ref access; safe in the useRef seeds and re-run in the mount effect.
- Wired at every displayOnly resting/home site (viewRef & homeWRef seeds, mount effect,
  backToStartScreen, PLAY reset, and the zoom-OUT-to-root branch) as
  `displayOnly ? displayRestView() : [<PIT_SPAN game view>]`. Zoom-into-a-child is
  untouched, so zoom is unchanged and zoom-out returns to this fitted frame.
- Added a small displayOnly-only re-fit effect (deps [displayOnly, aspect, nodes]) so the
  fit runs with the REAL stage aspect (the shared mount effect keys on [nodes, dropArmed],
  not aspect, and aspect is measured just after the first paint) and re-fits on resize.
- DELETED the DISPLAY_SPAN constant (no longer referenced) and the CSS PACK_PULL: the
  stage is now the EXACT zone (left = box right + --gutter-diagram = 809; right edge =
  tree left - --gutter-tree = 1985), and the fit fills it.
Game paths are byte-identical (displayOnly=false reduces every site to the original
`(dockAside ? PIT_SPAN : 1)` game view; displayRestView is never called). BreedTree stays
at its 61-problem (54e/7w) baseline. Expected: gutter 4 = 60 for every breed, gutter 5 =
100 when width binds (else the pack fills the zone height and gutter 5 is wider, contain
fit) - and the pack now fills the zone, bringing the tree/chart back into view. The
?audit=1 banner stays this round to verify the three breeds hit target; I cannot drive a
browser under the tsc/eslint/tsx-only tool limit, so the on-screen numbers need a load.

## 2026-09-03 no drop-in on the diagram; gutter audit instrument + proposal

### D55. displayOnly skips the drop-in entrance (settled immediately)
The diagram's falling/entrance choreography is the staggered rAF DROP-IN ENTRANCE in
BreedTree's mount/re-pack effect (~3154): each circle starts 1.3*SIZE above its packed
position and tweens down with a bounce, staggered ~45ms by index (dur 700). There is
already a settle-in-place branch (used by prefers-reduced-motion and a resize-only
re-pack) that just zoomTo(home) + setEntered(true) with no tween. Fix: add displayOnly
to that branch's condition (`reduce || resizeOnlyRef.current || displayOnly`), so on
/chums2 the circles appear settled at their resting positions immediately. Gated on
displayOnly; game hostings keep the drop.

### D56 (audit, temporary). Gutter instrument behind ?audit=1 + per-breed root cause
Built a dev-only, ?audit=1 on-screen readout (server-read `audit` prop like `diag`; a
fixed banner labelled "REMOVE BEFORE COMMIT"). It MEASURES at runtime (no estimation),
in canvas-space px: intro box right edge, the resting pack's actual leftmost/rightmost
circle x (min/max getBoundingClientRect of the visible `circle[data-n]`, hidden
root/echo dropped by fill="none"), the tree column left edge, and the real gutter 4
(box->pack) and gutter 5 (pack->tree). Load /chums2/<slug>?audit=1 per breed to read it.
ROOT CAUSE (confirmed by the staffie regression): the pack CENTRES in a fixed-position,
fixed-width stage, but the pack's OWN width varies per breed (staffie = two big circles,
yorkshire = many small ones, border-collie = another shape). PACK_PULL 356 was tuned to
yorkshire's estimated pack radius; a different pack width lands the centred pack's edges
at different offsets, so fixed CSS offsets can NEVER hold gutter 4 and 5 for every breed.
PROPOSAL (not implemented this round): derive the resting frame from the pack's MEASURED
bounding box per breed (the D47/D48 content-/height-aware fit). After BreedTree packs the
nodes, compute the cluster bbox (min/max x,y of the real circle centres +/- radii) and
set the resting view so the pack's LEFT edge maps to a fixed screen x (box right +
--gutter-diagram) and it fits the zone's short side; the pack's measured RIGHT edge then
fixes gutter 5. Gate the content-aware fit on displayOnly. This removes PACK_PULL and the
per-breed drift, so gutter 4 and 5 hold for every breed. Deliverable this round is the
instrument + this proposal; the measured three-breed numbers need a browser load of
?audit=1 (cannot drive a browser under the current tsc/eslint/tsx-only tool limit).

## 2026-09-02 five resting-layout gutters as CSS vars

### D54. Gutters 1-5 driven by four vars at the top of chums2.module.css
Steve numbered five resting-layout gutters; set as four vars on .canvas (gutter-v is
shared by 2 & 3) so every horizontal offset derives from them and tuning is one line:
  --gutter-rail: 40px    (1) rail right edge -> intro column left edge = leftBand gap.
  --gutter-v: 40px       (2) intro box -> ANCESTOR PACK = upperBand gap, AND
                         (3) pack -> FAMOUS CHUMS = introStack gap. Identical rhythm.
  --gutter-diagram: 60px (4) intro box right -> resting pack's leftmost circle (wider
                         than the old 20px). Every left-column item already shares the
                         one left edge (introStack align-items:flex-start).
  --gutter-tree: 100px   (5) diagram zone right edge -> tree column left edge.
Derived .diagramStage offsets (at a >=1200px viewport, leftBand pad 48):
  left = calc(48 + rail 61 + --gutter-rail + box 600 + --gutter-diagram - PACK_PULL 356)
       = 453px. PACK_PULL (356) is NOT a gutter: the pack centres in its stage, so we
       pull the stage left by ~half its empty margin to land the leftmost circle exactly
       --gutter-diagram off the box. box right = 749, pack leftmost = 809, gutter 4 = 60.
  right = calc(tree 75 + tree 840 + --gutter-tree) = 1015px -> zone right edge 1985,
       tree left 2085, gutter 5 = 100. The tree stays at its far-right concept position;
       the resting pack (small, D48) sits fully left of the 100px channel, with extra
       air between it and the channel until the pack is enlarged (D48). PACK_PULL is a
       documented constant, re-tune on a screenshot if the pack radius or a big
       --gutter-diagram/--gutter-tree change shifts the stage width.

## 2026-09-01 diagram: tight-left gutter, white outlines, behind everything, photos back

### D53. Horizontal gutters, white strokes, z-order behind, hideCircleImages removed
Four /chums2 diagram changes:
1. GUTTERS (chose: REPOSITION THE STAGE, not left-bias the frame). The pack centres in
   its stage, so moving the stage moves the pack - truest to the mechanism, and no risk
   to the shared BreedTree view code (whose resting frame is applied imperatively via
   zoomTo, so a `shift` change might not even survive to rest). The centred pack must
   sit tight to the intro box (leftmost circle ~20px from box right = 734) with the wide
   gutter on the RIGHT. The centred left margin is ~(stageW - packW)/2 ~ 314px, so pull
   the stage left by that: `.diagramStage` left 734-derived-calc -> 420px, right 915 ->
   1229px (stage width unchanged, so pack size unchanged). The 314 is off the estimated
   pack radius; nudge on a 3000 screenshot. Left column rhythm (brief 4) already matched:
   box->pack and pack->famous are both the 20px introStack/upperBand gap.
2. WHITE OUTLINES (chose: the displayOnly GATE in BreedTree, not page CSS). At the node
   circle stroke (BreedTree ~5704): `stroke={hidden ? "none" : displayOnly ? "#ffffff" :
   strokeColorFor(d)}`. Cleaner than a `.diagramStage circle` CSS override because it hits
   EXACTLY the node circle stroke, keeps the hidden circles' "none", and does not touch
   badge/toy/pill circles - and the node class .btCircle is hashed, so page CSS cannot
   target it precisely. Gated on displayOnly, so game hostings keep their depth strokes.
3. Z-ORDER BEHIND. `.canvas { isolation: isolate }` (own stacking context) + `.diagramStage
   { z-index: -1 }`, so the diagram paints just above the canvas background and BELOW all
   canvas content: intro box, pack, famous, tree, chart (auto z-index / in-flow, so
   effectively 0+) and the position:fixed popouts (z-index ~120) all render over it. To
   keep the behind-diagram zoomable in the open middle (the full-width introStack now sits
   over it), `.introStack { pointer-events: none }` passes clicks through and
   `.ancestorPack, .famousWrap { pointer-events: auto }` re-enable the real sections; the
   rail is a sibling of introStack, unaffected. Values: stage -1, sections auto/0+.
4. PHOTOS BACK: removed `hideCircleImages` from both the page and the ?diag=1 rig BreedTree
   calls. The prop stays defined in BreedTree, defaulted false (costs nothing, available).

## 2026-08-31 diagram: kill the surviving clip + traditional no-photo look

### D51. Surviving flat cut: the effects-canvas raster (and a guaranteed svg un-clip)
A render-tree map from the painted <circle>s up to <html> showed the circles' ancestor
chain is g -> svg -> .stage/.stageDocked -> .tree/.treeFill -> .diagramStage -> .canvas
-> body, and NONE of those set overflow (other than the svg's UA-default hidden), no
clip-path, no contain, no second svg, no foreignObject. So the only two possible
clippers were: (1) the pack <svg>'s default overflow:hidden (my earlier .diagramStage
svg { overflow:visible } already lifts it, but to remove any cascade doubt I now ALSO
set overflow:visible INLINE on the svg for displayOnly, which no rule can override);
and (2) `.fxCanvas`, the effects layer, a <canvas> sibling above the svg sized in JS to
the stage rectangle - a raster bitmap, so any effect it paints for a zoomed circle is
hard-cut at the stage's bottom edge, and overflow:visible cannot lift a bitmap. That
canvas is the surviving flat horizontal cut. Fix: in displayOnly, do not render the
fxCanvas at all (`{!displayOnly && <canvas .../>}`); the static diagram needs no fx.
Both fixes gated on displayOnly, so the mini pit / main pit / every game path are
byte-identical. Now nothing but the browser window clips at any zoom state.

### D52. hideCircleImages: traditional no-photo diagram, plain filled circles
New defaulted BreedTree prop `hideCircleImages` (default false), passed by /chums2 (both
the full-page diagram and the ?diag=1 rig). It gates the single image funnel `nodeImg()`
to return undefined for every node, so the pattern def, the hasImg/tint path and the
circle `fill` all fall through to `fillFor(d)` - the existing solid depth palette:
navy #0a3a57 (root, hidden anyway), #1f8fd0 (depth 1), #bfe3f7 (depth 2+), the site's
blue family. No breed photo at any depth; existing strokes, labels and % badges are
unchanged. It is SEPARATE from the accessibility HIDE_IMAGES mechanism (not reused, not
modified) and page-scoped via the prop, so default false keeps the mini pit, main pit
and every other hosting byte-identical.

## 2026-08-30 window scroll fix (body was the scroll container)

### D50. Mid-page horizontal scrollbar cropping the diagram: <body> was a scroll container
Symptom: a horizontal scrollbar mid-page with dead space below it, and the scroller's
bottom edge cropping the diagram (flat cut at the scrollbar line). Cause: the wide
-canvas mount effect (D30) set `overflow-x: auto` on html AND body. On <body>,
overflow-x:auto (a) makes body a scroll container and (b) coerces its overflow-y from
visible to auto (the CSS "auto + visible -> auto both axes" rule). <body> is only as
tall as the canvas's IN-FLOW content, but this round's restructure made the diagram,
tree and chart ABSOLUTE canvas-children that run BELOW that in-flow height, so the body
scroll container clipped them and dropped its own horizontal scrollbar at its bottom
edge, mid-page. globals deliberately pins html+body to overflow-x:clip precisely to
keep body OUT of the scroll-container role (its comment says so); the effect's `auto`
overrode that. No wrapper between body and the sections was a scroll container (the
only overflow:auto rules, .chartWrap/.scrollBody, are card-only and the cards are gated
off). Fix: the effect now sets overflow-x: VISIBLE, not auto, on html+body. visible
un-clips the wide canvas without promoting body to a scroll container, so the VIEWPORT
provides both scrollbars at the window edges, overflow-y stays visible, and the window
scrolls down to the absolute sections. Nothing but the window clips anything. State:
the element that was scrolling was <body>; it was scrolling because the effect set
overflow-x:auto on it (coercing overflow-y to auto too).

## 2026-08-29 diagram clip fix (svg overflow)

### D49. Zoomed pack clipped to the stage rectangle: outer <svg> overflow:hidden
Production showed zoomed diagram content cut flat on all four sides at exactly the
diagram stage's rectangle (intro box visible beyond the flat left edge). Cause: the
outer BreedTree <svg> uses the browser UA default overflow:hidden, so it clips its
content to the svg's rect = the stage's rect. BreedTree's own `.stage svg` rule sets
width/height/etc but NOT overflow, and `.stage` / `.treeFill` are overflow:visible, so
the svg is the sole clipper. The ?diag=1 rig never showed it because there the svg
rectangle is the whole 3000 x 100vh canvas, so zoomed circles never reach it; the
smaller full-page zone clips them. Fix: author `overflow: visible` on the svg, scoped
to the stage (`.diagramStage svg`, and `.diagStage svg` so the rig mirrors it), which
beats the UA default with nothing competing. The per-circle image clipPaths are
untouched, so photos stay round; only the whole-pack viewport clip is lifted, so the
pack and any zoomed circle now draw freely, clipped only by the browser window. CSS
only, scoped to /chums2; BreedTree and every game path are untouched.

## 2026-08-29 full page rebuilt around the (correct) diagram

### D48. Sections placed to the concept around the rig-hosted diagram; zone aspect reported
The ?diag=1 rig proved the diagram (DISPLAY_SPAN 1.7) is correct, so the full page is
brought back around it without touching the diagram mechanism:
- The diagram keeps the RIG's exact hosting (stage construction, fill, props,
  DISPLAY_SPAN); the ONLY difference is the stage is positioned over the concept's red
  zone instead of the whole canvas. Offsets only, nothing clips.
- Intro box back to the concept proportion: 600px (narrow, ~8 lines tall), not the
  wide-short 800px. The diagram zone's LEFT edge follows box-right + 20 (brief 4):
  left = leftBand padding + rail(61) + gap(5) + 600 + 20.
- Lifespan chart moved to its concept home (brief 3): a canvas-child in the far-right
  column BELOW the tree (.chartRegion, top 840, right 75, width 840), heading with it,
  out of the diagram zone. The left-column lower band is now famous-chums only.
- Chrome sweep (brief 5): the AUTO ("Auto Find") button is gated off for bounded
  (LineageMap ~3058, added !bounded) so it stops arming on the tree; the stray floating
  X was the diagram's own close button sitting on the invisible stage with nothing to
  attach to, so it (and the now-unused CloseX helper) are removed - the diagram is a
  permanent centrepiece and does not close.
Zone aspect check (brief 1, reported NOT retuned): the zone is ~1351 wide (left ~734 at
a 1440 viewport, right edge 2085) x ~600-660 tall (top 320 to the famous-row bottom),
so its aspect is ~2.0-2.25 - far from the rig's ~3.75 that DISPLAY_SPAN 1.7 was tuned
for. Because the resting frame is width-driven (a fixed view width ~3.75*packDiameter),
the pack fills the same D/w fraction of whatever stage it is in: in the 1351-wide zone
that is only ~27% of the width (~360px pack), so the pack frames noticeably SMALLER
here than in the 3000-wide rig. This is the D47 width-only-fit limitation, confirmed on
a real zone. Per brief 1 this is REPORTED, not fixed by a blind DISPLAY_SPAN change
(that would re-break the rig): the proper fix is a height-aware resting fit (frame by
min(width-fit, height-fit)) so the pack fills any aspect. Numbers are estimates off the
section heights; confirm on a 3000px screenshot.

## 2026-08-28 diagram isolation rig (?diag=1)

### D47. DISPLAY_SPAN 1.1 -> 1.7 (35% smaller resting pack); aspect check
The ?diag=1 rig confirmed the hosting is correct and UNCROPPED: no clipping at rest or
any zoom level. The only fault was that the resting pack framed too big and overshot
the viewport. One change: DISPLAY_SPAN 1.1 -> 1.7 (= 1.1 / 0.65), a wider resting view
width, so the on-screen pack is 35% smaller in the same stage. Same displayOnly gate,
same five resting/home view sites + the zoom-out-to-root branch, nothing else; game
paths (PIT_SPAN) untouched.
Aspect check (a check, not a change): the resting view is WIDTH-anchored - the viewBox
width is rootR*2*ZOOM_PAD*DISPLAY_SPAN and the shown HEIGHT follows the stage aspect
(height = width / aspect), with overflow visible (no clip). So a pack taller than the
shown height spills past top/bottom - that overshoot is what was seen. At the mini
pit's ~1.8 aspect the shown height is width/1.8 (tall enough that a width-framed pack
mostly fits). At the rig's / real /chums2's ~3.75 aspect the SAME view width gives only
width/3.75 of shown height (~half), so the same pack overshoots ~2x more. Widening the
view (1.1 -> 1.7) shrinks the pack and proportionally grows the shown height, so at
~3.75 the factor alone lifts the pack inside the viewport. BUT because the fit is
width-only, the right factor is aspect-dependent: if the stage aspect changes (viewport
height, or a different zone shape) the overshoot returns. The robust later fix is a
HEIGHT-AWARE resting fit (frame by min(width-fit, height-fit) so the pack fits both axes
at any aspect) instead of a single width factor tuned for ~3.75.


### D46. ?diag=1 strips /chums2 to only the circular diagram, for isolating BreedTree's framing
To diagnose BreedTree's displayOnly framing with nothing else able to interfere, the
existing page gains a query-string mode (no new route, no new files). `?diag=1` is read
on the SERVER (page.tsx searchParams, already force-dynamic) and passed as a `diag`
prop, so there is no hydration flip and the shared `<Nav>` is simply not rendered
(rather than hidden after mount). When diag: Chums2Client early-returns ONLY the
diagram, in an empty `.diagCanvas` (3000 x 100vh, transparent, overflow:visible) with
`.diagStage` absolutely positioned over the whole of it (inset:0, no size box, no
background/border/overflow), and BreedTree in fill mode with the LineageModal
learn-mode props (centred + fill + dockAside + strokeByDepth + tinted=false) + displayOnly,
so the DISPLAY_SPAN resting frame runs as shipped. Body gets a distinct
`data-pc-chums2-diag` attribute (not the normal `data-pc-chums2`), so diag globals
apply (min-width 3000, `.pc-nav` display:none as a safety net, 0/10 counter hidden via
its module) and the normal route CSS does not. Without ?diag=1 the page is byte-for-byte
unchanged. NOTE: BreedTree was NOT changed this round; the rig exists to test the three
acceptance criteria first. Suspected hosting difference vs LineageModal, to confirm in
the rig: LineageModal's .stageArea is the full VIEWPORT (~1440 wide, aspect ~1.8),
whereas this stage (and real /chums2) is 3000 wide (aspect ~3.75), and BreedTree's
viewBox is width-driven (vbW = SIZE * aspect), so an extreme landscape aspect is the
prime suspect for a small/edge-clipped resting pack.

## 2026-08-27 canvas 3000, fixed nav, zone stage, pack fill, node expand+popup

### D41. Canvas widened to 3000px; columns re-derived from the concept
The concept is 3000px wide, so `.canvas` and `body[data-pc-chums2]` min-width are now
3000px and the column offsets are read straight off the concept's proportions (no
longer viewport vw, which cannot fill a fixed 3000 canvas). Offsets set: intro/pack
column right = 970 (0.323*3000); diagram zone = 970..2085 (0.695*3000); tree column =
2085..2925 (0.975*3000). Intro box widened to 800px so it fills the intro column to
the zone. STATED so they can be tuned against a 3000px screenshot.

### D42. /chums2 reverts to the site's STANDARD fixed nav (un-fix deleted)
Earlier this run the shared nav was un-fixed (position:absolute) so the whole bar
scrolled with the wide canvas. Reversed: deleted `body[data-pc-chums2] .pc-nav {
position:absolute }` and the HiddenGamesCounter `:global(body[data-pc-chums2])
.counter/.reveal { position:absolute }` override, and dropped body's now-unneeded
position:relative. The shared nav (bar, logo, 0/10 counter, contrast toolbar, menu)
is position:fixed, so it stays pinned to the window over the 3000px horizontal scroll
exactly like every other page. Only the page-specific header content (chum square,
LEARN ABOUT THE title, subtitle) is inside .canvas and scrolls; the .header's existing
padding-top (clamp(110px,14vh,146px)) clears the fixed bar so it is not overlapped.
No new route-scoped nav exceptions remain; the only body[data-pc-chums2] rule left is
the 3000px min-width for the scroll.

### D43. Diagram stage = the concept's RED ZONE (canvas-child, bottom at the famous row)
The diagram is a canvas-child again (not bounded to the upper band), an offset-only
stage over the concept's marked zone: left 970 (intro/pack column right), right 915
(edge at 2085 = tree column left), top 320 (below the header/subtitle), bottom 40 (the
FAMOUS-CHUMS row bottom ~ the canvas content bottom, NOT the pack bottom). Zone width
~1115, tall. No size box, no background/border/overflow; BreedTree fill-measures it.
The tree moved to its own canvas-child in the tree column (top 300, right 75, width
840, height 500). The intro box + pack stay in the left column (pack directly below
the box). pointer-events:none + SVG-only hit-testing keep the sections beneath
clickable.

### D44. Small resting pack: gated the resting VIEW factor for displayOnly only
Finding (via investigation, correcting the earlier guess): the `level === null`
"off the pit, on a chum page" branch (BreedTree ~line 950) is NOT active here, because
dockAside passes the real `level` (DIFF_DEFAULT = 5) at the relayoutMobile call. The
small pack is the difficulty packing (`diffScale` at level 5 -> DIFF_STOP_5 0.575)
times desktop `sizeMul` 0.6, framed inside the pit's PIT_SPAN (2.541x) play-arena
resting view. PIT_SPAN scales BOTH the camera view AND the packing walls in lockstep,
so it cancels out of the game's pack-to-frame ratio and is game-load-bearing: NOT
touched, nor sizeMul, nor any shared packing math. Fix = ONE gated multiplier: a new
`DISPLAY_SPAN = 1.1` replaces PIT_SPAN in the resting/home VIEW-width sites ONLY when
displayOnly is set. Gate condition: `dockAside ? (displayOnly ? DISPLAY_SPAN : PIT_SPAN)
: 1`, applied at the five identical resting/home sites (viewRef init, homeWRef init,
backToStartScreen, mount effect, PLAY reset) plus the zoom-OUT-to-root branch. The
drill-into-a-child zoom target is untouched (no PIT_SPAN there), so click-to-zoom is
unchanged. Before/after resting factor: PIT_SPAN 2.541 (every game hosting, unchanged)
-> DISPLAY_SPAN 1.1 (displayOnly only), so the static resting view frames the pack
(~1x + small margin) and it fills the stage.

### D45. Tree node click: pit-expand THEN popup, popup directly below the node
Bounded onNodeClick used to return before the expand, so only the popup opened.
Reworked (LineageMap): the bounded click reads the node's rect, runs the pit's expand
`follow(n)` when the node has children (nodes with nothing deeper skip it), then fires
onNodeClick with the node's on-screen rect. /chums2 opens the shared TileZoom DIRECTLY
BELOW the node: the enlarge image + description panel side by side, centred under the
node, a small offset down, clamped to the viewport, flipping ABOVE only when there is
no room below, never covering the node. Same one-popout-at-a-time (openPop). Pit
behaviour unchanged (the expand-then-popup is bounded-only). Caveat: the expand
re-fits the tree (fitBox), so the node can shift from the rect captured pre-expand;
the popup anchors to the click-time rect.



### D40. Diagram bounded to an UPPER BAND; tree moved to the top-right corner
Two placement fixes against the concept. Both traced to ONE cause: the 660px inline
tree region sitting right of the intro box in introTopRow. It (a) made that row 660
tall so the ancestor pack sat ~360px below the ~300px intro box (the "empty gap",
which was NOT a leftover margin/panel/min-height, it was the tree), and (b) occupied
the middle band the diagram needed. The round-3 stage also spanned the whole canvas
(right:0, bottom:0 on the 2000px canvas), so the centred pack landed low and far right.
Built:
- New `.upperBand` (position:relative, width:100%, flex column, gap 20) wraps the intro
  box (introTopRow, now box-only) and the ancestor pack, so the pack sits DIRECTLY
  below the box again (fix 2). The tree no longer reserves height there.
- `.diagramStage` is now offset against the upper band instead of the canvas: top:0 =
  box top (top circles level with the box), bottom:0 = pack bottom (ABOVE the lower
  band), left = intro box width + 20 (pack tight beside the box), right = 660 (leaves
  the 640px tree column + a 20px gap). Offsets only, no sizing box, no overflow; the
  hosting mechanism (BreedTree fill-measures the stage, pointer-events:none with the
  SVG re-enabled) is UNCHANGED, zoom still spills freely. bottom:0 needs no magic
  canvas-height number because the upper band's own height is exactly box + pack.
- `.treeRegion` moved to the concept's top-right corner: position:absolute, top:0,
  right:0, and shrunk from 1100x660 to 640x460 so it reads as the concept's small
  top-right tree and clears the diagram (the bounded LineageMap fit-scales to it).
Result: resting pack tight beside the intro box in the middle band, pack heading
directly below the intro box, tree top-right, lower band (famous/chart) untouched
below. The tree move/resize was not separately requested but was unavoidable: it was
the shared root cause of both fixes and the concept shows it small in the top-right.

## 2026-08-25 diagram: kill the sized panel, host on an offset-only stage

### D39. .diagramPanel DELETED; BreedTree now on an offset-defined stage (supersedes D38's panel)
Question: two rounds running, the circular diagram came out cropped because it was
put in a SIZED box (.diagramPanel, width/height in flex flow). A sized box IS a
container, and that is the disease, not a hosting choice. The mini pit (LineageModal)
does NOT do this: it gives BreedTree `.stageArea { position:absolute; inset:0 }` in a
full-viewport overlay, a region defined by OFFSETS with no size, no background, no
overflow, there only to be measured. Copy that literally.
Built: deleted .diagramPanel (gone, not restyled) and the in-row diagram. Added
`.diagramStage`, an absolutely positioned region that is a direct child of `.canvas`
(the offset parent), defined ONLY by offsets: left = the intro column's right edge
(padding-left + rail 61 + gap 5 + intro box width + 20), top = below the header
(header padding-top + chum square height + 26), right:0 and bottom:0 = the canvas
edges. NO width/height, NO background/border/radius, NO overflow rule. BreedTree runs
in fill mode and measures this stage (stageRef.clientWidth/Height) to build its aspect
viewBox, the same mechanism the pit uses on .stageArea; the pack lands large and
centred. Because the canvas is min-width:2000px, right:0 makes the stage pit-scale,
not a 620px box. Props unchanged (centred + fill + dockAside + strokeByDepth +
tinted=false + displayOnly). Zoom unchanged.
pointer-events: the stage is transparent and now covers sections beneath it (pack
grid, famous, chart), so `.diagramStage` is pointer-events:none with the SVG and the
close button re-enabled (`.diagramStage svg`, `.diagramStage .panelClose`
pointer-events:auto). The SVG hit-tests only its painted circles, so the pack stays
clickable (zoom) while empty areas pass clicks through to the sections below. This is
interaction correctness, not visual styling, so it does not break the "nothing visual"
rule.
Measured stage at 1440x900 (clamp/vw/vh resolved): left 537, top 302, so the stage is
~1463 wide x ~1324 tall. Mini pit .stageArea = the full viewport, 1440 x 900. WIDTH is
the number that proves it is a real full stage and not a box: 1463 vs 1440 = +1.6%,
i.e. the same. HEIGHT is taller (1324 vs 900) because /chums2 is a scrolling page with
stacked sections below the fold, not a single full-screen overlay; the pack fits and
centres the same way, just with more vertical room. Open follow-up: the existing
1100px inline tree still sits in the top of this open area and overlaps the centred
pack; the concept shows a SMALLER tree in the top-right. Left the tree untouched this
round (out of scope); flagged for Steve.

## 2026-08-24 node popout anchor + diagram switch-on

### D37. Tree-node popout now anchors to the NODE, not the far-off pack tile
Question: clicking a tree node opened the TileZoom enlarge growing from the matching
ANCESTOR PACK tile, far away on the left. It should open next to the clicked node.
A: reposition by looking up the pack tile rect (still tile-anchored, wrong place).
B (built): LineageMap's bounded onNodeClick now also hands up the pointer's viewport
position (onNodeClick(name, {x,y}); the click lands on the node). /chums2 builds the
TileZoom anchor from that point: enlarge opens just right of the node, vertically
centred, flipping to the node's left near the right edge, and clamped so it never
leaves the visible viewport. Enlarge size stays 61 (== a pack tile, 183 zoomed) for
a consistent popout. The pack-tile click is untouched (still grows from its own
rect). Same openPop state, so still one-popout-at-a-time. Why B: the node is the
thing clicked, so the popout belongs beside it; a viewport point is all TileZoom
needs and it already position:fixed's to the viewport.

### D38. Circular diagram switched on, hosted the LineageModal .stageArea way, inline right of the intro box
Question: switch on SHOW_SECTIONS.diagram and host the circular BreedTree diagram
right of the intro box, big, uncropped, never in a cropping container. A: keep it in
the old standalone .mainBand below everything (not "right of the intro box"). B
(built): move the diagram INTO introTopRow, immediately after the intro box, so the
row is [introBox | 20px | diagram | tree]; the introTopRow gap is now exactly 20px
(brief B.3). Deleted the now-dead .mainBand rule and section. The diagram keeps the
learn-mode props it already had (centred + fill + dockAside + strokeByDepth +
tinted=false) plus displayOnly, i.e. NOT the legacy hideLabels/disableZoom mode. It
sits in a big .diagramPanel (width clamp(760,52vw,1000), height clamp(680,82vh,980),
flex 0 0 auto, overflow visible), roughly square so the centred pack fills the width
rather than floating in a wide letterbox. No ancestor clips (introTopRow, introStack,
leftBand, canvas are all overflow:visible), so the pack shows whole at rest and
zoomed circles draw over surrounding page content. Starts open (not a card, so not in
the initial `closed` set); its X calls closeCard("diagram"), which adds it to `closed`
and rails the DIAGRAM_GLYPH reopen icon (already wired in byId + openCard). The wide
canvas scrolls to fit the now-wider row (brief: use the room).

LineageModal mechanism reused for sizing/framing (brief B.8): LineageModal wraps
BreedTree in a single `.stageArea` div that is `position:absolute; inset:0` with NO
width/height/overflow/aspect/padding of its own, inside the full-viewport `.overlay`.
BreedTree runs in `fill` mode (its wrapper/stage/svg all become width:100% height:100%
via `.treeFill`), MEASURES that box (stageRef.clientWidth/clientHeight) and derives its
viewBox from the container's aspect ratio (vbW = SIZE*aspect, centred origin). It never
uses the `size` prop in fill mode. I reproduced that here by giving `.diagramPanel` a
definite (large) width and height with overflow:visible and no clipping ancestor, and
passing the same fill+dockAside+centred learn-mode props (plus displayOnly for the
static, non-gravity chums2 view). NOTE on the 20px: the 20px is the intro-box-to-panel
gap; because the learn view frames the pack centred with margin around it (as
LineageModal's resting view does), the leftmost CIRCLE sits a little inside the panel's
left edge rather than exactly 20px in. Pulling the circle literally to 20px would mean
overriding BreedTree's resting zoom, which would stop it being "hosted the LineageModal
way", so I kept the faithful framing and set the container gap to 20px.

### D34. Bounded tree clipped its outer depth-2 (why initialDepth=2 looked partial)
Question: production /chums2 showed depth-1 plus only SOME depth-2, not all.
Cause (not the open set): openIdsToDepth(root,2) DOES open root + every depth-1,
and the layout walk pushes every depth-2, so `open` was never the problem. The
non-circular chum tree lays out at fixed PIT scale (RING1=154, RSTEP=128) fanning
270deg straight up from a root at (550, ~245). The fullscreen pit has room; the
1100x660 inline box does not, so the top of the fan runs to negative y and off the
sides, clipping the outer depth-2 circles. A: shrink RING1/RSTEP in bounded mode
(touches shared layout maths, risky). B (built): a `fitBox` memo, bounded only,
that takes the bbox of every shown node (padded for circle + name pill, grown to
the container aspect) and drives BOTH SVG viewBoxes, so the whole tree scales to
meet the box and every depth-2 node is on screen at load. Pit path (bounded=false,
fitBox=null) is byte-identical. Why B: it fits whatever the tree's real extent is
without touching the layout constants the pit depends on.

### D35. Tree node click opens the ancestor's pack popout (not a game tap)
Question: on /chums2 a node is not a scoring tap; clicking it should open THAT
ancestor's popout. A: add a second popout system. B (built): a bounded-only
`onNodeClick(name)` prop. In bounded mode the node onClick calls it and returns
before any follow/score/pick, and the hover-follow is disabled too, so the tree
stays fully expanded. The host (/chums2) matches the name to a pack frame and, via
the SAME openPop state, opens the shared TileZoom enlarge (image + name + note =
the enlarge PLUS the info in one popout), grown from the matching pack tile. A node
with no matching frame does nothing. Obeys the one-popout-at-a-time rule because it
reuses openPop. Why: one popout state, one shared component, no parallel lookalike.

### D36. /chums2 yellow -> #fff200 via a single page-scoped token override
Question: recolour every yellow on /chums2 to the concept yellow #fff200 without
touching the global token (menu + every other page stay #ffd23e). Every yellow on
the page (title breed name, pack % pills, popout name titles) already reads
var(--yellow), and so do LineageMap and TileZoom. A: body[data-pc-chums2] scope
(also hits the site menu, which must stay #ffd23e). B (built): `--yellow: #fff200`
on `.canvas` only. The menu is owned by the layout Nav OUTSIDE .canvas, so it keeps
the global token; the inline tree and TileZoom sit INSIDE .canvas in the DOM and
inherit the override regardless of their position:fixed painting. One line, no
element-by-element edits, no LineageMap change (it reads the token, so no bounded
gate was needed). Global --yellow untouched.

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
