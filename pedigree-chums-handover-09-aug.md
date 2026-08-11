# Pedigree Chums, session handover

_Written 9 August 2026. Production `main` HEAD: **`2bae4c1`**._
_Every number below was measured against live `main`, not copied from an earlier doc._

Read sections 1 to 3 before touching anything. Section 5 is what is queued. Section 6 is what will break if edited casually.

---

## 1. Ground rules

- **Steve is dyslexic.** Short, bulleted, priority-ordered replies. **No em dashes**, in chat or in delivered files.
- **Investigate the real source before proposing.** Say so explicitly when reasoning from a doc rather than the code. The docs have been wrong repeatedly and the code was right.
- **Measure, do not estimate.** If a number needs a browser, say so and stop rather than reasoning from a constant.
- **Pros and cons before any significant change**, with a cost as a percentage of total delivery time.
- **One patch at a time**, pushed and tested before the next.
- **Only change what is asked.**
- **Steve approves every edit.** He reads the diffs and has caught real bugs in them. Do not batch edits out of sight.

**DO NOT USE A FORK OR BACKGROUND AGENT.** One was tried on 8 August for the pit menu job. Within a minute it had **deleted a tracked file nobody asked it to touch** and left 59 unreviewed lines in the working tree. Work inline, edit by edit.

## 2. Where the work happens

- Repo is public: `github.com/federationdesign-design/pedigree-chums`.
- Production branch **`main`**, auto-deploys to `www.pedigreechums.co.uk`.
- Steve's clone is **`~/pedigree-chums-main`**. Every command starts `cd ~/pedigree-chums-main`.
- **`~/pedigree-chums` belongs to another agent, branch `pick-a-chum`. Never touch it, never name it.** `~/pedigree-chums-hg` likewise.
- **Never create a branch.**
- Vercel: team `team_JFwmQlCm3J4w0dGzBxfCIYmR`, project `prj_Lg9QmI6rh3MSyIb3Yj5BV57fY9xj`. `sleep 75` before querying; match `githubCommitSha`, never assume the newest is yours.

**The other agent merges into `main` constantly.** Roughly one commit in three on 8 August was theirs. **Fetch immediately before building every patch.**

**Steve pastes prompts into the wrong window regularly.** Seven times on 8 August. If a request has nothing to do with the pit, the lineage data or the lift layer, **stop and ask before acting**. Every agent that did so was right to.

## 3. Getting up to speed

```bash
cd ~/pedigree-chums-main && git fetch origin && git log --oneline -10

for f in components/BreedTree/BreedTree.tsx components/PackPit/LineageMap.tsx \
         components/PackPit/PackPit.tsx components/LineageModal/LineageModal.tsx; do
  printf "%-46s %5s " "$f" "$(wc -l < $f)"
  ./node_modules/.bin/eslint $f 2>&1 | grep -o "[0-9]* errors, [0-9]* warnings"; echo; done
```

**Baselines at `2bae4c1`:**

| File | Lines | eslint |
|---|---|---|
| `components/BreedTree/BreedTree.tsx` | 7324 | **54 errors, 8 warnings** |
| `components/PackPit/LineageMap.tsx` | 2607 | **34 errors, 14 warnings** |
| `components/PackPit/PackPit.tsx` | 3254 | **194 errors, 41 warnings** |
| `components/LineageModal/LineageModal.tsx` | 803 | **3 errors, 6 warnings** |
| `data/lineage.ts` | 1749 | **0 errors, 0 warnings** |

**Do not add to these.** `data/lineage.ts` being clean matters most; it is one of the few files in the repo with nothing wrong in it.

## 4. Delivery

