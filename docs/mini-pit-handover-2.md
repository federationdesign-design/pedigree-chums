# Mini Pit Handover 2: Post-Matter-Migration

State as of end of session 2026-07-24 (late). Production main HEAD: 91335e7.
Read this fully before doing any mini pit work. Supersedes mini-pit-handover.md.
Scope: the mini pit (LineageModal / BreedTree / LineageMap-circular on
/britains-dog-history). Pick a Chum agent work is separate - see workspace rules.

## 1. THE WORKSPACE RULES (strict, non-negotiable)

- ~/pedigree-chums = Claude Code agent's folder (branch pick-a-chum).
  NEVER reference it in any command. Never push to remote pick-a-chum.
- ~/pedigree-chums-main = Steve's clone, main branch. ALL work here.
- Every command block starts: cd ~/pedigree-chums-main && pwd
- Steve AND the agent both push to main between turns - ALWAYS
  git pull --rebase origin main before committing anything.
- Steve is dyslexic: concise bulleted replies ordered by priority/risk/cost.
  Optional insights carry a cost estimate as % of project time.
- No em dashes anywhere. CSS Modules only. Relative imports. No dark
  backgrounds. No text opacity/rgba text. No bare :global() selectors.

## 2. DELIVERY WORKFLOW (the one that works)

Preferred: a downloadable .py patch script (unique name e.g. pc-fix-1234.py)
that: cd's to ~/pedigree-chums-main itself, git pull --rebase, applies
anchored string replacements (sys.exit(1) with "ANCHOR MISSING" if any anchor
fails - aborts before committing), then git add/commit/push via subprocess.
Steve runs: python3 ~/Downloads/pc-fix-1234.py
Why: Steve's terminal double-pastes large heredocs (two failures today);
zips auto-expand and single-root zips get RENAMED by macOS (components-2
incident). If a zip is ever needed: unique number AND a wrapper folder inside
named exactly after the zip.
Container verification before every delivery: git reset --hard origin/main,
apply, rm -rf .next if tsc errors on stale generated types, npx tsc --noEmit,
then run the guard suite (section 4). npx next build fails in container
(Google Fonts) - tsc + guards only.

## 3. WHAT SHIPPED TODAY (all live on main)

Physics/engine:
- components/PackPit/fixedTimestep.ts: fixed-timestep driver (16.666ms
  accumulator, MAX_ACC 100ms, rolling 2s debug ratio). Replaced Matter.Runner
  in PackPit (0.19 Runner clamps delta to >=16.666 per rAF = 2x speed on
  120Hz screens - iPhone ProMotion). ?simdebug=1 on any URL shows a navy/
  yellow "sim speed x1.00" chip. matter-js exact-pinned 0.19.0.
- THE MIGRATION IS DONE: BreedTree's hand-rolled sim replaced by Matter.js
  (dynamic import, untyped). Bodies live in DROP-TIME CLIENT PX (frozen
  getScreenCTM + view at doFall; pxFromWorld/worldFromPx bridge). Bridge
  objects keep world x/y/a + .mb; zoomTo/render unchanged; live zoom works.
  Collision events drive cascade pops, number flashes, badge knocks (rv<5
  ignored, 600ms cooldown, statics do not count, 20 charges then inert),
  menu-button sink/tilt/loose. Ghost immunity = shared negative collision
  group cleared on 650ms timer. Slosh spring (K=16 D=3.2) kept on top of
  Matter angles. Held bodies leave the world (Composite.remove) and re-add
  on release. Settle = mb.speed < vps(0.012) for 12 frames; wake() restarts.
  Old solver, ghost Map, spin caps, single hover pill, LearnLayer: DELETED.
- gravity engine.gravity.y = 1 (pit verbatim). Steve approved feel on iPhone.

Learn layer (LineageMap circular), after nine iterations of direction:
- No name tag on the layer at all. The name pill EXISTS ONLY as a physics
  pill dropped into the pit on Complete (not on close).
- Learn button (and green Complete when framesDone) anchored at circle
  BOTTOM, centre 4px below rim (roughly half overlapping the circle).
