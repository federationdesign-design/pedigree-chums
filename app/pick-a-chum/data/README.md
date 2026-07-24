# Pick a Chum data pack

This folder is the data layer for the Pick a Chum feature. Nothing here is
hard-coded copy in components: all editable content lives in records.

## Where each thing comes from

There are three kinds of file here, with three different owners.

### 1. `generated/` (owner: the workbook, do not hand-edit)

Rebuilt by `npm run build:chumdata` from `agent/data/workbook.xlsx`. That
spreadsheet is Steve's permanent editing surface for the life of the feature.
Edit the spreadsheet, run the script, commit, push, deploy. Anything you type
into a file under `generated/` by hand is overwritten on the next run, so ALL
content changes go through the workbook.

One JSON file per workbook sheet, plus `manifest.json` (record counts and the
workbook version the pack was built from). Current sheets: priority-stack,
buckets, character-profiles, first-interaction-matrix, collie-responses,
destinations, gk-plan, general-knowledge, collie-knowledge, transfers,
mini-games, session-logic, analytics-events, copy-components, faq, articles,
research-sources, risks, decisions, animation-states, open-inputs, change-log,
lists.

### 2. `route-map.json` (owner: the repo, hand-maintained)

The workbook's Destinations and Article Library sheets carry
`[URL to be supplied]` placeholders. `route-map.json` resolves each
`DST###` / `ART###` id to a real route in `app/`. The build merges it in as
`resolvedUrl` on each destination and article.

Precedence: if a real URL is typed into the workbook's URL column it wins;
otherwise the route-map value is used. So Steve can override a route from the
spreadsheet later without touching code. Destinations marked `embedded` (the
in-chat mini-games) have no URL by design.

### 3. Hand-authored TypeScript (owner: the repo)

- `dogs.generated.json` plus `dogs.ts`: the 54 pack dogs, extracted from the
  site's own `data/*.ts` by the build (see below). Reshaped into the
  brief-mvp Appendix A dog-record schema.
- `moderation.ts`: approved safety wording (brief section 16), including the
  locked SAFETY_SIGNPOST.
- `campaign.ts`, `rules.ts`, `discount-popup.ts`: confirmed campaign config,
  the six-stage rules content record, and the OfferModal open helper.
- `route-map.json`: described above.

## The dog records

The 54 pack dogs are not in the workbook: it references "the existing Pedigree
Chums database". The build imports the live `data/*.ts` modules directly (Node
type-stripping) so the dog records never drift from the site, then reshapes them
into the dog-record schema. This means dog data still has a single source (the
existing `data/` files), edited the same way it always was.

## Rebuilding

```
npm run build:chumdata          # rebuild all generated records
node scripts/build-chumdata.mjs --check   # parse and validate only, write nothing
```

The script is loud on purpose: any row it cannot parse is reported, and a
missing or unreadable required sheet fails the run so a broken workbook never
deploys silently.