1. **`git fetch origin` with no refspec.** **Ask Steve before any command containing `git reset --hard`** — one destroyed a day's uncommitted work.
2. **`git merge --ff-only` is always approved.** Do not stop to ask.
3. Verify with `./node_modules/.bin/tsc --noEmit`. **Never `npx tsc`, never `npx eslint`.** Use the repo binaries.
4. **Hold the eslint baseline.** Measure before and after.
5. **You cannot commit or push.** Steve's permission layer blocks `git add`, `commit`, `pull`, `push`, `rm`, `restore`. Hand him one paste-able command and he runs it in his own Terminal tab. **Do not put a co-author trailer in it**; the history is plain.
6. Stage named files, never `-A`. New images must be staged explicitly.
7. **Throwaway probes:** run inline with `./node_modules/.bin/tsx -e` rather than writing a file. Nothing to forget to delete.

---

## 5. WHAT IS QUEUED, in the order I would take it

### 5.1 Pit menu, stage 2. **Small, finish this first.**

Stage 1 shipped as `2bae4c1`: the corner X now piles up leave and restart pairs up to 8 instead of toggling one, id-keyed, spawned into the live world.

**Stage 2 is deletion only:** the now-dead frame-loop sync block (guarded with `if (u.spawned) continue;` and `const want = false;`) and the `pitMenuRef` vestige.

**Steve has not yet confirmed he tested stage 1.** Check before deleting the old path.

### 5.2 Node placement in the main pit. **The big one. ~3%, not yet investigated.**

Steve's four faults, from a screenshot he reviewed:

1. **Pills overlap each other and hide their own text.**
2. **Pills cover the dog** they are naming.
3. **The button is too big for the card.** Fixed, see 5.6.
4. **The green nodes behind are almost entirely hidden.**

**Node placement is the root cause of 1, 2 and 4.** Nodes are bunched in places, far from the circle edge in others, and their images overlap. **Fix placement before touching the pills**, or you fix a symptom twice.

**Decision already taken:** when two pills would overlap, **push them apart**, and the node moves with its pill.

### 5.3 The Tudor trail. **The largest job. 8 to 16%.**

**`tudor-trail-brief-v3.md` is at the repo root, untracked.** It is the authoritative document. Read it in full.

**Current failure count: 33 of 100 playable cards.** Step 1's first split shipped and took it from 34.

**It is a WRITING job, not a coding job.** 33 failures need new lineage data across six or seven ancestor families. The renames buy almost nothing and the depth cap is not involved.

### 5.4 The hover reveal port. **3 to 4%, desktop only.**

Bring the main pit's hover reveal to the mini pit. `PackPit.tsx` around line 2144: `hoverBody` plus a 240ms ramp, `drawFamily` draws ancestor nodes emerging, everything else dims to `DIM_MIN` 0.5.

**It is canvas. The mini pit is SVG. This is a rebuild, not shared code.** Extract nothing from PackPit, change nothing in it.

**Two targets:** the chum cards in the rail, and the dog circles.

**Decisions already taken:** desktop only, gated on a pointer media query not a width breakpoint. On the dog circles the nested circles **MOVE OUT, they are not copied** — hide them in their packed positions and animate them out, so a dog's ancestors never appear twice at once.

### 5.5 The dashed ring and line, start-screen only. **Small.**

A dashed white ring around the cluster and a dashed line from the level portrait mark that these dogs belong to the level. **Steve wants them on the start screen only**, gone once the round starts or the user enters learn, back if they return.

**READ SECTION 6.1 BEFORE BUILDING THIS.** `frozen` is exactly the start screen and has silently killed three handlers.

### 5.6 Smaller, all ready

