# Accessibility, working brief (v4)

Site: pedigreechums.co.uk
Repo: `federationdesign-design/pedigree-chums`
Agent worktree: `~/pc/dogsatwork`, branch `dogsatwork`
Supersedes v3. Rewritten 13 August 2026.

Every open question is now answered. Sections 1 to 3 are how you work. Section 4 is what to build. Everything after is reference.

---

## 1. The job, and what done looks like

Make the site readable for a blind user at the Digital Accessibility Centre who reported three problems and has agreed to test before anything ships. Two are fixed. Two remain: text over photographs, and the accessibility toolbar he proposed.

**Done means all five of these are true.**

1. Every instance of text over a photograph has been measured and reported, and the failing cases carry a scrim band in the scheme layer that clears 4.5:1 body and 3:1 large text.
2. The toolbar ships with three schemes, hide images, and reset. Each scheme measures 7:1 body and 4.5:1 large across the page set in task 6.
3. The toolbar is fully keyboard operable, every control has an accessible name and a pressed state, and no control depends on colour alone.
4. Preferences persist across pages and sessions and apply before first paint, with no flash of the default.
5. The DAC tester has been sent a preview and has signed off. That gate is Steve's, not yours.

---

## 2. Autonomy

**Decide yourself, do not ask.**
- All measurement. Playwright scripts, headless renders, computed styles, pixel sampling, screenshots. Write to a scratchpad, delete after.
- Reading any file in the repo.
- Naming, file structure, test approach, script approach.
- Which routes have a hero header. Find them yourself, no list for approval.
- Committing and pushing to `dogsatwork`.

**Report, then wait.**
- Any visual change. Numbers first, then approval, then the edit. No exceptions.
- Any change outside the files a task names.
- A locked decision in section 3 that measurement proves wrong.

**STOP and hand back.**
- `git branch --show-current` is not `dogsatwork`.
- A change would require touching `~/pedigree-chums-main`, or another agent's uncommitted files.
- `npm run build` or `tsc` fails and the fix is not obvious in two attempts.
- You are choosing between two readings of this brief.
- A task exceeds its cost estimate by a factor of two.

A partial job with a clear report is a good outcome. A finished job built on a guess is not.

**The style rule, absolute.** Style decisions are Steve's. Colour, placement, weight, size, spacing, treatment. Do not propose options and do not offer alternatives. Measure, report the number, state pass or fail against the standard. The right shape is "the headline over the hero measures 2.1 to 1, needs 3:1", not "here are three ways to fix it."

**The method rule, absolute.** Where the standard specifies a method, do not offer alternatives to it. Lightest pixel, not average. Offering a softer measurement is the same error as offering a style option.

---

## 3. Locked decisions

Answered. Do not reopen. Override only with measurement, and report before you do.

**The default view**
1. **The default view does not change.** Not by one pixel. Photograph failures are measured and reported, not fixed in the default. The scrim lives in the scheme layer only.
2. **The 935-paragraph recolour stays** as shipped. It is the fix that works.

**Photographs**
3. **Scrim band is the treatment.** A band behind the text, photograph intact. Opacity is measured once against the lightest pixel on the lightest hero, set as one value, applied everywhere.
4. **The scrim hides when a scheme is active**, because the text has moved off the image and the band is then decoration.
5. **Re-shooting or replacing photographs is out of scope.** Where a passing scrim would bury the subject, the fallback is move the text off that hero, then re-crop. Nothing beyond that.

