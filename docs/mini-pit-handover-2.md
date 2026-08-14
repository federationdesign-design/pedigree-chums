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
(Follow-up 2026-08-12: ghost stroke changed to WHITE at 50% with the navy halo
kept, so it reads on both dark and light artwork; the depth-2 caveat is resolved.)

## 11. DEEP TREES CLOSED AS A NON-ISSUE (2026-08-12)

The deep-tree worry (the depth-4+ trees, the big ones like Cocker Spaniel at ~104
nodes) is CLOSED as a non-issue. Reason: the large deep trees all belong to CHUMS,
which are page/learn cards (they have a /chums/[slug] page), so a player navigates
to that page and NEVER opens their tree in the pit. Only a "play" card opens a pit
level: no page AND a lineage with ancestors (breedCardKind, BreedStrip.tsx:87-91).

Measured over EVERY root with a tree, echo-excluded as the pit renders
(.scratch/deep-trees.mts, a throwaway probe):
- Largest tree a player can actually open and complete: FIELD SPANIEL, 78 nodes,
  depth 7. Reviewed on device, renders fine. This is the definitive worst
  reachable case, from a full enumeration of all reachable levels, not a sample.
- Next reachable below it: Patterdale Terrier 74/d6, Fox Terrier 68/d7,
  Curly-Coated Retriever 50/d6, Welsh Springer Spaniel 48/d7. Nothing reachable
  exceeds 78 nodes.
- The giants are all unreachable chum pages: Cocker Spaniel 104, Cockapoo 78,
  Irish Setter 76, Golden Retriever 74, Springer Spaniel 69.
Since the worst case a player can reach renders fine, no deep-tree work is needed.

## 12. J10b DRAG-ON-MOUSECONSTRAINT: PART DONE, STAGES 1-3 LIVE (recorded 2026-08-12)

Was a documentation gap (absent from this handover). The mini pit's in-round drag
was migrated onto Matter's own MouseConstraint. State, from the code:
- Stage 1 (badges): live. Marker BreedTree.tsx:4640.
- Stage 2 (dog circles, plus a tap that drops the constraint before liftToLearn
  removes a body from the world): live. Marker :2185 (mcReleaseRef).
- Stage 3 (pit props): live. MC_KINDS at :4669 = {badge, circle, rod, pill, toy,
  btn}, so rods/pills/toys/buttons drag via the constraint too. The in-pit control
  squares (close X, brain) and the chum scenery are deliberately excluded.
- Stages 4-5 of the original five-stage scope: NOT in the code. The constraint
  already grabs every in-round draggable kind, so they were descoped or
  unnecessary once the body scope was complete.
Old hand-rolled paths still coexist and were NOT deleted: pullRef ("PUSH AND PULL"
start-screen drag, a different phase) and dragRef. Partitioned by kind/phase so
they do not fight the constraint.
This is what unblocked J17 bombs: the fuse hangs off the constraint's startdrag/
enddrag (:4687-4702). J17 stages 1-5 are all built and live.

## 13. CIRCLE/WORD PHYSICS BODY SEPARATION: SUBSTANTIALLY DELIVERED (2026-08-12)

The queued job "separate circle and word physics bodies" is CLOSED as
substantially delivered, not pending. It was carried as agreed/staged/never
started, but the code already does it:

- `mkWord` (BreedTree.tsx) builds a dog's body as a NAME-SIZED RECTANGLE
  (`Bodies.rectangle`, wpx/hpx from the fitted name), not a circle.
- A depth-1 dog's own `<circle>` is hidden after the fall (`isWordNode`) and
  never gets a Matter body; its CHILDREN are freed at the drop as their own
  circle bodies (`mkCircle` + `FREED_CIRCLE_OPTS`).
- The `mkWord` comment documents the change in the PAST TENSE: the word body
  "used to stand in for the circle as well ... The circle now has its own free
  body, freed at the drop." So a word and a circle no longer share a body.

FOUR residual ties remain, and they are NAMING/TYPING ONLY, not behaviour:
1. `wordBodiesRef.current = bodies` aliases one array as both the word-render
   source and the depth-1 physics list.
2. The `Body` type still carries circle fields (`r`, `pct`) on a rectangle word
   body.
3. `mkWord` tags the rectangle `plugin.kind = "circle"`, so words classify as
   circles for drag (`MC_KINDS`) and collision damage (`k2 === "circle"`).
4. Word bodies use `CIRCLE_OPTS` (the comment admits it).

