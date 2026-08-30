# Press pack: Batch 0 reconnaissance

Read-only. Nothing in the app was changed; the only writes are this file and the
copied-in `docs/press/BRIEF.md`.

Method note: this recon was first delegated to five parallel sub-agents. Their
findings never handed back, so it was re-run directly and every claim below is
from a first-hand read of the file cited. Line numbers are current as of
29 August 2026.

---

## 1. Carousel mechanics: which is the better base

Both are horizontal, CSS scroll-snap rails driven by `scrollLeft`, with a
progress bar and a `goTo(index)` that calls `scrollTo({behavior:"smooth"})`.
Neither has previous/next arrow controls and neither has keyboard support. Those
must be built either way (the brief says as much).

**HistoryCarousel** (`app/britains-dog-history-2/HistoryCarousel.tsx`)
- Slides are a row inside a scroll-snap container; snap dance for iOS is noted at `history2.module.css:16` and `HistoryCarousel.tsx:374`.
- Advance: injected vanilla script, `goTo(idx)` at `HistoryCarousel.tsx:361` (with an iOS `scrollTo`-blocked fallback at `:374-382`).
- Progress bar: `:257` (`width = scrollLeft/max * 100%`).
- Controls that exist: a delegated click handler at `:387-404`. `#intro-next-btn` jumps to slide 1 (`:398`); **any button carrying a target index** scrolls to it (`:399-404`). Custom event `pc:history-home` -> `goTo(0)` at `:393`. Intro "next" button is `IntroButtons.tsx`.
- Touch: vertical-flick-to-advance at `:416-457` (`touch-action: pan-x`, no preventDefault).
- No keyboard arrows. No prev/next pair. Logic is vanilla JS in a `dangerouslySetInnerHTML` script, not React.

**Superpower rail** (`app/whats-your-superpower/ui/SuperpowerGame.tsx`)
- `goTo(index)` React `useCallback` at `:105`; settled-slide read back from scroll at `:118-134`; progress at `:189/195`.
- Advances by answering a question (`answer()`/`start()` call `goTo`), so it has no user-facing next/prev at all.
- **Dark night theme** scoped to `.rail`: `--sp-ground #0b1220`, `--sp-green #22c55e` at `SuperpowerGame.module.css:51`. This is the trap the brief flags; do not reuse the theme.

**Recommendation: base the pack on HistoryCarousel.** It is already a general
content carousel (not quiz-coupled), it lives on a light page so there is no dark
theme to strip, and it already ships the progress bar, index-jump buttons and
touch-advance we want. Its one weakness versus the superpower rail is that the
mechanics are injected vanilla JS rather than clean React `goTo`; the superpower
`goTo`/settled-index pattern (`:105`, `:118-134`) is the cleaner code model if we
want to re-implement in React. Either way we add: a previous/next control pair, a
keyboard arrow handler, and a visible position indicator (a counter or dots),
none of which exist anywhere in the repo (searched; only the progress *bar* and
index-jump buttons exist).

---

## 2. The container palette (existing, reusable)

The one approved "text on a darker ground" container the brief asks for:

- **`.section`** (`app/britains-dog-history/history.module.css:169`): the floating panel, `border-radius: 40px`, soft shadow, `overflow:hidden`, 2-col grid. Comment at `:168` "each section = its own floating panel, like the homepage pitch panel."
- Its blue fade is **`.glowLayer`** (`history.module.css:187`, gradient at `:194`): `linear-gradient(to top right, #00e2ff, #008eff)` plus screen-blended cyan glow circles (`.glowCircle :196`). Prose on it is forced black at `:351` ("prose on gradient -> black, WCAG 1.4.3"). This is the container to reuse verbatim for any slide that needs text on a darker ground.

Other reusable containers, by page (class : file:line : use):

