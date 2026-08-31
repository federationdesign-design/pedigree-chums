# Press pack revisions, round 8

**Owner notes, 30 August 2026. Build exactly as written.**

Do not edit, improve, substitute or question any request below.

**Check every change against the `@media (min-width: 769px)` block.** Several earlier rounds edited only the mobile base rules while a stale desktop twin won at desktop width. A change that works on a phone and does nothing at 1280px is not done.

---

## Global

- Move the blue container up 15px.
- Move the title and the image and video containers down 50px.

---

## Slide 1

- Make the video 10% smaller.
- Its very bottom should underlay the blue container by 5px.

---

## Slide 2

- Reduce the padding between the two images and columns. It should match the gutter on slide 3.

---

## Slide 3

- Close up the space between the two rows. There is a lot of space between them now, and they should mirror the padding on the other screens. 10px is ideal.

---

## Slide 4

- Still black bars above and below the video. Reduce the container height by 70px.

---

## Slides 5 and 6

- The padding between rows is not uniform with the padding between columns. Make them match.

---

## Slide 7

- Far too much vertical height on the video containers. Reduce them significantly.

---

## Slide 8

- The bigger image in column A must not be cropped.
- The video on the right must not have black bars.
- The blue figurine image may be cropped, so that the other two can follow those rules.

---

## Slide 9

- Far too much vertical height on the video containers. Reduce them significantly.

---

## Notes for the build

**The vertical height problem recurs across slides 4, 7 and 9.** All three are containers taller than the media they hold. Fix it at the cause where the cause is shared, rather than nudging each slide, but only where a shared fix does not distort a clip. The last attempt at a single global rule distorted the height-bound portrait clips, so context-matched rules are acceptable where genuinely needed.

**Slide 8 sets an explicit priority order:** the column A image and the video are protected from cropping and bars, and the figurine image absorbs whatever compromise is needed.

**Report anything that will not work only after building the rest.**

**Verify at 1280px as well as 390px**, and name both widths in the report.
