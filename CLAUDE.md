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
selector with no local class. This passes `npx tsc --noEmit` silently, so it
is invisible until deploy. Always compound: `.localClass:global(.foo)`.
Before any commit that touches module CSS, run:

    grep -n ":global(\.[a-zA-Z-]*) *{" **/*.module.css

and confirm every hit is compounded.

## Verification

- `npx tsc --noEmit` must be clean before every commit.
- `npx next build` may fail locally if Google Fonts is unreachable; that
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
