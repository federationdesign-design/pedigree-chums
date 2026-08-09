@AGENTS.md

# Pedigree Chums: house rules for Claude Code

These rules are absolute. They come from hard-won lessons on this project.
Read them at the start of every session and follow them without exception.

## Stack and style

- Next.js App Router, React 19, TypeScript. Deployed on Vercel from `main`.
- CSS Modules ONLY. Never Tailwind, never styled-components, never inline
  `<style>` blocks in new pages (existing injected mobile styles are legacy).
- Relative imports only. Never the `@/` alias.
- No em dashes anywhere: not in code comments, not in user-facing copy, not
  in markdown. Use commas, colons or parentheses instead.
- No dark backgrounds on any page: the global body gradient must show
  through.
- No text opacity and no `rgba` on text.
- Design tokens: `--blue-sky: #5cc4ee`, `--blue-deep: #0b78bd`,
  `--navy: #0a3a57`, `--yellow: #ffd23e`, `--cream: #fff8e6`.
  Fonts: Luckiest Guy (`--font-display`), Montserrat (`--font-body`),
  Open Sans (`--font-pct`).

## The Vercel build trap (critical)

CSS Modules will HARD-FAIL the Vercel build on any bare `:global(.foo)`
selector: one with no local class anywhere in it. This passes
`./node_modules/.bin/tsc --noEmit` silently, so it is invisible until deploy.
The fix is to give the selector a local class; it does NOT have to be
compounded.

Both of these are safe, because each carries a local class:

- `.localClass:global(.foo)` (compound) targets one element that has both
  the local class and `foo`.
- `.localClass :global(.foo)` (descendant, note the space) targets `foo`
  elements nested inside a `.localClass` element.

These are different selectors with different meanings. Never convert one
into the other to satisfy this rule: it changes what the CSS matches and
will break styling. Both forms build and deploy fine as they are.

Before any commit that touches module CSS, run:

    grep -n ":global(\.[a-zA-Z-]*) *{" **/*.module.css

and confirm no hit is bare. A hit is fine as long as a local class appears
somewhere in the same selector, whether compounded or as an ancestor. Only
a selector with no local class at all is the bug.

## Verification

- `./node_modules/.bin/tsc --noEmit` must be clean before every commit.
- `./node_modules/.bin/next build` may fail locally if Google Fonts is unreachable; that
  alone is not a code failure, but the `:global` audit above still applies.
- Visual work must be verified by running `npm run dev` and taking
  Playwright screenshots at 390px and 1280px, compared against the mockups
  in `agent/reference/`.

## Git discipline

- Work on the feature branch named in the runbook. Never commit directly
  to `main`.
- Commit incrementally with real messages describing what changed and why.
- Run `git show --stat` before any push: a small commit message with
  hundreds of deletions is a red flag, stop and investigate.
- Always `git add public/` when new images are involved or they 404 on
  Vercel.

## Pick a Chum specifics

- All classification and routing is deterministic local code. No external
  API calls, no live internet lookups, no LLM calls at runtime. Ever.
- All editable content lives in data records, not hard-coded strings in
  components.
- Do not wire anything into the global site layout (nav, root layout,
  floating launchers) until the runbook says the checkpoint allowing it has
  been approved by Steve.
- For any missing input listed in `agent/NEEDS_STEVE.md`, use a clearly
  named placeholder and log it in `PLACEHOLDERS.md` at the repo root.
  Never invent campaign values, prices, dates, moderation copy or asset
  paths.

## What's Your Superpower specifics

Current configuration is **MVP-4.3**: ten questions, result-contract schema 2.0.

Two commands prove the state of it:

    npm run build
    ./node_modules/.bin/tsx scripts/superpower-verify-contract.mts

The verifier enumerates all 1,024 answer arrays through the production engine
and checks the canonical hash, the six state counts, the golden results file
and the structural rules. If it passes, the game is correct. If it fails, read
the failure. Never adjust the expected hash or the expected counts to make it
pass.

Expected hash:
`ae249fcd7e5455a72c940604fa52525b261cf7cdcf03bc6ea007cbb9636c682a`

### Structural invariants

Not style preferences. Breaking any of these is a bug.

- Each of the five powers holds exactly 4 primary and 4 secondary opportunities
- Every question uses exactly 4 distinct powers, so no power scores on both answers
- Raw range 0 to 12 for every power
- Every answer array totals exactly 30 raw points
- A four-way tie is impossible with ten questions, so `TIE_FOUR` is asserted at 0
- Fixed power order is Focus, Vision, Zoom, Ideas, Energy. It governs chart axes,
  every list, placeholder substitution and the final tie-break

### Regenerating the config

`scripts/superpower-generate-config.mjs` is the way to rebuild the config from
the workbook. It reads `whats_your_superpower_question_bank_v4_3.xlsx` and
reproduces `config.mvp-4.3.json` byte for byte: it emits `sidekickRoles`, keys
`jointTitles` in fixed power order, derives every count (question count,
opportunities per power, raw range) from the workbook rather than a literal,
and writes no trailing newline to match the committed file.

Content is authored in the workbook, never retyped in code, so any wording
change goes back to the workbook and reruns the generator. After running it,
confirm the round trip: `git diff` on the config must be empty and
`./node_modules/.bin/tsx scripts/superpower-verify-contract.mts` must still pass against the
canonical hash.

It was previously broken: it produced the pre-sidekick config shape and had
silently overwritten the live config once, stripping `sidekickRoles` and
breaking the verifier while `npm run build` still passed. That is fixed.

### Two traps that have already cost time

**Joint title keys.** `engine.ts` builds `titleKey` for a two-way tie with
`[...leadingPowers].sort()`, which is alphabetical, but looks the config up with
`leadingPowers.join("+")`, which is fixed power order. Both are deliberate.
Config `jointTitles` keys must be in fixed power order: `Focus+Vision`,
`Focus+Zoom`, `Focus+Ideas`, `Focus+Energy`, `Vision+Zoom`, `Vision+Ideas`,
`Vision+Energy`, `Zoom+Ideas`, `Zoom+Energy`, `Ideas+Energy`.

**Question count.** Anything deriving a length from the question set must read
`config.questions.length`, never a literal. A hard-coded 15 in the verifier
handed the engine fifteen answers for a ten-question config.

### Known departure from the house rules

This page is built on a dark ground (`--sp-ground: #0b1220`), which contradicts
the no-dark-backgrounds rule above. It was requested directly by Steve on
6 August and is deliberate. Do not "fix" it. Whether it becomes a permanent
carve-out or the page returns to the body gradient is an open decision, so leave
it alone until this note says otherwise.

The night palette is scoped to the `.rail` element, so the global tokens are
untouched and no other page is affected.
