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
| `BREED-<slug>` per-breed page lines (10 proof breeds) | `assembler.ts` (`BREED_FACTS`, `case 'breed_page'`) | Shared factual one-liner for the ten proof breeds: DRAFT-UNVERIFIED, NOT approved, claims still need checking against a Kennel Club source. Task 142: the OTHER 44 pack breeds now use their real description from the dog database (no placeholder). | Steve verifies the ten proof one-liners (breed pages + a Kennel Club source) |
| Breed hub answer | `router.ts` (`BREED_HUB` -> `fallback`) | "tell me about dog breeds" / "best dog breed" has no specific breed; routed to the approved fallback for now, NOT a placeholder line | Steve supplies a proper narrowing/hub line, then wire a dedicated action |
| LOOP-01..04 / ORIENT copy | `engine.ts` (`LOOP_03_VARIANTS`, `LOOP_04_VARIANTS`, `ORIENT_LINE`) | Task 58 dog-led loop copy, approved by Steve, held as engine constants (like the repair ladder) rather than in the workbook. Migrate into the workbook per PD-01 with the other loop copy | Steve confirms the workbook bucket, then migrate |
| LOOP-02 route offer | `engine.ts` (`LOOP_02_ROUTE_OFFER = 'the game or a dog?'`) | The `[ROUTE A] or [ROUTE B]?` fill is my best-effort using ORIENT's two departments; the exact copy, and whether it should adapt to the candidate's specific route ("close to a supported route"), is unspecified. It also overlaps ORIENT's wording | Steve supplies the LOOP-02 route-offer copy and the adapt-to-candidate rule |
| Grief detection trigger lists | `safety.ts` (`GRIEF_DIED`/`GRIEF_LOST`/`GRIEF_WORRIED`/`GRIEF_CONTINUE`/`GRIEF_EXCLUDE`) | Task 58 grief COPY (`:(`) is approved; the DETECTION wording is best-effort, authored to cover the three scenarios and the required assertions, conservative to avoid false positives. As a safety route it should be reviewed/extended by Steve like the other safety trigger lists | Steve reviews and extends the grief triggers |

## Task 140/141 media clips (all five wired)

All five clips in `public/chat-media/` are wired. The clip is ADDED to its
response, never replacing the copy. Task 141 moved car and balls into the
workbook (B64 / B52-MISC-09), so their clips now attach by responseId in the
assembler's `CANNED_MEDIA` map, like cats. Only **birthday** remains a code
constant (`MEDIA_REPLIES['BIRTHDAY-01']`), because it still has no workbook row.

| Clip | Trigger | Response (unchanged copy) + clip | Where |
|---|---|---|---|
| `cats.mp4` | `cats`/`cat` | `B21-CATS-01` "Where?" | `CANNED_MEDIA` |
| `hotdog.mp4` | `hot dogs`/`hot dog` | `FAQ007` answer (unchanged) | `case 'faq_answer'` (FAQ007 only) |
| `car.mp4` | "do you like going in the car" | `COL-B64-CAR-01` "yes" | `CANNED_MEDIA` |
| `ball.mp4` | "can you lick your balls" / "balls" / "tennis balls" | `COL-B52-MISC-09` "Tennis balls?" | `CANNED_MEDIA` |
| `birthday.mp4` | any birthday mention | ":)" (the existing smile face) | `MEDIA_REPLIES['BIRTHDAY-01']` |

Only birthday is left to migrate: move it into the workbook as its own row, then
attach the clip via `CANNED_MEDIA` and retire the constant. No clip surfaces
inside a protected state (the hotdog clip is suppressed when
`session.protectedState` is set; the others are held/refused by the S12 machine).

## Task 140 page bios, route 2 (not implemented)

