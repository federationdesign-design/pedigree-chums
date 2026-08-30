# Press pack: build brief

**A click-through press pack at /press. 29 August 2026.**

Ten slides, one on screen at a time, advanced by clicking. It reads like a PDF rather than a scrolling page: everything on a slide is visible at once, with no scrolling within a slide.

The audience is a London journalist or agency person who should understand the whole story in under two minutes.

---

## 1. The hard constraint, read this first

**Build nothing new. Reuse what is already on the site.**

Every colour, container, button, card, type scale and layout device must come from an existing page. If a thing does not already exist somewhere in this repo, it is out of scope, and the answer is to use the closest existing thing rather than to invent one.

**No dark backgrounds.** This has gone wrong repeatedly. The site's background is the fixed blue gradient with the paw pattern, and the press pack uses that like every other page.

**There is a trap here.** The obvious pattern to copy is the /whats-your-superpower carousel, because it is already a click-through slide rail. But that page uses a dark night theme scoped to its `.rail` element, `--sp-ground #0b1220`, which is exactly the dark blue that is not wanted. **Take the carousel mechanics from there and nothing else.** The visual language comes from the light pages: about, dogs-at-work, know-your-chums, britains-dog-history.

**The one approved container that carries text on a darker ground** is the rounded-edge container on britains-dog-history with the blue fade running dark to light. Where a slide needs text on a container rather than on the page background, that is the container to use. Identify it precisely in the recon and reuse it as it is, rather than rebuilding it.

---

## 2. Batch 0: reconnaissance, read-only

Change nothing. Report, with file and line for every claim:

1. **The carousel mechanics.** `app/britains-dog-history-2/HistoryCarousel.tsx` and the superpower rail both do scroll-snapped slides. Report which is the better base for a click-through pack, and why. The superpower rail advances on answer; this needs next and previous controls.
2. **Every container that exists.** Cards, panels, split blocks, image bands, roundels, pills, quote blocks. Name each, say which page it lives on, and say what it is good for. This is the palette the pack is built from.
3. **The type scale.** How headings, display accents, body copy and small labels are sized on the light pages, and which classes carry them.
4. **Buttons and controls.** The green button, the pill, and whatever previous and next controls already exist anywhere on the site.
5. **What images exist.** Everything in `public/` that could serve this content, especially anything under `public/competitions/pug/`, the 54 card squares, and any existing Pug or figurine photography. List paths and say what each shows.
6. **The findpug page.** `/findpug` already exists and the bento menu links to it. Report what is on it, since some of this content may already be written there and should be reused rather than rewritten.
7. **Accessibility mode.** How the contrast schemes and the hide-images mode treat existing pages, so the pack behaves the same way.
8. **Contradictions.** Anything in this brief that does not match the code.

**Stop after the report.**

---

## 3. The content, in ten sections

Roughly 60 to 70 per cent visual, 30 to 40 per cent text. Where copy is given below it is owner-approved and used verbatim. Where it is not, it is **NEEDS OWNER** and must be raised rather than written.

Numbered 1 to 10 below as content sections. Each may become several slides.

### Section 1: Cover

- Pedigree Chums
- **PUG HAS ESCAPED**
- "Britain, we need your help."
- One very strong hero image
- Press contact details

**NEEDS OWNER**: the press contact details.

### Section 2: The story in 30 seconds

Highly visual, instantly understandable.

> The product was finished. During the final photoshoot Pug left the card and disappeared into the real world. The Pug card is now blank. Pedigree Chums cannot launch with only 53 Chums, so Britain is being asked to Find Pug.

### Section 3: The press release

A shortened version of the existing release. The longer philosophical material lives elsewhere in the pack rather than here.

**NEEDS OWNER**: the release text. Report whether a release already exists on /findpug or elsewhere in the repo before asking.

### Section 4: How the Pedigree Chums world works

Show Pug in three states, left to right:

**Imaginary → Real → Tangible**

Card illustration, then living Pug, then the one-of-one figurine.

Then roughly 100 words explaining that Pug is always the same character, simply changing state.

**NEEDS OWNER**: the 100 words, and the three images.