- Viewport clamp: if circle+button would clip, whole assembly hops into
  view - pit pct-circle hop shape (300ms, -sin(t*PI)*A*(1-t), A clamped
  14-44) + heavy-book dust poof on landing. BTN_CLEAR 58, margins 10/96.
  NOTE: no one-shot ref guard (StrictMode double-mount killed it once).
- Children sprout at the TOP (center = -PI/2), stacked card-style,
  parent painted above (shown reversed in circular), gentle fan PI*0.42.
- Connectors are size-aware: child distance = rOf(parent) + rOf(child) + 50
  (rOf = clamped rootRadius for root, radius(share) otherwise). The
  "node swallowed by a big circle" bug is geometrically impossible now.
- Frames grid: 3px gutter (F_COL/F_ROW = CW+3), chumTop 118 mobile / 168
  desktop. Card adornments in circular: mixPill, magnifier, remove-X all
  hidden; only the blue info 'i' remains.
- Caption/info box: hidden behind the 'i' icon (auto-open was tried and
  rolled back by Steve).
- Overlay close X: .closeCircular class = 84px navy square, 4px yellow
  border, yellow x (matches in-pit menu squares).
- Wrapped pills: names >16 chars split at nearest-middle space to 2 lines;
  pill height grows (tag 60 / pit pill 46), corner radius = h/2 (full
  capsule - Steve wants SAME RATIO, not fixed px); line gap 1.3em
  (offsets +-pl.rx*0.6); width from longest line (pit pill 7.4px/char + 22
  + 10 if wrapped). Duplicate pill fix: node nmPill suppressed when
  n.name === breed.name (self-synthesized leaves).

Pit props (BreedTree):
- Rods: chamfered bars, lit #ffd23e / unlit white, maxHits 2 then poof.
- Pills: navy capsule, white 0.85 stroke, 700 Montserrat, maxHits 3.
- Both spawn from the Complete scatter ({circles, rods, pills} contract,
  velocity {(rand-0.5)*3, 3} verbatim), render as index-aligned SVG layers
  (dead ones keep their slot, display:none), draggable, settle-tracked.
- Big white Luckiest Guy labels: splitLabel >11 chars AND font scales to
  fit the circle: fs = clamp(10, cap, (r*1.7)/(maxLen*0.56)), cap 102/34.

Campaign:
- Score carries across levels: BreedStrip owns campaignScore, passes
  initialScore/onScoreChange to LineageModal; resets ONLY on game-over
  Start again (modal replay() setScore(0) propagates up).
- ROUND WON finale: last dog cleared -> 700ms -> chainRef fires: every
  remaining prop (badges incl inert, rods, pills, desc button - close X
  survives) explodes nearest-first from the final circle's resting spot,
  90ms apart -> confetti (canvas-confetti 1.9.2 CDN) -> ROUND WON flash at
  2x (clamp(6.8rem,24vw,16rem)) lands total+420ms later. Level pill:
  green #22c55e, scale(0.5), label only (no "Next level:" prefix).

## 4. THE GUARD SUITE (run before every delivery)

Pattern: (npm run dev > /tmp/dev.log 2>&1 & echo $! > /tmp/dev.pid) &&
sleep 34 && node tests/<guard>; kill $(cat /tmp/dev.pid)
- tests/sim-speed-check.js - GUARD-001: homepage ?simdebug=1 ratio 0.95-1.05.
- tests/minipit-drop-check.js - GUARD-002: Old English Bulldog popup,
  circle falls >50 and settles <2 over 2s. Has 5s cold-compile headroom;
  if it nulls when run first after rm -rf .next, re-run alone before
  believing a failure.
- tests/minipit-pill-close-check.js - GUARD-003: learn layer opens, Learn
  below circle (tolerance -40, overlap allowed), fully in viewport, NO tag
  pill on the layer, zero page errors.
Add a new guard for every bug fixed. Ledger idea agreed but LEDGER.md not
yet created.

## 5. GOTCHAS LEARNED TODAY (bug classes)

