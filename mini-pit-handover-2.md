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
