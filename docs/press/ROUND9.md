# Press pack revisions, round 9

**Owner notes, 30 August 2026. Build exactly as written.**

Do not edit, improve, substitute or question any request below.

**Check every change against the `@media (min-width: 769px)` block.** Several earlier rounds edited only the mobile base rules while a stale desktop twin won at desktop width.

**Note the title lesson from round 8:** the "Press Pack" title and the counter are absolutely positioned on `.pack`, not inside `.slide`. Slide padding does not move them.

---

## Global

All text in the blue containers becomes:

- `font-weight: 700`
- `font-size: clamp(1.18rem, 4vw, 1.55rem)`

---

## Copy moves

Move this text from slide 2 to slide 3:

> recognise and play with, helping you notice, recognise and understand the dogs that were already around you. The world has not changed. The way you look at it has.

Move this text from slide 3 to slide 4:

> One of 54 Chums. There may be millions of Pug outside the cards. but in the chums world, there is only Pug. Every real Pug you see is the Pug.

---

## Slide 4

- Reduce the video container height so there are no black bars.

---

## Slide 5

- Add this text to the blue container:

> We had a plan. Pug had instincts.

---

## Slide 6

- Add this text to the blue container:

> Pug is not trying to cause trouble. Pug is simply behaving like a dog.

---

## Slide reorder

Three moves, which shift the numbering after slide 6:

1. Move slide 9, "Making Pug Tangible.", to the slide 7 position.
2. Move slide 8, "Then Pug Left.", to appear after "Making Pug Tangible.".
3. Move slide 10, "Find Pug", to after "One Pug. One Prize.".

Report the resulting order once built.

---

## "Then Pug Left."

- Too much padding between the rows, the same fault as the "Meet Pug" slide. Address it.
- Padding must be uniform on all rows and all columns, on this slide and everywhere the same fault occurs.

---

## Notes for the build

**The uniform padding rule is general.** Row padding and column padding should match wherever a slide has both, not only on the slides named above. Fix it at the cause.

**Report anything that will not work only after building the rest.**

**Verify at 1280px as well as 390px**, and name both widths in the report.
