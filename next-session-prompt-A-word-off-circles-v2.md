# Next session kickoff: A, the name comes off its circles

**Version 2.** Supersedes v1, which had four faults that would have stalled a run. They are listed at the end so they are not repeated.

Paste this into a **fresh chat**. Everything below was read out of the source on 7 August at `main` HEAD **`8992003`**.

**Do not start this at the end of a long conversation.**

---

## 0. How to find things in this document

**Another agent merges into `main` constantly. Every line number below will have moved.**

So every location is given as a **grep anchor first, line number second**. The anchor is the truth. The number is only a hint about where to look.

Each anchor was checked to be unique in the file at `8992003`. If an anchor returns more than one hit, or none, **stop and report it** rather than guessing.

```bash
cd /home/claude && git clone --depth 60 https://github.com/federationdesign-design/pedigree-chums pc && cd pc && npm install

F=components/BreedTree/BreedTree.tsx
for s in "the clinging children" "const clingGroup" "b.popped = true; // its children" \
         "Clinging circles ride their word" "const mkWord = " "for (const b of bodies) mkWord" \
         "THE BODY MUST ALSO HOLD THE CIRCLE" "const isWordNode" "const popChildren" \
         "const ghost = " "const wGone" "function liftToLearn" "const moveSubtree"; do
  printf "%-40s %s hit  line %s\n" "$s" "$(grep -c -F "$s" $F)" "$(grep -n -F "$s" $F | head -1 | cut -d: -f1)"
done
```

Expected: **one hit each**.

## 1. Ground rules

- Steve is dyslexic. Short, bulleted, priority-ordered replies. **No em dashes**, in chat or in delivered files.
- **Investigate the real code before proposing.** The handovers have been wrong about this exact area twice. Both corrections are in section 3.
- Measure, do not estimate.
- Pros and cons before any significant change, with a cost as a percentage of total delivery time.
- One patch at a time, pushed and tested before the next.
- Only change what is asked.

## 2. Where the work happens, and how to deliver

- Repo is public: `github.com/federationdesign-design/pedigree-chums`.
- Production branch `main`, auto-deploys to `www.pedigreechums.co.uk`.
- Steve's clone is `~/pedigree-chums-main`. Every command starts `cd ~/pedigree-chums-main`.
- `~/pedigree-chums` belongs to another agent, branch `pick-a-chum`. **Never touch it, never name it.** `~/pedigree-chums-hg` likewise.
- **Never create a branch.**

Delivery:

1. **Ask Steve whether anything is uncommitted before writing any command containing `git reset --hard`.** One did, and it destroyed a day's artwork wiring.
2. `git fetch origin` with no refspec, then reset.
3. Verify with `./node_modules/.bin/tsc --noEmit`. **Never `npx tsc`.**
4. `git apply --check` against a pristine worktree of the real `origin/main`.
5. **Hold the eslint baseline. At `8992003` `BreedTree.tsx` measured 54 errors, 8 warnings.** Re-measure at your own HEAD. See section 6 for the one place this job will push it up if you are careless.
6. One numbered `.patch`, one paste-able command, staging named files, never `-A`. Present the file in the same message as the command.

---

## 3. The job

**Steve's words: the name comes off. I am happy with the inner circles, I just want to disconnect the name from the circles.**

Today a level dog in the pit is one rigid lump: the name, and every circle packed inside it, moving and turning together. Steve wants the name to fall as its own object.

**Out of scope:** the game loop, the badges' own behaviour, the toys, the lift to learn, anything in the main pit.

### Two corrections. Both are cases of a doc being trusted over the code

- **The dog's circle is NOT drawn on top of its word.** Anchor `const isWordNode`, about line 2852. It hides every depth-1 circle for the whole round. **In the pit a level dog IS its name.** The circles you can see beside a name are its CHILDREN, one depth down.
- **Children do not pop out on collision any more.** Steve believed they do, and so did the last handover. Anchor `const popChildren`, about line 3563, cannot run for a level dog, because the cling block sets `popped` first. Anchor `b.popped = true; // its children`, about line 3532.

### The cause, confirmed in source

The joint is deliberate and named. Anchor **`the clinging children`**, about line 3450, running roughly 85 lines.

At the drop, for every level dog:

- Each child is given a real Matter body by `mkCircle`. **The bodies already exist.**
- Anchor `const clingGroup`: the word and its children share a NEGATIVE collision group, so they can never collide with each other.
- Each child is set `static` and `isSensor`, so it is immovable and resolves nothing.
- Anchor `Clinging circles ride their word`, about line 4573, in the frame loop: each child is teleported to the word's position and angle every frame.
- `popped` is set, closing the pop path.

The only release is `held`: lifting the word cuts the children loose and hands them the word's velocity.

### The two failures the cling was built to prevent

Both are recorded in the comments in that block. **Read them before editing. Any version of this job that leaves a child static will hit one or both.**

- **The rocket motor.** A dynamic word overlapping a STATIC child reads to the solver as a body sunk inside infinite mass, and it fired names out through the top of the screen every frame.
- **The sweeper.** A static body teleported every frame ploughs through everything and wins every contact, because nothing can push a static body back. On a deep level that shovelled the whole pit up and out over about a minute. That is why they are also sensors.

Neither applies to a DYNAMIC child, which is what this job creates. They are here so you recognise them instantly if they come back.

---

## 4. WHAT MUST SURVIVE THE REWRITE

**The cling block does five jobs, not one.** Only the first is being removed. **An agent that rewrites the block wholesale will silently drop the rest.** Check each one off explicitly in your report.

