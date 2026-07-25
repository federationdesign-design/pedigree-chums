# Migration runbook: split dev tooling into a companion private repo (chum-lab)

Status: REVIEW DOCUMENT. Nothing here has been executed. Do not run any step
until Steve approves. Written 2026-07-25.

## Goal and invariant

End the manual "strip" at every merge. Today the `pick-a-chum` branch tracks
both shippable app code and non-shippable lab material (workbook, briefs,
placeholders, dev/QA scripts, backups), and because a merge carries whatever the
branch tracks, every merge to `main` re-derives "ships only" by hand.

The fix is physical separation. After this migration the branch that merges to
`main` tracks ONLY shippable paths, so:

    git checkout main && git merge pick-a-chum && git push

is the whole merge. No `--no-commit`, no re-checkout, no `git rm`.

**Invariant to enforce:** a `main`-bound change may only touch `app/`,
`components/`, `public/`, and root config files. Everything else is lab material
and lives in the companion repo.

## Decisions locked (from Steve)

1. Companion **private, versioned** repo. Not a git-ignored directory. The
   workbook is the single content source and must stay version-controlled.
2. **No history rewrite** of `pedigree-chums`. Removal is going-forward only.
3. `pedigree-chums` **is now PRIVATE** (made private 2026-07-25). Because the
   repo is private, the lab material that remains in history after Phase 3 is no
   longer publicly exposed, so the no-rewrite decision carries no exposure cost.
4. Ship boundary is `app/pick-a-chum/data/generated/*.json`. The generated JSON
   is imported by the app, so it stays in the app repo and is committed there.

## Target layout