**The toolbar**
6. **Two boxes on the header axis**, same horizontal line as the menu icon. Three schemes in one box, hide images and reset in the other. Segmented, shared border, divider between cells.
7. **Icons only.** No text labels. Outline shows active, `aria-pressed` carries state, accessible name flips between hide images and show images. Glyph does not change on state.
8. **36px cells on phone, 44px from 721px up.** WCAG 2.5.8 floor is 24px, so both clear it. Glyph sits at roughly 45% of cell height.
9. **Three schemes:** default, black on white, white on black.
10. **Headings are white in white on black.**
11. **The header inverts with the scheme.** A navy and yellow bar above a corrected page is the one element still failing while claiming to be the high contrast mode.
12. **Inside a scheme, legibility decides.** Brand colours have no claim. Do not raise brand consistency as an objection to a measured value.
13. **Text moves off photographs in the high contrast schemes** and sits on the flat background.
14. **Hide images keeps the container at full size**, filled with a contrast colour and the alt text as visible text. No layout shift entering or leaving the mode.
15. **A scheme overrides the per-article text toggle and leaves its stored state untouched.** Reset restores whatever the toggle was set to.
16. **Alt text is audited and drafted before hide images is built.** In that mode the alt text is the page.
17. **The mini pit at `/britains-dog-history` is out of scope.** Do not start it, do not silently include it in a sweep.

**The article text toggle**
18. **Kept, alongside the toolbar.** Both exist, toolbar wins while a scheme is active.
19. **Extends to every route with a hero header.** Same position, directly below the hero. Find the routes yourself.
20. **Storage stays per page** in `sessionStorage`, keyed on pathname.

**Housekeeping**
21. **`/test` and `/test-deploy` are deleted.** No reference check needed.

---

## 4. The work

Cost is a percentage of total remaining delivery time.

### Task 1. Housekeeping. Cost 2%.
- Draft the note to the DAC tester: what the zoom problem turned out to be, and the live URL. Steve sends it.
- Delete `/test` and `/test-deploy`.
- Acceptance: routes gone, build clean, draft note in Steve's hands.

### Task 2. Alt text audit and drafts. Cost 12%.
- Every `<img>`, `next/image` and CSS-background-as-content across the editorial routes.
- Classify: meaningful and correct, meaningful but poor, decorative and correctly empty, decorative but wrongly described, missing.
- Draft replacement alt text for everything not in category one. Editorial routes get bespoke text, breed pages get a templated pattern.
- Acceptance: a table by route with counts, plus the drafts. Steve signs off in one pass.

### Task 3. Photograph contrast audit. Cost 15%.
- Every text-over-photograph instance. Article heroes first, then cards, then anything else the sweep finds.
- Measure against the lightest pixel inside the text bounding box, not an average, at three viewport widths.
- Run a keyboard, focus visibility, skip link, landmark and heading order sweep at the same time. Report only, fix nothing.
- Acceptance: a table of instance, page, measured ratio, pass or fail, plus the sweep findings as a separate list. Use `/accessibility-test` for background numbers rather than re-deriving them.

### Task 4. Scrim band. Cost 5%.
- One reusable component. Measure the opacity needed against the lightest hero, set one value, apply everywhere.
- Hidden when `data-pc-contrast-scheme` is set.
- Acceptance: before and after ratios for every failing instance from task 3, on a branch push Steve can look at. Then approval, then rollout.

### Task 5. Toolbar, stage 1, plumbing. Cost 15%.
- `data-pc-contrast-scheme` on `<html>`. Token-level palette swaps only, never parallel stylesheets.
- Persistence in `localStorage`, applied before first paint via an inline script in the root layout.
- **Build that script with string concatenation, not template literals. Backticks inside inline script template literals have broken this build more than once.**
- **First, check whether there is one shared header component.** Workstream A found seven route groups falling back to a generic title, so the routes may not be unified. If there are several headers, extract one before adding the toolbar. Report the finding before building.
- Acceptance: attribute sets and clears, survives reload and navigation, no flash of default, the per-article toggle defers automatically because it is already gated on `:root:not([data-pc-contrast-scheme])`.

### Task 6. Toolbar, stage 2, schemes. Cost 20%.
- Default, black on white, white on black. Headings white in white on black. Header inverts.
- Acceptance: 7:1 body and 4.5:1 large measured across home, about, one Dogs at Work article, one Good Dog Bad Dog article, one `/chums/[slug]`, and `/accessibility-test`.

