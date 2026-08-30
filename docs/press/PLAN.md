# Press pack: working plan (slide-by-slide)

Status: approved split + proposed layout. **Not built.** Copy marked NEEDS OWNER
is not to be written. Containers and images are named from the recon
(`docs/press/RECON.md`); paths are real unless marked PLACEHOLDER.

Authoring order is mobile-first (BRIEF section 6). The mobile split is canonical;
desktop combines where a landscape slide has room, EXCEPT Section 5, which keeps
its per-card reveal on desktop rather than compressing (owner note, 29 Aug).

## Shell (applies to every slide)

- Base: the HistoryCarousel mechanics (`app/britains-dog-history-2/HistoryCarousel.tsx`) — horizontal scroll-snap rail, `goTo(idx)`, touch-advance, progress bar. Re-themed light (page gradient shows through; NOT the superpower `--sp-ground` dark).
- Net-new UI to add (nothing equivalent exists): a previous/next control pair, a keyboard arrow handler, and a position indicator (counter "n / N" and/or dots), built from existing button/pill styles (`--radius-pill`, green `#22c55e`), no new colours.
- Accent word colour: `--yellow-header` (#ffed00). Display font `--font-display` (Luckiest Guy), body `--font-body` (Montserrat).
- Renders inside `#pc-site` so contrast schemes / hide-images / text-invert apply for free. Every image carries a real alt.

## Counts

- **Mobile: 24 slides.** **Desktop: 14 slides.**
- Only the Cover is 1:1. Section 5 stays a near-1:1 reveal on desktop on purpose.

| # | Section | Mobile | Desktop |
|---|---|---|---|
| 1 | Cover | 1 | 1 |
| 2 | Story in 30s | 2 | 1 |
| 3 | Press release | 2 | 1 |
| 4 | Imaginary → Real → Tangible | 3 | 1 |
| 5 | Missing-card problem | 5 | 4 |
| 6 | Find Pug (mechanic) | 2 | 1 |
| 7 | One-of-one figurine | 2 | 1 |
| 8 | No board / Britain is the board | 3 | 2 |
| 9 | A little deeper | 2 | 1 |
| 10 | Assets + press info | 2 | 1 |

## Resolved assets (29 August 2026)

Steve supplied `~/Downloads/pug press images/` (47 stills + 5 videos). The three
"does not exist" placeholders below are now all covered by real artwork, so the
interim treatments described further down are no longer needed. Chosen assets are
copied into `public/press/` (source file noted); `actual-cards.jpg` is used from
the repo root. Video is embedded from Vimeo (whole clips, findpug pattern), not
served as MP4.

| Mobile slide | Asset | Source |
|---|---|---|
| M1 Cover | `press/cover.jpg` | slide1.jpg |
| M2a Story 1/2 | `/actual-cards.jpg` (repo) + owner text | — |
| M2b Story 2/2 | owner text only | — |
| M3a/M3b Press release | PLACEHOLDER (Section 3, copy NEEDS OWNER) | — |
| M4a Imaginary | `press/state-imaginary.jpg` | card-on-cartoon.jpg |
| M4b Real | `press/state-real.jpg` | dog-on-real.jpg (the living Pug) |
| M4c Tangible | `press/state-tangible.jpg` | 3d-on-podium.jpg (clean, no WIN ME) |
| M5a Normal card | `press/card-normal.jpg` | zoom-card.jpg |
| M5b Pug leaving | `press/card-leaving.jpg` | slide14.jpg |
| M5c Blank card | `press/card-blank.jpg` | non-zoom-card-no-dog.jpg (no PRE-ORDER sticker) |
| M5d "54 became 53" | owner text | — |
| M5e "can't launch" | owner text | — |
| M6a Find Pug steps | Vimeo **advertB** id `1221597431` (facade poster `press/findpug-video-poster.jpg`) | advertB.mp4 |
| M6b Dates + prize | `press/findpug-ticket.jpg` | get-your-ticket.jpg |
| M7a Figurine hero | `press/figurine-hero.jpg` | blue-orig1.jpg |
| M7b Only one exists | `press/figurine-angle.jpg` | blue-orig2.jpg |
| M8a/b/c No board | PLACEHOLDER (Section 8, image + traffic-jam copy NEEDS OWNER) | — |
| M9a/M9b A little deeper | PLACEHOLDER (Section 9, live-site thumbnails not in folder) | — |
| M10a/M10b Assets + contact | PLACEHOLDER (Section 10, handles/contact NEEDS OWNER) | — |

Video, on Vimeo (from findpug's `CompetitionVideoRow` config): `advertB`
`1221597431`, `make-ad` `1221597430`, `advert2B` `1221597429`. Wired: advertB
(Find Pug). Available but unplaced: advert2B, make-ad. **`ad1d.mp4` is not on
Vimeo** (would need uploading); its slot was No board (S8), which stays a
placeholder regardless.

The recommendations above override two of Steve's picks: `slide5.jpg` (retail box
"COLLECT THEM ALL", contradicts one-of-one) is dropped in favour of the clean
figurine stills, and the missing-card sequence uses the four true beats
(normal / leaving / blank) rather than the eight originally listed (slide15/16/17b
belong to Find Pug and the prize).

## Missing artwork: superseded (29 August 2026)

The three interim treatments below are **no longer used**: each is now covered by
real artwork in the table above. Kept for the record only.

- **Living Pug** (real dog, Section 4 "Real"). Resolved by `dog-on-real.jpg`.
- **Pug leaving** (Section 5, middle card). Resolved by `slide14.jpg`.
- **Blank card** (Section 5, third card). Resolved by `non-zoom-card-no-dog.jpg`. `myscorecard-empty.jpg` is a blank *scorecard*, not this, so it is not used here.

---

## Section 1 — Cover (M1 / D1)

- **M1.** Container: `.essayHero` (full-bleed hero image + overlaid H1, `dogs-at-work.module.css:373`). Content: `PC-logo-blue.svg` top; H1 **PUG HAS ESCAPED** (display, lemon accent on "ESCAPED"); subline "Britain, we need your help."; a small press-contact line at the foot (NEEDS OWNER). Image: portrait cover. Final = the escaped-Pug hero (PLACEHOLDER); interim = `competitions/pug/portrait-advert.jpg`.
- **Desktop:** same slide, landscape hero = `competitions/pug/video-start.jpg` (or its `.mp4`).

## Section 2 — The story in 30 seconds (M2 / D1)

Owner-approved copy (verbatim, brief blockquote): "The product was finished. During the final photoshoot Pug left the card and disappeared into the real world. The Pug card is now blank. Pedigree Chums cannot launch with only 53 Chums, so Britain is being asked to Find Pug."

- **M2a.** Container: `.section` + `.glowLayer` (blue-fade rounded panel, `britains-dog-history/history.module.css:169`/`:187`). Content: the hook, first two sentences. Image: `actual-cards.jpg` (the full spread of real cards) as the visual beside/above the text.
- **M2b.** Container: `.section` + `.glowLayer`. Content: the payoff, last two sentences, "53 Chums ... Find Pug" set large. Image: none (text panel).
- **Desktop:** one `.section` split, all four sentences with `actual-cards.jpg` in the second grid column.

## Section 3 — Press release, shortened (M2 / D1)

NEEDS OWNER: the release text (not in repo; not on /findpug). Count scales with its length.

- **M3a / M3b.** Container: `.section` + `.glowLayer` (text on the blue-fade panel, prose forced black per `history.module.css:351`). Content: the shortened release split across two portrait panels. Image: `PC-logo-blue.svg` in the header only.
- **Desktop:** one `.section` with the release in two columns.

## Section 4 — Imaginary → Real → Tangible (M3 / D1)

NEEDS OWNER: the ~100 words (one third under each state). Labels are owner-approved.

- **M4a.** Container: `.breedPanel` (bordered card, `dogs-at-work.module.css:220`) with a `.mobileSlideTag` pill "IMAGINARY". Image: `pug-card.jpg` (the card illustration).
- **M4b.** Container: `.breedPanel` + pill "REAL". Image: **Living Pug (PLACEHOLDER)** — see above.
- **M4c.** Container: `.breedPanel` + pill "TANGIBLE". Image: `competitions/pug/blue-orig1.jpg` (the 3D-printed figurine).
- **Desktop:** one slide, the three `.breedPanel`s in a `.rowGrid` (know-your-chums `:759`) left-to-right, the 100 words beneath.

## Section 5 — The missing-card problem (M5 / D4, reveal preserved)

Owner-approved lines: "54 Chums became 53 Chums and one blank card." and "We can't launch like that."

- **M5a.** Centered card on the page gradient (no container needed; optional `.chumCard` frame, `know-your-chums:373`). Image: `pug-card.jpg` (the normal Pug card).
- **M5b.** Same treatment. Image: **Pug leaving (PLACEHOLDER)**.
- **M5c.** Same treatment. Image: **Blank card (PLACEHOLDER)**.
- **M5d.** Container: `.section` + `.glowLayer`. Content: the big line "54 Chums became 53 Chums and one blank card." Image: `actual-cards.jpg` faint behind, optional.
- **M5e.** Container: `.section` + `.glowLayer`. Content: "We can't launch like that." set large. Image: none.
- **Desktop (4, not 2):** keep the three card slides distinct (5a, 5b, 5c) so the card-by-card reveal survives; combine only the two closing lines onto one `.section` slide. If the two lines feel cramped together, keep them separate and run Section 5 at 5 on desktop too.

## Section 6 — Find Pug, the mechanic (M2 / D1)

Owner-approved sequence: "Spot Pug → Photograph Pug → Post Pug → Tag Pedigree Chums → #ChumSpot". NEEDS OWNER: competition dates.

- **M6a.** Container: reuse `CompetitionIconRow` (findpug, spot/snap/logo/TikTok/Instagram) for the icon vocabulary, with the five steps stacked as `.mobileSlideTag` pills. Image: the icon row.
- **M6b.** Container: `.section` + `.glowLayer`. Content: dates (NEEDS OWNER) + the figurine prize line. Image: `competitions/pug/findpug-og.jpg` (figurine on the "Pug" podium, WIN ME).
- **Desktop:** one slide, the five steps in a single horizontal `CompetitionIconRow` with dates + prize beneath.

## Section 7 — The one-of-one figurine (M2 / D1)

- **M7a.** Container: full-bleed hero on the page (or `.essayHero`). Image: `competitions/pug/blue-orig1.jpg` (hero), with `hand.png` (in-palm, for scale) as an inset.
- **M7b.** Container: `.section` + `.glowLayer`. Content: "the only physical Pug figurine currently in existence, created for this story, with no current plans to make another" (paraphrase of brief; confirm as owner copy). Image: `blue-orig2.jpg` / `blue-orig3.jpg` (angles).
- **Desktop:** one slide, `blue-orig1.jpg` hero + the explanation and the extra angles in a `.rowGrid`.

## Section 8 — There is no board. Britain is the board. (M3 / D2)

Owner-approved: "There is no board. Britain is the board." and the framing "Not poker. Not rummy. Not another game around the kitchen table." NEEDS OWNER: the traffic-jam example.

- **M8a.** Container: `.section` + `.glowLayer`. Content: the statement, large. Image: none.
- **M8b.** Container: `.blueSection` (blue panel band, `dogs-at-work/deck.module.css:140`). Content: "take the cards outside" — parks, trains, streets, beaches, car journeys, towns, as `.mobileSlideTag` pills. Image: a lifestyle scene (PLACEHOLDER if none exists) or the pill row alone.
- **M8c.** Container: `.section` + `.glowLayer`. Content: the traffic-jam example (NEEDS OWNER). Image: PLACEHOLDER (cards in a car window).
- **Desktop:** slide one = statement + places (`.section` with the pill row); slide two = the traffic-jam example.

## Section 9 — A little deeper (M2 / D1)

Owner-approved: "There is always something else to dig up." Seven strands: breed information; working dogs; dogs and British history; famous dogs; temperament; costs and ownership; playful educational content.

- **M9a.** Container: `.statGrid` of `.statBlock` tiles (know-your-chums `:740`/`:187`), four strands, each tile a thumbnail reused from the matching live page (e.g. a `<breed>-card.jpg`, a dogs-at-work `.essayHero` still, a britains-dog-history hero). Image: existing page thumbnails, real.
- **M9b.** Container: `.statGrid`, the remaining three strands + the line "There is always something else to dig up." Image: existing page thumbnails.
- **Desktop:** one slide, all seven tiles in a single `.statGrid` with the line beneath.

## Section 10 — Assets and press information (M2 / D1)

NEEDS OWNER: social @handles, press contact; which listed assets are cleared for release.

- **M10a.** Container: `.factGrid` / `.rowGrid` thumbnail grid. Content: thumbnails + a plain list of what is available — high-res stills (`blue-orig*.jpg`, `hand.png`, `findpug-og.jpg`, `pug-preorder.jpg`), campaign videos (`video-start.mp4`, `portrait-advert.mp4`, three Vimeo clips), logo (`PC-logo-blue.svg`), card artwork; blank-card artwork and 3D-printing footage marked "to come" (NEEDS OWNER). Image: the thumbnail grid.
- **M10b.** Container: `.section` + `.glowLayer`. Content: contact details, website, social handles (NEEDS OWNER). Image: `PC-logo-blue.svg`.
- **Desktop:** one slide, thumbnail grid + contact column side by side.

---

## Open items before build

- NEEDS OWNER copy: press contact, release text, competition dates, the 100 words, the traffic-jam example, social handles, asset clearances.
- Three PLACEHOLDER images: living Pug, Pug leaving, blank card (described above; to log in `PLACEHOLDERS.md` at build time).
- Confirm Section 7's "only one in existence" wording is owner-approved, not paraphrased.
- Net-new controls (prev/next, keyboard, position indicator) to be built from existing styles.