Two sibling checkouts:

    ~/pedigree-chums/                 (public app repo, unchanged deploys)
      app/pick-a-chum/
        lib/ ui/ data/generated/*.json   <- generated JSON SHIPS, committed here
      components/ public/ ...
    ~/chum-lab/                       (NEW private repo, never deployed/merged)
      data/workbook.xlsx              single content source
      content/                        copy decks, briefs, phrase libraries (.xlsx/.docx)
      docs/                           AGENT_RUNBOOK, NEEDS_STEVE, SAFETY_BACKLOG,
                                      PHASE briefs, reviewer feedback, PLACEHOLDERS,
                                      this runbook, master-intent-corpus-plan
      screens/                        checkpoint screenshots
      scripts/                        build-chumdata, test-pickachum,
                                      verify-theatre-v3, shoot-pickachum,
                                      verify-global-launcher, and the recorder's
                                      replay/export scripts
      package.json                    its own deps (xlsx/SheetJS, tsx, playwright)

## What moves vs what stays

MOVES to chum-lab (the recurring strip set):
- `agent/` in full (workbook, briefs, decks, docs, screens, NEEDS_STEVE,
  SAFETY_BACKLOG, this runbook)
- `PLACEHOLDERS.md`
- dev scripts: `scripts/build-chumdata.mjs`, `scripts/test-pickachum.mjs`,
  `scripts/verify-theatre-v3.mjs`, `scripts/shoot-pickachum.mjs`,
  `scripts/verify-global-launcher.mjs`
- `_backups/` (delete outright, it is cruft: old `page.tsx` snapshots and a
  stale `index.lock`)

STAYS in pedigree-chums (ships):
- `app/pick-a-chum/**` including `data/generated/*.json`
- generic build scripts that are not pick-a-chum lab tooling (e.g.
  `scripts/optimize-images.mjs`) stay unless Steve says otherwise

## Phases (each ends with a verification gate)

### Phase 0. Snapshot (reversible safety net)
- `git tag pre-chumlab-migration pick-a-chum` and push the tag. If anything goes
  wrong, this is the known-good point.
- Confirm the working tree is clean.

### Phase 1. Create the private repo (history preserved by default)
Recommended: **snapshot start.** Simple and safe.
- Create the private repo on GitHub: `<CHUM_LAB_REMOTE_URL>` (PLACEHOLDER, Steve
  to create). Confirm the Vercel GitHub App does NOT have it (it must never
  deploy).
- `mkdir ~/chum-lab && cd ~/chum-lab && git init`.
- Copy the MOVES set into the layout above (workbook to `data/`, decks/briefs to
  `content/`, docs to `docs/`, screens to `screens/`, scripts to `scripts/`).
- Add a `package.json` with only the lab deps (SheetJS `xlsx`, `tsx`, and
  `playwright` for the QA scripts), plus `build:chumdata` and `test:pickachum`.
- Commit and push.
- Past workbook versions remain retrievable from `pedigree-chums` history (not
  rewritten), so nothing is lost.

Optional (only if Steve wants full workbook history INSIDE chum-lab from day
one): use `git filter-repo`/`git subtree split -P agent` to export the `agent/`
history to a branch and seed chum-lab from it. Heavier; combining multiple source
paths is fiddly. Not recommended unless the in-repo history matters more than
simplicity. This does not touch `pedigree-chums` history either way.

Gate: chum-lab clones cleanly on a fresh checkout; it is private; Vercel has no
access to it.

### Phase 2. Repoint the tooling (in chum-lab)
- `build:chumdata`: reads `data/workbook.xlsx` (was `agent/data/workbook.xlsx`)
  and WRITES to the app repo. Introduce one path constant, default to the sibling
  checkout, overridable by env:

      const APP_REPO = process.env.APP_REPO_DIR ?? join(ROOT, '..', 'pedigree-chums');
      const OUT_DIR  = join(APP_REPO, 'app/pick-a-chum/data/generated');

  Update the `generatedFrom` provenance string to the new workbook path.
- Harness/QA scripts (`test-pickachum`, `verify-theatre-v3`, `shoot-*`,
  `verify-global-launcher`): repoint their imports/URLs from repo-relative to the
  sibling app repo, e.g. `../pedigree-chums/app/pick-a-chum/lib/...`. Add one
  `APP_REPO` constant at the top of each rather than scattering `../pedigree-chums`.
- `npm install` in chum-lab.

Gate: from chum-lab, `npm run build:chumdata` regenerates the JSON into the app
repo and `git -C ~/pedigree-chums diff --stat app/pick-a-chum/data/generated`
shows NO change (byte-identical output). `npm run test:pickachum` is green
(expected count at time of migration; 194 as of this writing).

### Phase 3. Remove lab material from pedigree-chums (going forward only)
On the `pick-a-chum` branch:
- `git rm -r --cached agent PLACEHOLDERS.md scripts/build-chumdata.mjs \
   scripts/test-pickachum.mjs scripts/verify-theatre-v3.mjs \
   scripts/shoot-pickachum.mjs scripts/verify-global-launcher.mjs`
- `git rm -r _backups` (delete the cruft entirely)
- Add to `.gitignore`: `agent/`, `PLACEHOLDERS.md`, `_backups/`, and the moved
  script names (so they cannot be re-added by accident).
- Move the `build:chumdata` and `test:pickachum` entries OUT of
  `pedigree-chums/package.json` (they now live in chum-lab).
- Commit: "pick-a-chum: move lab tooling to the chum-lab repo; app branch now
  ships only app/". Push.

NOTE (no rewrite): this removes the files going forward. Their historical copies
remain in past commits, but the repo is now private, so they are not exposed.
That is the accepted trade per Decision 2 and 3.

Gate: `git ls-files` on `pick-a-chum` shows no `agent/`, `_backups/`,
`PLACEHOLDERS.md`, or moved scripts. `npx tsc --noEmit` clean. The app builds.

### Phase 4. Enforce the invariant (so the strip can never silently return)
Add a `main`-bound scope guard. Preferred: a GitHub Actions check on pushes/PRs
to `main` that fails if the diff touches anything outside the allowlist
(`app/`, `components/`, `public/`, root config files). Belt-and-braces, and it
runs for everyone regardless of local hooks.

Optionally also a local `pre-push` hook (now that hooks are wanted, per the
standing correction): reject a push to `main` whose diff includes a disallowed
path. The CI check is the real gate; the hook is a fast local warning.

Gate: a deliberate test commit that adds a dummy `agent/x.md` to a `main`-bound
branch fails the check; a pure `app/pick-a-chum` change passes.

### Phase 5. Prove the no-strip merge
- Make a trivial `app/pick-a-chum` change on `pick-a-chum`, commit.
- `git checkout main && git merge pick-a-chum` with NO strip steps.
- Confirm `git diff --name-only HEAD^1 HEAD` shows only `app/pick-a-chum`.
- Push; confirm the production deploy goes READY as usual.

Gate: a clean merge with zero manual stripping, production serves it.

## Rollback
Nothing here rewrites history, so rollback is ordinary:
- Phase 3 removal: `git revert` the removal commit (files come back from the
  same repo since history is intact), or reset the branch to
  `pre-chumlab-migration`.
- chum-lab is additive; deleting it changes nothing in pedigree-chums.

## SECURITY note (carried from the history scan, 2026-07-25)
A full-history scan (2,519 commits, all refs; 4,033 text blobs) found NO
committed secrets: no `.env`, keys, tokens, or passwords, matching the app's
no-runtime-secrets design. The repo was made private on 2026-07-25, which both
adds defence-in-depth and covers the lab material remaining in history after
Phase 3 (no rewrite needed).

## Open placeholders (Steve to supply; do not invent)
- `<CHUM_LAB_REMOTE_URL>`: the private GitHub repo for chum-lab.
- Confirm the sibling checkout convention (`~/chum-lab` beside `~/pedigree-chums`)
  or an alternative path for `APP_REPO_DIR`.
- Confirm whether any non-pick-a-chum `scripts/*` (e.g. `optimize-images.mjs`)
  should also move or stay.