`page-bios.ts` was briefed to serve three routes. Routes 1 ("what is this page")
and 3 (fetch fall-through to bios) are built. Route 2 ("where do I find X" -> the
bio plus that page's link) is NOT built: how the bio composes with the existing
navigation answer (replace the B03 nav copy? append to it? only for the ~10 bio
pages that have no destination record?) is unspecified, and any of those changes
the served text of existing nav answers broadly. Left for a composition decision.

## Task 142 conversational copy held as code constants

Owner-approved copy from Task 142, held in code (the goodbye / out-of-scope
pattern), flagged for later workbook migration:

| What | Where | Copy |
|---|---|---|
| Name acknowledgement (2 lines, alternating) | `assembler.ts` `case 'name_ack'` | "Do you want to play a game, {name}?" / "Do you want to see if you have super powers, {name}?" (2nd links `/whats-your-superpower`). The name is used once and never stored. |
| Naming-her deflection (2 lines, alternating) | `assembler.ts` `case 'name_deflect'` | "I answer to anything." / "Call me what you like." |
| How-are-you clips | `assembler.ts` `case 'how_are_you'` | `howareyou1/2/3.mp4`, one picked per session and kept |
| Good-boy clip | `assembler.ts` `case 'good_boy'` | `goodboy.mp4` |
| Dog-lifespan answer | `assembler.ts` `case 'dog_lifespan'` | "About 10 to 13 years. Small dogs longer, big dogs less." + the breed explorer link |
| Death-cluster answer | `assembler.ts` `case 'death_answer'` | "I cannot die as im not alive in the same way as real dogs" (persistence escalates to safeguarding) |
| Diversions (8 destination offers) | `engine.ts` `DIVERSIONS` | Ancient/Medieval/Tudor/London dogs, jobs, chum finder, name generator, the whole pack. One offered on the third consecutive no-subject turn, then back to "im a dog". Replaces the retired B46 single-word rotation (those B46 rows are now orphaned in the workbook). |

Decisions taken (Steve, 6-7 August): the how-are-you clip catches only the
personal questions that were broken (`are you real` keeps identity; `what do you
do` keeps B27). `Oh wowe` / `wowee` are reactions, routed to the existing B29
":)" acknowledgement, not a clip. A referral question ("refer my friends") points
at the offer (no referral scheme exists). The rules answer no longer promises
"the full rules are here" (no rules page exists; B02-R01 edited in the workbook).
The turn-20 hidden-ceiling cutoff is unchanged; the chat now closes cleanly on it
(a closed session is never persisted or restored, so reopening starts fresh).

The four new `public/chat-media/*.mp4` (howareyou1/2/3, goodboy) are untracked;
`git add public/` before any commit or they 404 on Vercel.

## Ancient playable levels (4 August)

Six circle images do not exist yet. All six nodes point at the shared
stand-in `/history/breeds/placeholder-circle.svg` (a cream "IMAGE COMING
SOON" disc) until Steve supplies the artwork (same process as the eight
Batch images). Swap each node's `img` in `data/lineage.ts` to its real
asset, then delete the SVG.

| Node awaiting artwork | Level |
|---|---|
| Dogs of the Alan horsemen (nested) | Ancient Mastiff |
| Old desert coursing dogs (nested) | Celtic Coursing Hound |
| Segusian tracking hounds (big circle) | Celtic Scent Hound |
| Old trail dogs of the ancient East (nested) | Celtic Scent Hound |
| Celtic herdsmen's dogs (big circle) | Livestock Dog |
| Roman shepherd dogs (big circle) | Livestock Dog |

## Medieval dogs made playable (10 August): two wrong-artwork reuses

The three medieval cards (Shepherd's Dog, Drover's Dog, Earth Dog) were given
children in `data/lineage.ts` so they can be played. To make the trails work
without new artwork, two ancestor nodes reuse an existing image that belongs to
a different dog. The trails are correct; only the pictures are wrong. Both need
new artwork, then swap each node's `img` in `data/lineage.ts`.

| Node | Wrong image in use | Belongs to | Where |
|---|---|---|---|
| Ancient Celtic earth dogs | `/history/breeds/Ancient-spotted-hounds.jpg` | a different dog (spotted hounds) | Earth Dog children, `data/lineage.ts` |
| Early badger hunting dogs | `/history/breeds/Teckel---Dachshund-family.jpg` | a dachshund | Earth Dog children, `data/lineage.ts` |

The other three parents reuse correct existing images (Celtic herdsmen's dogs,
Roman shepherd dogs, Old British bandogs) and need nothing.

## Deferred jobs, Tudor trail (logged 10 August, do after the families)

Two known issues found while writing the families. Neither is a placeholder;
both are their own jobs, deliberately parked so a family patch is not derailed.

**1. The 61-tree duplicate-percentage artifact.** Across 100 trees, 61 show one
ancestor name at two or more different percentages. It is not a cycle (the cycle
was fixed in `07f82a5d`) and not an infinite loop (`expandNode` guards on
`visited`). It is the valueless-branch (Celtic Heeler) shape: when a deep
ancestor sits under two sibling branches, it renders once under each with
different scaled shares. Worst in the hound trees (Foxhound, Otterhound,
Staghound duplicate `St Hubert Hound` and `Old scenting hounds`). Fixing it is a
structural reshape, not a token change, and risks load-bearing edges (removing
`Skye terrier stock -> Earth Dog` would cost Cairn Terrier). Owner decision:
its own job, after the families.

**2. Borrowed-image audit.** 77 of the 228 images in `public/history/breeds/`
are referenced by nothing, a third of the folder. Several are correctly named
for nodes that are currently wearing a borrowed picture, so the right artwork
already exists and just needs pointing at. Named starting points:
`Old-earth-terrier.jpg`, `celtic-hound-drawing.jpg`, `Southern_Hound-drawing.jpg`,
`Roman-drover-dog.jpg`, `early-land-spaniel.jpg`. The job: audit every node
wearing a borrowed image against the unused files, and list the ones where the
correct picture already exists on disk. Do not act piecemeal; do it as one pass.

## What's Your Superpower (MVP-4.1 prototype)

| Placeholder | Location | Meaning | Resolve via |
|---|---|---|---|
| `PLACEHOLDER_COMPLETION_TIME` ("It takes about two minutes.") | `scripts/superpower-generate-config.mjs` (emitted into `app/whats-your-superpower/data/config.mvp-4.2.json` `copy.completionTime`) | The entry screen must show an approximate completion time (spec section 3) but no document specifies the value; this is a best-effort stand-in, not approved copy | Steve confirms the wording, then rerun the generator |

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