LOW PRIORITY and NOT worth the risk: untangling these touches the drag
classification and the collision-damage multipliers for zero visible gain. Leave
them unless a real need appears (e.g. wanting words to bounce differently from
circles). Read from the code, not device.

(Lesson, as with other queued items closed today: a job read smaller or already
done than the notes said. Check the code before scheduling handover jobs.)

## 14. PER-LEVEL PAGES (A) + CHUM-PAGE REWORK (B): SCOPED, PARKED (2026-08-12)

Two related pieces, scoped read-only and PARKED (not started). Costs are rough,
as a share of the combined A+B delivery.

A. NEW PER-LEVEL PAGES for non-chum dogs: wide, like the chum pages, showing the
   start screen (circular diagram) with the information cards exposed. NOT a
   playable pit, a presentation.
   - ~60% of delivery, and the real work. Needs: a new ROUTE (`/levels/[slug]`;
     levels open as a modal from BreedStrip today, no per-level URL); a static
     "PRESENT" mode on `BreedTree` (its start screen is the `dockAside && gravity
     && !started` state, deeply physics/interaction-coupled, so rendering it
     without arming the live pit is the hard part and the main risk); statically
     PRE-EXPOSED `LineageMap` cards (auto-expose exists but is interaction-
     triggered, no "mount already open" mode); and a wide page shell.
   - THE KEY FINDING: the start screen currently CANNOT render without the live
     pit. A's core is inventing a static present mode over it. `hideLabels`/
     `disableZoom`/auto-expose are partial ingredients, not a ready mode.

B. REWORK THE CHUM PAGES: the open blue info boxes closed behind their blue
   icons, the diagram + line graph re-oriented, health moved into a blue card as
   a closed feature, then the old `centred` diagram replaced by A.
   - ~40% of delivery, cheaper than it looks. THE KEY FINDING: the card dock
     ALREADY EXISTS (`closedCards` + `CardDock`, `BreedClient.tsx:123,441`), so
     "close behind icons" is mostly RE-DEFAULTING the cards to closed, not
     building the dock. The ~10 blue cards are separate components under one
     shared `DragCard` shell; the line graph is its own `LifespanChart`. Re-orient
     is layout-by-eye; health-to-card is `HealthSection` -> a `DockItem`. The
     diagram swap is mechanical but GATED on A existing.

PLAN: build A as the master, get it right, then replace the chum diagram with it.
Chum diagram today = `BreedTree` `centred hideLabels disableZoom` (the OLD static
mode, line 914 "old centred-and-nudged-down rule"); the learn view is a DIFFERENT
component (`LineageMap`). The suspected "minus out a biggest circle" divergence is
CLOSED as not real (Steve checked on device 2026-08-12): `isEcho` (:531) and the
root hide (:5469) skip the same self-child/root on BOTH the pit and the chum
paths, so there is no extra circle on the chum page. It was the fourth queued
item that day to turn out already-done or not-real. Do not re-open it.

## 15. TOYS: ROCK REMOVED, BALLS ON ALL LEVELS (2026-08-12)

Two toy changes in `BreedTree.tsx`, one commit.

1. ROCK OUT OF DEFAULT_PROPS. `DEFAULT_PROPS` is now `["stick", "stickBig"]`; the
   rock no longer drops. The rock's `spawnToy` case, opts and `ToyKind` entry are
   left in place (harmless, unused) so a future theme could still ask for it.
   `rockAt` survives as a TIMING ANCHOR only (the bone and the chum flood still
   key off `propsAt + TOY_ROCK_GAP`), so nothing spawns on that beat but the
   rhythm is unchanged.

   WHY THIS REACHES EVERY LEVEL, NO EXCEPTIONS: `THEMES_ENABLED` is `false`
   (`data/levelThemes.ts`), so `levelThemeFor` returns null and no era's `props`
   override runs, not even Tudor's `["newspaper","fork","shoe"]`. Every level
   falls through to `DEFAULT_PROPS`, so removing rock there removes it everywhere.
   If themes are ever re-enabled, re-check the per-era prop sets for rock.

