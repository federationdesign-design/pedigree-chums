# Pedigree Chums — Essay Page Build Rules

**Read this before touching any Good Dog Bad Dog or Dogs at Work essay page.**

Argos is the reference implementation. Every rule below exists because we
broke it first and spent a long session finding out why. The scars are noted,
because a rule without its reason gets "improved" away by the next session.

---

## 1. Spacing

### The one rule

**Space belongs BETWEEN things, not ON them.**

No element in the essay body carries a vertical margin of its own. The parent
places every gap. This makes three whole classes of bug impossible:

- gaps collapsing unpredictably against each other
- bottom padding turning up uninvited
- deleting or reordering a block orphaning a gap

### The scale

Defined on `.essayBody` in `good-dog-bad-dog.module.css`:

```
--gap-xs:  9px   (0.5x)  a heading and its own first line
--gap-s:  18px   (1x)    between paragraphs   <- THE BASE UNIT
--gap-m:  27px   (1.5x)  before a heading
--gap-l:  36px   (2x)    quotes, scenes, rules
--gap-xl: 54px   (3x)    section breaks
```

Every value is a multiple of `--gap-s`. **Change that one number and the whole
essay rescales in proportion.** It is the only number to touch if a page wants
opening up or tightening. Do not add a sixth token without a real reason.

### Three traps, all of which caught us

**Specificity.** The rhythm selectors are written `.essayBody.essayBody > * + *`
with the class deliberately doubled. `.essayBody p { margin: 0 }` scores one
class plus one element and beats a single class, so an undoubled rhythm rule
loses and every paragraph gap silently collapses to zero. If you add a rule,
double the class.

**Direct children only.** `> * + *` reaches direct children of `.essayBody` and
nothing deeper. A divider nested inside a scene wrapper gets no gap at all.
Either lift it to the top level or give it its own rule, as `.essayBody .rule`
does.

**Deliberate exceptions must be registered.** The rhythm scores three classes,
so it will silently override a compound selector like `.timelineScene.tightTop`.
Any intentional zero or negative gap needs an explicit opt-out at matching
specificity, placed after the rhythm rules. See `.tightTop`.

### Never

- No `margin-bottom` on anything. One direction only, so two values can never fight.
- No hand-placed spacer divs. They add to the rhythm rather than replacing it.
  Use `<Spacer size="l" />` if you genuinely need an exception, so it is visible
  in the markup rather than hidden in a stylesheet.
- No transparency on text or lines.

---

## 2. Scroll scenes

### How progress works

`useSceneProgress` returns `p` from 0 to 1. It starts when the scene's top
enters the **lower third** of the viewport, via the `LEAD` constant, not when
the scene reaches the top of the screen.

**Why this matters more than anything else on this page.** Progress used to be
`-r.top / travel`, which stays at 0 for the entire time a scene travels up the
screen. Every element sat invisible while reserving its full height: a screen
of blank rectangle before anything began. It also meant a 125vh scene had only
`height - viewport` of usable travel, so the whole build was crammed into about
175px of scroll. Fixing this made every scene roughly 3.5x slower and removed
the blank arrival in one change.

If a scene ever feels like "nothing, nothing, then everything", check here first.

### The rules

- **Never reserve layout space for something invisible.** If an element holds
  its height from the first frame, it must be visible from the first frame.
  An invisible poll card is a blank screen, not empty page.
- **Use the whole scene.** An animation finishing at p=0.55 leaves 45% of the
  scene as dead scroll. Stretch the animation into the tail rather than
  shortening the scene: the scene length is unchanged so nothing speeds up,
  and the build gets gentler.
- **Stages hug their content.** No `min-height` on a stage. A full-screen box
  with top-aligned content leaves a tall empty tail below the last element.
- **Slower is better.** We never want a build to feel rushed. If in doubt,
  spread it over more scroll rather than less.

### Two kinds of scene, and they behave oppositely

- **Scroll-driven** (`useSceneProgress`): galleries, wipes, poll. Shortening the
  scene speeds the animation up. Do not do it.
- **Time-driven** (`usePinnedTrigger`): quote reveals. The build is a fixed CSS
  transition, so scene length only controls the pause afterwards. Shortening
  these costs nothing.

---

## 3. The block library

| Block | Component | Use for |
|---|---|---|
| Pull quote | `QuoteReveal` (pass `tight`) | A standalone idea, in normal flow |
| Full-width transition gallery | `WipeSequence` | Sequences of frames: `mode="wipe"` or `"fade"` |
| Inline captioned gallery | `StatueBulletsChoreo` | Swipeable images with captions, optional bullets and quote |
| Poll | `QuotePollScene` | An audience question. Always pair with a quote above it |
| Divider | `.rule` | A 1px full-bleed line. The only sanctioned line style |
| Sidebar card | `.sidebarCard` | Fact panels |

### WipeSequence settings worth knowing

- `mode` — `"wipe"` reveals each frame from the right edge; `"fade"` cross-dissolves.
- `hold={1}` — every frame gets a still moment as long as the fade that brought
  it in, including the first and last. Without this a frame starts being
  replaced the instant it lands.
- `frameRatio` — crops frames to a fixed shape. Omit it and the artwork keeps
  its own proportions with no cropping.
- `captionMode` — `"swap"` replaces the caption each step, `"stack"` builds them up.
- `fromProgress` — key captions to raw scroll instead of frame index when you
  want more caption steps than frames.

### Asset rules

- **Every frame in a gallery must be identical in pixel dimensions.** Mismatched
  frames slide out of register with the artwork beneath.
- Images through `sips` at quality 78, longest edge 1400. Aim under 300KB.
- Videos need `muted` and `playsInline` or iOS will not autoplay them.
- Scrub videos must be encoded all-intra (`-g 1 -keyint_min 1 -sc_threshold 0`)
  or reverse scrubbing snaps between sparse keyframes. This makes them large;
  that is the price and it is not a bug.
- `git add public/` when adding images, or they 404 on Vercel.

---

## 4. Pull quotes

**One every 600 words or so.** Argos runs 3,069 words with seven, which is at
the top end. Below 400 words apart they stop being emphasis and become wallpaper.

### The rules

- **A quote must be an idea, not an event.** "Odysseus notices, he wipes away a
  tear" is a plot beat. "He gives us recognition without comfort" is an idea.
  Only the second is worth stopping the reader for.
- **Structural, not decorative.** Promote a line in place: it appears once,
  styled as a display beat. Do not copy a sentence out and leave it in the body
  as well.
- **Never adjacent to its own duplicate.** The print convention of repeating a
  nearby sentence does not transfer to a phone, where reading is strictly
  linear and you cannot see both at once. It just reads as the same sentence
  twice.
- **Under 20 words**, ideally well under.
- **Never two visible in one screen.**
- **Quotes above polls are compositional.** The poll card is short and needs
  something to sit against. Do not remove one without replacing it.

---

## 5. Repo workflow

- Production is `main`, auto-deploying to www.pedigreechums.co.uk from Vercel.
- `~/pedigree-chums-main` is the working clone. **`~/pedigree-chums` belongs to
  the Claude Code agent on branch `pick-a-chum` and must never be touched.**
- The agent also merges into `main`, so re-sync before generating any patch.
- Verify with `npx tsc --noEmit`. `npx next build` fails in the container on a
  Google Fonts fetch.
- **Count components before and after any structural edit.** A removal script
  once deleted a gallery and the poll because their quotes were props on those
  components rather than standalone blocks. The typecheck did not catch it; a
  component count did.
