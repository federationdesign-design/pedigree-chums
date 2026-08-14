# Accessibility, working brief (v5)

Site: pedigreechums.co.uk
Repo: `federationdesign-design/pedigree-chums`
Agent worktree: `~/pc/dogsatwork`, branch `dogsatwork`
Supersedes v4. Rewritten 13 August 2026.

Tasks 1, 2 and 3 are complete. This version removes the scrim, adds the hero rule, and records what task 3 measured.

---

## 1. The job, and what done looks like

Make the site readable for a blind user at the Digital Accessibility Centre who reported three problems and has agreed to test before anything ships. Two were fixed on 12 August. What remains is the toolbar.

**Done means all five of these are true.**

1. The photograph contrast failures are measured and reported. They are not fixed in the default view.
2. The toolbar ships with three schemes, hide images, and reset. Each scheme measures 7:1 body and 4.5:1 large across the page set in task 6.
3. The toolbar is fully keyboard operable, every control has an accessible name and a pressed state, and no control depends on colour alone.
4. Preferences persist across pages and sessions and apply before first paint, with no flash of the default.
5. The DAC tester has been sent a preview and has signed off. That gate is Steve's.

---

## 2. Autonomy

**Decide yourself, do not ask.**
- All measurement. Playwright scripts to `.scratch`, headless renders, computed styles, pixel sampling, screenshots. Read-only, no approval needed.
- Reading any file in the repo.
- Naming, file structure, test approach, script approach.
- Which routes have a hero header. Find them yourself, no list for approval.
- Committing and pushing to `dogsatwork`.

**Report, then wait.**
- Any visual change. Numbers first, then approval, then the edit.
- Any change outside the files a task names.
- A locked decision in section 3 that measurement proves wrong.

**STOP and hand back.**
- `git branch --show-current` is not `dogsatwork`.
- A change would require touching `~/pedigree-chums-main`, or another agent's uncommitted files.
- `npm run build` or `tsc` fails and the fix is not obvious in two attempts.
- You are choosing between two readings of this brief.
- A task exceeds its cost estimate by a factor of two.

**The style rule, absolute.** Style decisions are Steve's. Colour, placement, weight, size, spacing, treatment. Do not propose options and do not offer alternatives. Measure, report the number, state pass or fail against the standard.

**The method rule.** Where the standard specifies a method, do not offer alternatives to it. Lightest pixel, not average. Offering a softer measurement is the same error as offering a style option.

**Git discipline.** Stage named files only. Never `git add -A`. Another agent works in this repo and its files appear without warning.

---

## 3. Locked decisions

Answered. Do not reopen.

**The default view**
1. **The default view does not change. Not by one pixel.** This has been asked and answered three times. Photograph contrast failures are measured and reported, never fixed in the default. Do not propose a scrim, a tint, a hero redesign or any other default-view remedy.
2. **The 935-paragraph recolour stays** as shipped.
3. **There is no scrim.** The scrim task is removed. In the schemes the hero photograph is hidden, so there is nothing to sit a scrim on. In the default view no change is permitted.

**The toolbar**
4. **Two boxes on the header axis**, same horizontal line as the menu icon. Three schemes in one box, hide images and reset in the other. Segmented, shared border, divider between cells.
5. **Icons only.** No text labels. Outline shows active, `aria-pressed` carries state, accessible name flips between hide images and show images. Glyph does not change on state.
6. **36px cells on phone, 44px from 721px up.** WCAG 2.5.8 floor is 24px, so both clear it. Glyph sits at roughly 45% of cell height.
7. **Three schemes:** default, black on white, white on black.
8. **Headings are white in white on black.**
9. **The header inverts with the scheme.**
10. **Inside a scheme, legibility decides.** Brand colours have no claim. Do not raise brand consistency as an objection to a measured value.
11. **In both high contrast schemes, hero photographs are hidden.** The hero becomes the flat dark container with its text on it. This is what fixes the 176 measured failures for scheme users, and it replaces the scrim entirely.
12. **Hide images keeps the container at full size**, filled with a contrast colour and the alt text as visible text. No layout shift entering or leaving the mode. Note that in a scheme the hero image is already hidden by decision 11, so hide images extends that to every other image on the page.
13. **A scheme overrides the per-article text toggle and leaves its stored state untouched.** Reset restores whatever the toggle was set to.
14. **The mini pit at `/britains-dog-history` is out of scope.** Do not start it, do not silently include it in a sweep.