| Must survive | Why | How to check |
|---|---|---|
| `owned.add(ch)` for every child | `pitBodiesRef.current.owned` and `moveSubtree` both read it. Losing it breaks nesting and the lift | grep `owned.add` still inside the loop |
| `all.push(nb)` for every child | `all` is what the frame loop, the round-won chain and the scatter iterate | grep `all.push` count unchanged |
| **The child's own percentage badge** | Spawned inside the same loop. **These vanished once before**, and the comment in the code says so. Each child badge is deliberately NOT in the cling group | count the yellow chips on a live level and compare with before |
| `b.popped = true` in **both** places | Once for a childless dog near the top of the loop, once at the end. Both must stay or `popChildren` will fire and double the circles | grep for `popped = true`, expect two inside this block |
| `setBadgePcts` call | Drives the badge React state that draws the numbers | grep unchanged |

---

## 5. Staging. Push and test between each

**Stage 1 is deliberately larger than it looks. Do not split it.** Freeing the children without also handling the drop-time overlap ships the rocket motor, because a word and its children are placed overlapping on purpose.

### Stage 1: cut the cling, and land the children safely. One push.

- Spawn each child as an **ordinary dynamic body** at its packed position, instead of static, sensor and in the word's group.
- Give the word and its children **temporary** mutual immunity so the starting overlap resolves without an explosion. **Anchor `const ghost = `, about line 3552.** It already does exactly this, a shared negative group cleared on a 650ms timer, and `popChildren` already uses it for the same reason.
- Give each child a small outward burst, the way `popChildren` does.
- Keep everything in section 4.
- **Remove the per-frame cling drive in the same push.** Anchor `Clinging circles ride their word`. Leaving it is harmless, since it no-ops on an empty list, but it is dead code that reads as live and the next reader will trust it.
- **Delete the now-unused locals.** Cutting the cling leaves `wordFits`, `wpx` and `hpx` unused inside that block. **Unused variables are eslint errors and the baseline must hold.** This is the one place this job will push the count up.

**Test before stage 2.** This is the whole visible result. Names fall free, circles fall free.

### Stage 2: tidy the release path

- The cling release inside the `held` block can go, once nothing populates `b.cling`.
- Confirm lifting a dog to learn still behaves. It is now simpler, because there is nothing to cut loose.

### Stage 3: give the word its own size back

- Anchor **`THE BODY MUST ALSO HOLD THE CIRCLE`**, about line 3322, inside `const mkWord = `.
- The body is floored to at least the dog's circle diameter. That floor is a stop-gap from when the word's body had to carry everything.
- **Once the children are free the floor has no job**, so remove it and the name gets a body its own size.
- Expect the names to fall differently after this. That is the point, and it is the reason it is a separate push.

---

## 6. Coupling points. Any of these breaking will break quietly

- **`liftToLearn`**, anchor `function liftToLearn`, about line 2948. Reached from the word's own click and from a circle. **Both must still lift the same dog.** Note it computes the lift radius differently for a word node, from the node's own `r` rather than a measured rect.
- **The word's visibility**, anchor `const wGone`, about line 2770. It reads `held` off the word's body. A word and its children no longer share `held`, so confirm a lifted dog still hides.
- **`moveSubtree`**, anchor `const moveSubtree`, about line 3539. Syncs the d3 nodes to physics so nesting is preserved. Confirm it follows the right body once the children move independently.
- **The MouseConstraint**, anchor `MC_KINDS` (**two hits, this is expected**), about line 4813. It already accepts kind `"circle"`, and `mkCircle` tags children with that kind. **So freed children become draggable.** See the decision in section 7.
- **The scatter into the next level**, which reads circles, rods and pills off the same bodies.

---

## 7. Two expected behaviour changes, not bugs

Both follow necessarily from freeing the children. **Raise them with Steve before stage 1 ships, do not decide alone.**

- **Freed children can be dragged.** `MC_KINDS` already permits it.
- **Freed children get pushed around by everything.** Today a chum bounces off a child as if off an immovable wall, because it is static. After this they will shove each other.

---

## 8. What to check on a real device

Steve tests on an iPhone, not an emulator.

- Names fall free of their circles and both settle sensibly.
- **Nothing leaves through the top of the screen.** That is the rocket motor.
- **The pack does not creep upward over a minute.** That is the sweeper.
- The percentage chips are all still there. Count them.
- Lifting a dog to learn still works from the name and from a circle.
- **Deep levels.** Measured across the 54 entries in `data/breeds.ts`, the median dog carries 4 nested circles and the worst carry **46, five deep**, on Golden Retriever and Irish Setter. **Caveat: earlier notes refer to 90 or 96 levels, so the pit's level list may be larger than the breed list. Re-measure against whatever the pit actually loads before quoting these numbers back.**

## 9. STOP conditions

- `git branch --show-current` is not `main`.
- An anchor in section 0 returns zero hits or more than the stated number.
- Anything exits the top of the stage, or the pack creeps upward over time.
- Any coupling point in section 6 breaks and the fix is not obvious.
- Any row in section 4 cannot be confirmed.
- `tsc` fails twice.
- You are choosing between two readings of this brief.

**A partial job with a clear report is a good outcome.**

## 10. Cost

**About 1.5% of total delivery time.** Most of it is removal, but stage 1 does add the ghost immunity and the outward burst, so it is not pure deletion. Risk low to medium, concentrated entirely in the two failure modes in section 3.

---

## 11. What was wrong with v1 of this brief, so it is not repeated

- **It split stage 1 from the overlap fix**, which would have shipped a push that fired every name off the top of the screen.
- **It never mentioned the badges, `owned` or `all`**, all of which live in the block being rewritten. Section 4 exists because of that.
- **It gave twenty bare line numbers** in a file another agent edits daily. Section 0 exists because of that.
- **It said the job was removal not construction**, then asked for new code.
- **It stated a level count as fact** from a measurement over the breed list, which may not be the same thing.
