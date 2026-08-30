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

## Medieval dogs made playable (10 August): wrong-artwork reuses (RESOLVED)

The three medieval cards (Shepherd's Dog, Drover's Dog, Earth Dog) were given
children in `data/lineage.ts` so they can be played. Two ancestor nodes borrowed
an image belonging to a different dog. Both are now on their own artwork.

- **Ancient Celtic earth dogs: RESOLVED (10 August).** Now on
  `/history/breeds/ancient-celtic-earth-dog.jpg` (optimized to 89 KB), off the
  borrowed `Ancient-spotted-hounds.jpg`. Both node occurrences repointed.
- **Early badger hunting dogs: RESOLVED (10 August).** Now on
  `/history/breeds/early-badger-hunting-dogs.jpg` (57 KB), off the borrowed
  `Teckel---Dachshund-family.jpg` (a modern dachshund). All four node
  occurrences repointed; the dachshund image is now referenced by nothing.

The other three parents reuse correct existing images (Celtic herdsmen's dogs,
Roman shepherd dogs, Old British bandogs) and need nothing.

## Borrowed-image repoints (11 August): RESOLVED

Two of the borrowed-image faults from the audit are now on their own artwork.

- **Rough water dogs: RESOLVED (11 August).** Now on
  `/history/breeds/rough-water-dogs.jpg` (optimised to 63 KB), off the borrowed
  `water-spaniel-illustration.jpg`. One node occurrence repointed (line 1495, in
  25 trees). `water-spaniel-illustration.jpg` is now referenced by nothing, and
  Water spaniels is untouched on its own `original-water-spaniel.jpg`.
- **Wire Fox Terrier: RESOLVED (11 August).** Now on
  `/history/breeds/wire-fox-terrier.jpg` (optimised to 86 KB), off the borrowed
  `fox_terrier-img.jpg`, which is the Fox Terrier's own card art. Two node
  occurrences repointed (lines 750 and 770, in 3 trees). Fox Terrier keeps
  `fox_terrier-img.jpg`.

(`barbet.jpg` is on disk for split 3 of the Tudor trail. It has no node yet and
is deliberately not wired.)

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

**Not a fault, do not flag.** Some dog names carry TWO images by design, one for
each of two image systems, and this is correct:
- **Chum image:** the blue-backed cartoon card for the playable card, at the
  site root, e.g. `/greyhound-square.jpg`.
- **Historic image:** the painted period picture for the ancestor node in the
  lineage, in `public/history/breeds/`.

Same dog name, two roles, two pictures, not a duplicate. Bloodhound, Bulldog and
Greyhound are the known cases. Any node with one chum image (site root) and one
historic image (`history/breeds`) is fine and must not be reported by the audit.

## Deferred cleanups (code, not placeholders)

**Inert inline `--rows` on the title ladder (logged 10 August).** The title
portrait scaling was removed from `LineageModal.module.css` (owner decision:
portrait stays full size at every depth). That deleted `--rows`, `--ceil` and
`--push` from the CSS. The component still SETS `--rows` inline on `.titleWrap`,
but nothing reads it any more. Left in place deliberately so a component change
did not ride on a CSS-only patch. Cleanup: drop the inline `--rows` write from
the LineageModal component.

## Generated-data drift: dogs.json sizeBand (logged 22 August 2026)

Not a placeholder and not caused by any recent change: the committed
`app/pick-a-chum/data/generated/dogs.json` is stale against its source. A full
`npm run build:chumdata` regenerates it and flips `sizeBand` from `"giant"` to
`"large"` for four dogs, because the derivation in `data/breeds.ts` now yields
`"large"` for them but the generated file was never rebuilt:

| Dog | slug | committed | rebuild yields |
|---|---|---|---|
| Bloodhound | `bloodhound` | `giant` | `large` |
| Doberman Pinscher | `doberman-pinscher` | `giant` | `large` |
| Rottweiler | `rottweiler` | `giant` | `large` |
| Old English Sheepdog | `old-english-sheepdog` | `giant` | `large` |

