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
| Labrador / Terrier / Boxer bark presentations + B19/B20 lines | `assembler.ts` (`BARK_PRESENTATION` wires the Collie only) + parked deck rows | The non-Collie bark words and English break/ack lines are PARKED with the Phase 3 voice package; the per-dog state machine runs but their responses render a parked marker | Phase 3 per-dog build wires the presentations and merges the LAB/TER/BOX B19/B20 lines |
| `BREED-<slug>` per-breed page lines | `assembler.ts` (`BREED_FACTS`, `case 'breed_page'`) | Shared factual one-liner (no dog voice) shown when a named breed resolves to its page. ALL TEN now filled but DRAFT-UNVERIFIED, NOT approved: the historical claims still need checking against the breed pages and a Kennel Club source before this branch merges | Steve verifies all ten (breed pages + a Kennel Club source); the per-breed character-handoff line that follows each factual answer is a separate item |
| `BREED-CHOICE` framing | `assembler.ts` (`case 'breed_choice'`) | The line that offers two breeds when an ambiguous word (e.g. "terrier") is within the confidence gap. Currently `[PLACEHOLDER breed choice framing] A or B?` | Steve supplies the choice framing sentence |
| Breed hub answer | `router.ts` (`BREED_HUB` -> `fallback`) | "tell me about dog breeds" / "best dog breed" has no specific breed; routed to the approved fallback for now, NOT a placeholder line | Steve supplies a proper narrowing/hub line, then wire a dedicated action |
| LOOP-01..04 / ORIENT copy | `engine.ts` (`LOOP_03_VARIANTS`, `LOOP_04_VARIANTS`, `ORIENT_LINE`) | Task 58 dog-led loop copy, approved by Steve, held as engine constants (like the repair ladder) rather than in the workbook. Migrate into the workbook per PD-01 with the other loop copy | Steve confirms the workbook bucket, then migrate |
| LOOP-02 route offer | `engine.ts` (`LOOP_02_ROUTE_OFFER = 'the game or a dog?'`) | The `[ROUTE A] or [ROUTE B]?` fill is my best-effort using ORIENT's two departments; the exact copy, and whether it should adapt to the candidate's specific route ("close to a supported route"), is unspecified. It also overlaps ORIENT's wording | Steve supplies the LOOP-02 route-offer copy and the adapt-to-candidate rule |
| Grief detection trigger lists | `safety.ts` (`GRIEF_DIED`/`GRIEF_LOST`/`GRIEF_WORRIED`/`GRIEF_CONTINUE`/`GRIEF_EXCLUDE`) | Task 58 grief COPY (`:(`) is approved; the DETECTION wording is best-effort, authored to cover the three scenarios and the required assertions, conservative to avoid false positives. As a safety route it should be reviewed/extended by Steve like the other safety trigger lists | Steve reviews and extends the grief triggers |

## Resolved (no longer placeholders)

- Per-breed aliases: WIRED from Steve's list into `router.ts`
  `BREED_PAGES[].aliases` (labrador: lab/labs/lab retriever/labrador retriever;
  border collie: collie/collies; cocker spaniel: cocker/cockers; french bulldog:
  frenchie/frenchies/frenchy/french bull dog/french bulldogs; german shepherd:
  gsd/alsatian/alsation/german shepard/german shepperd; staffie:
  staffie/staffy/staffies/staffordshire/staffie bull terrier/sbt). Boxer, beagle,
  pug and border terrier carry no aliases. Excluded per Steve: `staff` (employees),
  `sheepdog` (a separate breed), and bare `shepherd` / `spaniel`, which route to
  the confidence gap as a choice (`AMBIGUOUS_FAMILY`), never a guess.
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
- Collie bark-game copy: WRITTEN (completed bark-game deck). Three COL-B19 break
  lines and three COL-B20 post-break lines wired into the workbook (B19 / B20),
  replacing the interim placeholders.
- FAQ003-006 and FAQ011-014 answers: WRITTEN (copy deck v2) into the workbook
  Canonical answer column. FAQ011 uses the render-time `{{competition_close_date}}`
  token, filled by the assembler to the last day of the current month, mirroring
  `app/chumspot/ChumSpotClient.tsx` exactly.
