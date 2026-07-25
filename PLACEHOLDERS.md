# Placeholders

Clearly named placeholder values still live in the Pick a Chum build. Each links
to the decision needed in `agent/NEEDS_STEVE.md`. Never treat a placeholder as
final copy.

| Placeholder | Location | Meaning | Resolve via |
|---|---|---|---|
| Robot-head launcher icon | (styled build, later) | Approved stand-in launcher mark; implement as a single easily swapped asset | NEEDS_STEVE item 6 (runbook rule 3) |
| `campaign.launchDate = null` | `app/pick-a-chum/data/campaign.ts` | Launch date not public yet; no copy may state a date | NEEDS_STEVE item 1 (OI04) |
| ART002 / ART003 / ART009 `resolvedUrl: null` | `route-map.json` | Planned articles not yet built | NEEDS_STEVE item 4 (OI06) |
| ART010 interim mapping | `route-map.json` | 'The Power of Smell' unbuilt; points at the teaching-medicine article for now | NEEDS_STEVE item 4 |
| Random-dog control treatment | (styled build, Checkpoint 2) | To be proposed for approval | NEEDS_STEVE item 5 |
| B19 / B20 bark-game lines | `generated/collie-responses.json` (B19-R01/02, B20-R01/02) + fallbacks in `assembler.ts` | The English break line and the post-break bark-acknowledgement family; routing and mirroring are live, copy is not | Steve writes the bark-break and bark-ack copy into the workbook Collie Responses sheet (B19 / B20), then regenerates |

## Resolved (no longer placeholders)

- Moderation wording and the safety signpost: APPROVED (`moderation.ts`).
- Revised B01 buying copy: APPROVED and written into the workbook's Collie
  Responses sheet, regenerated into `generated/collie-responses.json`.
- Contact action: `mailto:hello@Pedigree-Chums.co.uk` (DST013).
- Article mappings ART001, ART004, ART005: confirmed.
- Commercial model (prices, discount, delivery, pre-order action): confirmed
  (`campaign.ts`); only the launch DATE remains.
- Chatbot dog assets: the square card images at `/public/<slug>-square.jpg` are
  FINAL. The HUD and selector are built around the square format.
- Dog records for all 54 pack dogs: real, from the repo's own `data/*.ts`.
- B15 orientation copy: WRITTEN (copy deck v2), 12 lines across 4 families in the
  workbook Collie Responses sheet, regenerated. `ORIENTATION_PLACEHOLDER` in
  `assembler.ts` is now only a defensive fallback.
- FAQ003-006 and FAQ011-014 answers: WRITTEN (copy deck v2) into the workbook
  Canonical answer column. FAQ011 uses the render-time `{{competition_close_date}}`
  token, filled by the assembler to the last day of the current month, mirroring
  `app/chumspot/ChumSpotClient.tsx` exactly.