**The article text toggle**
15. **Kept, alongside the toolbar.** Both exist, toolbar wins while a scheme is active.
16. **Extends to every route with a hero header.** Same position, directly below the hero. Find the routes yourself.
17. **Storage stays per page** in `sessionStorage`, keyed on pathname.

---

## 4. The work

Cost is a percentage of total remaining delivery time.

### Tasks 1 to 3, complete

- **Task 1**, done. `/test` and `/test-deploy` deleted. DAC note drafted, in Steve's hands.
- **Task 2**, done, pushed at `ea9a5194`. Eleven files, alt text only. Zero missing alt attributes were found; the problem was meaningful images carrying `alt=""` and heroes whose alt repeated the H1. The 35 history-2 fact cards were measured as captioned figures, so `alt=""` is conformant and they were correctly left alone.
- **Task 2a**, outstanding. Breed root portrait is genuinely unannounced. Approved fix: one `rootLabel` prop on BreedTree, rendered as an SVG `<title>` on the root node only, display mode. Nothing else in that widget.
- **Task 3**, done, report in `.scratch/task3-report.md`. See section 5.

### Task 5. Toolbar, stage 1, plumbing. Cost 20%.
- `data-pc-contrast-scheme` on `<html>`. Token-level palette swaps only, never parallel stylesheets.
- Persistence in `localStorage`, applied before first paint via an inline script in the root layout.
- **Build that script with string concatenation, not template literals. Backticks inside inline script template literals have broken this build more than once.**
- **First, check whether there is one shared header component.** Task A found seven route groups falling back to a generic title, so the routes may not be unified. If there are several headers, extract one before adding the toolbar. Report the finding before building.
- Acceptance: attribute sets and clears, survives reload and navigation, no flash of default, the per-article toggle defers automatically because it is already gated on `:root:not([data-pc-contrast-scheme])`.

### Task 6. Toolbar, stage 2, schemes. Cost 27%.
- Default, black on white, white on black. Headings white in white on black. Header inverts. Hero photographs hidden.
- Acceptance: 7:1 body and 4.5:1 large measured across home, about, one Dogs at Work article, one Good Dog Bad Dog article, one `/chums/[slug]`, and `/accessibility-test`. Every hero title from the section 5 table re-measured in both schemes and passing.

### Task 7. Toolbar, stage 3, hide images. Cost 20%.
- Every image replaced by a contrast block at the container's existing size, carrying its alt text as visible text.
- The mode must be clearly labelled and easy to leave.
- Acceptance: no image survives, every block carries readable alt text at 7:1, no layout shift on enter or exit, reset returns everything in one action.

### Task 8. Toolbar, stage 4, controls. Cost 13%.
- Two boxes on the header axis. Reference model is the DAC's own site.
- Each scheme button is the letter A rendered in the scheme it applies. Active one outlined.
- Draw the crossed-photo and refresh glyphs to match the existing dock icon weight in `components/CardDock/CardDock.tsx`. Do not import a new icon library.
- Text size is not a control. Browser zoom handles it.
- Acceptance: keyboard operable, screen reader announces name and state, no state conveyed by colour alone, targets meet decision 6.

---

## 5. Task 3 findings, the record

Measured against the lightest pixel in each text bounding box, at 390, 768 and 1280. Standard AA, 4.5:1 body, 3:1 large. Full data in `.scratch/task3-report.md`.

**176 of 412 measurements fail.** Every editorial article hero with text over a photograph fails at all three widths.

| Hero title | 390 | 768 | 1280 | needs |
|---|---|---|---|---|
| Dogs at Work, all six, white 46px | 1.0 | 1.0 | ~2.0 | 3 |
| Greyfriars Bobby, yellow 50px | 1.04 | 1.43 | 1.29 | 3 |
| Argos, yellow 36px | 1.20 | 1.20 | 2.48 | 3 |
| Anubis, Gelert, Hound, Lassie | 1.2 to 2.0 | 1.7 to 2.2 | 1.5 to 1.8 | 3 |
| smarter-than-the-test, yellow 50px | 1.29 | 1.89 | 1.65 | 3 |
| hot-dogs, yellow 48px | 1.62 | 1.75 | 1.61 | 3 |