So the next full rebuild will sweep these four lines into an otherwise unrelated
commit. This is the ONLY diff a rebuild produces beyond whatever sheet you edited.
It was deliberately left OUT of the Treat Trail lead-in commit (22 August) to keep
that change surgical. Resolve by deciding which is right: if `"large"` is correct,
rebuild and commit `dogs.json` on its own; if `"giant"` was intended, fix the
`sizeBand` derivation in `data/breeds.ts` first, then rebuild.

## What's Your Superpower (MVP-4.1 prototype)

| Placeholder | Location | Meaning | Resolve via |
|---|---|---|---|
| Completion time ("Takes about two minutes.") | `scripts/superpower-generate-config.mjs` (`COMPLETION_TIME`, emitted into `app/whats-your-superpower/data/config.mvp-4.3.json` `copy.completionTime`) | The entry screen must show an approximate completion time (spec section 3) but no document specifies the value; this is a best-effort stand-in, not approved copy. It is a code constant in the generator, not workbook copy | Steve confirms the wording, then update `COMPLETION_TIME` in the generator and rerun it (`node scripts/superpower-generate-config.mjs`); the generator is safe again and reproduces the config byte for byte |
| Question images `q01/q03/q04/q05/q06/q07/q09/q11/q12/q15.jpg` | `public/superpower/` (referenced by `app/whats-your-superpower/ui/SuperpowerGame.tsx` via `questionImage(q.id)`) | The whole `public/superpower/` directory is absent, so every question image is a missing file (404). They are decorative (`alt=""`, the question is answerable without them), and the slot is keyed off the question id, so dropping each named file in pairs it with the right question. The dropped questions' images (q02/q08/q10/q13/q14) are no longer referenced. | Steve supplies the ten question images, numbered against the original set (M03 to q03), into `public/superpower/`; then `git add public/` |

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

## Dogs at Work redux (dogsatwork branch)

Placeholders introduced by the Dogs at Work redux (brief v3.0). Details and any
outstanding decisions are in `docs/dogs-at-work/NEEDS_STEVE.md`.

No named placeholders remain in the Dogs at Work slides or article pages.

Task 7 (hide images), 13 Aug 2026: the NO-SCHEME block colours are PLACEHOLDER.
Steve's instruction read "blocks are [COLOUR] with [TEXT COLOUR] text" with the
two values left unfilled. `--pc-hb-bg` (`#1a1a1a`) and `--pc-hb-text` (`#ffffff`)
in `app/contrast-schemes.css` are a high-contrast stand-in so the mechanism is
demonstrable; replace both when Steve supplies the two colours. Inside a scheme
the block uses the scheme's own two colours and is not a placeholder.