### Task 7. Toolbar, stage 3, hide images. Cost 15%.
- Every image replaced by a contrast block at the container's existing size, carrying its alt text as visible text.
- The mode must be clearly labelled and easy to leave.
- Acceptance: no image survives, every block carries readable alt text at 7:1, no layout shift on enter or exit, reset returns everything in one action.

### Task 8. Toolbar, stage 4, controls. Cost 10%.
- Two boxes on the header axis. Reference model is the DAC's own site.
- Each scheme button is the letter A rendered in the scheme it applies. Active one outlined.
- Draw the crossed-photo and refresh glyphs to match the existing dock icon weight in `components/CardDock/CardDock.tsx`. Do not import a new icon library.
- Text size is not a control. Browser zoom handles it.
- Acceptance: keyboard operable, screen reader announces name and state, no state conveyed by colour alone, targets meet the sizes in decision 8.

---

## 5. Delivery loop

Per task:

1. Measure. Write the report.
2. Post the report. Wait for approval on anything visual.
3. Edit only the files the task names.
4. `npm run build`. It must pass.
5. Commit and push to `dogsatwork`. Plain history, no `Co-Authored-By` trailer.
6. Post the close-out: what changed, files touched, before and after numbers, what you did not do.

Steve merges to `main` by hand. Only manual step, and the only thing that deploys.

**Report format, every time.** Numbers, then the finding, then the cost. Not prose.

---

## 6. Standing instructions

- **Measure, report, change.** In that order.
- **Compute the existing value before adding to it.** "Add 20px" means 20 on top of what is there.
- **One owner per space.** A vertical gap belongs to one element, never both. Three rules stacking produced the 110px void around the text toggle.
- **Check for a stale server before reporting a bug.** Three "bugs" in two days were a stale dev server or edge cache. Restart the dev server after CSS module changes. Append `?v=2` to a live URL before reporting anything visual.
- **One command per bash call.** No chaining, loops or shell variables where avoidable.
- **Never `npx`.** It is denied. Use `./node_modules/.bin/`.
- **No em dashes**, in chat or in delivered files.
- **Do not propose capping, centring or framing the article layout.** Asked three times, settled three times.

---

## 7. Setup, resolved 13 August

Working. Do not re-derive.

**The cause of the permission prompts.** `~/.claude/settings.json` carried an `ask` array. User-level and project-level rules combine rather than replace, so `ask` fired regardless of `bypassPermissions` in the project file. Every `git push`, `rm`, `mv`, `git apply` and `npm install` prompted.

**The fix.** The user-level file is now this and nothing more:

```json
{
  "permissions": {
    "deny": [
      "Read(.env)",
      "Read(.env.*)"
    ]
  },
  "skipDangerousModePermissionPrompt": true
}
```

Backup at `~/.claude/settings.json.backup`. All other rules come from the project file, which is the one you can see.

**Project file**, `~/pc/dogsatwork/.claude/settings.local.json`. `defaultMode: bypassPermissions`, no `allow` array. Deny list as before with two changes: `git checkout` and `git restore` are **removed**, so the agent can revert its own uncommitted mistakes. `git reset` and `git clean` stay denied, so committed work and untracked files are protected. The worktree is the agent's own, so nothing precious is at risk.

**Launch.** Settings load at startup only, from the directory the agent is launched in. Always `cd ~/pc/dogsatwork` first, confirm with `pwd`, then start.

**Playwright 1.62.1 installed** as a dev dependency, committed at `37e05263`. Run it as `./node_modules/.bin/playwright`. Never `npx`, it is denied.

**Ignore the seven npm audit warnings.** Dev dependencies, build tooling, never reaches a visitor. Do not run `npm audit fix --force`; it upgrades across major versions and breaks working builds. Worth its own task some other time.