- britains-dog-history: `.section` (`history.module.css:169`, floating panel) - the workhorse block. Pills use `--radius-pill` at `:423/431/443`.
- dogs-at-work: `.blueSection` (`deck.module.css:140`, blue panel band); `.breedPanel` (`dogs-at-work.module.css:220`, bordered card); `.essayHero` (`:56/373`, full-bleed hero image, gets crushed in contrast schemes); `.sidebarCard` (`:473`); `.mobileCard` (`:542`); `.mobileSlideTag` (`:767`, a tag/pill); `.mobileIntroBtn` (`:717`, button).
- know-your-chums: `.factsPanel` (`know.module.css:103`); `.factHero` (`:144`); `.factGrid` (`:119`); `.chumCard` (`:373`); `.statBlock` (`:187`)/`.statGrid` (`:740`)/`.statsSection` (`:162`, stat tiles); `.familyBlock` (`:700`); `.modalCard` (`:515`); `.resultGrid` (`:732`)/`.rowGrid` (`:759`).
- about: has **no** `*.module.css` of its own; it composes shared components (e.g. `components/PitchPanel`, the homepage pitch panel the `.section` comment references). Reuse those components rather than about-local classes.
- findpug: the whole `Competition*` component family (see item 6) is a ready-made slide vocabulary: `CompetitionHero`, `CompetitionTitles`, `CompetitionProductStrip`, `CompetitionPreorder`, `CompetitionVideoRow`, `CompetitionIconRow`, `CompetitionTerms`.

Radii tokens are centralised: `--radius-card: 22px`, `--radius-pill: 999px` (`globals.css:55-56`).

---

## 3. The type scale

Set globally in `app/globals.css`:
- Tokens (`:root`, `:12`): `--blue-deep #0b78bd` (`:14`), `--blue-sky #5cc4ee` (`:15`), `--yellow #ffd23e` (`:18`), `--navy #0a3a57` (`:26`), `--cream #ffffff` (`:27`).
- **Lemon header yellow is a token**: `--yellow-header: #ffed00` (`globals.css:40`), described as the accent for headers/sub-headers across the editorial pages, deliberately distinct from `--yellow #ffd23e`. Use `var(--yellow-header)` (or `#ffed00`) for accent words, matching every other H1/H2. The lemon header-text class is defined from `globals.css:156`.
- Fonts: `--font-display` (Luckiest Guy) and `--font-body` (Montserrat) are set on `<html>` by next/font (`globals.css:9-11`); headings use `var(--font-display)` (`:148`), body uses `var(--font-body)` (`:92`). `--font-pct` (Open Sans, per CLAUDE.md) is not defined in globals.css; confirm its source before relying on it.
- Editorial heading sizes live per page (e.g. dogs-at-work `.essayHero` heading, know-your-chums `.factHero`); the display font + lemon accent is the consistent treatment. Small labels/kickers are Montserrat, uppercase, letter-spaced (pattern seen in `SuperpowerGame.module.css` `.kicker`/`.progress` and the editorial pages).

---

## 4. Buttons and controls

- **Green CTA**: colour `#22c55e`. Faced buttons appear across home, preorder, know-your-chums, good-dog-bad-dog, britains-dog-history(2), chum-calculator, name-generator (`grep` hits). The token `--sp-green` is defined only inside the superpower dark rail (`SuperpowerGame.module.css:51`), so reuse a light-page green button (e.g. home/preorder) or the `#22c55e` value, not the superpower token.
- **Pill**: `border-radius: var(--radius-pill)` (999px, `globals.css:56`), used e.g. `history.module.css:423/431/443` and `history2.module.css:554/704/1122`.
- **Previous/next controls: none exist anywhere.** The closest are the HistoryCarousel progress bar (`:257`) and index-jump buttons (`:398-404`), and the intro "next" button (`IntroButtons.tsx`). A prev/next pair and a position indicator are net-new UI the pack must add (built from the existing button/pill styles, no new colours).

---

## 5. Images that exist