- **Extract `splitName` to a shared module.** It exists identically in `LineageMap.tsx` (used) and inline in `BreedTree.tsx`'s `spawnPillRef`. Two copies of one wrapping rule. Logged, not done.
- **Remove the dead `w` from the pills type.** `spawnPillRef` ignores the width it is passed, so `LineageMap:1390` carries a stale `+22` duplicating a number that was retuned. Five sites, two files.
- **The three-line wrap question.** `splitName` only ever makes two lines. "Mediterranean miniature sighthounds" wraps to 187px against a 176px phone card, so it still just overflows. A three-line wrap would diverge from the pit and also affect the root card tag. **Steve's call.**
- **Four names show two different images:** Bloodhound, Bulldog, Greyhound, Water spaniels. Bloodhound and Bulldog may be deliberate, medieval versus modern. **Greyhound looks wrong**: one of its images is `/greyhound-square.jpg` from the site root, not the breeds folder. **Steve has not answered this.**
- **Filename audit.** 156 named nodes with images and inconsistent naming throughout: some capitalised and hyphenated, some lowercase, some era-prefixed, some outside `/history/breeds/` entirely. Long list, every rename touches `lineage.ts`.

---

## 6. FRAGILE. Do not edit without a full audit

### 6.1 `frozen` in BreedTree

```js
const frozen = dockAside && gravity && !started && !learning;
```

**Exactly the start screen**, and it gates 18 things. **It has silently killed three handlers** by being in their attachment condition. The symptom is always the same: the code is correct and never runs. **Check this before adding any start-screen interaction.**

### 6.2 A dog's physics body is not its circle

`mkWord` builds a dog's body as a rectangle the size of its NAME. During a round a level dog's own circle is **not drawn at all** — `isWordNode` hides every depth-1 circle once `fellRef` is true. **In the pit a level dog IS its name.** What you see beside a name is its children, one depth down.

### 6.3 Children do not pop out on collision

`popChildren` cannot run for a level dog: `popped` is set at the drop. The children are freed at the drop instead, as of job A. **Both Steve and two earlier handovers believed otherwise.**

### 6.4 One ring rule, and the clamp

`RING_FRAC = [0.09, 0.082, 0.075, 0.07, 0.065]` in `LineageMap`, imported by `BreedTree`. **The table only ever descends**, and a hard clamp in both files caps every ring at its parent's width, so no future table edit can break the hierarchy rule.

**The fallback is 0.145 on purpose.** `ringFrac(0)` returns it, and that IS the root circle's own ring in BreedTree. **Do not read the fallback as a table entry.**

**Ring colour means DEPTH only:** yellow, navy, light blue, white, cycling. The circle you are on keeps its depth colour **lifted 40% toward white**, not recoloured. White cannot be lifted, so a depth-4 circle gets no highlight. Flagged, accepted.

### 6.5 Label fitting

- `fitLabel` returns `{ lines, fs, fits }`. **A name that cannot fit its circle is not drawn at all**, in the two in-circle callers. The pit-words caller deliberately still draws, because the word IS the game object.
- **On a tie in fitted size, more lines wins.** Without that, the degenerate case pinned every option at the 6px floor and the first candidate, one long line, won.

### 6.6 The viewport was a lie until 8 August

`LineageMap`'s `vp` defaulted to `{ w: 1280 }` and only corrected in an effect after first paint. **Every phone painted its first frame sized for a desktop**, on every level open. Now lazy-initialised from `window` with a `useLayoutEffect` measure. **If you see a size that looks like the wrong device, check for another stale default before blaming the maths.**

### 6.7 CSS module rule order

**Same specificity means the last rule wins.** A mobile override placed above its base rule is silently ignored. Two blocks are parked at the end of files for this reason.

### 6.8 The two overlays look alike

`LineageMap` renders both the pit lift and the chum family tree. **`circular` marks the pit lift, `strongBg` the chum tree, neither marks the main pit.** Establish which is on screen before changing anything visual.

### 6.9 Render-time traps in BreedTree

- A plain function in the component body that touches refs or `setState` reads as render work.
- `performance.now()` in such a function is flagged. Take the clock from `requestAnimationFrame` or an event's `timeStamp`.
- **A `const` cannot be read from above where it is declared.** This has forced code 3000 lines down the file before.
- **Side effects must not go inside a `setState` updater.** React can run an updater more than once, and StrictMode does in development. This nearly shipped a double-spawn in the pit menu on 8 August.