### Section 5: The missing-card problem

One of the strongest pages in the pack. Show three states:

- The normal Pug card
- Pug leaving
- The blank card

Then one large line:

> 54 Chums became 53 Chums and one blank card.

Followed by:

> We can't launch like that.

### Section 6: Find Pug

The campaign mechanic, as a simple sequence:

**Spot Pug → Photograph Pug → Post Pug → Tag Pedigree Chums → #ChumSpot**

Plus the competition dates and the figurine prize.

**NEEDS OWNER**: the competition dates.

### Section 7: The one-of-one Pug

Hero photography of the figurine. Explain that this is the only physical Pug figurine currently in existence, created for this story, with no current plans to make another.

Useful to journalists because it is an angle beyond the competition itself.

**NEEDS OWNER**: the figurine photography, unless the recon finds it.

### Section 8: There is no board. Britain is the board.

The actual product proposition.

Not poker. Not rummy. Not another game around the kitchen table.

Take the cards outside and find the dogs. Parks, trains, streets, beaches, car journeys, towns.

Include the traffic-jam example, which makes the game understandable to parents very quickly.

**NEEDS OWNER**: the traffic-jam example, unless it already exists on the site.

### Section 9: A little deeper

Compact, covering what exists beyond the cards:

- Breed information
- Working dogs
- Dogs and British history
- Famous dogs
- Temperament
- Costs and ownership information
- Playful educational content

Use the digging language:

> There is always something else to dig up.

### Section 10: Assets and press information

Thumbnails plus a clear statement of what is available:

- High-resolution stills
- Campaign videos
- Blank-card artwork
- Figurine photography
- 3D-printing footage
- Logos
- Social artwork
- Founder or business interview, if eventually appropriate

Plus contact details, website and social handles.

**NEEDS OWNER**: which of these assets actually exist and where they are, plus the social handles. Report what the recon finds before asking.

---

## 4. Build rules

- **Slides advance on click**, with next and previous controls, and the current position shown. Keyboard arrows work. Swipe works on touch.
- **Nothing scrolls within a slide.** If content does not fit, the slide is too full. The answer is to split it across more slides, not to scroll and not to shrink the type.
- **There is no limit on the number of slides.** The ten below are the content, not the slide count. Split any of them as often as it takes to keep each slide bite-sized and instantly readable. A pack of twenty short slides is better than ten crowded ones. Report your proposed split before building.
- **The pack works at 1280 wide and on a phone.** Report the shortest desktop height tested.
- **Placeholder images are named as placeholders** and logged in `PLACEHOLDERS.md`, so a missing asset is never mistaken for a design decision.
- **Page metadata**: report what the other pages set for robots and Open Graph, and follow it. Say whether /press should be indexed, since a press pack usually should be.

---

## 5. Rules for the agent

- **Report before building.** Batch 0 first, then a proposed slide-by-slide layout using named existing containers, then build.
- **A NEEDS OWNER item is raised and stopped on, never guessed.** That includes every piece of copy not written verbatim above.
- **No new colours, no new containers, no new type scale.** If you find yourself writing a new component, stop and report what existing thing you were trying to avoid using and why it did not fit.
- **Report format**: files changed with line counts, the type check as a number, and for each requirement the file and line implementing it.
- **Verify with the repo binaries**, `./node_modules/.bin/tsc --noEmit`, never npx. Run the bare `:global` audit before reporting.

---

## 6. Amendment, 29 August 2026: mobile is the primary case

**Mobile is the primary case, not the secondary one.** Expect half or more of the
traffic to be a journalist opening the pitch email on a phone. Design around this
from the start rather than retrofitting it.

1. **Portrait slides, phone first, then adapted to desktop.** Build the portrait
   layout first and adapt up to desktop. Do not build a landscape layout with a
   mobile breakpoint bolted on.

2. **The canonical split is the MOBILE split.** Since nothing scrolls within a
   slide, a section that fits one desktop slide may need two or three on a phone.
   Author the mobile split first; desktop then COMBINES slides where there is
   room, rather than the reverse. Report the mobile slide count separately from
   the desktop one, and say which sections need to differ.