`public/competitions/pug/` (12 files, all present):
- Figurine hero shots: `blue-orig1.jpg`, `blue-orig2.jpg`, `blue-orig3.jpg` (the blue 3D-printed Pug figurine, three angles), `hand.png` (figurine in a palm), `findpug-og.jpg` (figurine on a yellow "Pug" podium, WIN ME badge), `pug-preorder.jpg` (composed pre-order artwork).
- Campaign video: `video-start.mp4` + `video-start.jpg` (landscape), `portrait-advert.mp4` + `portrait-advert.jpg` (portrait). Three more clips are Vimeo-hosted (ids `1221597429/30/31`, `findpug/page.tsx:133-137`).
- Logo: `PC-logo-blue.svg`.

Card art in `public/` root:
- **Exactly 54** `<breed>-card.jpg` files (matches "54 Chums"), e.g. `lab-card.jpg`, `afghan-card.jpg`, `staffy-card.jpg`, plus `pug-card.jpg` (the normal Pug card) and `pug-square.jpg`/`.png`.
- Generic/aux: `card.jpg`, `actual-cards.jpg` (a spread of real cards), `card-hover.png`, `myscorecard-empty.jpg` (blank *scorecard*, not a blank Pug card).

Maps to the brief's needs:
- Section 4 (Imaginary -> Real -> Tangible): illustration = `pug-card.jpg` (EXISTS); tangible figurine = `blue-orig*.jpg`/`hand.png` (EXISTS); **living real-dog Pug photo = not clearly present** (the pug assets read as card/figurine, not a photographed dog) -> NEEDS OWNER to confirm.
- Section 5 (missing-card states): normal card = `pug-card.jpg` (EXISTS); **Pug-leaving and blank-card artwork = not found** -> NEEDS OWNER or placeholder.
- Section 7 (one-of-one figurine hero): EXISTS (`blue-orig*`, `hand.png`, `findpug-og.jpg`).
- Section 1 cover hero: candidates exist (`video-start.*`, `portrait-advert.*`, `blue-orig*`); final pick is a design decision.
- Section 10 assets: figurine stills EXIST; campaign videos EXIST; logo EXISTS (`PC-logo-blue.svg`); blank-card artwork and 3D-printing footage = not found -> NEEDS OWNER.

---

## 6. The /findpug page (reuse vs rewrite)

`app/findpug/page.tsx` (179 lines) is the Pug "Spot your Chum" competition page,
config-driven (`const PUG`) and built from the `Competition*` components.

Already written there, reuse rather than rewrite:
- Campaign mechanic (partial): "Get a photo or selfie and share it on Instagram or TikTok" (`:95-96`); icon row is spot / Snap / logo / TikTok / Instagram (`:163-165`). This is close to the brief's "Spot -> Photograph -> Post -> Tag -> #ChumSpot" but **there is no `#ChumSpot` hashtag string here** (note a separate `/chumspot` route exists; not yet inspected).
- Figurine framing: "exclusive 3D printed Chum figurine" and the prize copy (`:71`, `:124-130`).
- SEO/OG copy (`:69-75`), terms via `spotYourChumTerms(PUG.breed)` (`:174`).