### 6.10 Physics constants are tuned, not guessed

| | |
|---|---|
| `FREED_CIRCLE_OPTS` | restitution 0.35, friction 0.5, frictionStatic 1.0, frictionAir 0.015 |
| `CHUM_FLOOR_GRACE_MS` | 120, so a resting card does not strobe red and white |
| `DIFF_STOP_0 / 5 / 10` | **0.5** / 0.575 / 1.0. Raised from 0.4 on 8 August |
| `PIT_WORD_SCALE` | 1.05, audited across 2431 circles |
| `LIFT_MAX_SHARE` | ramps 0.45 at 390 to 0.31 at 1440, then holds |
| `learnBtnScale` | `min(1, 1.8 * liftR / 200)` |
| Pill hits / padding | 2 hits, +14 width, 22 and 40 height |
| `MAX_LINEAGE_DEPTH` | 5. **Read the comment; it records exactly what it guards and that it never binds the Tudor rule** |

### 6.11 Delivery traps

- Backticks inside inline script template literals break the build.
- **An apostrophe in a name breaks shell quoting** in inline scripts. `Shepherd's Dog` has done this twice.
- An inline `stroke-width` beats a CSS hover rule. That is why `--ring` exists.
- CSS animation exits use `forwards`, not `both`. A keyframe replaces `transform` outright.

---

## 7. What was got wrong, so it is not repeated

- **A fork agent deleted a tracked file** within a minute of starting, on a job nobody had asked it to clean up.
- **I predicted a 176px phone card and told Steve to tune a button against it.** The card was being sized from a stale 1280 viewport, so the number never existed. **The button was tuned three times against a card that was wrong.**
- **A brief told an agent to alias two names that turned out to be parent and child**, not two spellings of one dog. `Old English Black and Tan Terrier` is the population, `Black and Tan Terrier` the breed.
- **A brief predicted a failure-count drop that could not happen**, because three families also depended on renames. An agent would have read that as its own failure.
- **`POP_MIN_PX` was discussed at length as the fix for tiny circles.** It governs a path that no longer runs for them.

**The procedural rule, unchanged and still the whole game:** establish which view is on screen, measure the real path, then change it. **When three attempts have failed, build a diagnostic instead of a fourth fix.**

## 8. The inner-circle hover bug (open, parked)

- **Symptom:** hovering an inner circle on the lift (e.g. `Ancient eastern sighthounds` on the Scottish Deerhound tree) does not take: the level ladder does not add the rung and the label does not turn yellow. First attempt fails, second works, out-and-back "fixes" it.
- **Cause 1, real and FIXED:** `BreedTree.tsx` circle `onMouseLeave` called `asideRef.current.contains(rt)` guarded only by `rt &&`. `relatedTarget` can be a non-Node (the window), and `Node.contains()` throws on it. The throw aborted the leave before `setHovered(null)`, latching `hovered` on the parent. Fixed by guarding the TYPE: `rt instanceof Node && ...` (commit `c925b682`). The console TypeError is gone.
- **Cause 2, still open:** with the throw gone, the hover still fails, so there is a second cause. The circle `onMouseEnter` (BreedTree, around line 5665) has a latch, `if (u && u.raf !== null && d !== u.parent && u.inside.has(d)) return;`, that swallows hovers onto nested circles while the unlock sim is running; if `u.raf` never clears, deep circles stay unhoverable. Not yet confirmed. Next diagnostic should log, in BreedTree, whether `onMouseEnter` fires on the inner circle, the latch decision, and whether `setHovered` runs.
- **Lesson, do this first next time:** three diagnostics were put in `LineageMap.tsx` and printed nothing, because the learn/lift circle view is rendered by **`BreedTree.tsx`**, not LineageMap (BreedTree's `hovered` drives `onShownPathChange`, hence the ladder). Establish which file renders the thing before instrumenting it. Same trap as the collapse job.