2. hideBalls GATE REMOVED ENTIRELY, against an UNRECORDED decision (Steve,
   2026-08-12). The gate `levelNo <= 6` hid both tennis balls on the first seven
   play levels (all 6 ancient + the first medieval, Shepherd's Dog). Its reason
   was never recorded: the commit `36f13b72 "hide both tennis balls on the first
   seven levels"` is a bare subject and the code comment explained only the how.
   Steve removed it knowingly, so balls (yellow + pink) now drop on EVERY level.
   The no-balls re-timing went with it (`NOBALLS_FLAG_AT/STICKS_AT/BONE_AFTER_
   FLOOD` gone); the schedule is now always the balls-present timing. Do NOT
   restore the gate thinking the early-level balls are a regression: the removal
   is intentional, and the original reason for hiding them is lost, so if a real
   settle/pile-up problem surfaces on the ancient levels (the ball is restitution
   0.97, the bounciest thing in the pit) it should be re-solved and RE-RECORDED,
   not reinstated blind.

## 16. ROUND WON SCREEN FIXES (2026-08-12)

Three fixes in `LineageModal.module.css`, mobile as one commit, desktop as
another.

- MOBILE: `.winFlash` ("ROUND WON") line-height 0.82 -> 0.6 (0.82 read ~1.3
  against Luckiest Guy's ink, same effect as the circle labels; Steve wanted the
  LOOK of 0.9, not the number). And `.winWrap` top padding bumped
  `clamp(96px,24vw,150px)` -> `clamp(148px,30vw,180px)` so the flow group clears
  the absolutely-positioned chum-rate block (`.winTop` at top:24px) it overlapped.
- DESKTOP: went through two passes. First pass anchored the head
  (`object-position: center center` -> `center top`) and softened the clip-path
  slant, but that only chose which part to lose: `cover` on a square image in the
  full-width landscape box still scaled the dog to the WIDTH, so it filled the
  frame and read as a crop, not a portrait. FINAL fix: `.winNextImg` is now a
  CENTRED COLUMN on desktop (`width: min(40vw, 460px); margin-inline: auto`), which
  flips `cover` to scale by HEIGHT and roughly halves the dog to a sensible
  portrait; the blue overlay gradient fills the sides. Still `cover` + `center top`
  (immersive, light side-crop, head kept). `contain` was rejected on purpose (it
  shows the artwork's own edges and reads as a sticker, comment ~839). Clip-path
  slant retuned `3% -> 1.5%` because its y is a % of the element HEIGHT and the
  narrower column makes a given % read steeper. Per-breed focal data was rejected
  as not worth it. Mobile is the base rule (full-bleed cover) and was untouched by
  any of this.

  ASPIRATIONAL-COMMENT NOTE, worth recording: the desktop comment already SAID "shown
  from its TOP so the dog's head is not cropped off", but the value was
  `center center` the whole time. The comment was ASPIRATIONAL, never applied,
  until this fix. A reminder that a comment describing intent is not proof the
  code does it, on this screen at least.

  (Follow-up: the column ALSO failed on device, reading as a strip of photo pasted
  on the blue and clashing with the diagonal band. FINAL desktop treatment is a
  CIRCLE: `.winNextImg` is a square box + `border-radius: 50%` + cover (even crop,
  matches the game's circle language), clip-path dropped, centred in the free band
  with a plain yellow `box-shadow` ring, `min(40vw, 400px)`. Still desktop-only;
  mobile keeps the full-bleed base rule.)

## 17. BALL RETUNED TO FIX THE 30s PIT FREEZE (2026-08-12)

The tennis ball (`ball` + `ballPink`) was `restitution: 0.97` with no
`frictionStatic` ("super bouncy"). After rock removal put a ball on EVERY level
(section 15), pits began FREEZING for a beat every ~30 seconds. Cause: the sim
loop only re-arms while `stillFrames < 12` (or flash numbers exist) AND under a
30s cap, `now - started < 30000` (BreedTree.tsx). `wake()` early-returns while the
loop runs, so `started` is a hard 30s wall. A 0.97 ball never reaches 12 still
frames: it bounces for tens of seconds AND, with friction 0.05 and no
`frictionStatic`, rolls/creeps on the floor almost forever. So the loop ran the
full 30s then stopped mid-motion = the freeze (a tap woke it for another 30s).

FIX: `restitution 0.97 -> 0.85` (still the bounciest thing in the pit; the dogs
are 0.78, and 0.85 keeps a lively bounce while decaying in ~4-6s) PLUS
`frictionStatic: 0.8` to stop the roll (the same lever FREED_CIRCLE_OPTS uses on
the dogs). Together the ball reaches 12 still frames and the loop settles.

REJECTED, do not reach for either without re-reading this: raising `frictionAir`
would settle it too, but reads floaty and weakens the throw-it-out release valve
on a light body; excluding toys from the settle test would stop the loop when the
DOGS settle, freezing the ball suspended MID-BOUNCE a few seconds in, worse than
the 30s freeze.

## Throwing a ball: what is IDENTICAL between the two pits (do not re-derive)

The ball "will not throw in the mini pit" has taken several passes. To stop the
next agent re-checking a whole family of theories, these are confirmed the SAME
in the main pit (PackPit.tsx) and the mini pit (BreedTree.tsx), verified 13 Aug
2026 by reading both:

- **World scale.** Both are 1 physics unit = 1 screen pixel. Main pit: Matter
  `Render` at `stage.clientWidth/Height`, `pixelRatio: 1`. Mini pit: bodies live
  in CLIENT PX via the CT transform ("Matter bodies live in CLIENT PX"). So a
  given `setVelocity` travels the same distance in either pit.
- **Timestep.** Both fixed 60Hz. Main: `startFixedTimestep(Engine, engine)`. Mini:
  accumulator calling `Engine.update(engine, 1000/60)`. Same delta, so px-per-step
  means the same px-per-second in both.
- **Gravity.** `engine.gravity.y = 1` in both (main also tilts gravity from device
  motion; the mini pit does not, but that does not touch a throw).

Because scale, timestep and gravity match, matching the ball's body numbers DOES
match its behaviour on those grounds. Theories that start "the mini pit's world
is smaller / faster / heavier-feeling" are dead ends.

## Two drag hypotheses, both RULED OUT (13 Aug 2026)

- **Held ball is position-driven, so velocity is overwritten each step.** No. The
  per-step `setPosition`+`setVelocity` overwrite for a dragged prop (the `else`
  branch of the toy sync) fires only when `isDragged(pr)` is true, and
  `isDragged = dragRef.current?.body === b` is the OLD `startDrag` path.
  `startDrag` is called only for UI menu squares (leave/restart/learn/pair), never
  a toy. A dragged ball has `isDragged === false`, so it reads velocity FROM Matter
  and is never overwritten.
- **`enddrag` fires before the constraint detaches, so the spring cancels the
  flick.** No. Matter nulls `constraint.bodyB`/`mouseConstraint.body` BEFORE
  triggering `enddrag`; the constraint is already released inside `onEndDrag`.

So the release-velocity flick, as written (onDown sets `button=0`, onMove samples
`flickBuf`, enddrag reads it and `setVelocity`s the toy), should apply and stick.
It does not, and no reasoning pass has caught why. NEXT STEP is a fenced
diagnostic readout in `onEndDrag` (does it fire, `flickBuf.length`, computed
`vx/vy`, body velocity a few steps later), not a fifth blind fix.

## RESOLVED: the throw works, the "failure" was a wiped flick (14 Aug 2026)

The throw is FIXED and shipped as `f1cf0072` ("pit: throw the toy on release,
from the pointer's own flick velocity"). Nothing above was wrong about the
mechanics: the flick as written applies and sticks. It just was not in the tree
being tested.

CAUSE OF THE FALSE FAILURE: the flick had been built, then wiped TWICE by merges
before Steve ever tested it, so every "it will not throw" report above was made
against a tree with NO flick code in it. The reasoning passes kept looking for a
bug in code that was not there. Once the flick was re-applied and the diagnostic
readout run, the throw worked first time and the readout confirmed it (enddrag
fires, `flickBuf` populated, `vx/vy` computed, velocity present a few steps
later). The diagnostic was then removed; it is not in `f1cf0072` and is NOT
needed again.

Lesson for the next agent: the two sections above are kept as an honest record,
but do not re-open the throw or re-derive the ruled-out theories. If a throw
regression ever appears, FIRST confirm the flick code (onDown/onMove/`flickBuf`/
enddrag `setVelocity` in BreedTree.tsx) is actually present in the tree before
theorising, because a merge eating it is the known failure mode here.

## Ancestor-tree blue pills: nmY reverted -r+22 -> -r-13 (14 Aug 2026)

The blue name pill on each ancestor circle (LineageMap `.nmPill`, the non-circular
`nmY` path used by the main pit and the chum card) sits ABOVE the circle at
`nmY = -r - 13`. Commit `93638c46e` (5 Aug 2026) moved it to `-r + 22`, which drops
it from above the circle to inside its top, so in the main pit it read as sitting
ON the node rather than clear of it. That was wrong in the main pit (the shared
component), so it is reverted to `-r - 13`.

Do NOT re-apply `-r + 22` thinking the above-circle placement is a drift: it is the
intended position, confirmed by Steve on 14 Aug. The circular (learn lift) path is
separate and unaffected, it uses `pillPlacement` (the clock-face offsets), not `nmY`.
Hiding the pills in the learn area is done with a dedicated prop (not `!circular`,
because the chum card is non-circular too and keeps its pills), tracked separately.
