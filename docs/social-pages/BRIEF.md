# Overnight brief: per-era social pages

**Project:** Pedigree Chums
**Owner:** Steve James, Federation Design
**Written:** 12 August 2026
**Mode:** Unattended. Do not stop to ask questions. Every decision you need is below.

---

## 0. Amendments, 13 August 2026 (these override the sections below)

Steve is present today, so the two unattended-mode constraints are relaxed:

1. **Ask on genuinely ambiguous calls.** Section 5 said "make the call, record
   it, keep going." Today: if a call is genuinely ambiguous, ask Steve rather
   than deciding alone. Settled, low-risk judgement calls still go straight into
   the decisions file without interrupting.
2. **Propose history-page extraction, do not stop.** Section 2's limit said
   "stop before touching `/britains-dog-history`." Today: if a component needs
   extracting from the history page to avoid duplication, propose the extraction
   and wait for Steve's approval, rather than halting the job and leaving it for
   morning.

Everything else in the brief stands unchanged.

---

## 1. The job

Build six standalone pages, one per era, for sharing individual eras on social channels.

| Page | Contains |
|---|---|
| Ancient | Ancient era only |
| Medieval | Medieval era only |
| Tudor | Tudor era only |
| 1700s | 1700s era only |
| 1800s | **All three 1800s timelines, stacked vertically on one page** |
| 1900s | 1900s era only |

Each page shows, and nothing else:

- The era title
- Its blue container
- The horizontal slider beneath it

`/britains-dog-history` **is not modified**. This work is purely additive.

---

## 2. The hard constraint

**No duplication.** The strips, cards, pit and modal must be the same components the history page already uses, imported and reused.

If, after this work, a change to a card has to be made in two places, the job has been done wrong.

**But this rule has a limit, and the limit wins overnight.**

If a component is too entangled to extract without modifying `/britains-dog-history`, **stop before touching the history page.** Record it in the decisions file, build what you can around it, and leave the rest for morning review.

Breaking the main history page unattended is a worse outcome than an incomplete set of new pages.

*(See section 0: today, propose the extraction and wait for approval rather than stopping.)*

---

## 3. Investigate before you build

Answer these from the source. Do not estimate. Write the answers into the decisions file.

1. How does `/britains-dog-history` compose its eras today? One page rendering a list, or separate components per era?
2. Is the era strip already a reusable component taking era as a prop, or is the era baked in?
3. What does a strip need in order to render: data, images, handlers, context from a parent?
4. Does clicking a card open the pit through a modal that expects to sit inside the history page, or is it self-contained?
5. Where does era data live, and is it keyed in a way that supports selecting a single era?
6. The three 1800s timelines: what distinguishes them, what are they called, and how are they ordered today?

---

## 4. Decisions already made. Do not re-open these.

**Route shape.** Use `/britains-dog-history/[era]` with slugs: `ancient`, `medieval`, `tudor`, `1700s`, `1800s`, `1900s`. If the existing routing makes a nested dynamic route impossible, use `/dog-history/[era]` instead and record why.

**Dynamic route or six files.** Prefer a single dynamic route if the strip is already parameterised by era. Six thin pages only if routing a parameter proves genuinely harder. Record which you chose and why.

**Metadata.** Each page gets a title and description derived from the era name and its existing intro copy. No new copywriting. If no intro copy exists for an era, use the era title alone.

**Navigation.** These pages are unlisted. Do not add them to any nav, menu, or sitemap link. They are share-only for now.

**Back link.** Each page carries one link back to `/britains-dog-history`. Style it to match existing links on the site.

**Mobile and desktop.** Match whatever the history page already does at each breakpoint. Do not invent new responsive behaviour.

**1800s ordering.** Stack the three timelines in the same order they appear on the history page today.

**Scope creep.** Add nothing not listed in section 1. No hero images, no share buttons, no analytics, no og:image work.

---

## 5. When you hit something ambiguous

Make the call, record it, keep going. Do not stop and wait.

*(Amended 13 August 2026, section 0: genuinely ambiguous calls come to Steve. Settled calls still go into the decisions file.)*

Record every judgement call in:

```
docs/social-pages/DECISIONS.md
```

For each one: what the choice was, the options, what you picked, and why. This file is the morning review, so it should read as a single pass rather than a log.

The only thing that stops you is section 2's limit: a change that would modify `/britains-dog-history`.

---

## 6. Delivery

**Do not commit. Do not push.** Prepare the work and leave it in the tree.

Because staged work in this repo has been wiped twice by syncs and merges, also write a backup patch:

```
git diff > .scratch/social-pages-overnight.patch
```

`.scratch` is gitignored. Note the path in the decisions file so it can be reapplied if the tree is lost.

Leave a clear summary at the end of the session covering: what was built, what is in the tree, what was skipped and why, and anything waiting on a human.

---

## 7. Working rules

**Workspace**

- All work in `~/pedigree-chums-main` only
- `~/pedigree-chums` and `~/pedigree-chums-hg` are off limits. Never touched, never referenced in any command
- Command blocks handed to Steve start with `cd ~/pedigree-chums-main && pwd`
- Read-only commands you run yourself: send them bare, no `cd` prefix, no `&&` chaining

**Git**

- Never `git add`, `git commit` or `git push`. These are denied in permissions
- A second agent pushes to `main` continuously. `git fetch origin` before any patch check
- Never `git add -A`

**Verification**

- `./node_modules/.bin/tsc --noEmit`, never `npx tsc`
- Check the eslint baseline before and after any change to a shared file. `BreedTree.tsx` baseline is 53 errors, 7 warnings
- If tsc reports a stale `.next/types` error, note it. Do not attempt to delete `.next`, `rm` is gated
- No `:global` in CSS modules

**Conduct**

- No background agents, no fork agents. Sweeps done inline
- Read the real source before proposing anything
- Add nothing not explicitly asked for
- When three reasoning-based attempts fail, build a diagnostic readout rather than a fourth fix
- Never ship a `console.log`. If you add one to diagnose, fence it with `REMOVE BEFORE COMMIT` banners and remove it before the session ends
- Delete any probe or harness scripts immediately after use

**Comments**

- If you supersede an existing decision recorded in a code comment, rewrite the comment to record the reversal and the date. Do not delete it. A future agent must not restore the old behaviour thinking the change is a regression

---

## 8. Design tokens

```
--blue-sky   #5cc4ee
--blue-deep  #0b78bd
--navy       #0a3a57
--yellow     #ffd23e
--cream      #fff8e6
```

Fonts: Luckiest Guy (`--font-display`), Montserrat (`--font-body`)

**Known trap:** Luckiest Guy sits high in its em box. Its visible letters are about 0.6 of the em, so a `line-height` of 0.9 reads as roughly 1.5 against the ink. If matching existing type, copy the existing value rather than reasoning about what it should be.

*(Note: CLAUDE.md records `--cream` as `#ffffff` on the Dogs at Work line as of 10 August 2026. This brief's `#fff8e6` is superseded by that token change wherever `var(--cream)` is consumed. Match the live token, not this literal.)*

---

## 9. Communication style for the morning summary

- Concise bulleted lists, ordered by priority, risk or cost
- No prose walls
- No em dashes
- Optional insights carry a cost estimate as a percentage of total delivery time

---

## 10. Key identifiers

- Repo: `github.com/federationdesign-design/pedigree-chums`, branch `main`
- Vercel project: `prj_Lg9QmI6rh3MSyIb3Yj5BV57fY9xj`
- Vercel team: `team_JFwmQlCm3J4w0dGzBxfCIYmR`
