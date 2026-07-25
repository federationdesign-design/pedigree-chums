# Strip list: what must NOT reach production

The `main` branch (production) must contain only shippable app code. Everything
in this list is dev/lab tooling that lives on the `pick-a-chum` branch and must
be stripped at every merge to `main`, until the chum-lab migration
(`agent/MIGRATION_RUNBOOK_chum-lab.md`) makes the separation physical and this
manual step goes away.

## Always stripped
- `agent/` (entire directory: workbook, briefs, decks, docs, screenshots, this
  file, the migration runbook, SAFETY_BACKLOG, NEEDS_STEVE)
- `PLACEHOLDERS.md`
- `_backups/`
- Dev/QA scripts: `scripts/test-pickachum.mjs`, `scripts/verify-theatre-v3.mjs`,
  `scripts/shoot-pickachum.mjs`, `scripts/verify-global-launcher.mjs`,
  `scripts/build-chumdata.mjs`, `scripts/replay-pickachum.mjs`

## Conversation recorder (dev tooling, preview only)
The recorder captures test turns to IndexedDB on Vercel previews and is inert on
production hosts by runtime guard (`recorderEnabled()` in
`app/pick-a-chum/lib/turn-tap.ts`). It is ALSO stripped from `main` as
defence-in-depth. To strip it:

1. Delete `app/pick-a-chum/dev/` (recorder-store, DevRecorder, its CSS).
2. In `app/pick-a-chum/ui/PickAChumLauncher.tsx` remove the two lines marked
   `DEV-RECORDER (strip for production)`: the `import DevRecorder` line and the
   `<DevRecorder />` render.
3. Delete `scripts/replay-pickachum.mjs`.
4. Remove the `replay:pickachum` entry from `package.json`.

STAYS on production (do NOT strip, it is neutral and inert):
- `app/pick-a-chum/lib/turn-tap.ts` (the tap has no sink in production, so
  `emitTurn` is a no-op)
- the `emitTurn(...)` call in `app/pick-a-chum/ui/PickAChumExperience.tsx`

After stripping, `git diff --cached origin/main` must show only `app/pick-a-chum`
paths (minus the deleted `dev/`), and `npx tsc --noEmit` must be clean.

## Note
Once chum-lab lands, the lab material and dev scripts move to the private repo and
a CI scope guard enforces the app-only invariant, so this list shrinks to just the
in-app recorder toggle (which the runtime guard already covers).