**What this actually protects.** The deny list is string matching on shell commands. It does not stop a Node or Python script calling `fs.rmSync` or `child_process`. The real protection is that the worktree is disposable and `dogsatwork` deploys nothing.

---

## 8. Settled, do not re-derive

**The site background**
- `linear-gradient(to top right, #00e2ff, #008eff)` with `background-attachment: fixed`. Darker at the top of the viewport, lighter at the bottom.
- Above it, `paw-pattern2.svg` at `opacity: 0.5`, containing a `#fff466` light yellow fill. That overlay, not the gradient, is what pushes the background bright enough to fail.
- Measured at the lightest point: black 6.31, navy 4.25, white 1.45. Only black clears 4.5:1 for body copy at both ends.
- Recolouring the paws does not rescue light text. Dark paws lift white only to 3.33 and cost black its margin.
- The gradient is viewport-fixed, not page-anchored, so per-position colour rules cannot work.
- `/accessibility-test` is live, unlinked, noindex. Seven text colours, two sizes, three points of the gradient, each with its measured ratio. Use it.

**The standard**
- WCAG 1.4.3 AA for the site. Body 4.5:1, large 3:1. Text over an image is measured against the lightest part behind it, never an average.
- Toolbar schemes target AAA, 7:1 and 4.5:1.
- WCAG 2.5.8 target size floor is 24px.

**Layout**
- Dogs at Work and Good Dog Bad Dog share `components/EssayShell/EssayShell.module.css` via `composes`.
- The layout is liquid. No `--essay-max`, no text-column cap, no paragraph cap. Logo, hero, headline, toggle and body all sit on the same 48px gutter.
- Sidebar is `clamp(380px, 30vw, 700px)`. The payslip overhangs it both sides, sized from available space, 10px clearance to the article text as the binding constraint.

**Per-article text toggle**
- Below the hero. Switches body paragraphs between the compliant black default and white as an opt-in.
- `sessionStorage`, keyed on pathname. Icon-only, navy half-disc, rotates 180 degrees, flipping `aria-label`.
- White measures 1.45:1 at worst. A deliberate, user-initiated non-compliant choice from a compliant default.
- Gated on `:root:not([data-pc-contrast-scheme])`. Use that attribute name. Do not invent a second one.

---

## 9. Reference

**What was reported.** Same title on every page, and he supplied his own fix. Text over images hard to read, which is the substance. Browser zoom appeared blocked. The toolbar is his solution to the second, not a separate request.

**A. Page titles, done 12 Aug.** Seven route groups fell back to the generic title, including `/chums/[slug]`, so 54 breed pages shared one. Another 33 routes used three separators and three suffixes. Fixed with a title template in the root layout.

**B. Browser zoom, done 12 Aug.** Two of three suspected causes disproved: viewport meta was Next's default, nothing intercepted Ctrl plus or minus, reflow already passed at 200% and 400%. Only pinch was blocked, by seven card rails whose non-passive `wheel` handlers called `preventDefault` without skipping ctrl-modified events, and twenty-six `touch-action` declarations missing the `pinch-zoom` token. Fixed across fourteen files. Tell the tester: he diagnosed the category correctly from outside the code, and the cause was a card rail on `/home` and `/about` that nobody thought of as a carousel.

**C. Text over images, background half done.** 935 body paragraphs recoloured to black at template level. 172 headings, panels and deliberate design elements left alone, all accounted for.

**Not scoped.** Keyboard focus visibility, skip link, heading order, landmarks, form labels, `prefers-reduced-motion`, and the mini pit. Task 3 reports on some of these; nothing fixes them. This project covers what one user reported. It is not AA conformance for the site.

**Delivery clones.** `~/pc/dogsatwork` is the agent's. `~/pedigree-chums-main` is the delivery clone on `main`, where no agent runs. Another agent works on lineage and pit features in the same repo; its uncommitted files appear constantly in the delivery clone. Stash them, never touch them, never resolve their conflicts.

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