**Not present on /findpug** (so these are genuinely NEEDS OWNER, the brief asked
me to check first): no press release text; no competition dates (only "This
month ... tombola raffle", `:96`); no traffic-jam example; no "there is always
something else to dig up" language; no "PUG HAS ESCAPED"/"Britain, we need your
help"; no "54 became 53 and one blank card"; no "there is no board, Britain is
the board"; no Imaginary->Real->Tangible copy; no social @handles or press
contact. None of the pack's narrative spine lives here.

Linking: `/findpug` is reached from the nav/bento (`Nav` component is imported at
`findpug/page.tsx:2`); the bento entry itself lives in `components/Nav`.

---

## 7. Accessibility mode: how a new /press page inherits it

- All page content renders inside **`<div id="pc-site">`** (`app/layout.tsx:214`). Any new `app/press` page is automatically inside it, so it inherits everything below with no per-page wiring.
- **Contrast schemes**: `contrast-schemes.css` (loaded globally, `layout.tsx:22`) is entirely scoped under `:root[data-pc-contrast-scheme="black-on-white" | "white-on-black"]` (`:30`, `:55`); with no scheme active nothing applies (default gradient view). The scheme is mirrored onto `<html>` before first paint by an inline script reading `localStorage['pc-contrast-scheme']` (`layout.tsx:199-201`), kept in sync with `lib/contrastScheme.ts`. The "A A A" switcher is `components/PcContrastToolbar`.
- Inside a scheme, every non-media element under `#pc-site` (and `[data-pc-reach]` portals) is forced to the scheme's fg/bg and the paw pattern is turned off (`contrast-schemes.css:34-38`, `:61-63`). Hero photos are crushed dark with white text rather than hidden (`:87-92`), via helper components `SchemeCrushSvg`, `SchemeShapes`, `SchemeStrokes`, `SchemeLayers` that scan `#pc-site`.
- **Hide-images mode**: `components/HideImages/HideImages.tsx` replaces images inside `#pc-site` with their accessible name (alt / aria-label / title). So every image on /press must carry a real alt for this mode to degrade well.
- **Text-invert** (per-article prose darkening to navy): `components/ArticleTextToggle` sets `data-pc-textinvert="on"` on `<main>` (`:38`), and CSS at `contrast-schemes.css:357/381` darkens prose, gated on no active scheme. Opt-in per page if the pack wants it.

Implication for the build: render inside `#pc-site` (automatic via layout), give
every image a real alt, and prefer the standard containers so the scheme rules
match; no press-pack-specific accessibility code should be needed.

---

## 8. Contradictions between brief and code

1. **"Take the carousel mechanics from the superpower rail."** The superpower rail has no next/previous and advances only by answering (`SuperpowerGame.tsx` `answer()`/`start()`), and its `goTo` is entangled with quiz state. HistoryCarousel is the more literal "click-through" base. Recommend basing on HistoryCarousel and borrowing the superpower `goTo`/settled-index *pattern* only.
2. **Figurine photography listed as NEEDS OWNER (Section 7 / 10).** It already exists at `public/competitions/pug/blue-orig*.jpg`, `hand.png`, `findpug-og.jpg`. Recon resolves this; it is not needed from the owner.
3. **"Reuse the release/copy already on /findpug."** /findpug does not contain a press release or the pack's narrative copy (escaped Pug, missing card, no board, traffic jam, digging). Those are genuinely unwritten -> NEEDS OWNER, not reuse.
4. **Lemon accent as a bespoke value.** There is already a token, `--yellow-header: #ffed00` (`globals.css:40`); use it rather than a literal, so the pack matches the editorial pages by construction.
5. **`--sp-green` as "the green button" token.** That token is scoped to the dark superpower rail (`SuperpowerGame.module.css:51`); pulling it would drag in the theme the brief bans. Use a light-page green button (`#22c55e`) instead.

---

## Metadata (brief section 4)

`app/robots.ts` allows `/` for all crawlers and disallows only `/api/`, so a new
`/press` route is **indexed by default** (no page in the repo sets `noindex`).
Pages set SEO via `export const metadata` with a per-page Open Graph image
(pattern at `findpug/page.tsx:140-149`). /press should do the same and, being a
press pack, should be indexed, which the default already gives.

---

## NEEDS OWNER, consolidated (raise, do not write)

1. Press contact details (Section 1) and social @handles (Section 10).
2. The press release text (Section 3) - not in the repo.
3. Competition dates (Section 6) - /findpug has none.
4. The 100-word "always the same character, changing state" copy (Section 4).
5. The traffic-jam example (Section 8) - not on the site.
6. Images: a living real-dog Pug photo (Section 4), Pug-leaving and blank-card
   artwork (Section 5), 3D-printing footage (Section 10). Figurine photography is
   NOT needed (found).

---

**Stopping after the report, per the brief.** Next step, on your go-ahead, is the
proposed slide-by-slide split using the named containers above (item 176 of the
brief), before any build.