Also failing over photographs: Dogs at Work back-links and kicker tags, Good Dog Bad Dog kicker and breed tags, the hot-dogs subtitle at 2.7, navy jump pills at 1.6 to 1.8, the white wordplay stack at 3.2. `#ffd23e` yellow display type is the worst offender.

**The one exception.** `/britains-dog-history-2` carries a darkening `introTint` and passes at 4.86 to 5.48. Recorded because it proves the pattern is solvable, not because it is being copied. The default view does not change.

**Failure mode in one line.** Light display type, white or `#ffd23e`, laid directly on an untreated photograph.

---

## 6. Structural sweep, queued not scheduled

Found during task 3. Outside the brief. Do not start any of it without a new instruction.

- No skip link on any page. Keyboard users tab the whole nav on every page.
- `/chums/[slug]` has no landmarks. Zero `main`, zero `nav`, zero `footer`. Content sits outside any landmark.
- Breed page heading skip, h1 to h3 with no h2.
- Duplicate h1s on index pages. Four on `/dogs-at-work`, two on `/good-dog-bad-dog`, because desktop and mobile layouts both mount one in the DOM.
- `/britains-dog-history-2` exposes 542 focusable elements. The timeline puts every breed card in tab order.
- Interactive SVG likely mouse-only. BreedTree circles and timeline cards act on `onClick` with no focusable role. Flagged, not exhaustively driven. Mini pit is out of scope regardless.
- Focus indicator present, browser default, not globally suppressed. Custom controls not each verified.
- No positive tabindex anywhere. Landmarks otherwise correct on article pages.

---

## 7. Delivery loop

Per task:

1. Measure. Write the report.
2. Post the report. Wait for approval on anything visual.
3. Edit only the files the task names.
4. `npm run build`. It must pass.
5. Stage named files. Commit and push to `dogsatwork`. Plain history, no `Co-Authored-By` trailer.
6. Post the close-out: what changed, files touched, before and after numbers, what you did not do.

Steve merges to `main` by hand. Only manual step, and the only thing that deploys.

**Report format, every time.** Numbers, then the finding, then the cost. Not prose.

---

## 8. Standing instructions

- **Measure, report, change.** In that order.
- **Compute the existing value before adding to it.** "Add 20px" means 20 on top of what is there.
- **One owner per space.** A vertical gap belongs to one element, never both. Three rules stacking produced the 110px void around the text toggle.
- **Check for a stale server before reporting a bug.** Three "bugs" in two days were a stale dev server or edge cache. Restart the dev server after CSS module changes. Append `?v=2` to a live URL before reporting anything visual.
- **One command per bash call.** No chaining, loops or shell variables where avoidable.
- **Never `npx`.** It is denied. Use `./node_modules/.bin/`.
- **No em dashes**, in chat or in delivered files.
- **Do not propose capping, centring or framing the article layout.**

---

## 9. Setup, resolved 13 August

**The cause of the permission prompts.** `~/.claude/settings.json` carried an `ask` array. User-level and project-level rules combine rather than replace, so `ask` fired regardless of `bypassPermissions` in the project file.

**The fix.** The user-level file is now only the two `.env` denies plus `skipDangerousModePermissionPrompt`. Backup at `~/.claude/settings.json.backup`. All other rules come from the project file.

**Project file**, `~/pc/dogsatwork/.claude/settings.local.json`. `defaultMode: bypassPermissions`, no `allow` array. `git checkout` and `git restore` are removed from the deny list so the agent can revert its own uncommitted mistakes. `git reset` and `git clean` stay denied.

**Launch.** Settings load at startup only, from the directory the agent is launched in. Always `cd ~/pc/dogsatwork` first, confirm with `pwd`, then start.

**Playwright 1.62.1** installed as a dev dependency, committed at `37e05263`. Run as `./node_modules/.bin/playwright`. Never `npx`.

**Ignore the seven npm audit warnings.** Dev dependencies, build tooling, never reaches a visitor. Do not run `npm audit fix --force`.

