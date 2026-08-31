# Press pack revisions, round 13

**Owner notes, 31 August 2026. Build exactly as written.**

Do not edit, improve, substitute or question any request below.

**Check every change against the `@media (min-width: 769px)` block.**

Slides are identified by title. This round removes one slide and reorders three, so report the resulting order once built.

---

## Meet Pug, the first instance, the diptych

- Add two white Montserrat labels on top of the cards, in the same style as "The Card Is the Lens": **Imagination world** on the first, **Our Studio Set** on the second.

---

## Meet Pug, the second instance, the video slide

- Remove the "Meet Pug" title from this slide.
- Add one white Montserrat label on top of the video, in the same style, reading **Transitioning to real**. It must persist while the video is playing.

---

## Why Pug?

- Add the title "We had a plan. Pug had instincts."
- Remove that same text from the blue container below.
- Add two white Montserrat labels on top of the cards, in the same style as "The Card Is the Lens": **Our social advert** on the first, **Our website video** on the second.

---

## One Pug. One Prize.

- The image in column A is still being cropped. Change the columns to 60/40 and do whatever is needed to ensure that image is not cropped on any side.

---

## Reorder

Three moves:

1. Move "Find Pug" to after "Help Us Find Pug".
2. Move "Turning Imagination Into Reality" to after "Making Pug Tangible".
3. Move "There Is Only One Pug" to after "What We Have Now".

---

## Remove

- Remove the "What We Have Now" slide.

Note this interacts with the reorder above: "There Is Only One Pug" is to move after "What We Have Now", which is then removed. So it takes that position in the sequence.

---

## There Is Only One Pug

Change the copy to:

> 53 Chums and one blank card.
>
> There is no spare Pug. There is no replacement card waiting backstage.
>
> We cannot really launch like that.

---

## Notes for the build

**The labels are an existing pattern**, already on "The Card Is the Lens". Reuse it rather than rebuilding.

**The video label must survive playback**, so it sits above the player rather than on the poster.

**Report anything that will not work only after building the rest.**

**Verify at 1280px as well as 390px**, and name both widths in the report.

---

## Extra item, folded in from the gallery diagnosis

Reported before this round, kept here so it is not lost.

**"Turning Imagination Into Reality": the three images sat too low.** Both the
two-image slides and this gallery use the same overlay wideTop container
(`.overlayMediaWideTop`, `align-items: center`), and both children fill the media
height, so the container's own alignment is moot. The real difference was the
child's alignment: `.diptych` is `align-items: start` (images at the media top,
275px at 1280), while `.gallery` was `align-items: center` (images centred, 59px
lower, topping at 334px).

Fix: `.gallery` now uses `align-items: flex-start`, matching `.diptych`. Turning
Imagination is the only gallery in the pack, so nothing else is affected.
Verified at 1280px: the gallery images now top at 275px, level with the
two-image slides.

## Extra item, the Cover move (added after the file was written)

Move the Cover slide (the first one, the ad1d film) to after "A Little Deeper".
That leaves "The Card Is the Lens" as the opening slide. Reported in the final
order below.