Resolved 12 Aug 2026: the guide dogs hero alt is supplied ("a man with a white
cane sitting on a park bench beside a black Labrador in a yellow guide-dog
harness") and inlined in `slides.ts` and the article page, so
`PLACEHOLDER_ARTICLE_6_ALT` is gone.

Resolved 12 Aug 2026: the guide dogs hero image is supplied (`/guide_dog_image.jpg`),
wired into `slides.ts` and the article page, replacing the `/hero-coming-soon.svg`
stand-in (now deleted). `PLACEHOLDER_ARTICLE_6_HERO` is gone; this also makes the
old hero chain (moving `article3_hero.jpg` off article 2) moot, so article 2 keeps
its hero.

Resolved 11 Aug 2026: `PLACEHOLDER_ARTICLE_5_PANEL`, `PLACEHOLDER_ARTICLE_5_DEK`,
`PLACEHOLDER_ARTICLE_5_ALT`, `PLACEHOLDER_ARTICLE_6_PANEL` and
`PLACEHOLDER_ARTICLE_6_DEK` are all filled with Steve's supplied copy and inlined
in `slides.ts` (and the article page meta descriptions / the article 5 hero alt).
No consts remain for them.

## Spot your Chum competition terms (findpug build, 25 Aug 2026)

Known duplicate, accepted by Steve. The competition terms now exist in two
places: the live `app/chumspot/ChumSpotClient.tsx` `TERMS` array, and a
byte-for-byte copy in the new shared `components/CompetitionTerms/CompetitionTerms.tsx`.
`/chumspot` is live and was not touched in the same session as the `/findpug`
build. Once `/findpug` is live and tested, Steve will decide whether to point
`/chumspot` at the shared component and collapse the two copies to one.

Two live production defects in that terms copy, present on `/chumspot` and
carried verbatim into `/findpug`. Both were FIXED on 27 Aug 2026, in both places
(`spotYourChumTerms.ts` for findpug, `ChumSpotClient.tsx` for /chumspot), across
two separate pushes (one per page):

| Defect | Location | Meaning | Status |
|---|---|---|---|
| `[PRIVACY POLICY LINK]` placeholder | Term 14, in both `ChumSpotClient.tsx` and `spotYourChumTerms.ts` | The Privacy Policy link text was never resolved to the real `/privacy` route; the literal bracket text shipped to users | RESOLVED 27 Aug 2026: term 14 now links "Privacy Policy" to the relative `/privacy` route. Bodies gained markdown-style `[label](href)` link support, rendered as an anchor in both terms renderers. |
| Duplicated sentence | Term 2, in both `ChumSpotClient.tsx` and `spotYourChumTerms.ts` | "Each monthly round opens at 00:00 ... final calendar day of that month." appeared twice | RESOLVED 27 Aug 2026: the duplicated sentence (and its "The competition is divided into monthly rounds." lead-in) is removed. |

### Pre-order card render carries stale figures

The `/findpug` PRE-ORDER block uses a static photographic product render (box +
printed card on podiums), NOT a card generated from breed data at runtime. The
height, length and weight printed on the card in that artwork are baked into the
image, so:

- The figures are currently WRONG and the artwork must be RE-EXPORTED once the
  breed data fix lands. A data change alone does not touch the image.
- Divergence risk, explicit: the interactive breed card in
  `app/know-your-chums/BreedDialog.tsx` renders those same figures LIVE from the
  data. When the data fix lands there, the live card will show the corrected
  numbers while the baked pre-order artwork still shows the old ones, until the
  artwork is re-exported to match. Ship the corrected render alongside, or the
  two surfaces will disagree.
- No pug pre-order asset exists in `public/` yet; Steve is supplying it
  separately. It is a per-page (breed-specific) config field, not shared.

### /findpug now live (27 Aug 2026): accepted known issues, not blocking

The noindex was removed and `/findpug` added to the sitemap on 27 Aug 2026. Two
issues are accepted for now and are NOT blockers:

1. **Default-view contrast (WCAG 1.4.3 / 1.4.11).** On the default view (no
   contrast scheme), two elements sit white on the `--comp-yellow` band at 1.36:1,
   below the 3:1 they need:
   - the icon-row glyphs (spot, TikTok, Instagram)
   - the PHOTO COMPETITION title line
   Both clear 8.8:1 if turned navy; that fix is deferred, not applied. The three
   contrast schemes and the navy terms panel are unaffected.

2. **Wrong breed figures baked into artwork.** The Pug height/length/weight are
   wrong and are baked (not live data) into three surfaces, each of which must be
   RE-EXPORTED when the corrected art lands (see "Pre-order card render carries
   stale figures" above):
   - the pre-order product render
   - the hero video's held final frame
   - the first of the three Vimeo thumbnails
   The OG image (`findpug-og.jpg`) is the hero scene only and carries NO card or
   figures, so it is safe to serve.

### Case-collision pairs in public/ (existing defect on main)

`git ls-files` shows three pairs of tracked filenames that differ only in case.
On the case-insensitive macOS working tree only one of each pair exists on disk;
Vercel's case-sensitive Linux build treats them as two separate files, so
whichever the code does not reference is a phantom and the other may 404
depending on the exact casing used. Pre-existing on `main`, NOT introduced by
the findpug work and NOT for this session to fix:

- `public/a-car-is-not-a-kennel.jpg` vs `public/A-car-is-not-a-kennel.jpg`
- `public/a-dog-never-died-from-missing-a-walk.jpg` vs `public/A-dog-never-died-from-missing-a-walk.jpg`
- `public/if-the-pavement-is-too-hot-for-your-hand.jpg` vs `public/If-the-pavement-is-too-hot-for-your-hand.jpg`

Resolve via a dedicated cleanup on `main`: pick the lowercase name each side
references, `git rm` the other, confirm with `git ls-files` (not `ls`).

## Discount badge is desktop-only on britains-dog-history (27 Aug 2026)

The 30% OFF discount badge (`.heroBadge`, background `public/30percent-off.png`)
shows on /britains-dog-history at **desktop width only**. The badge sits inside
`.desktopView`, which is `display:none` below 721px; on mobile the whole desktop
hero is replaced by `HistoryCarousel` (`.mobileView`), which renders no badge. On
/know-your-chums the same badge is NOT gated, so it shows at every width.

Deliberate for now, NOT a bug: whether to add the badge to the bdh mobile carousel
is a design decision Steve will make when looking at that page properly, not as a
side effect of the badge/shadow change. Do not "fix" it in a drive-by.

## Unrendered selectors in dogs-at-work.module.css (28 Aug 2026)

Found during the editorial-header yellow unification (`--yellow-header: #ffed00`).
Two yellow-text selectors in `app/dogs-at-work/dogs-at-work.module.css` are defined
but not referenced by any `.tsx` in `app/dogs-at-work/` (checked with
`grep -rl "styles.<name>"`), so they render nowhere:

| Selector | Where | Meaning |
|---|---|---|
| `.essayTitle` | `dogs-at-work.module.css` | Display-font article title, `var(--yellow)`. No JSX uses it; the articles title via other classes. |
| `.breedPanelLabel` | `dogs-at-work.module.css` | Small uppercase body-font label, `var(--yellow)`. No JSX uses it. |

Left as-is on the old `--yellow` (NOT retargeted to `--yellow-header`), because they
do not render and changing dead code adds diff for no visible effect. Logged so
nobody chases why they were skipped, or "fixes" their colour later. Resolve by
deleting them if a future pass confirms they are still unused.

## Press pack contact details (29 August)

The Press Enquiries screen (`/press`, the final slide) renders the owner's own
bracketed placeholders verbatim from `docs/press/COPY.md` (screen 19). They are
clearly bracketed on the page, never mistaken for real details.

| Placeholder | Location | Meaning | Resolve via |
|---|---|---|---|
| `[NAME]` `[EMAIL]` `[TELEPHONE]` | `app/press/PressCarousel.tsx` (screen 16, from COPY.md §19) | Press contact, not yet supplied | Owner supplies contact details |
| `[WEBSITE]` `[HANDLE]` | same | Website and social handle | Owner supplies |
| `[DATE]` (opens / closes) | same | Competition dates | Owner supplies dates |

The copy-only tail screens (A Little Deeper, Press Assets, Press Enquiries) also
have no image assigned; parked, unused press images are available
(`cover-where-is-pug`, `no-dog-on-real`, `slide9`, `3d-on-podium`, `slide5`) if
the owner wants pictures there.

### Screens 4 and 5 copy (30 August, from the screens 1-7 revision)

The two new 2x2-grid screens (new numbering 4 and 5, inserted where the old
"Imaginary. Real. Tangible." screen was) carry a clearly-labelled placeholder line
on the copy panel. Images and the 2x2 layout are wired; the copy follows later.

| Placeholder | Location | Meaning | Resolve via |
|---|---|---|---|
| `[ Placeholder — copy for screen 4 to follow ]` | `app/press/PressCarousel.tsx` (screen 4) | 2x2 grid: slide13, slide14, slide14b, dog-on-real | Owner supplies the copy |
| `[ Placeholder — copy for screen 5 to follow ]` | `app/press/PressCarousel.tsx` (screen 5) | 2x2 grid: dog-on-real, slide15, slide16, cover | Owner supplies the copy |

Screen 3 is held pending its image list (the revision gave `card-on-real` twice);
its confirmed copy is captured for the next pass: "There may be millions of dogs
outside the cards. In our world, there is only one Pug. Every real Pug you see is
the same Pug."