- React StrictMode double-mounts effects: never combine a one-shot ref
  guard with a cleanup that cancels the work (the hop bug).
- Stale .next/dev/types can fail tsc after branch state changes: rm -rf .next.
- The agent merged pick-a-chum into main mid-session (bf03671) and pushes
  continued all day; non-fast-forward rejects mean pull --rebase, never force.
- ~/pedigree-chums-main once sat on branch pick-a-chum (checkout confusion);
  the local pick-a-chum branch there is now deleted. pwd + branch checks matter.
- Playwright repro: click "View Old English Bulldog family tree" ONCE,
  dialog count 3 is benign (2 cookie banners). Rache has no lineage.
- Sandbox container cannot reach the live site (egress whitelist); verify
  production state via Vercel MCP tools (list_deployments confirmed builds
  READY today) plus git ancestry checks.

## 6. OUTSTANDING QUEUE (priority order)

1. Steve's Firefox/iPhone pass of the last three patches: ROUND WON chain
   feel (90ms gap, 420ms flash delay tunable), size-aware connectors
   (50px clearance tunable), score carryover across levels.
2. UNPINNED BUG (item 5 from Steve's list): a placed card in a circular
   frame shows as a ROUNDED SQUARE. Both obvious suspects (pick-card image
   clip rx and frame rect) are already circle-gated in code - need Steve's
   next screenshot to identify the actual element. Do not assume fixed.
3. Stack/fan tuning round if wanted: fan width PI*0.42, clearance 50,
   BTN_CLEAR 58, hop amplitude 14-44.
4. STAGE 2 (was Phase 3): per-circle name pills popping in WITH their
   circles (pit pill spec, stick-to-own-dog constraint - find and copy
   PackPit's), rods on cascade pops, and the bomb (1-in-20 per scattered
   circle, 5 hits, squash-anticipation, nearest-first chain, paw strobe
   [0,80,160,240,380]ms - all in PackPit: detonateBomb/hitBomb/blastSize).
5. Older backlog untouched today: other five Good Dog Bad Dog essay mobile
   rebuilds; crossbreed list for the history page (Steve never supplied);
   Argos share/OG image; the--electronic-nose.jpg hero wiring.

## 7. TUNABLE CONSTANTS (single numbers, mini pit)

Connector clearance 50 - fan spread PI*0.42 - BTN_CLEAR 58 - button offset
+4 from rim - hop 300ms / amp 14-44 / damping (1-t) - chain gap 90ms -
flash delay +420ms - wrap threshold 16 chars (pills) / 11 (labels) -
pill line gap 0.6*rx (=1.3em) - frames gutter 3px - chumTop 118/168 -
label font cap 102/34, floor 10 - settle vps(0.012) x 12 frames -
pit-full: zone 150px, count 5, 4s grace - badge charges 20 - rod hits 2 -
pill hits 3 - restitution: circles 0.78, badges 0.48, floor 0.4, walls 0.35.

## 8. TIME TUNNEL TRANSITION (integration groundwork, 2026-08-12)

Prototype: prototypes/time-tunnel.html (gitignored, not wired in). Canvas 2D
only, NO CSS 3D (banned in this tree, confirmed clean below). These findings are
recorded so the seam and the fxCanvas reuse are NOT re-derived next session.

DECISIONS (Steve, 2026-08-12):
- Lengthen the handover to about 1.2s. Do NOT cut the tunnel to 0.7s (feels
  snatched). The real gap today is ~0.7-1.0s (see timing below); 1.2s is a
  deliberate stretch.
- Dog circles on the start screen: NO CHANGE. They keep dropping in from the
  top, biggest to smallest, exactly as today (the SVG drop-in at 3235-3273).
  The earlier "arrive from the centre" idea was WITHDRAWN on 2026-08-12. Do not
  touch that seam.

CARD CLICK -> MINI PIT (the handover path):
- Card is a flipCard button, onClick={open} at BreedStrip.tsx:515. open comes
  from openFor(b) (BreedStrip.tsx:176-195); its closure calls
  setActive({name,image,character,fact,lineage}) at :187. active non-null builds
  the modal at :418.
- LineageModal portals the overlay and mounts <BreedTree fill gravity dockAside>
  at LineageModal.tsx:332-404. There is NO separate start-screen component: the
  start screen is BreedTree in its !started state (started at BreedTree.tsx:1836,
  PLAY button 6558-6609). PLAY -> setStarted(true)+runFallRef (6607-6608) is the
  NEXT step (round begin), not this handover.
- Same setActive/mount pattern from BreedDialog.tsx:67 and HistoryCarousel.
  chums/[slug]/BreedClient.tsx:331 renders BreedTree disableZoom hideLabels =
  the STATIC diagram, not this path.

HANDOVER TIMING TODAY (the gap the tunnel fills):
- Click -> setActive -> modal mount: 0ms, synchronous, no timer/await.
- Overlay rise: lmRise 0.32s = 320ms (LineageModal.module.css:16-21). Off under
  prefers-reduced-motion (:164-166).
- Circle drop-in tween (BreedTree.tsx:3235-3273): dur=700ms per circle,
  stagger=45ms, total = 700 + 45*(n-1). setEntered(true) only fires on
  completion (:3270); PLAY is gated on entered.
- Net with motion: ~0.7-1.0s of entrance. Reduced motion skips BOTH -> instant
  cut. Tunnel target is ~1.2s per the decision above.

CIRCLE DROP-IN (leave exactly as-is):
- SVG drop-in effect: BreedTree.tsx:3212-3277 (useEffect on [nodes]). NOT
  physics. Packed pos (tx,ty) at :3252-3253, y offset by
  drop=(1-easeOutBounce(lt))*dropFrom, written as translate(tx, ty-drop) at
  :3255-3256. easeOutBounce at :767. This stays UNCHANGED: circles drop from the
  top, biggest to smallest, as today. Recorded only so it is not disturbed when
  the tunnel is layered in front.
- The Matter scatter path (BreedTree.tsx:3316-5039, doFall) is the PLAY
  explosion, also unrelated. Do not touch either.

CANVAS LAYER (reuse, do not add a new one):
- Mini pit runs Matter.js HEADLESS: no Render, no Runner, bodies drawn as SVG
  (comment "mini pit has no canvas" at :6113).
- There IS a dedicated 2D effects canvas to reuse: <canvas ref={fxCanvasRef}
  className={styles.fxCanvas} aria-hidden> at BreedTree.tsx:6703-6704. Custom 2D
  ctx at :5086, frame loop 5082-5160. z-index:2 ABOVE the SVG (z-index:-1),
  pointer-events:none (BreedTree.module.css:17-28). Tuned in "pit pixels" via
  createPitEffects.
- It only wakes for non-idle effects (:5117-5122); wake it deliberately for the
  tunnel window, mirroring fxKickRef (:5151). Main pit's equivalent reuse point
  is the Matter render canvas afterRender hook (PackPit.tsx:348-353), not needed
  here.

CONSTRAINTS (verified):
- CSS 3D: NONE in the pit tree. Zero hits for perspective, transform-style,
  backface-visibility, rotateX/Y, translateZ, preserve-3d, matrix3d across
  PackPit/BreedTree/PitEnd/LineageModal/LineageMap. Only translate3d(x,y,0) (2D
  GPU hint). Keep the tunnel canvas-only.
- Reduced motion: honoured everywhere via inline
  matchMedia("(prefers-reduced-motion: reduce)"), NO shared hook. Precedent to
  follow: BreedTree.tsx:3219-3221 (drop-in skip via 3228-3233) and 3316-3319
  (scatter early return). Tunnel needs its own reduced-motion branch: static or
  skipped, falling to the settled state, or it reintroduces motion the rest of
  the pit suppresses. Non-exported prefersReducedMotion() exists at
  app/dogs-at-work/WorkDeck.tsx:195-199 if a shared util is wanted.
- Teardown: register RAF in a ref, cancelAnimationFrame in effect cleanup
  (precedents :3232, :3275, :5153-5159, :5037). If the Matter world is touched:
  Composite.clear(world,false) then Engine.clear(engine) (:5024-5025). No
  Render.stop/Runner.stop needed (never created). Guard deferred work behind a
  disposed/ref flag; StrictMode double-mount is a known killer (section 5).

COST (as % of the ORIGINAL tunnel-feature scope, largest first). The circle
arrival change (~30%) was DROPPED on 2026-08-12 (circles keep dropping from the
top), so the feature is now ~70% of that original scope. Remaining slices
unchanged in absolute terms:
- Tunnel on fxCanvas: ~35% - port prototype into the frame loop, pit-pixel
  space, align vanishing point to pack centre, wake/idle, fit to 1.2s. Now also
  owns the card-dive-from-click-position and the rings-clear-outward end phase
  (folded in; the tunnel needs a real end state, not just self-terminate).
- Teardown: ~15% - RAF ref + cleanup, disposed guard, no leak across modal
  open/close, StrictMode-safe.
- Reduced-motion branch: ~10% - inline matchMedia, static/skip fallback.
- Verification/glue: ~10% - new guard test, tsc, device pass.
- (WITHDRAWN) Circle arrival change: ~30% - circles keep dropping from the top,
  no work.

## 9. HOVER UNLOCK REMOVED (2026-08-12)

The "hover unlock" is gone (own commit, `BreedTree.tsx` only). That was the JS
system where hovering a first-ring circle made its children fan/hop outwards
(spring sim writing offsets onto the wrapper <g>s). Removed: the C1 constants and
`UnlockState`/`unlockRef`, the sim functions (`unlockPaint`/`unlockStop`/
`unlockStep`/`unlockHomeStep`/`unlockFrame`), the two hover effects, and the
`onMouseEnter` latch. The shared wrapper-offset machinery (`paintOffset`, the
drag/`pullPaint`, the collision `knockStep`) was NOT touched.

**It closes the tucked-child hover bug, open a while:** tucked child circles did
not turn their label yellow or gain a breadcrumb ladder rung on hover, though
clicking worked. Cause: the `onMouseEnter` latch (`if (u && u.raf !== null ...)
return`) swallowed hover on the inside circles WHILE the unlock sim animated, so
`setHovered` never fired for them (yellow label at the `d === hovered` test; the
rail/ladder mirrors `hovered ?? focus`). `onClick` was never latched, so clicks
landed. No unlock means no latch, so hover on tucked children now works at once.
tsc clean, eslint held at 53 errors / 7 warnings.

**It also closed the zoom "overshoot" (2026-08-12).** The long-running complaint
that zooming from the fully-zoomed-out root landed showing a child's image at full
size ("legs", the parent ring off frame) was NOT a zoom bug. The static reading was
right: the view rests at the target. The cause was the unlock system displacing
circles; removing it fixed the zoom with no change to zoom code. Investigation
closed, and the planned probe at the old line 3039 is no longer needed.

## 10. NEST GHOSTING (2026-08-12, commit after the unlock removal)

Hovering a circle now GHOSTS the circles nested inside it instead of hiding them:
image fades out (`fill-opacity: 0`), the ring becomes a dashed hollow outline at
50% (`stroke-opacity: 0.5`) with a navy `drop-shadow` halo so it reads over a busy
image, and it keeps its hit area so moving onto one re-hovers it and it comes back
solid. `BreedTree.tsx`: `buriedSet` (the old hide-the-nest set) now drives a
`ghosted` flag on the circle; the first-ring carve-out is gone (it only existed for
the unlock), so hovering a BIG circle ghosts its nest too. `BreedTree.module.css`:
`.btCircle` carries the 0.3s `fill-opacity`/`stroke-opacity` transition (both ways,
inert until ghosted), `.ghost` sets the hollow dashed look and the halo; both are
off under reduced motion. Dashes are proportional to the ring width (a JSX
attribute), the fade is pure CSS. Note: a depth-2 nest has a navy stroke, so the
navy halo does nothing for it on dark image areas; flagged to Steve to check on
device. tsc source clean, eslint 53/7, no bare :global.