**Scratchpad** is `.scratch`, in-tree and gitignored, so bare imports resolve from the repo's `node_modules`.

**What the deny list actually protects.** String matching on shell commands. It does not stop a Node or Python script calling `fs.rmSync`. The real protection is that the worktree is disposable and `dogsatwork` deploys nothing.

---

## 10. Settled, do not re-derive

**The site background**
- `linear-gradient(to top right, #00e2ff, #008eff)` with `background-attachment: fixed`. Darker at the top of the viewport, lighter at the bottom.
- Above it, `paw-pattern2.svg` at `opacity: 0.5`, containing a `#fff466` light yellow fill. That overlay, not the gradient, is what pushes the background bright enough to fail.
- Measured at the lightest point: black 6.31, navy 4.25, white 1.45.
- Recolouring the paws does not rescue light text. Dark paws lift white only to 3.33 and cost black its margin.
- The gradient is viewport-fixed, not page-anchored, so per-position colour rules cannot work.
- `/accessibility-test` is live, unlinked, noindex. Use it.

**The standard**
- WCAG 1.4.3 AA for the site. Body 4.5:1, large 3:1. Text over an image is measured against the lightest part behind it, never an average.
- Toolbar schemes target AAA, 7:1 and 4.5:1.
- WCAG 2.5.8 target size floor is 24px.

**Layout**
- Dogs at Work and Good Dog Bad Dog share `components/EssayShell/EssayShell.module.css` via `composes`.
- The layout is liquid. No `--essay-max`, no text-column cap, no paragraph cap. Logo, hero, headline, toggle and body all sit on the same 48px gutter.
- Sidebar is `clamp(380px, 30vw, 700px)`. The payslip overhangs it both sides, 10px clearance to the article text as the binding constraint.

**Per-article text toggle**
- Below the hero. Switches body paragraphs between the compliant black default and white as an opt-in.
- `sessionStorage`, keyed on pathname. Icon-only, navy half-disc, rotates 180 degrees, flipping `aria-label`.
- White measures 1.45:1 at worst. A deliberate, user-initiated non-compliant choice from a compliant default.
- Gated on `:root:not([data-pc-contrast-scheme])`. Use that attribute name.

---

## 11. Reference

**What was reported.** Same title on every page, and he supplied his own fix. Text over images hard to read, which is the substance. Browser zoom appeared blocked. The toolbar is his solution to the second, not a separate request.

**A. Page titles, done 12 Aug.** Seven route groups fell back to the generic title, including `/chums/[slug]`, so 54 breed pages shared one. Another 33 routes used three separators and three suffixes. Fixed with a title template in the root layout.

**B. Browser zoom, done 12 Aug.** Only pinch was blocked, by seven card rails whose non-passive `wheel` handlers called `preventDefault` without skipping ctrl-modified events, and twenty-six `touch-action` declarations missing the `pinch-zoom` token. Fixed across fourteen files. Tell the tester: he diagnosed the category correctly from outside the code, and the cause was a card rail on `/home` and `/about` that nobody thought of as a carousel.

**C. Text over images.** 935 body paragraphs recoloured to black at template level. 172 headings, panels and deliberate design elements left alone. The photograph half is measured and reported, not fixed, by decision 1.

**Not scoped.** Skip link, landmarks, heading order, duplicate h1s, focus visibility, form labels, `prefers-reduced-motion`, and the mini pit. Section 6 lists what task 3 found. Nothing fixes them. This project covers what one user reported. It is not AA conformance for the site.

**Delivery clones.** `~/pc/dogsatwork` is the agent's. `~/pc/preorder` is a separate worktree for unrelated work. `~/pedigree-chums-main` is the delivery clone on `main`, where no agent runs. Another agent works on lineage and pit features in the same repo; its uncommitted files appear constantly in the delivery clone. Stash them, never touch them, never resolve their conflicts.

**Merge sequence**, run by Steve, one line at a time:

```
cd ~/pedigree-chums-main
git stash push -m "wip" <files another agent has left modified>
git fetch origin
git merge origin/dogsatwork
npm run build && git push
git stash pop
```

Stash before the build, not just the merge. Merge `origin/dogsatwork`, not `dogsatwork`. Keep `git stash pop` last and on its own.
