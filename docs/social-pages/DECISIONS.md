# Per-era social pages: decisions

Single-pass review. Built 13 August 2026 to `docs/social-pages/BRIEF.md`. Not
committed, not pushed. Backup patch at `.scratch/social-pages-overnight.patch`.

## What was built

Six share-only pages at `/britains-dog-history/[era]`, one dynamic route,
statically generated for six slugs, 404 for anything else.

| Slug | Strips rendered (uk-breeds `strip` keys) |
|---|---|
| ancient | ancient |
| medieval | medieval |
| tudor | c1500 |
| 1700s | c1700 |
| 1800s | early1800, spaniels, mid1800, late1800 (stacked, page order) |
| 1900s | c1900 |

Each strip renders as: the era heading (BreedStrip's own `stripLabel`), then the
slider (BreedStrip), then the era write-up panel (`HistorySection`) below it. The
1800s page stacks four such units.

## Decisions

**1800s strips: all four (Steve chose).** early1800, spaniels, mid1800, late1800
in page order.

**Era heading: BreedStrip's own `stripLabel`, no box, no note (Steve chose).**
Matches the history page's era heading exactly (`ERA_LABELS[era]`, e.g. "The
1700s"). An earlier invented header (blue box + word lockup with a stray "Dogs")
was scrapped. The one-line eraIntros note is used only for the SEO description,
not shown.

**Write-up panel below each slider, at all widths (Steve chose, option A).** The
blue glow `.section` panel from the history page (intro, detail, bullets, Did you
know facts, image), same component and same copy source. No 720px switch to a
mobile treatment, because the mobile carousel is not reusable per era (see
below).

**Why not the mobile carousel on phones.** `HistoryCarousel` renders every era in
one flat swipe sequence (whole-history, not per-era), and `TimelineRun` is hard-
wired to that shell (`getElementById("mobile-carousel")`, reads its scroll,
writes `data-pc-vlock`), so it cannot render standalone. A per-era carousel would
be a new build touching `britains-dog-history-2`, which Steve is keeping isolated.

**Route, slugs, metadata, nav, back link.** Single dynamic route
`/britains-dog-history/[era]`; `dynamicParams = false` + `generateStaticParams`
for the six slugs (`crosses` 404s by design). Title from the era name,
description from the strips' existing eraIntros notes (no new copywriting).
Unlisted, not added to any nav or sitemap. One back link to
`/britains-dog-history`, styled from site tokens.

**No site Nav or Footer (judgement call).** Per "and nothing else": back link,
strips, panels. Global root-layout chrome (pre-order launcher, effects) still
wraps the page as on every route.

## The extraction (Steve approved, both parts)

To share one copy source between the history page and the era pages:
- `data/historySections.ts` (new): the `Section` type + `SECTIONS` array, lifted
  verbatim from `app/britains-dog-history/page.tsx`.
- `components/HistorySection/HistorySection.tsx` (new): the `.section` panel
  markup, lifted verbatim (same classes, same structure).
- `app/britains-dog-history/page.tsx` (modified): now imports `SECTIONS` and
  renders `<HistorySection>` instead of the inline array and inline panel. The
  unused `Image` and `FactHatImage` imports were removed (they moved into the
  component).

Edit the copy in `data/historySections.ts` and both the history page and the era
pages update. The mobile carousel keeps its own deliberate duplicate in
`app/britains-dog-history-2/sections.ts`; that isolation is intentional and was
NOT reversed (Steve's instruction).

Panel dependencies, all self-contained: `next/image`, `FactHatImage`, the
`history.module.css` classes, and `/public/history/` assets.

## Files

New: `data/historySections.ts`, `components/HistorySection/HistorySection.tsx`,
`app/britains-dog-history/[era]/{page.tsx,eraConfig.ts,era.module.css}`,
`docs/social-pages/{BRIEF.md,DECISIONS.md}`.
Modified: `app/britains-dog-history/page.tsx` (the extraction only).

## Verification

- `tsc --noEmit` clean; `:global` audit clean; eslint clean on all touched files.
- Six slugs 200, `crosses` and unknown slugs 404.
- History page desktop before and after the extraction: both captures are
  1280 x 30739, identical height and visually indistinguishable (same ten
  panels, same order, same strips). Renders identically. Screenshots in the
  session scratchpad: `history-before.png`, `history-after.png`.
- Era page at 390: heading, slider, then the panel, all render and are legible
  (`era-1700s-390-full.png`). The panel reflows to a single column via the
  existing `@media (max-width: 760px)` rule.

## Mobile fact stack (applied, Steve approved)

At 390 the "Did you know?" fact rows kept the image-beside-text layout, squeezing
the copy into a narrow column. Fixed with a `@media (max-width: 480px)` rule in
`history.module.css` that stacks the circle above its text so the copy takes the
full panel width. It only reaches the era pages: the history page's desktop view
is hidden at 720 and below, where the carousel takes over, so the history page is
unaffected. Verified at 390 (`era-1700s-390-facts.png`).

## Card flip side (yellow face), matched below 480, circles dropped

The strip card's yellow flip side looked looser than the mobile carousel card's.
Below 480 it now matches the mobile `.dogBack`: face padding 14 to 22, inner gap
10 to 16, the green "Tap to learn" button 22/34/16 to 28/42/18, and the note
pulled tight under it with `margin: -8px 0 -6px`. Era pages only (the `.flip*`
strip card is hidden on the history page at 720 and below, where the `.dog*`
carousel card takes over).

**The outbound source circles are hidden below 480, not matched, and this is the
reason:** the era strip card is a fixed 260px square with `overflow: hidden`
faces, while the mobile card is an auto-height grid (`.dogFlipInner`, both faces
on `grid-area: 1/1`) that simply grows to fit its content. At the matched sizes
the circles overflow the square by ~38px and clip. Making the era card grow to
fit them would leave uneven card heights along the horizontal rail; the mobile
run is vertical so it never sees that, but the era slider would. That trade is
not worth it (Steve, 13 August 2026). Only ancient, medieval and tudor carry
circles at all (6, 7 and 3 cards); 1700s, 1800s and 1900s have none. With the
circles hidden, the worst-case back content (button + longest note) overflows the
fixed face by ~7px, which is imperceptible.

## Touch flip on the era card, below 480

The strip card only flipped on `:hover`/`:focus-visible`, and a phone has no
hover, so the yellow back (and all the styling matched above) was unreachable on
a finger. Added a tap flip, matching the mobile carousel card, below 480 only:
- `BreedStrip.tsx`: a `flipped` state; a front tap control (`.frontFlip`) that
  turns the card, and the existing `.deskBackFlip` icon made interactive to turn
  it back (Steve's call: reuse the icon that is already there rather than add a
  second control). `.flipInner` gets an inline `rotateY(180deg)` when flipped.
- `history.module.css` (below 480 only): show `.frontFlip` top-right (the
  `.lineageBadge` tree glyph steps aside, exactly as the mobile card did with its
  own glyph), enlarge and un-gate `.deskBackFlip` for touch, and switch off the
  hover/focus flip so the tap state drives it.

**Desktop history is untouched, and this is how:** `.frontFlip` is `display:none`
above 480 (not painted, not tabbable, cannot flip), `.deskBackFlip` keeps its
`pointer-events:none` and its size above 480 (mouse blocked, look unchanged), and
the `flipped` state can only be set by the below-480 controls, so above 480 it
stays null and the inline transform is never applied. The hover flip is only
switched off below 480. Verified: desktop history at 1280 renders identically to
baseline (both 1280 x 30739). Touch flip verified at 360 with hover disabled
(inner transform goes none -> rotateY(180deg) on tap; only the tapped card
flips). One accepted non-visual delta above 480: `.deskBackFlip` gains a
focusable no-op role in the tab order, alongside the outbound-link circles that
were already there; activating it there sets the state to null, which does
nothing.

## Commit split (handed to Steve, not committed here)

Two commits, file-level, no hunk splitting:

1. **refactor** (history page output-identical): `data/historySections.ts`,
   `components/HistorySection/HistorySection.tsx`,
   `app/britains-dog-history/page.tsx`.
2. **feat** (the new pages plus their mobile polish):
   `app/britains-dog-history/[era]/`, `app/britains-dog-history/history.module.css`
   (the 480px fact rule), `docs/social-pages/`.

The 480px CSS rule sits in commit 2, not the refactor, so commit 1 stays a pure
output-identical extraction.

## Notes

- Dev server left running on port 3123.
- Nothing committed or pushed. Backup patch at
  `.scratch/social-pages-overnight.patch` (gitignored).
